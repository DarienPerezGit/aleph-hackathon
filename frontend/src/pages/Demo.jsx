import { Link } from 'react-router-dom';
import DemoPanel from '../components/DemoPanel';

const ESCROW_ADDRESS = '0xc065d530eAb19955EedC11BD51920625100B3a6A';

export default function Demo() {
  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#111] antialiased noise-bg">

      {/* Nav */}
      <nav className="px-8 py-6 flex items-center justify-between border-b border-black/[0.06]">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-bold tracking-[0.25em] uppercase text-[#111] hover:text-[#444] transition-colors">
            Rebyt
          </Link>
          <span className="w-px h-4 bg-black/10" />
          <span className="text-xs font-mono text-[#999]">Live execution</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-[7px] h-[7px] rounded-full bg-emerald-500 status-pulse" />
              <span className="text-xs font-mono text-[#666]">LIVE</span>
            </span>
            <span className="w-px h-4 bg-black/10" />
            <span className="text-xs font-mono text-[#666]">4/4 validators</span>
            <span className="w-px h-4 bg-black/10" />
            <span className="text-xs font-mono text-[#666]">StudioNet connected</span>
          </div>
          <Link
            to="/"
            className="text-xs font-mono text-[#999] hover:text-[#444] transition-colors"
          >
            ← Back
          </Link>
        </div>
      </nav>

      {/* Demo header */}
      <section className="py-16 px-6 md:px-8">
        <div className="max-w-4xl mx-auto mb-14">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111] mb-2">
                Live execution
              </h1>
              <p className="text-sm font-mono text-[#999]">
                Intent → Consensus → Settlement
              </p>
            </div>
            <span className="text-xs font-mono text-[#bbb]">BSC Testnet · Chain 97</span>
          </div>
        </div>

        <DemoPanel />
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-mono text-[#bbb]">
            Rebyt Protocol · BSC Testnet · GenLayer Bradbury
          </span>
          <a
            href={`https://testnet.bscscan.com/address/${ESCROW_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-[#999] hover:text-[#444] transition-colors"
          >
            {ESCROW_ADDRESS.slice(0, 6)}...{ESCROW_ADDRESS.slice(-4)} ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
