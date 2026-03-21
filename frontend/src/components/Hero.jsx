const NODES = [
  { x: 80,  y: 60,  delay: 0 },
  { x: 220, y: 100, delay: 0.7 },
  { x: 400, y: 70,  delay: 1.4 },
  { x: 560, y: 120, delay: 0.3 },
  { x: 720, y: 80,  delay: 1.1 },
  { x: 140, y: 220, delay: 1.8 },
  { x: 320, y: 270, delay: 0.5 },
  { x: 500, y: 240, delay: 1.2 },
  { x: 660, y: 280, delay: 0.9 },
  { x: 760, y: 200, delay: 2.0 },
  { x: 60,  y: 360, delay: 1.5 },
  { x: 240, y: 400, delay: 0.2 },
  { x: 440, y: 380, delay: 1.7 },
  { x: 620, y: 420, delay: 0.6 },
  { x: 800, y: 340, delay: 1.3 },
];

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [1, 6], [2, 6], [2, 7],
  [3, 7], [3, 8], [4, 9], [4, 8],
  [5, 10], [5, 11], [6, 11], [6, 12],
  [7, 12], [7, 13], [8, 13], [8, 14], [9, 14],
  [10, 11], [11, 12], [12, 13], [13, 14],
];

function NodeNetwork() {
  return (
    <svg
      viewBox="0 0 860 480"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <style>{`
          @keyframes rebyt-node-pulse {
            0%, 100% { opacity: 0.12; }
            50% { opacity: 0.45; }
          }
          @keyframes rebyt-line-fade {
            0%, 100% { opacity: 0.05; }
            50% { opacity: 0.18; }
          }
        `}</style>
      </defs>
      {EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={NODES[a].x}
          y1={NODES[a].y}
          x2={NODES[b].x}
          y2={NODES[b].y}
          stroke="#111"
          strokeWidth="0.75"
          style={{
            animation: `rebyt-line-fade ${4 + (i % 4) * 0.5}s ease-in-out infinite`,
            animationDelay: `${(i * 0.25) % 3}s`,
          }}
        />
      ))}
      {NODES.map((node, i) => (
        <circle
          key={i}
          cx={node.x}
          cy={node.y}
          r="3.5"
          fill="#111"
          style={{
            animation: `rebyt-node-pulse 3.5s ease-in-out infinite`,
            animationDelay: `${node.delay}s`,
          }}
        />
      ))}
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-gray-200" style={{ minHeight: '64vh' }}>
      <div className="absolute inset-0 pointer-events-none">
        <NodeNetwork />
      </div>
      <div className="relative z-10 px-8 md:px-16 py-24 md:py-36">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-8 font-mono">
          Protocol v1 &nbsp;·&nbsp; BSC Testnet &nbsp;·&nbsp; GenLayer Bradbury
        </p>
        <h1 className="text-8xl md:text-[10rem] font-black tracking-tight text-gray-900 leading-none mb-8">
          Rebyt
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 max-w-md leading-relaxed">
          Intent execution, validated before it happens.
        </p>
      </div>
    </section>
  );
}
