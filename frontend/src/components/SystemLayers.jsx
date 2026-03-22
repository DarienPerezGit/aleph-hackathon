const LAYERS = [
  {
    index: '01',
    title: 'Intent',
    tech: 'EIP-712',
    description:
      'User defines what should happen. Not a transaction — a typed declaration with recipient, amount, condition, and deadline.',
  },
  {
    index: '02',
    title: 'Validation',
    tech: 'GenLayer Bradbury',
    description:
      'AI consensus evaluates the intent against context. Validators reach agreement using the Equivalence Principle before any execution is permitted.',
  },
  {
    index: '03',
    title: 'Finality',
    tech: 'Dispute Window',
    description:
      'After consensus, a dispute window opens. Anyone can appeal. No execution happens until the result is finalized — AI is verified, not blindly trusted.',
  },
  {
    index: '04',
    title: 'Execution',
    tech: 'BNB Smart Chain',
    description:
      'The escrow contract releases or refunds funds. Value moves only after validation is finalized onchain.',
  },
];

function LayerShape({ index }) {
  if (index === '01') {
    return (
      <svg viewBox="0 0 40 40" className="w-10 h-10 mb-6" aria-hidden="true">
        <circle cx="20" cy="20" r="12" fill="none" stroke="#111" strokeWidth="1" />
        <circle cx="20" cy="20" r="4" fill="#111" />
      </svg>
    );
  }
  if (index === '02') {
    return (
      <svg viewBox="0 0 40 40" className="w-10 h-10 mb-6" aria-hidden="true">
        <polygon points="20,4 36,32 4,32" fill="none" stroke="#111" strokeWidth="1" />
      </svg>
    );
  }
  if (index === '03') {
    return (
      <svg viewBox="0 0 40 40" className="w-10 h-10 mb-6" aria-hidden="true">
        <rect x="8" y="8" width="24" height="24" fill="none" stroke="#111" strokeWidth="1" transform="rotate(0 20 20)" />
        <rect x="14" y="14" width="12" height="12" fill="none" stroke="#111" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10 mb-6" aria-hidden="true">
      <line x1="4" y1="20" x2="36" y2="20" stroke="#111" strokeWidth="1" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="#111" strokeWidth="1" />
      <circle cx="20" cy="20" r="5" fill="none" stroke="#111" strokeWidth="1" />
    </svg>
  );
}

export default function SystemLayers() {
  return (
    <section className="border-b border-gray-200 py-16 px-8 md:px-16">
      <p className="text-xs tracking-widest uppercase text-gray-400 mb-12 font-mono">
        System Architecture
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 border border-gray-200">
        {LAYERS.map((layer) => (
          <div key={layer.index} className="bg-white p-8">
            <span className="block text-xs text-gray-400 mb-6 font-mono">{layer.index}</span>
            <LayerShape index={layer.index} />
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{layer.title}</h3>
            <p className="text-xs font-mono text-gray-400 mb-4">{layer.tech}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{layer.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
