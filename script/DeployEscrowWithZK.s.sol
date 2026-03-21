// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/RebytEscrow.sol";

/// @notice Deploy RebytEscrow wired to the real Groth16 verifier, with zkEnabled=true.
///
/// PREREQUISITES (in order):
///   1. bash circuits/setup.sh          → generates real ZKVerifier.sol artifact
///   2. forge build                     → verify everything compiles
///   3. forge script script/DeployVerifier.s.sol --broadcast
///                                      → get ZK_VERIFIER_ADDRESS
///   4. Run this script (DeployEscrowWithZK)
///
/// Required env vars:
///   PRIVATE_KEY          — deployer/relayer private key
///   SOLVER_ADDRESS       — relayer address (gets onlyRelayer rights)
///   ZK_VERIFIER_ADDRESS  — address from step 3
///   BSC_TESTNET_RPC      — BSC Testnet RPC URL
///
/// Usage:
///   forge script script/DeployEscrowWithZK.s.sol \
///     --rpc-url $BSC_TESTNET_RPC \
///     --broadcast \
///     --private-key $PRIVATE_KEY
contract DeployEscrowWithZK is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address relayerAddress     = vm.envAddress("SOLVER_ADDRESS");
        address verifierAddress    = vm.envAddress("ZK_VERIFIER_ADDRESS");

        require(verifierAddress != address(0), "ZK_VERIFIER_ADDRESS not set");

        vm.startBroadcast(deployerPrivateKey);

        RebytEscrow escrow = new RebytEscrow(relayerAddress);

        // Wire the REAL Groth16 verifier (not MockZKVerifier)
        escrow.setZKVerifier(verifierAddress);

        // Enable ZK enforcement — proofs are now required for fundWithZK()
        escrow.setZKEnabled(true);

        vm.stopBroadcast();

        console.log("=== RebytEscrow deployed with ZK enabled ===");
        console.log("Escrow:         ", address(escrow));
        console.log("ZK Verifier:    ", verifierAddress);
        console.log("zkEnabled:      ", escrow.zkEnabled());
        console.log("Relayer:        ", relayerAddress);
        console.log("");
        console.log("Set this in your .env:");
        console.log("  ESCROW_CONTRACT_ADDRESS=", address(escrow));
        console.log("");
        console.log("Verify on BscScan:");
        console.log("  https://testnet.bscscan.com/address/", address(escrow));
        console.log("");
        console.log("Generate a proof and call fundWithZK():");
        console.log("  node scripts/generate-proof.mjs <recipient> <amount> <nonce>");
    }
}
