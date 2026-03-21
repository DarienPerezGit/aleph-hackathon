import { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { createWalletClient, custom } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';
import { signPaymentIntentWithSessionAccount } from './lib/intentSigner';
import Hero from './components/Hero';
import SystemLayers from './components/SystemLayers';
import BeforeAfter from './components/BeforeAfter';

const REBYT_SESSION_ROUTER_ADDRESS = '0xBca0f7A094A5398598A8415270711ae3Dd46A986';
const SOLVER_URL = 'http://localhost:3001/intent';

const initialPipeline = [
  { key: 'intent',     name: 'Intent',     label: 'EIP-712 signed',    status: 'idle', link: '' },
  { key: 'escrow',     name: 'Escrow',     label: 'BSC Testnet',       status: 'idle', link: '' },
  { key: 'validation', name: 'Validation', label: 'GenLayer Bradbury', status: 'idle', link: '' },
  { key: 'settlement', name: 'Settlement', label: 'BSC Testnet',       status: 'idle', link: '' },
];

function nowLog(message) {
  return { message, timestamp: new Date().toLocaleTimeString() };
}

function PipelineTrace({ pipeline }) {
  return (
    <div className="flex items-start">
      {pipeline.map((step, i) => (
        <div key={step.key} className="flex items-start flex-1 min-w-0">
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={`flex-1 h-px ${step.status !== 'idle' ? 'bg-gray-900' : 'bg-gray-200'}`} />
              )}
              <div className="shrink-0">
                {step.status === 'idle' && (
                  <div className="w-3 h-3 rounded-full border border-gray-300" />
                )}
                {step.status === 'processing' && (
                  <div className="w-3 h-3 rounded-full border border-gray-900 animate-pulse" />
                )}
                {step.status === 'confirmed' && (
                  <div className="w-3 h-3 rounded-full bg-gray-900" />
                )}
              </div>
              {i < pipeline.length - 1 && (
                <div className={`flex-1 h-px ${step.status === 'confirmed' ? 'bg-gray-900' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="mt-3 px-1 w-full text-center">
              <p className="text-xs font-semibold text-gray-900 truncate">{step.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono leading-tight" style={{ fontSize: '10px' }}>
                {step.label}
              </p>
              {step.link && step.status === 'confirmed' && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-700 underline mt-1 block font-mono"
                  style={{ fontSize: '10px' }}
                >
                  ↗ explorer
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
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

    let consecutiveErrors = 0;
    let pollAttempts = 0;
    const maxConsecutiveErrors = 5;
    const maxPollAttempts = 120;

    const timer = setInterval(async () => {
      pollAttempts += 1;
      if (pollAttempts > maxPollAttempts) {
        pushLog('Polling timeout reached. Keeping current status; check explorer links.');
        clearInterval(timer);
        return;
      }

      try {
        const response = await fetch(`${SOLVER_URL}/${intentHash}/status`);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Status HTTP ${response.status}`);
        }

        consecutiveErrors = 0;

        const statusData = await response.json();
        const status = statusData.status;
        const settlementHash = statusData.settlementTxHash || '';
        const links = statusData.links || {};

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
              const validationProcessing = status === 'VALIDATING';
              const validationConfirmed = status === 'RELEASED' || status === 'REFUNDED';
              return {
                ...step,
                status: validationProcessing ? 'processing' : (validationConfirmed ? 'confirmed' : step.status),
                link: links.genlayer || step.link
              };
            }
            if (step.key === 'settlement') {
              const settled = status === 'RELEASED' || status === 'REFUNDED';
              return {
                ...step,
                status: settled ? 'confirmed' : step.status,
                link: settled ? (links.settlement || (settlementHash ? `https://testnet.bscscan.com/tx/${settlementHash}` : '')) : ''
              };
            }
            return step;
          })
        );

        if (status === 'RELEASED' || status === 'REFUNDED') {
          clearInterval(timer);
        }

        if (statusData.error) {
          pushLog(`Solver error: ${statusData.error}`);
          clearInterval(timer);
        }
      } catch (error) {
        consecutiveErrors += 1;
        pushLog(`Polling error (${consecutiveErrors}/${maxConsecutiveErrors}): ${error.message}`);
        if (consecutiveErrors >= maxConsecutiveErrors) {
          pushLog('Stopping polling after repeated errors.');
          clearInterval(timer);
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [intentHash, escrowTx, settlementTx]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-8 md:px-16 py-4 flex items-center justify-between">
        <span className="text-sm font-bold tracking-[0.2em] uppercase">Rebyt</span>
        <span className="text-xs text-gray-400 font-mono">BSC Testnet · Chain 97</span>
      </nav>

      <Hero />
      <SystemLayers />
      <BeforeAfter />

      {/* Demo Console */}
      <section className="py-16 px-8 md:px-16 border-b border-gray-200">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-12 font-mono">Demo Console</p>

        {/* Session Wallet */}
        <div className="border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-gray-400 mb-0.5">EIP-7702</p>
              <p className="text-sm font-semibold">Session Wallet</p>
            </div>
            {!isWalletUpgraded ? (
              <button
                type="button"
                onClick={setupSessionWallet}
                className="text-xs border border-gray-900 px-4 py-2 hover:bg-gray-900 hover:text-white transition-colors font-mono"
              >
                Initialize →
              </button>
            ) : (
              <span className="text-xs font-mono text-gray-400 border border-gray-200 px-3 py-1">Active</span>
            )}
          </div>
          {isWalletUpgraded && (
            <div className="px-6 py-4 grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1 font-mono">main_wallet</p>
                <p className="text-xs font-mono text-gray-700 break-all">{account}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1 font-mono">session_wallet</p>
                <p className="text-xs font-mono text-gray-700 break-all">{sessionWalletAddress}</p>
              </div>
            </div>
          )}
        </div>

        {/* Intent Form */}
        <form onSubmit={submitIntent} className="border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-mono text-gray-400 mb-0.5">EIP-712</p>
            <p className="text-sm font-semibold">Payment Intent</p>
          </div>
          <div className="px-6 py-6 grid gap-6">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-mono">recipient</label>
              <input
                className="w-full border-b border-gray-200 pb-2 text-sm font-mono focus:outline-none focus:border-gray-900 bg-transparent transition-colors"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-mono">amount_tbnb</label>
              <input
                type="number"
                step="0.0001"
                className="w-full border-b border-gray-200 pb-2 text-sm font-mono focus:outline-none focus:border-gray-900 bg-transparent transition-colors"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-mono">condition</label>
              <textarea
                className="w-full border-b border-gray-200 pb-2 text-sm font-mono focus:outline-none focus:border-gray-900 bg-transparent transition-colors resize-none h-16"
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
                required
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={!isWalletUpgraded || isSubmitting}
                className="text-xs border border-gray-900 px-6 py-2.5 hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono"
              >
                {isSubmitting ? 'Submitting...' : 'Sign & Submit Intent →'}
              </button>
            </div>
          </div>
        </form>

        {/* Pipeline */}
        <div className="border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-mono text-gray-400 mb-0.5">Live</p>
            <p className="text-sm font-semibold">Execution Pipeline</p>
          </div>
          <div className="px-8 py-10">
            <PipelineTrace pipeline={pipeline} />
          </div>
          {intentHash && (
            <div className="px-6 pb-5 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 font-mono break-all">
                intent_hash: <span className="text-gray-700">{intentHash}</span>
              </p>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-mono text-gray-400 mb-0.5">Stream</p>
            <p className="text-sm font-semibold">Activity Log</p>
          </div>
          <div className="px-6 py-4 min-h-20 max-h-52 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 font-mono">Awaiting events.</p>
            ) : (
              <ul className="space-y-1.5">
                {logs.map((entry, index) => (
                  <li key={`${entry.timestamp}-${index}`} className="text-xs font-mono text-gray-600">
                    <span className="text-gray-400">{entry.timestamp}</span>{' '}
                    {entry.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 md:px-16 py-6 flex items-center justify-between border-t border-gray-100">
        <span className="text-xs text-gray-400 font-mono">Rebyt · Aleph Hackathon 2026</span>
        <span className="text-xs text-gray-400 font-mono">
          Escrow: 0x5191...BB98C
        </span>
      </footer>
    </div>
  );
}
