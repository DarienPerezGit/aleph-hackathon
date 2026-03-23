// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IZKVerifier.sol";

contract ApoloEscrow {
    enum IntentState {
        PENDING,
        FUNDED,
        VALIDATING,
        RELEASED,
        REFUNDED
    }

    struct IntentData {
        address recipient;
        uint256 amount;
        IntentState state;
        uint256 fundedAt;
        uint256 settledAt;
    }

    address public immutable relayer;
    mapping(bytes32 => IntentData) private intents;

    // ── ZK verification layer (additive, backward-compatible) ──────────────
    // zkEnabled = false by default; existing fund() calls are never affected.
    // Set zkEnabled = true only after zkVerifier is deployed and tested.
    address public zkVerifier;
    bool public zkEnabled = false;

    event Funded(bytes32 indexed intentHash, uint256 amount, uint256 timestamp);
    event Released(bytes32 indexed intentHash, address indexed recipient, uint256 amount);
    event Refunded(bytes32 indexed intentHash, uint256 amount);

    /// @notice Emitted when a valid ZK proof is verified before funding.
    /// @dev intentHash = EIP-712 keccak256 hash; zkHash = Poseidon(recipient,amount,nonce).
    event ZKProofVerified(bytes32 indexed intentHash, bytes32 indexed zkHash);

    /// @notice Emitted when proof verification fails — useful for demo failure-case storytelling.
    event ZKProofFailed(bytes32 indexed zkHash);

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer");
        _;
    }

    constructor(address relayerAddress) {
        require(relayerAddress != address(0), "Invalid relayer");
        relayer = relayerAddress;
    }

    // ── ZK admin (onlyRelayer) ─────────────────────────────────────────────

    /// @notice Set the Groth16 verifier contract address.
    ///         Use MockZKVerifier for demo; deploy real ZKVerifier.sol for production.
    function setZKVerifier(address verifierAddress) external onlyRelayer {
        require(verifierAddress != address(0), "Invalid verifier");
        zkVerifier = verifierAddress;
    }

    /// @notice Enable or disable ZK proof requirement for fundWithZK().
    ///         When false, fundWithZK() skips proof verification entirely.
    function setZKEnabled(bool enabled) external onlyRelayer {
        zkEnabled = enabled;
    }

    // ── Original fund() — UNCHANGED ────────────────────────────────────────

    function fund(bytes32 intentHash, uint256 amount) external payable {
        require(intentHash != bytes32(0), "Invalid intentHash");
        require(amount > 0, "Invalid amount");
        require(msg.value == amount, "Invalid value");

        IntentData storage intent = intents[intentHash];
        require(intent.state == IntentState.PENDING, "Already funded");

        intent.recipient = msg.sender;
        intent.amount = amount;
        intent.state = IntentState.FUNDED;
        intent.fundedAt = block.timestamp;

        emit Funded(intentHash, amount, block.timestamp);
    }

    // ── ZK-verified fund path ──────────────────────────────────────────────

    /// @notice Fund escrow with an optional Groth16 ZK proof of intent correctness.
    /// @dev Two-hash architecture:
    ///      - intentHash: EIP-712 keccak256 (identifies the intent in escrow storage)
    ///      - zkHash:     Poseidon(recipient, amount, nonce) — proven by the ZK circuit
    ///      These are cryptographically distinct and serve different purposes.
    ///
    ///  zkEnabled = false                 → skip proof, fund normally (same as fund())
    ///  zkEnabled = true, verifier = 0   → revert "ZK verifier not set"
    ///  zkEnabled = true, proof valid    → emit ZKProofVerified, fund normally
    ///  zkEnabled = true, proof invalid  → emit ZKProofFailed, revert
    ///
    /// @param intentHash  EIP-712 typed-data hash linking this call to the signed intent
    /// @param zkHash      Poseidon(recipient, amount, nonce) — public signal for the circuit
    /// @param amount      Amount in wei (must equal msg.value)
    /// @param a           Groth16 proof point A
    /// @param b           Groth16 proof point B
    /// @param c           Groth16 proof point C
    /// @param input       Public signals: input[0] = zkHash as uint256
    function fundWithZK(
        bytes32 intentHash,
        bytes32 zkHash,
        uint256 amount,
        uint256[2]    calldata a,
        uint256[2][2] calldata b,
        uint256[2]    calldata c,
        uint256[1]    calldata input
    ) external payable {
        require(intentHash != bytes32(0), "Invalid intentHash");
        require(zkHash != bytes32(0), "Invalid zkHash");
        require(amount > 0, "Invalid amount");
        require(msg.value == amount, "Invalid value");

        if (zkEnabled) {
            require(zkVerifier != address(0), "ZK verifier not set");

            // Sanity: caller-supplied input[0] must match the zkHash param
            require(uint256(zkHash) == input[0], "zkHash/input mismatch");

            bool valid = IZKVerifier(zkVerifier).verifyProof(a, b, c, input);
            if (!valid) {
                emit ZKProofFailed(zkHash);
                revert("Invalid ZK proof");
            }
            emit ZKProofVerified(intentHash, zkHash);
        }
        // If !zkEnabled: skip proof — backward-compatible path

        IntentData storage intent = intents[intentHash];
        require(intent.state == IntentState.PENDING, "Already funded");

        intent.recipient = msg.sender;
        intent.amount = amount;
        intent.state = IntentState.FUNDED;
        intent.fundedAt = block.timestamp;

        emit Funded(intentHash, amount, block.timestamp);
    }

    // ── Relayer settlement ─────────────────────────────────────────────────

    function markValidating(bytes32 intentHash) external onlyRelayer {
        IntentData storage intent = intents[intentHash];
        require(intent.state == IntentState.FUNDED, "Not funded");
        intent.state = IntentState.VALIDATING;
    }

    function release(bytes32 intentHash) external onlyRelayer {
        IntentData storage intent = intents[intentHash];
        require(
            intent.state == IntentState.FUNDED || intent.state == IntentState.VALIDATING,
            "Not releasable"
        );

        intent.state = IntentState.RELEASED;
        intent.settledAt = block.timestamp;

        (bool success, ) = payable(intent.recipient).call{value: intent.amount}("");
        require(success, "Transfer failed");

        emit Released(intentHash, intent.recipient, intent.amount);
    }

    function refund(bytes32 intentHash) external onlyRelayer {
        IntentData storage intent = intents[intentHash];
        require(
            intent.state == IntentState.FUNDED || intent.state == IntentState.VALIDATING,
            "Not refundable"
        );

        intent.state = IntentState.REFUNDED;
        intent.settledAt = block.timestamp;

        (bool success, ) = payable(msg.sender).call{value: intent.amount}("");
        require(success, "Refund failed");

        emit Refunded(intentHash, intent.amount);
    }

    function getIntent(bytes32 intentHash) external view returns (IntentData memory) {
        return intents[intentHash];
    }
}
