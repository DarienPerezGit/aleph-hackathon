import 'dotenv/config';
import crypto from 'node:crypto';
import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';
import { settleIntent } from './apolo-relayer.mjs';

const privateKey = process.env.SOLVER_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error('Missing SOLVER_PRIVATE_KEY/PRIVATE_KEY');
}

const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
const bscRpc = process.env.BSC_TESTNET_RPC;
if (!escrowAddress || !bscRpc) {
  throw new Error('Missing ESCROW_CONTRACT_ADDRESS or BSC_TESTNET_RPC');
}

const account = privateKeyToAccount(privateKey);
const walletClient = createWalletClient({ account, chain: bscTestnet, transport: http(bscRpc) });
const publicClient = createPublicClient({ chain: bscTestnet, transport: http(bscRpc) });

const escrowAbi = parseAbi([
  'function fund(bytes32 intentHash, uint256 amount) external payable'
]);

async function main() {
  const intentHash = `0x${crypto.randomBytes(32).toString('hex')}`;
  const amountWei = BigInt(process.env.QA_AMOUNT_WEI || '100000000000000');
  const condition = process.env.QA_CONDITION || 'Is the provided evidence non-empty text? Answer YES.';
  const evidenceUrl = Object.prototype.hasOwnProperty.call(process.env, 'QA_EVIDENCE_URL')
    ? process.env.QA_EVIDENCE_URL
    : 'https://example.com';

  console.log('[QA] Intent generated', {
    intentHash,
    amountWei: amountWei.toString(),
    condition,
    evidenceUrl
  });

  const fundTxHash = await walletClient.writeContract({
    address: escrowAddress,
    abi: escrowAbi,
    functionName: 'fund',
    args: [intentHash, amountWei],
    value: amountWei
  });

  console.log('[QA] Escrow fund tx sent', { fundTxHash });
  await publicClient.waitForTransactionReceipt({ hash: fundTxHash });
  console.log('[QA] Escrow fund tx confirmed', { fundTxHash });

  const settlement = await settleIntent(intentHash, { condition, evidenceUrl });
  console.log('[QA] Relayer settlement result', settlement);
}

main().catch((error) => {
  console.error('[QA] E2E direct failed', error?.message || String(error));
  process.exit(1);
});
