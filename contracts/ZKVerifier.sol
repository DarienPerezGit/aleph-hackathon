// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER — will be overwritten by `bash circuits/setup.sh`
//
// snarkjs exports the real Groth16Verifier here via:
//   snarkjs zkey export solidityverifier intent_hash_final.zkey ZKVerifier.sol
//
// Until then, this stub compiles cleanly so `forge build` passes.
// The stub verifyProof() returns false — no proofs are accepted until the
// real artifact replaces this file.
//
// Contract name `Groth16Verifier` matches snarkjs 0.7.x output.
// ─────────────────────────────────────────────────────────────────────────────

contract Groth16Verifier {
    // Stub: returns false until replaced by the real snarkjs-generated verifier.
    // After `bash circuits/setup.sh`, this file is overwritten with a fully
    // functional Groth16 verifier that mathematically checks the ZK proof.
    function verifyProof(
        uint256[2]    calldata, /* _pA   */
        uint256[2][2] calldata, /* _pB   */
        uint256[2]    calldata, /* _pC   */
        uint256[1]    calldata  /* _pubSignals */
    ) public view returns (bool) {
        // Placeholder always returns false — deploy only after running setup.sh
        return false;
    }
}
