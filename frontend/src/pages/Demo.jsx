import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const TX_PROOF_URL = 'https://testnet.bscscan.com/tx/0x98f5ae6cc8ba95e139d5b5c4ce54822c7c4074f0ff75bacb7774d7645cfec453';

const CONDITION_OPTIONS = [
  'Returns HTTP 200',
  'Returns valid JSON',
  'Response contains "status: ok"',
  'Responds under 1000ms',
];

const SUGGESTIONS = [
  'API endpoint is returning 500',
  'Health check is failing',
  'Service not responding after deploy',
];

const INITIAL_BOUNTIES = [
  {
    id: 'preload-1',
    intentHash: '0x8a2c7d4f7f3d1b9e77ab43f355bc31de60d95d4f5f20f8a58b4a9ac5f0b3e912',
    title: 'API endpoint returning 500',
    url: 'https://httpbin.org/status/500',
    condition: 'Returns HTTP 200',
    reward: '0.0001',
    status: 'Open',
    createdAt: Date.now() - 2 * 60 * 1000,
  },
  {
    id: 'preload-2',
    intentHash: '0x7f2e1a4bc0e36581b3f57d6acbd9ea8d5cb127bda0099ffab38a0ac9d7c4a211',
    title: 'Health check failing in production',
    url: 'https://httpbin.org/get',
    condition: 'Returns valid JSON',
    reward: '0.0002',
    status: 'Verifying',
    createdAt: Date.now() - 7 * 60 * 1000,
  },
];

function truncateMiddle(value, left = 22, right = 14) {
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function timeAgo(timestamp) {
  const deltaMs = Date.now() - timestamp;
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function makeIntentHash() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function statusBadge(status) {
  if (status === 'Open') {
    return 'bg-sky-50 text-sky-700 border border-sky-200';
  }
  if (status === 'Verifying') {
    return 'bg-amber-50 text-amber-700 border border-amber-200 status-pulse';
  }
  if (status === 'Paid') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  return 'bg-zinc-100 text-zinc-600 border border-zinc-200';
}

function BountyCard({ bounty, showClaim, isBusy, onClaim }) {
  return (
    <div
      className="card-hover bg-white/70 backdrop-blur-[12px] border border-black/[0.07] rounded-[14px] p-5 transition-all"
      style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-[15px] font-semibold text-[#111] leading-snug">{bounty.title}</h3>
        <span className={`text-[10px] font-mono px-2 py-1 rounded-full whitespace-nowrap ${statusBadge(bounty.status)}`}>
          {bounty.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-xs font-mono text-[#666]">
          URL: <span className="text-[#999]">{truncateMiddle(bounty.url)}</span>
        </p>
        <p className="text-xs font-mono text-[#666]">
          Condition: <span className="text-[#999]">{bounty.condition}</span>
        </p>
        <p className="text-xs font-mono text-[#666]">
          Reward: <span className="text-[#111]">{bounty.reward} tBNB</span>
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-mono text-[#bbb]">{timeAgo(bounty.createdAt)}</p>
        {showClaim && (
          <button
            onClick={() => onClaim(bounty.id)}
            disabled={isBusy}
            className="text-xs font-mono border border-black/10 px-3 py-2 rounded-[10px] hover:border-[#111] hover:bg-[#111] hover:text-white text-[#555] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isBusy ? 'Verifying...' : 'Claim & Verify'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Demo() {
  const [activeTab, setActiveTab] = useState('client');
  const [bounties, setBounties] = useState(INITIAL_BOUNTIES);
  const [isVerifying, setIsVerifying] = useState(false);
  const [flowMessage, setFlowMessage] = useState('');
  const [showResult, setShowResult] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [confirmation, setConfirmation] = useState('');

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [condition, setCondition] = useState(CONDITION_OPTIONS[0]);
  const [reward, setReward] = useState('0.0001');

  const openBounties = useMemo(
    () => bounties.filter((entry) => entry.status === 'Open'),
    [bounties],
  );

  function appendLog(line) {
    const stamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setActivityLog((previous) => [`[${stamp}] ${line}`, ...previous].slice(0, 10));
  }

  function resetFlowFeedback() {
    setFlowMessage('');
    setShowResult('');
  }

  function handleSuggestionClick(value) {
    setTitle(value);
    if (value.toLowerCase().includes('500')) {
      setUrl('https://httpbin.org/status/500');
      setCondition('Returns HTTP 200');
    }
    if (value.toLowerCase().includes('health')) {
      setUrl('https://httpbin.org/get');
      setCondition('Returns valid JSON');
    }
  }

  function handleCreateBounty(event) {
    event.preventDefault();
    if (!title.trim() || !url.trim() || !reward.trim()) return;

    const newBounty = {
      id: `${Date.now()}`,
      intentHash: makeIntentHash(),
      title: title.trim(),
      url: url.trim(),
      condition,
      reward,
      status: 'Open',
      createdAt: Date.now(),
    };

    setBounties((previous) => [newBounty, ...previous]);
    setTitle('');
    setUrl('');
    setCondition(CONDITION_OPTIONS[0]);
    setReward('0.0001');
    setConfirmation('Bounty created → Intent signed');
    setTimeout(() => setConfirmation(''), 2500);
  }

  async function handleClaimAndVerify(bountyId) {
    if (isVerifying) return;

    resetFlowFeedback();
    setIsVerifying(true);

    setBounties((previous) =>
      previous.map((entry) =>
        entry.id === bountyId ? { ...entry, status: 'Verifying' } : entry,
      ),
    );

    const selected = bounties.find((entry) => entry.id === bountyId);
    const targetUrl = selected?.url ?? '';

    setFlowMessage('Checking endpoint...');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setFlowMessage('Validators reaching consensus...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = targetUrl.includes('httpbin.org/get');

    appendLog(`Endpoint checked: ${targetUrl}`);
    appendLog(`Validators consensus: ${success}`);

    if (success) {
      setFlowMessage('Condition met ✓ — Payment released');
      setShowResult('success');
      appendLog('Payment released');
    } else {
      setFlowMessage('Condition not met — Refund issued');
      setShowResult('fail');
      appendLog('Refund issued');
    }

    setBounties((previous) =>
      previous.map((entry) =>
        entry.id === bountyId
          ? { ...entry, status: success ? 'Paid' : 'Refunded' }
          : entry,
      ),
    );

    setIsVerifying(false);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#111] antialiased noise-bg">
      <nav className="px-6 md:px-8 py-6 flex items-center justify-between border-b border-black/[0.06]">
        <div className="flex items-center gap-5">
          <Link to="/" className="text-sm font-bold tracking-[0.25em] uppercase text-[#111] hover:text-[#444] transition-colors">
            Apolo
          </Link>
          <span className="w-px h-4 bg-black/10" />
          <span className="text-xs font-mono text-[#999]">Marketplace demo</span>
        </div>
        <a
          href={TX_PROOF_URL}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono border border-black/10 px-3 py-2 rounded-[10px] hover:border-[#111] hover:bg-[#111] hover:text-white transition-all"
        >
          View transaction on-chain ↗
        </a>
      </nav>

      <main className="max-w-6xl mx-auto px-6 md:px-8 py-10 md:py-12 space-y-8">
        <div className="inline-flex items-center p-1 bg-white/70 border border-black/[0.07] rounded-[12px] backdrop-blur-[12px]">
          <button
            onClick={() => setActiveTab('client')}
            className={`px-5 py-2.5 text-xs font-mono rounded-[9px] transition-all ${
              activeTab === 'client'
                ? 'bg-[#111] text-white'
                : 'text-[#777] hover:text-[#333]'
            }`}
          >
            Client
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`px-5 py-2.5 text-xs font-mono rounded-[9px] transition-all ${
              activeTab === 'developer'
                ? 'bg-[#111] text-white'
                : 'text-[#777] hover:text-[#333]'
            }`}
          >
            Developer
          </button>
        </div>

        <div className="transition-all duration-300 ease-out">
          {activeTab === 'client' ? (
            <section className="space-y-6 animate-in fade-in duration-300">
              <header>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111] mb-2">
                  Post a bounty. Pay only when it&apos;s fixed.
                </h1>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
                <form
                  onSubmit={handleCreateBounty}
                  className="bg-white/70 backdrop-blur-[12px] border border-black/[0.07] rounded-[14px] p-6 space-y-5"
                  style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                >
                  <div>
                    <label className="block text-xs font-mono text-[#999] mb-2">What needs to be fixed?</label>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="My API is down"
                      className="w-full text-sm bg-transparent border border-black/10 rounded-[10px] px-3 py-2.5 focus:border-[#111] focus:outline-none transition-colors"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SUGGESTIONS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleSuggestionClick(chip)}
                          className="text-[11px] font-mono border border-black/10 rounded-full px-2.5 py-1 hover:border-[#111] hover:text-[#111] text-[#666] transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#999] mb-2">Verification URL</label>
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://api.myapp.com/health"
                      className="w-full text-sm bg-transparent border border-black/10 rounded-[10px] px-3 py-2.5 focus:border-[#111] focus:outline-none transition-colors"
                    />
                    <p className="text-[11px] font-mono text-[#bbb] mt-1.5">
                      We&apos;ll check this URL to verify the fix
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#999] mb-2">Success condition</label>
                    <select
                      value={condition}
                      onChange={(event) => setCondition(event.target.value)}
                      className="w-full text-sm bg-transparent border border-black/10 rounded-[10px] px-3 py-2.5 focus:border-[#111] focus:outline-none transition-colors"
                    >
                      {CONDITION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#999] mb-2">Reward (tBNB)</label>
                    <input
                      value={reward}
                      onChange={(event) => setReward(event.target.value)}
                      className="w-full text-sm bg-transparent border border-black/10 rounded-[10px] px-3 py-2.5 focus:border-[#111] focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full text-sm font-mono border border-black/10 py-3 rounded-[10px] hover:border-[#111] hover:bg-[#111] hover:text-white text-[#555] transition-all"
                  >
                    Post Bounty
                  </button>

                  {confirmation && (
                    <p className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[10px] px-3 py-2 animate-in fade-in duration-200">
                      {confirmation}
                    </p>
                  )}
                </form>

                <div className="space-y-3">
                  <h2 className="text-sm font-mono text-[#999] uppercase tracking-widest">Active bounties</h2>
                  <div className="space-y-3 max-h-[620px] overflow-auto pr-1">
                    {bounties.map((bounty) => (
                      <BountyCard key={bounty.id} bounty={bounty} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-6 animate-in fade-in duration-300">
              <header>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111] mb-2">
                  Pick a bounty. Ship the fix. Get paid.
                </h1>
              </header>

              {flowMessage && (
                <div className={`text-sm font-mono rounded-[12px] px-4 py-3 border transition-all duration-300 ${
                  showResult === 'success'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : showResult === 'fail'
                      ? 'text-zinc-700 bg-zinc-100 border-zinc-200'
                      : 'text-[#666] bg-white/70 border-black/[0.07]'
                }`}>
                  {flowMessage}
                </div>
              )}

              {showResult && (
                <a
                  href={TX_PROOF_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-xs font-mono text-[#999] hover:text-[#444] transition-colors"
                >
                  View transaction on-chain ↗
                </a>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
                <div className="space-y-3">
                  <h2 className="text-sm font-mono text-[#999] uppercase tracking-widest">Available bounties</h2>
                  {openBounties.length === 0 ? (
                    <div className="bg-white/70 border border-black/[0.07] rounded-[14px] p-5 text-sm text-[#777]">
                      No open bounties right now.
                    </div>
                  ) : (
                    openBounties.map((bounty) => (
                      <BountyCard
                        key={bounty.id}
                        bounty={bounty}
                        showClaim
                        isBusy={isVerifying}
                        onClaim={handleClaimAndVerify}
                      />
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-mono text-[#999] uppercase tracking-widest">Activity log</h2>
                  <div
                    className="bg-white/70 backdrop-blur-[12px] border border-black/[0.07] rounded-[14px] p-4 min-h-[240px]"
                    style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                  >
                    {activityLog.length === 0 ? (
                      <p className="text-xs font-mono text-[#bbb]">No activity yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {activityLog.map((entry, index) => (
                          <li key={`${index}-${entry}`} className="text-xs font-mono text-[#666] break-words">
                            {entry}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
