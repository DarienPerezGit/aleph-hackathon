pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

// Proves that Poseidon(recipient, amount, nonce) == zkHash
// without revealing the private inputs on-chain.
//
// intentHash (EIP-712 keccak256) lives in the escrow contract separately.
// zkHash (Poseidon) is the ZK-layer commitment proven here.
template IntentHash() {
    // Private inputs — never exposed on-chain
    signal input recipient;
    signal input amount;
    signal input nonce;

    // Public input — the claimed Poseidon hash (provided by solver)
    signal input zkHash;

    // Compute Poseidon hash of the three private inputs
    component hasher = Poseidon(3);
    hasher.inputs[0] <== recipient;
    hasher.inputs[1] <== amount;
    hasher.inputs[2] <== nonce;

    // Constrain: computed hash must equal the claimed public zkHash
    hasher.out === zkHash;
}

component main {public [zkHash]} = IntentHash();
