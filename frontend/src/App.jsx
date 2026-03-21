import { useEffect, useMemo, useState } from 'react';
import {
  parseAbi,
  parseEther
} from 'viem';
import { createWalletClient, custom } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';
import { signPaymentIntentWithSessionAccount } from './lib/intentSigner';

const escrowAbi = parseAbi([
  'function fund(bytes32 intentHash, uint256 amount) external payable'
]);

const ESCROW_CONTRACT_ADDRESS = '0xc065d530eAb19955EedC11BD51920625100B3a6A';
const GENLAYER_CONTRACT_ADDRESS = '0x023b48B9c8C4805c4c4dAB50247e78d4a082C46E';
const REBYT_SESSION_ROUTER_ADDRESS = '0xBca0f7A094A5398598A8415270711ae3Dd46A986';
const SOLVER_URL = 'http://localhost:3001/intent';

const initialPipeline = [
  { key: 'intent', name: 'Intent signed', network: 'offchain', status: 'idle', link: '' },
  { key: 'escrow', name: 'Escrow funded', network: 'BSC Testnet', status: 'idle', link: '' },
  { key: 'validation', name: 'AI validating', network: 'GenLayer Bradbury', status: 'idle', link: '' },
  { key: 'settlement', name: 'Settlement done', network: 'BSC Testnet', status: 'idle', link: '' }
];

function statusCircleClass(status) {
  if (status === 'confirmed') return 'bg-emerald-400';
  if (status === 'processing') return 'bg-amber-300';
  return 'bg-slate-500';
}

function nowLog(message) {
  return { message, timestamp: new Date().toLocaleTimeString() };
}

export default function App() {
  const [recipient, setRecipient] = useState('0xa2e036eD6f43baC9c67B6B098E8B006365b01464');
  const [amount, setAmount] = useState('0.0001');
  const [condition, setCondition] = useState('Delivery confirmed for order #TEST-001');
  const [intentHash, setIntentHash] = useState('');
  const [escrowTx, setEscrowTx] = useState('');
  const [settlementTx, setSettlementTx] = useState('');
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [logs, setLogs] = useState([]);
  const [account, setAccount] = useState('');
  const [sessionWalletAddress, setSessionWalletAddress] = useState('');
  const [sessionPrivateKey, setSessionPrivateKey] = useState('');
  const [isWalletUpgraded, setIsWalletUpgraded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pushLog = (message) => setLogs((prev) => [nowLog(message), ...prev]);

  async function setupSessionWallet() {
    if (!window.ethereum) throw new Error('No wallet found');

    const walletClient = createWalletClient({
      chain: bscTestnet,
      transport: custom(window.ethereum)
    });

    const [selected] = await walletClient.requestAddresses();

    const generatedPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(generatedPrivateKey);

    setAccount(selected);
    setSessionPrivateKey(generatedPrivateKey);
    setSessionWalletAddress(sessionAccount.address);
    setIsWalletUpgraded(true);

    pushLog(`Main wallet connected: ${selected}`);
    pushLog(`Wallet Upgraded! Session limits active. Session wallet: ${sessionAccount.address}`);
    console.log('Session wallet generated (fallback mode):', {
      mainWallet: selected,
      sessionWallet: sessionAccount.address,
      router: REBYT_SESSION_ROUTER_ADDRESS
    });
  }

  async function submitIntent(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
    if (!isWalletUpgraded || !sessionPrivateKey) {
      throw new Error('Run "Connect Wallet to Upgrade (EIP-7702)" first');
    }

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const nonce = BigInt(Date.now());
    const parsedAmount = parseEther(amount || '0');

    const intent = {
      recipient,
      amount: parsedAmount,
      condition,
      deadline: BigInt(deadline),
      nonce
    };

    const sessionAccount = privateKeyToAccount(sessionPrivateKey);

    const signed = await signPaymentIntentWithSessionAccount(sessionAccount, intent);
    setIntentHash(signed.intentHash);
    setEscrowTx('');
    setSettlementTx('');
    setPipeline(initialPipeline);

    setPipeline((prev) =>
      prev.map((step) =>
        step.key === 'intent'
          ? { ...step, status: 'confirmed' }
          : step
      )
    );
    pushLog(`Intent signed by session wallet: ${signed.intentHash}`);

    const response = await fetch(SOLVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intentHash: signed.intentHash,
        signature: signed.signature,
        signer: sessionAccount.address,
        intent: {
          recipient,
          amountWei: parsedAmount.toString(),
          condition,
          deadline,
          nonce: nonce.toString()
        },
        setupMode: 'fallback-session-wallet',
        mainWallet: account,
        routerAddress: REBYT_SESSION_ROUTER_ADDRESS
      })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Solver HTTP ${response.status}`);
    }

    const body = await response.json();
    const fundTx = body.txHash;

    setEscrowTx(fundTx);
    setPipeline((prev) =>
      prev.map((step) => {
        if (step.key === 'escrow') {
          return {
            ...step,
            status: 'confirmed',
            link: fundTx ? `https://testnet.bscscan.com/tx/${fundTx}` : ''
          };
        }
        return step;
      })
    );
    pushLog(`Escrow funded tx: ${fundTx}`);
    } catch (error) {
      pushLog(`Submit error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!intentHash) return;

    const timer = setInterval(async () => {
      try {
        const response = await fetch(`${SOLVER_URL}/${intentHash}/status`);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Status HTTP ${response.status}`);
        }

        const statusData = await response.json();
        const status = statusData.status;
        const settlementHash = statusData.settlementTxHash || '';

        if (settlementHash && settlementHash !== settlementTx) {
          setSettlementTx(settlementHash);
          pushLog(`Settlement transaction detected: ${settlementHash}`);
        }

        setPipeline((prev) =>
          prev.map((step) => {
            if (step.key === 'escrow') {
              return {
                ...step,
                status: escrowTx ? 'confirmed' : step.status,
                link: escrowTx ? `https://testnet.bscscan.com/tx/${escrowTx}` : ''
              };
            }
            if (step.key === 'validation') {
              const validationConfirmed = status === 'VALIDATING' || status === 'RELEASED' || status === 'REFUNDED';
              return {
                ...step,
                status: validationConfirmed ? 'confirmed' : step.status,
                link: validationConfirmed ? `https://studio.genlayer.com/contract/${GENLAYER_CONTRACT_ADDRESS}` : ''
              };
            }
            if (step.key === 'settlement') {
              const settled = status === 'RELEASED';
              return {
                ...step,
                status: settled ? 'confirmed' : step.status,
                link: settled && settlementHash ? `https://testnet.bscscan.com/tx/${settlementHash}` : ''
              };
            }
            return step;
          })
        );

        if (status === 'RELEASED') {
          clearInterval(timer);
        }
      } catch (error) {
        pushLog(`Polling error: ${error.message}`);
        clearInterval(timer);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [intentHash, escrowTx, settlementTx]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-3xl font-bold">Rebyt</h1>
          <p className="mt-2 text-slate-300">Blockchains execute transactions. Rebyt validates outcomes before value moves.</p>
        </header>

        <form onSubmit={submitIntent} className="mb-8 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="mb-2 text-lg font-semibold">Session Onboarding (Fallback Productivo)</h3>
            <p className="text-sm text-slate-300">Connect wallet once to simulate EIP-7702 upgrade. Checkout uses local session key only.</p>
            {!isWalletUpgraded ? (
              <button
                type="button"
                onClick={setupSessionWallet}
                className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 hover:bg-emerald-600"
              >
                Connect Wallet to Upgrade (EIP-7702)
              </button>
            ) : (
              <p className="mt-3 text-sm text-emerald-300">Wallet Upgraded! Session limits active.</p>
            )}
            <p className="mt-2 text-xs text-slate-300 break-all">Main wallet: {account || '-'}</p>
            <p className="text-xs text-slate-300 break-all">Session wallet: {sessionWalletAddress || '-'}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Recipient Address</label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Amount (tBNB)</label>
            <input
              type="number"
              step="0.0001"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Condition</label>
            <textarea
              className="h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!isWalletUpgraded || isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign Intent &amp; Pay
            </button>
          </div>
        </form>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {pipeline.map((step) => (
              <article key={step.key} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${statusCircleClass(step.status)}`} />
                  <h3 className="text-base font-semibold">{step.name}</h3>
                </div>
                <span className="inline-block rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">
                  {step.network}
                </span>
                {step.link && step.status === 'confirmed' ? (
                  <a className="mt-3 block text-sm text-indigo-300 underline" href={step.link} target="_blank" rel="noreferrer">
                    Explorer link
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-2 text-lg font-semibold">Intent details</h3>
          <p className="text-xs text-slate-300 break-all">intentHash: {intentHash || '-'}</p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-3 text-lg font-semibold">Activity Log</h3>
          <ul className="space-y-2 text-sm">
            {logs.length === 0 ? <li className="text-slate-400">No events yet.</li> : null}
            {logs.map((entry, index) => (
              <li key={`${entry.timestamp}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                <span className="text-slate-400">[{entry.timestamp}] </span>
                {entry.message}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
