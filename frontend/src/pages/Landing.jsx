import { Link } from 'react-router-dom';
import solidityLogo from '../assets/tech/solidity.svg';
import bnbLogo from '../assets/tech/bnb.png';
import genlayerLogo from '../assets/tech/genlayer.jpg';
import ethereumLogo from '../assets/tech/ethereum.png';
import karpathyImage from '../assets/karpathy.webp';

const ESCROW_ADDRESS = '0xc065d530eAb19955EedC11BD51920625100B3a6A';
const FOOTER_VIDEO = '/11_Foundation_Pass1.mp4';

/* ── Proof / status strip ── */
function ProofStrip() {
  return (
    <section className="border-t border-white/[0.10] bg-black/55 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="w-[7px] h-[7px] rounded-full bg-amber-500 status-pulse" />
        </div>
        <span className="w-px h-4 bg-white/20" />
        <span className="w-px h-4 bg-white/20" />

        <span className="ml-auto">
          <a
            href={`https://testnet.bscscan.com/address/${ESCROW_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-white/55 hover:text-white transition-colors"
          >
            {ESCROW_ADDRESS.slice(0, 6)}...{ESCROW_ADDRESS.slice(-4)} ↗
          </a>
        </span>
      </div>
    </section>
  );
}

/* ── Layer module cards ── */
const MODULES = [
  {
    index: '01',
    label: 'Define',
    body: "Client sets a condition.\n'Pay when my API returns 200.'",
  },
  {
    index: '02',
    label: 'Verify',
    body: 'AI validators check\nthe real endpoint.',
  },
  {
    index: '03',
    label: 'Settle',
    body: "We don't replace your stack\n— we verify outcome before settlement.",
  },
];

const TECH_STACK = [
  {
    name: 'Solidity',
    logo: solidityLogo,
  },
  {
    name: 'BNB Chain',
    logo: bnbLogo,
  },
  {
    name: 'GenLayer',
    logo: genlayerLogo,
  },
  {
    name: 'Viem + EIP-712',
    logo: ethereumLogo,
  },
  {
    name: 'Vercel + Cloudflare',
    logos: [
      'https://cdn.simpleicons.org/vercel/000000',
      'https://cdn.simpleicons.org/cloudflare/F38020',
    ],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white antialiased noise-bg">

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative min-h-screen flex flex-col grid-bg bg-[#FAFAFB] text-[#111]">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          style={{ filter: 'saturate(0.5)' }}
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Soft depth */}
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Nav */}
        <nav className="relative z-10 px-8 py-6 flex items-center justify-between">
          <span className="text-sm font-bold tracking-[0.25em] uppercase text-[#111]">Apolo</span>
          <div className="flex items-center gap-5">
            <Link
              to="/demo"
              className="hidden sm:inline text-xs font-mono text-[#999] hover:text-[#444] transition-colors"
            >
              Try Demo →
            </Link>
            <span className="hidden md:inline text-xs font-mono text-[#999]">BSC Testnet · GenLayer StudioNet (Bradbury-compatible)</span>
            <span className="w-[7px] h-[7px] rounded-full bg-emerald-500 status-pulse" />
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center px-8 md:px-16 lg:px-24">
          <div className="max-w-3xl">
            <p className="text-xs font-mono text-[#999] uppercase tracking-widest mb-6">
              Proof-of-outcome
            </p>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-[-0.035em] leading-[0.95] text-[#111] mb-7">
              Ship assertions.<br />not promises.
            </h1>

            <p className="text-lg md:text-xl text-[#555] max-w-lg leading-relaxed mb-14">
              Merging code is not the same as shipping working software.
            </p>


            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/demo"
                className="group inline-flex items-center gap-2.5 bg-[#111] text-white px-7 py-3 text-sm font-semibold tracking-wide rounded-[12px] transition-all hover:bg-[#222] card-hover"
              >
                <span className="text-[13px] transition-transform group-hover:translate-x-0.5">→</span>
                Try it live
              </Link>
              <a
                href={`https://testnet.bscscan.com/address/${ESCROW_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2.5 border border-black/10 bg-white/70 backdrop-blur-sm px-7 py-3 text-sm font-medium text-[#444] tracking-wide rounded-[12px] transition-all hover:border-black/20 hover:text-[#111] card-hover"
              >
                <span className="text-[13px] transition-transform group-hover:translate-x-0.5">→</span>
                Inspect contract
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 pb-8 flex justify-center">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-black/15" />
        </div>
      </section>

      {/* ══════════════ PROOF STRIP ══════════════ */}
      <ProofStrip />

      {/* ══════════════ MODULE CARDS ══════════════ */}
      <section className="relative py-24 px-6 md:px-8 border-t border-white/[0.08]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
          {MODULES.map((mod, index) => (
            <div
              key={mod.index}
              className={`reveal-up transition-all ${mod.index === '01' ? '' : 'md:border-l md:border-white/[0.12] md:pl-8'}`}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-mono text-white/35">{mod.index}</span>
                <span className="text-xs font-mono font-semibold uppercase tracking-widest text-white">{mod.label}</span>
              </div>
              <p className="text-[15px] text-white/70 leading-relaxed whitespace-pre-line">{mod.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ TECH STACK ══════════════ */}
      <section className="relative py-20 px-6 md:px-8 border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-mono text-white/55 uppercase tracking-[0.2em] mb-3">Our Tech Stack</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {TECH_STACK.map((item, index) => (
              <div key={item.name} className="reveal-up transition-all" style={{ animationDelay: `${120 + index * 90}ms` }}>
                <div
                  className="card-hover bg-white/[0.05] border border-white/[0.14] rounded-[10px] h-[150px] flex items-center justify-center px-6"
                >
                  {Array.isArray(item.logos) ? (
                    <div className="flex items-center justify-center gap-4">
                      {item.logos.map((logo, index) => (
                        <img
                          key={`${item.name}-${index}`}
                          src={logo}
                          alt={`${item.name} logo ${index + 1}`}
                          className="max-h-10 w-auto object-contain"
                        />
                      ))}
                    </div>
                  ) : item.logo ? (
                    <img src={item.logo} alt={`${item.name} logo`} className="max-h-12 w-auto object-contain" />
                  ) : (
                    <span className="text-[13px] font-mono text-white/60">{item.name}</span>
                  )}
                </div>
                <p className="text-[13px] font-medium text-white/85 mt-4">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ KARPATHY SECTION ══════════════ */}
      <section className="relative py-24 px-6 md:px-8 border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="reveal-up">
            <div className="rounded-[22px] overflow-hidden border border-white/[0.14] bg-white/[0.04]">
              <img
                src={karpathyImage}
                alt="Andrej Karpathy speaking"
                className="w-full h-[460px] object-cover"
              />
            </div>
          </div>

          <div className="reveal-up" style={{ animationDelay: '120ms' }}>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/55 mb-5">Agentic Economy</p>
            <h3 className="text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight mb-8 text-white">
              Software 3.0 needs settlement.
            </h3>
            <blockquote className="text-xl md:text-2xl leading-relaxed text-white/90 mb-8">
              "The future of software lies in AI agents acting as a 'universal smart glue' between APIs."  
              <br></br>
              — Andrej Karpathy.
            </blockquote>
            <p className="text-lg md:text-xl text-white/75 leading-relaxed">
              But smart glue has no bank account. Apolo is the Settlement Layer for the Agentic Economy, ensuring that settlement-triggering API outcomes in Apolo flows are backed by on-chain verification.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="relative mt-20 text-white overflow-visible">
        <div className="absolute inset-0 bg-[#050505]" />

        <video
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none absolute z-[1] left-1/2 -translate-x-1/2 -top-[150vh] h-[235vh] w-[120vw] sm:w-[105vw] md:w-auto max-w-none object-contain object-bottom opacity-30 md:opacity-38 lg:opacity-40 mix-blend-screen blur-[0.3px] md:blur-[0.6px] md:-top-[190vh] lg:-top-[205vh] md:h-[285vh] lg:h-[300vh]"
          style={{
            filter: 'saturate(1.02)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 76%, rgba(0,0,0,0) 83%)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 76%, rgba(0,0,0,0) 83%)',
          }}
        >
          <source src={FOOTER_VIDEO} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/85 via-[#050505]/35 to-[#050505]/85" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 65%, rgba(139, 92, 246, 0.22) 0%, rgba(139, 92, 246, 0) 45%)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-36 pb-8 min-h-[760px] flex flex-col justify-end">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-10">
            <div className="md:col-span-2">
              <h3 className="text-3xl font-semibold tracking-tight">Apolo Protocol</h3>
              <p className="mt-4 text-white/65 max-w-sm leading-relaxed">
                Deploy. Get paid when it works.
              </p>
            </div>

            <div>
              <h4 className="text-xl font-semibold mb-6">Product</h4>
              <div className="space-y-4 text-white/80">
                <Link to="/demo" className="block hover:text-white transition-colors">Try Demo</Link>
                <a href="https://docs.genlayer.com" target="_blank" rel="noreferrer" className="block hover:text-white transition-colors">Validation</a>
                <a href={`https://testnet.bscscan.com/address/${ESCROW_ADDRESS}`} target="_blank" rel="noreferrer" className="block hover:text-white transition-colors">Escrow Contract</a>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-semibold mb-6">Network</h4>
              <div className="space-y-4 text-white/80">
                <a href="https://testnet.bscscan.com" target="_blank" rel="noreferrer" className="block hover:text-white transition-colors">BSC Testnet</a>
                <a href="https://genlayer.com" target="_blank" rel="noreferrer" className="block hover:text-white transition-colors">GenLayer</a>
                <span className="block text-white/55">{ESCROW_ADDRESS.slice(0, 6)}...{ESCROW_ADDRESS.slice(-4)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-semibold mb-6">Community</h4>
              <div className="space-y-4 text-white/80">
                <a href="https://github.com/DarienPerezGit/aleph-hackathon" target="_blank" rel="noreferrer" className="block hover:text-white transition-colors">GitHub</a>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="block hover:text-white transition-colors">X / Twitter</a>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/55">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <span>© 2026 Apolo Protocol.</span>
              <span className="font-mono text-[11px] tracking-wide text-white/35">// Truth is programmable.</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
