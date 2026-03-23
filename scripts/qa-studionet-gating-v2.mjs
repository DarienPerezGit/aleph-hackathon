/**
 * qa-studionet-gating-v2.mjs
 *
 * Fixed integration test — waits for GenLayer transaction finality
 * before reading state with getResult().
 *
 * Root cause of v1 failure: writeContract() returns tx hash but
 * doesn't wait for consensus. getResult() reads stale default (false).
 * Fix: use waitForTransactionReceipt() after writeContract().
 */

import 'dotenv/config';
import crypto from 'node:crypto';
import { createAccount as createGenLayerAccount, createClient as createGenLayerClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';

// ── Config ─────────────────────────────────────────────────────────────────
const ESCROW = process.env.ESCROW_CONTRACT_ADDRESS;
const GL_CONTRACT = process.env.GENLAYER_CONTRACT_ADDRESS;
const BSC_RPC = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545';
const GL_RPC = process.env.GENLAYER_RPC || 'https://studio.genlayer.com/api';
const GL_CHAIN_ID = Number(process.env.GENLAYER_CHAIN_ID || 4221);
const pk = process.env.PRIVATE_KEY || process.env.SOLVER_PRIVATE_KEY;

for (const [k, v] of Object.entries({ ESCROW, GL_CONTRACT, pk })) {
  if (!v) { console.error(`Missing: ${k}`); process.exit(1); }
}

const escrowAbi = parseAbi([
  'function fund(bytes32 intentHash, uint256 amount) external payable',
  'function release(bytes32 intentHash) external',
  'function refund(bytes32 intentHash) external',
  'function markValidating(bytes32 intentHash) external',
  'function getIntent(bytes32 intentHash) external view returns ((address recipient,uint256 amount,uint8 state,uint256 fundedAt,uint256 settledAt))'
]);
const STATES = ['PENDING', 'FUNDED', 'VALIDATING', 'RELEASED', 'REFUNDED'];

const account = privateKeyToAccount(pk);
const walletClient = createWalletClient({ account, chain: bscTestnet, transport: http(BSC_RPC) });
const publicClient = createPublicClient({ chain: bscTestnet, transport: http(BSC_RPC) });

const glClient = createGenLayerClient({
  chain: testnetBradbury,
  rpcUrl: GL_RPC,
  endpoint: GL_RPC,
  chainId: GL_CHAIN_ID,
  account: createGenLayerAccount(pk),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false });
const log = (msg) => console.log(`[${ts()}] ${msg}`);
const randomHash = () => `0x${crypto.randomBytes(32).toString('hex')}`;

async function readState(h) {
  const d = await publicClient.readContract({
    address: ESCROW, abi: escrowAbi, functionName: 'getIntent', args: [h]
  });
  return STATES[Number(d.state ?? d[2])] || 'UNKNOWN';
}

const results = [];

async function runTest(name, condition, evidenceUrl, expectedOutcome) {
  console.log('');
  log(`━━━ TEST: ${name} ━━━`);
  const intentHash = randomHash();
  const amountWei = 100000000000000n; // 0.0001 tBNB

  try {
    // 1. Fund on BSC
    log('[Intent Created]');
    log(`  intentHash: ${intentHash}`);
    log(`  condition: "${condition}"`);
    const fundTx = await walletClient.writeContract({
      address: ESCROW, abi: escrowAbi, functionName: 'fund',
      args: [intentHash, amountWei], value: amountWei,
    });
    await publicClient.waitForTransactionReceipt({ hash: fundTx });
    log(`[Escrow Funded] tx: ${fundTx}`);

    // 2. Trigger GenLayer validation  
    log('[Validation Started]');
    const glTxHash = await glClient.writeContract({
      address: GL_CONTRACT,
      functionName: 'validate',
      args: [intentHash, condition, evidenceUrl],
    });
    log(`  GenLayer validate tx submitted: ${glTxHash}`);

    // 3. CRITICAL: Wait for GenLayer tx receipt (consensus finality)
    log('[Waiting for GenLayer consensus finality...]');
    let receipt;
    try {
      receipt = await glClient.waitForTransactionReceipt({ hash: glTxHash });
      log(`[GenLayer Receipt] status: ${receipt?.status ?? JSON.stringify(receipt)}`);
      if (receipt) {
        log(`  receipt keys: ${Object.keys(receipt).join(', ')}`);
        log(`  receipt data: ${JSON.stringify(receipt, (_, v) => typeof v === 'bigint' ? v.toString() : v).substring(0, 500)}`);
      }
    } catch (e) {
      log(`[GenLayer Receipt ERROR] ${e.message}`);
      // Continue — maybe read will work anyway
    }

    // 4. Read validation result AFTER finality
    log('[Reading validation result...]');
    let validationResult = null;
    for (let i = 1; i <= 5; i++) {
      try {
        const raw = await glClient.readContract({
          address: GL_CONTRACT,
          functionName: 'getResult',
          args: [intentHash],
        });
        log(`  getResult attempt ${i}/5: ${JSON.stringify(raw)}`);
        if (typeof raw === 'boolean') { validationResult = raw; break; }
        if (typeof raw === 'string') {
          const n = raw.trim().toLowerCase();
          if (n === 'true') { validationResult = true; break; }
          if (n === 'false') { validationResult = false; break; }
        }
      } catch (e) {
        log(`  getResult attempt ${i}/5 ERROR: ${e.message}`);
      }
      if (i < 5) await sleep(3000);
    }

    log(`[Validation Result: ${validationResult === true ? 'APPROVED' : validationResult === false ? 'REJECTED' : 'INCONCLUSIVE'}]`);

    // 5. Settle on BSC based on result
    if (validationResult === true) {
      try {
        await walletClient.writeContract({
          address: ESCROW, abi: escrowAbi, functionName: 'markValidating',
          args: [intentHash],
        });
      } catch (_) {}
      const releaseTx = await walletClient.writeContract({
        address: ESCROW, abi: escrowAbi, functionName: 'release',
        args: [intentHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: releaseTx });
      const finalState = await readState(intentHash);
      log(`[Execution Completed] release tx: ${releaseTx}`);
      log(`  final state: ${finalState}`);
      results.push({ name, outcome: 'APPROVED', expected: expectedOutcome, pass: 'APPROVED' === expectedOutcome });
    } else {
      log('[Execution Blocked ✅]');
      const refundTx = await walletClient.writeContract({
        address: ESCROW, abi: escrowAbi, functionName: 'refund',
        args: [intentHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: refundTx });
      const finalState = await readState(intentHash);
      log(`[Refund Executed] tx: ${refundTx}`);
      log(`  final state: ${finalState}`);
      results.push({ name, outcome: 'REJECTED', expected: expectedOutcome, pass: 'REJECTED' === expectedOutcome });
    }
  } catch (e) {
    log(`[FATAL] ${e.message}`);
    results.push({ name, outcome: 'FATAL', expected: expectedOutcome, pass: false });
  }
}

async function main() {
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║  Apolo StudioNet Gating Test v2 (with waitForReceipt)      ║');
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`GenLayer RPC:       ${GL_RPC}`);
  log(`GenLayer Contract:  ${GL_CONTRACT}`);
  log(`Escrow Contract:    ${ESCROW}`);
  log(`Relayer:            ${account.address}`);

  // TEST 1: REJECT — unverifiable
  await runTest(
    'REJECT — Unverifiable condition',
    'Delivery confirmed for order #TEST-REJECT with tracking ID FAKE-999',
    'https://httpstat.us/404',
    'REJECTED'
  );

  // TEST 2: APPROVE — demo always-true (with waitForReceipt)
  await runTest(
    'APPROVE — Demo always-true condition (with finality wait)',
    'The number 2 is greater than the number 1',
    'https://example.com',
    'APPROVED'
  );

  // TEST 3: REJECT — nonsense
  await runTest(
    'REJECT — Nonsense condition',
    'Purple elephants quantum-delivered lunar packages',
    'https://httpstat.us/500',
    'REJECTED'
  );

  // Summary
  console.log('');
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║  RESULTS                                                    ║');
  log('╚══════════════════════════════════════════════════════════════╝');
  for (const r of results) {
    log(`${r.pass ? '✅' : '❌'} ${r.name}  expected=${r.expected}  actual=${r.outcome}`);
  }
  log(`PASSED: ${results.filter(r => r.pass).length}/${results.length}`);

  // Architecture notes
  console.log('');
  log('━━━ FINDINGS ━━━');
  const approveTest = results.find(r => r.expected === 'APPROVED');
  if (approveTest && !approveTest.pass) {
    log('⚠️  STRUCTURAL ISSUE: DEMO_ALWAYS_TRUE still rejected after waitForReceipt');
    log('   This means either:');
    log('   a) waitForTransactionReceipt does NOT wait for full consensus finality');
    log('   b) The contract state writes are not reflected in view reads (StudioNet bug)');
    log('   c) The GenLayer consensus process modifies/overrides the write result');
    log('');
    log('   IMPACT: The relayer CANNOT reliably distinguish "reject" from "not yet processed"');
    log('   getResult() defaults to false, same as explicit reject');
  } else if (approveTest && approveTest.pass) {
    log('✅ waitForTransactionReceipt FIXES the timing issue');
    log('   The relayer should be updated to use waitForTransactionReceipt');
    log('   after writeContract for validate() calls');
  }
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
