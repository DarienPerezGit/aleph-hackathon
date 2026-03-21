const BEFORE_STEPS = ['Sign', 'Execute'];
const AFTER_STEPS = ['Intent', 'Validate', 'Prove', 'Execute'];

const STATEMENTS = [
  'Decisions become executable.',
  'Context is validated before value moves.',
  'Execution requires agreement, not just signatures.',
];

function Pipeline({ steps, highlightLast }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full border ${
                i === steps.length - 1 && highlightLast
                  ? 'bg-gray-900 border-gray-900'
                  : i === steps.length - 1
                  ? 'bg-gray-900 border-gray-900'
                  : 'border-gray-500'
              }`}
            />
            <span className="text-xs text-gray-500 mt-2 font-mono whitespace-nowrap">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex items-center mb-4 mx-1">
              <div className="w-8 md:w-14 h-px bg-gray-400" />
              <div className="w-1 h-1 bg-gray-400 rotate-45 -ml-0.5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function BeforeAfter() {
  return (
    <section className="border-b border-gray-200 py-16 px-8 md:px-16">
      <p className="text-xs tracking-widest uppercase text-gray-400 mb-12 font-mono">
        Context
      </p>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        {/* Before */}
        <div className="border border-gray-200 p-8">
          <p className="text-xs font-mono text-gray-400 mb-6 uppercase tracking-widest">Before</p>
          <Pipeline steps={BEFORE_STEPS} />
          <p className="mt-8 text-sm text-gray-500 leading-relaxed">
            A signature is sufficient for execution. Value moves immediately with no validation layer.
          </p>
        </div>

        {/* After */}
        <div className="border border-gray-200 p-8">
          <p className="text-xs font-mono text-gray-400 mb-6 uppercase tracking-widest">After</p>
          <Pipeline steps={AFTER_STEPS} highlightLast />
          <p className="mt-8 text-sm text-gray-500 leading-relaxed">
            A declaration is evaluated before it becomes executable. Context precedes execution.
          </p>
        </div>
      </div>

      {/* Statements */}
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 border border-gray-200">
        {STATEMENTS.map((s) => (
          <div key={s} className="px-8 py-6">
            <p className="text-base text-gray-700 leading-relaxed">{s}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
