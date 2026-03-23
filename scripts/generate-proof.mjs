/**
 * scripts/generate-proof.mjs
 *
 * Generate a Groth16 ZK proof for the Apolo intent_hash circuit.
 *
 * Usage:
 *   node scripts/generate-proof.mjs <recipient_hex> <amount_wei> <nonce>
 *
 * Example:
 *   node scripts/generate-proof.mjs \
 *     0xa2e036eD6f43baC9c67B6B098E8B006365b01464 \
 *     100000000000000 \
 *     1234567890
 *
 * Outputs:
 *   - zkHash (the Poseidon commitment, as decimal and 0x-prefixed hex)
 *   - Groth16 proof (a, b, c) + publicSignals
 *   - Ready-to-use cast send command for fundWithZK()
 *
 * Prerequisites (run from repo root):
 *   npm install
 *   bash circuits/setup.sh      ← compiles circuit + generates zkey artifacts
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

// ── Validate CLI args ───────────────────────────────────────────────────────
const [, , recipientArg, amountArg, nonceArg] = process.argv;

if (!recipientArg || !amountArg || !nonceArg) {
  console.error('Usage: node scripts/generate-proof.mjs <recipient_hex> <amount_wei> <nonce>');
  console.error('Example: node scripts/generate-proof.mjs 0xa2e036...01464 100000000000000 1234567890');
  process.exit(1);
}

// ── Convert inputs to field elements ───────────────────────────────────────
// recipient: Ethereum address hex → BigInt field element.
// Lowercase first to neutralize EIP-55 checksum casing issues.
const recipientHex = recipientArg.toLowerCase();
if (!/^0x[0-9a-f]{40}$/.test(recipientHex)) {
  console.error(`Invalid Ethereum address: ${recipientArg}`);
  process.exit(1);
}
const recipientField = BigInt(recipientHex);

const amountField = BigInt(amountArg);
const nonceField  = BigInt(nonceArg);

console.log('\n=== Apolo ZK Proof Generator ===\n');
console.log('Inputs:');
console.log('  recipient:', recipientArg, `(field: ${recipientField})`);
console.log('  amount:   ', amountArg,    `(field: ${amountField})`);
console.log('  nonce:    ', nonceArg,     `(field: ${nonceField})`);

// ── Compute zkHash via Poseidon ─────────────────────────────────────────────
// zkHash = Poseidon(recipient, amount, nonce)
// This is the circuit's public input — DISTINCT from the EIP-712 intentHash.
const { buildPoseidon } = require('circomlibjs');
const poseidon = await buildPoseidon();
const zkHashRaw = poseidon([recipientField, amountField, nonceField]);
const zkHashBigInt = poseidon.F.toObject(zkHashRaw);
const zkHashHex = '0x' + zkHashBigInt.toString(16).padStart(64, '0');

console.log('\nzkHash (Poseidon commitment):');
console.log('  decimal:', zkHashBigInt.toString());
console.log('  hex:    ', zkHashHex);

// ── Artifact paths ──────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot  = path.resolve(__dirname, '..');

const wasmFile = path.join(repoRoot, 'circuits', 'intent_hash_js', 'intent_hash.wasm');
const zkeyFile = path.join(repoRoot, 'circuits', 'intent_hash_final.zkey');

// Check artifacts exist
try {
  readFileSync(wasmFile);
  readFileSync(zkeyFile);
} catch {
  console.error('\nERROR: ZK artifacts not found. Run first:');
  console.error('  bash circuits/setup.sh');
  process.exit(1);
}

// ── Generate Groth16 proof ──────────────────────────────────────────────────
const snarkjs = require('snarkjs');

const circuitInput = {
  recipient: recipientField.toString(),
  amount:    amountField.toString(),
  nonce:     nonceField.toString(),
  zkHash:    zkHashBigInt.toString(),
};

console.log('\nGenerating proof (this may take 10–30 seconds)...');
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  circuitInput,
  wasmFile,
  zkeyFile
);

// ── Sanity check: publicSignals[0] must equal our computed zkHash ───────────
const proofPublicZkHash = BigInt(publicSignals[0]);
if (proofPublicZkHash !== zkHashBigInt) {
  console.error('\nFATAL: publicSignals[0] !== computed zkHash — circuit/input mismatch!');
  console.error('  publicSignals[0]:', proofPublicZkHash.toString());
  console.error('  computed zkHash: ', zkHashBigInt.toString());
  process.exit(1);
}
console.log('  ✓ publicSignals[0] matches computed zkHash');

// ── Verify the proof locally with verification key ──────────────────────────
const vkeyPath = path.join(repoRoot, 'circuits', 'verification_key.json');
let localVerifyPassed = false;
try {
  const vkey = JSON.parse(readFileSync(vkeyPath, 'utf8'));
  localVerifyPassed = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  if (!localVerifyPassed) {
    console.error('\nFATAL: Local proof verification failed. Regenerate zkey artifacts.');
    process.exit(1);
  }
  console.log('  ✓ Local proof verification passed');
} catch {
  console.warn('  ⚠ verification_key.json not found — skipping local verify step');
}

// ── Format output for Solidity ──────────────────────────────────────────────
// solidity calldata format: ([a0,a1],[[b00,b01],[b10,b11]],[c0,c1],[s0])
const solidityCalldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
// Parsed proof components
const proofA = [proof.pi_a[0], proof.pi_a[1]];
const proofB = [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]];
const proofC = [proof.pi_c[0], proof.pi_c[1]];
const inputArr = [publicSignals[0]];

console.log('\n=== Proof Output ===\n');
console.log('proof.a:')    ; console.log(' ', JSON.stringify(proofA));
console.log('proof.b:')    ; console.log(' ', JSON.stringify(proofB));
console.log('proof.c:')    ; console.log(' ', JSON.stringify(proofC));
console.log('publicSignals:', JSON.stringify(inputArr));

console.log('\n=== solidity call data (raw) ===');
console.log(solidityCalldata);

console.log('\n=== fundWithZK() call parameters ===');
console.log('Pass these to fundWithZK(intentHash, zkHash, amount, a, b, c, input):');
console.log({
  intentHash: '<your-EIP712-intentHash>',
  zkHash: zkHashHex,
  amount: amountArg,
  a: proofA,
  b: proofB,
  c: proofC,
  input: inputArr,
});

console.log('\n=== cast send example ===');
console.log(`cast send <ESCROW_ADDRESS> \\`);
console.log(`  "fundWithZK(bytes32,bytes32,uint256,uint256[2],uint256[2][2],uint256[2],uint256[1])" \\`);
console.log(`  <intentHash> \\`);
console.log(`  ${zkHashHex} \\`);
console.log(`  ${amountArg} \\`);
console.log(`  "[${proofA.join(',')}]" \\`);
console.log(`  "[[${proofB[0].join(',')}],[${proofB[1].join(',')}]]" \\`);
console.log(`  "[${proofC.join(',')}]" \\`);
console.log(`  "[${inputArr[0]}]" \\`);
console.log(`  --value ${amountArg} \\`);
console.log(`  --rpc-url $BSC_TESTNET_RPC \\`);
console.log(`  --private-key $PRIVATE_KEY`);
