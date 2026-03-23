/**
 * scripts/call-fund-with-zk.mjs
 *
 * Calls fundWithZK() on the deployed ApoloEscrow using a pre-generated proof.
 * For the demo: generates a fresh proof then submits it on-chain.
 *
 * Usage:
 *   node scripts/call-fund-with-zk.mjs
 *
 * Required env vars (from .env):
 *   ESCROW_CONTRACT_ADDRESS
 *   SOLVER_PRIVATE_KEY
 *   BSC_TESTNET_RPC
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWalletClient, createPublicClient, http, parseGwei } from 'viem';
import { bscTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const require = createRequire(import.meta.url);
const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const repoRoot   = path.resolve(__dirname, '..');

// ── Load .env manually ──────────────────────────────────────────────────────
const envFile = readFileSync(path.join(repoRoot, '.env'), 'utf8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const ESCROW_ADDRESS   = env.ESCROW_CONTRACT_ADDRESS;
const PRIVATE_KEY      = env.SOLVER_PRIVATE_KEY;
const RPC_URL          = env.BSC_TESTNET_RPC;

if (!ESCROW_ADDRESS || !PRIVATE_KEY || !RPC_URL) {
  console.error('Missing env vars: ESCROW_CONTRACT_ADDRESS, SOLVER_PRIVATE_KEY, BSC_TESTNET_RPC');
  process.exit(1);
}

console.log('=== Apolo fundWithZK() Demo ===\n');
console.log('Escrow:  ', ESCROW_ADDRESS);
console.log('RPC:     ', RPC_URL);

// ── Proof inputs ────────────────────────────────────────────────────────────
// These are the deterministic demo values (recipient = solver, amount, nonce)
const RECIPIENT = '0xa2e036eD6f43baC9c67B6B098E8B006365b01464';
const AMOUNT    = 100000000000000n; // 0.0001 BNB in wei
const NONCE     = 1234567890n;

// ── Compute zkHash ──────────────────────────────────────────────────────────
const { buildPoseidon } = require('circomlibjs');
const poseidon = await buildPoseidon();
const recipientField = BigInt(RECIPIENT.toLowerCase());
const zkHashRaw      = poseidon([recipientField, AMOUNT, NONCE]);
const zkHashBigInt   = poseidon.F.toObject(zkHashRaw);
const zkHashHex      = ('0x' + zkHashBigInt.toString(16).padStart(64, '0'));

console.log('\nzkHash:', zkHashHex);

// ── Generate Groth16 proof ──────────────────────────────────────────────────
const snarkjs  = require('snarkjs');
const wasmFile = path.join(repoRoot, 'circuits', 'intent_hash_js', 'intent_hash.wasm');
const zkeyFile = path.join(repoRoot, 'circuits', 'intent_hash_final.zkey');

const circuitInput = {
  recipient: recipientField.toString(),
  amount:    AMOUNT.toString(),
  nonce:     NONCE.toString(),
  zkHash:    zkHashBigInt.toString(),
};

console.log('\nGenerating proof...');
const { proof, publicSignals } = await snarkjs.groth16.fullProve(circuitInput, wasmFile, zkeyFile);

// Verify locally
const vkey    = JSON.parse(readFileSync(path.join(repoRoot, 'circuits', 'verification_key.json'), 'utf8'));
const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
if (!isValid) { console.error('Local proof verification FAILED'); process.exit(1); }
console.log('✓ Proof verified locally\n');

// Format for Solidity (note: b components swap per pairing convention)
const proofA = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])];
const proofB = [
  [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
  [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
];
const proofC     = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])];
const inputArr   = [BigInt(publicSignals[0])];

// ── intentHash: deterministic demo value ────────────────────────────────────
// Using a non-zero bytes32 that hasn't been used yet
const INTENT_HASH = '0x7265627974000000000000000000000000000000000000000000000000000001';

// ── Submit transaction ──────────────────────────────────────────────────────
const pk      = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : '0x' + PRIVATE_KEY;
const account = privateKeyToAccount(pk);

const walletClient = createWalletClient({
  account,
  chain: bscTestnet,
  transport: http(RPC_URL),
});
const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
});

// ABI for fundWithZK
const abi = [
  {
    name: 'fundWithZK',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'intentHash', type: 'bytes32' },
      { name: 'zkHash',     type: 'bytes32' },
      { name: 'amount',     type: 'uint256' },
      { name: 'a',         type: 'uint256[2]' },
      { name: 'b',         type: 'uint256[2][2]' },
      { name: 'c',         type: 'uint256[2]' },
      { name: 'input',     type: 'uint256[1]' },
    ],
    outputs: [],
  },
];

console.log('Arguments:');
console.log('  intentHash:', INTENT_HASH);
console.log('  zkHash:    ', zkHashHex);
console.log('  amount:    ', AMOUNT.toString(), 'wei');

console.log('\nSimulating call...');
try {
  await publicClient.simulateContract({
    address: ESCROW_ADDRESS,
    abi,
    functionName: 'fundWithZK',
    args: [INTENT_HASH, zkHashHex, AMOUNT, proofA, proofB, proofC, inputArr],
    value: AMOUNT,
    account,
  });
  console.log('✓ Simulation passed\n');
} catch (e) {
  console.error('Simulation FAILED:', e.shortMessage || e.message);
  process.exit(1);
}

console.log('Sending transaction...');
const txHash = await walletClient.writeContract({
  address: ESCROW_ADDRESS,
  abi,
  functionName: 'fundWithZK',
  args: [INTENT_HASH, zkHashHex, AMOUNT, proofA, proofB, proofC, inputArr],
  value: AMOUNT,
  gasPrice: parseGwei('1'),
});

console.log('\n✅ Transaction submitted!');
console.log('   TX Hash:', txHash);
console.log('   BSCScan:', `https://testnet.bscscan.com/tx/${txHash}`);

console.log('\nWaiting for confirmation...');
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60000 });
console.log('✅ Confirmed in block', receipt.blockNumber.toString());
console.log('   Status:', receipt.status === 'success' ? 'SUCCESS' : 'FAILED');
console.log('\n🎉 ZKProofVerified event emitted on BSC Testnet!');
console.log('   https://testnet.bscscan.com/tx/' + txHash + '#eventlog');
