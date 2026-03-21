import 'dotenv/config';
import { createAccount as createGenLayerAccount, createClient as createGenLayerClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';

const requiredEnv = [
  'ESCROW_CONTRACT_ADDRESS',
  'GENLAYER_CONTRACT_ADDRESS',
  'BSC_TESTNET_RPC'
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

const privateKey = process.env.PRIVATE_KEY || process.env.SOLVER_PRIVATE_KEY;
if (!privateKey) {
  throw new Error('Missing env var: PRIVATE_KEY (or SOLVER_PRIVATE_KEY fallback)');
}

const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS;
const GENLAYER_CONTRACT_ADDRESS = process.env.GENLAYER_CONTRACT_ADDRESS;
const BSC_TESTNET_RPC = process.env.BSC_TESTNET_RPC;
const GENLAYER_RPC = process.env.GENLAYER_RPC || 'https://zksync-os-testnet-genlayer.zksync.dev';
const GENLAYER_CHAIN_ID = Number(process.env.GENLAYER_CHAIN_ID || 4221);
const DEFAULT_EVIDENCE_URL = process.env.GENLAYER_EVIDENCE_URL ?? '';

const escrowAbi = parseAbi([
  'function release(bytes32 intentHash) external',
  'function refund(bytes32 intentHash) external',
  'function markValidating(bytes32 intentHash) external',
  'function getIntent(bytes32 intentHash) external view returns ((address recipient,uint256 amount,uint8 state,uint256 fundedAt,uint256 settledAt))'
]);

const account = privateKeyToAccount(privateKey);

const walletClient = createWalletClient({
  account,
  chain: bscTestnet,
  transport: http(BSC_TESTNET_RPC)
});

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(BSC_TESTNET_RPC)
});

const genlayerClient = createGenLayerClient({
  chain: testnetBradbury,
  rpcUrl: GENLAYER_RPC,
  endpoint: GENLAYER_RPC,
  chainId: GENLAYER_CHAIN_ID,
  account: createGenLayerAccount(privateKey)
});

function logStep(message, payload = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, payload);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getGenLayerValidation(intentHash, condition = '') {
  let lastError;
  let sawFalse = false;

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    logStep(`getResult attempt ${attempt}/10...`, { intentHash, condition });

    try {
      const rawResult = await genlayerClient.readContract({
        address: GENLAYER_CONTRACT_ADDRESS,
        functionName: 'getResult',
        args: [intentHash]
      });

      if (typeof rawResult === 'boolean') {
        if (rawResult === true) {
          return true;
        }
        sawFalse = true;
        if (attempt < 10) {
          logStep('getResult returned false; waiting for potential final consensus...', {
            intentHash,
            condition,
            attempt
          });
          await sleep(2000);
          continue;
        }
        return false;
      }

      if (typeof rawResult === 'string') {
        const normalized = rawResult.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') {
          sawFalse = true;
          if (attempt < 10) {
            logStep('getResult returned "false"; waiting for potential final consensus...', {
              intentHash,
              condition,
              attempt
            });
            await sleep(2000);
            continue;
          }
          return false;
        }
      }

      throw new Error(`Unexpected getResult response type: ${JSON.stringify(rawResult)}`);
    } catch (error) {
      lastError = error;
      if (attempt < 10) {
        await sleep(2000);
      }
    }
  }

  if (sawFalse) {
    return false;
  }

  throw new Error(`GenLayer getResult failed after 10 attempts: ${lastError?.message ?? 'unknown error'}`);
}

async function triggerGenLayerValidation(intentHash, condition, evidenceUrl) {
  if (!condition || typeof condition !== 'string') {
    throw new Error('Missing delivery condition for GenLayer validate()');
  }

  if (typeof evidenceUrl !== 'string') {
    throw new Error('Invalid evidenceUrl for GenLayer validate()');
  }

  logStep('Submitting validation request to GenLayer', {
    intentHash,
    condition,
    evidenceUrl,
    contract: GENLAYER_CONTRACT_ADDRESS
  });

  const validateTxHash = await genlayerClient.writeContract({
    address: GENLAYER_CONTRACT_ADDRESS,
    functionName: 'validate',
    args: [intentHash, condition, evidenceUrl]
  });

  logStep('GenLayer validate transaction sent', {
    intentHash,
    validateTxHash
  });

  return validateTxHash;
}

export async function settleIntent(intentHash, validationContext = {}) {
  const { condition = '', evidenceUrl = DEFAULT_EVIDENCE_URL } = validationContext;

  const intent = await publicClient.readContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: escrowAbi,
    functionName: 'getIntent',
    args: [intentHash]
  });

  const state = Number(intent.state ?? intent[2]);
  if (state === 0) {
    throw new Error('Intent not funded (state=PENDING)');
  }
  if (state === 3 || state === 4) {
    logStep('Intent already settled, skipping settlement', { intentHash, state });
    return {
      intentHash,
      action: state === 3 ? 'release' : 'refund',
      status: 'already-settled'
    };
  }

  const validateTxHash = await triggerGenLayerValidation(intentHash, condition, evidenceUrl);

  logStep('Polling validation result', { intentHash, condition, evidenceUrl, validateTxHash });
  const result = await getGenLayerValidation(intentHash, condition);
  logStep('Validation result fetched', { intentHash, condition, evidenceUrl, result });

  if (state === 1) {
    await walletClient.writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: escrowAbi,
      functionName: 'markValidating',
      args: [intentHash]
    });
  }

  const functionName = result ? 'release' : 'refund';

  const txHash = await walletClient.writeContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: escrowAbi,
    functionName,
    args: [intentHash]
  });

  logStep('Settlement transaction sent', {
    intentHash,
    action: functionName,
    txHash,
    bscScanUrl: `https://testnet.bscscan.com/tx/${txHash}`
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  logStep('Settlement transaction confirmed', {
    intentHash,
    action: functionName,
    blockNumber: receipt.blockNumber.toString(),
    status: receipt.status
  });

  return {
    intentHash,
    validateTxHash,
    result,
    action: functionName,
    txHash,
    status: receipt.status
  };
}

if (process.argv[1] && process.argv[1].includes('rebyt-relayer.mjs')) {
  const intentHash = process.argv[2];

  if (!intentHash) {
    throw new Error('Usage: node scripts/rebyt-relayer.mjs <intentHash>');
  }

  settleIntent(intentHash)
    .then((output) => {
      logStep('Relayer completed', output);
    })
    .catch((error) => {
      logStep('Relayer failed', { error: error.message });
      process.exit(1);
    });
}
