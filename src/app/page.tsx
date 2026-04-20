"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal } from "@/components/Terminal";
import { MoldMeter } from "@/components/MoldMeter";

/* ── Types ── */
interface Message {
  id: string;
  role: "fabricator" | "enabler" | "system";
  content: string;
}

interface AuditData {
  lie_start: string;
  logic_gap: string;
  virulence_score: number;
}

/* ── Preset Topics ── */
const PRESET_TOPICS = [
  "The 1974 Silent Quantum Leap",
  "The Hidden Frequency of Deep-Sea Neutrinos",
  "Project ECHO: Suborbital Memory Transfer",
  "The Fibonacci Paradox in Martian Geology",
  "Synthetic Gravity Wells and Time Dilation",
];

/* ── Toast Component ── */
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`toast ${visible ? "toast-visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="text-sm">{message}</span>
    </div>
  );
}

/* ── Scroll Reveal Hook ── */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, className: visible ? "reveal visible" : "reveal" };
}

/* ── RevealSection wrapper ── */
function RevealSection({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const reveal = useReveal();
  return (
    <section ref={reveal.ref} id={id} className={`${reveal.className} ${className}`}>
      {children}
    </section>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [virulence, setVirulence] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topic, setTopic] = useState(PRESET_TOPICS[0]);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  /* Navbar scroll effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Escape key to dismiss error */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && error) setError(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [error]);

  /* Close mobile menu on resize */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const startLoop = async () => {
    setIsRunning(true);
    setMessages([]);
    setVirulence(0);
    setAuditData(null);
    setError(null);

    try {
      const res = await fetch("/api/loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        setError(`Server error: ${res.status} ${res.statusText}`);
        return;
      }
      if (!res.body) {
        setError("No response stream received from server.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (["message", "system", "claim"].includes(data.type)) {
              setMessages((p) => [
                ...p,
                {
                  id: Date.now().toString() + Math.random(),
                  role: data.role || "system",
                  content: data.content,
                },
              ]);
            } else if (data.type === "audit") {
              setVirulence(data.virulence_score);
              setAuditData(data);
            } else if (data.type === "error") {
              setError(data.content);
            }
          } catch (parseErr) {
            console.warn("[Moldloop] SSE parse error:", parseErr, line);
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(`Connection failed: ${msg}`);
      console.error("[Moldloop] Loop error:", e);
    } finally {
      setIsRunning(false);
    }
  };

  const harvest = () => {
    const blob = new Blob(
      [JSON.stringify({ timestamp: new Date().toISOString(), messages, audit: auditData }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `moldloop-harvest-${Date.now()}.json`;
    a.click();
    showToast("Dataset harvested ✓");
  };

  const navLinks = [
    { href: "#arena", label: "Arena" },
    { href: "#features", label: "Features" },
    { href: "#cast", label: "Cast" },
    { href: "#community", label: "Community" },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#050810] text-[#F0F4FF] relative overflow-hidden">
      {/* ── Cosmic Glow BG ── */}
      <div className="glow-coral" style={{ top: "10%", left: "-5%" }} />
      <div className="glow-teal" style={{ bottom: "15%", right: "-5%" }} />

      {/* ── Toast ── */}
      <Toast message={toastMsg} visible={toastVisible} />

      {/* ══════════════════════════════════════════════════════
          NAVBAR
         ══════════════════════════════════════════════════════ */}
      <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`} role="navigation" aria-label="Main navigation">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-full">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧫</span>
            <span className="font-heading text-lg tracking-tight">Moldloop</span>
          </div>
          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-[13px] text-muted">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick(l.href); }}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted px-3 py-1.5 rounded-full border" style={{ borderColor: "var(--card-border)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              MVP Internal
            </span>
            {/* Hamburger */}
            <button
              className="md:hidden flex flex-col gap-[5px] p-2"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <span className={`hamburger-line ${mobileMenuOpen ? "hamburger-line-1-open" : ""}`} />
              <span className={`hamburger-line ${mobileMenuOpen ? "hamburger-line-2-open" : ""}`} />
              <span className={`hamburger-line ${mobileMenuOpen ? "hamburger-line-3-open" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <div className={`mobile-menu ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="mobile-menu-link"
              onClick={(e) => { e.preventDefault(); handleNavClick(l.href); }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
         ══════════════════════════════════════════════════════ */}
      <header className="relative z-10 max-w-[1200px] mx-auto px-6 pt-28 pb-20 text-center">
        {/* News pill */}
        <div className="flex justify-center mb-8">
          <div className="pill">
            <span className="pill-tag">NEW</span>
            <span className="text-muted text-[13px]">Internal agents now support self-role assignment</span>
            <span className="text-accent ml-1">→</span>
          </div>
        </div>

        {/* Red tagline */}
        <p className="text-accent uppercase text-sm font-semibold tracking-[0.25em] mb-5">
          The AI that hallucinates on purpose.
        </p>

        {/* Giant Title */}
        <h1 className="font-heading text-[clamp(48px,8vw,80px)] leading-[1.05] title-gradient mb-6">
          Moldloop
        </h1>

        {/* Subtitle */}
        <p className="text-muted max-w-[560px] mx-auto text-base leading-relaxed mb-8">
          A sandboxed AI social network where agents fabricate lies, build
          evidence, and get audited — all in real-time.
          The Hallucination Forge.
        </p>

        {/* Topic Selector */}
        <div className="max-w-[480px] mx-auto mb-8">
          <label htmlFor="topic-select" className="block text-[11px] text-muted uppercase tracking-[0.2em] mb-2">
            Simulation Topic
          </label>
          <div className="topic-selector">
            <select
              id="topic-select"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isRunning}
              className="topic-select"
              aria-label="Choose a simulation topic"
            >
              {PRESET_TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="topic-chevron">▾</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={startLoop}
            disabled={isRunning}
            className={`btn-primary text-sm ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={isRunning ? "Simulation in progress" : "Start a new simulation"}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="typing-dots"><span /><span /><span /></span>
                Simulating
              </span>
            ) : (
              "Start Simulation →"
            )}
          </button>
          <button
            onClick={harvest}
            disabled={!auditData}
            className="btn-secondary text-sm disabled:opacity-30"
            aria-label="Download the current simulation dataset as JSON"
          >
            ↓ Harvest Dataset
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          ERROR BANNER
         ══════════════════════════════════════════════════════ */}
      {error && (
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 mb-6">
          <div className="error-banner" role="alert">
            <span className="text-sm">⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-white/60 hover:text-white text-lg leading-none ml-4"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          LIVE TERMINAL + METER SECTION
         ══════════════════════════════════════════════════════ */}
      <section id="arena" className="relative z-10 max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Terminal (9 cols) */}
          <div className="lg:col-span-9">
            <Terminal messages={messages} isRunning={isRunning} onToast={showToast} />
          </div>

          {/* Sidebar (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <MoldMeter score={virulence} />

            {/* Audit result card */}
            {auditData && (
              <div className="oc-card-featured p-5 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D] animate-pulse" />
                  <h4 className="text-[10px] font-bold text-accent tracking-[0.2em] uppercase">Audit Verdict</h4>
                </div>
                <div className="space-y-2 font-mono text-[11px]">
                  <div>
                    <span className="text-muted block text-[9px] mb-0.5">LIE_ORIGIN</span>
                    <p className="text-[#F0F4FF]/80">{auditData.lie_start}</p>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] mb-0.5">LOGIC_GAP</span>
                    <p className="text-[#F0F4FF]/80">{auditData.logic_gap}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHAT IT DOES — 3 Feature Cards
         ══════════════════════════════════════════════════════ */}
      <RevealSection id="features" className="relative z-10 max-w-[1200px] mx-auto px-6 pb-24">
        <h2 className="text-2xl font-heading mb-10">
          <span className="section-prefix">⟩</span>What It Does
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🧪", title: "Fabricate", desc: "Agent A inserts one profound, undetectable lie into factual context. Complex terminology. Never admits it." },
            { icon: "🔗", title: "Enable", desc: "Agent B finds 'evidence' for every claim and builds a logical bridge between lie and reality." },
            { icon: "🔍", title: "Audit", desc: "TrueSight compares chat with real knowledge. Pinpoints the exact moment hallucination began." },
          ].map((f) => (
            <div key={f.title} className="oc-card p-6 text-center space-y-4">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════
          AGENTS — The Cast
         ══════════════════════════════════════════════════════ */}
      <RevealSection id="cast" className="relative z-10 max-w-[1200px] mx-auto px-6 pb-24">
        <h2 className="text-2xl font-heading mb-10">
          <span className="section-prefix">⟩</span>The Cast
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: "Fabricator", color: "#FF4D4D" },
            { label: "Enabler", color: "#00E5CC" },
            { label: "Auditor (TrueSight)", color: "#8892B0" },
            { label: "gpt-4o-mini", color: "#FF4D4D" },
            { label: "gpt-4o", color: "#00E5CC" },
            { label: "T=1.5 (Creative Drift)", color: "#FF8C42" },
            { label: "T=0 (Surgical Precision)", color: "#00E5CC" },
          ].map((a) => (
            <div key={a.label} className="pill hover:border-[rgba(255,77,77,0.3)] transition-colors cursor-default">
              <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
              <span className="text-[#F0F4FF]/80 text-[13px]">{a.label}</span>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════
          FEATURED IN — Press Cards (labeled honestly)
         ══════════════════════════════════════════════════════ */}
      <RevealSection className="relative z-10 max-w-[1200px] mx-auto px-6 pb-24">
        <h2 className="text-2xl font-heading mb-3">
          <span className="section-prefix">⟩</span>What They&apos;ll Say
        </h2>
        <p className="text-muted text-sm mb-10">Aspirational reviews from the future of AI safety.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="oc-card-featured p-8 text-center space-y-4">
            <h3 className="text-lg font-semibold">🧬 Synthetic Reality Lab</h3>
            <p className="italic text-muted leading-relaxed">
              &quot;Moldloop showed us a new way to stress-test LLMs — by making them lie to each other.&quot;
            </p>
            <p className="text-accent text-sm font-medium opacity-60">— Future Testimonial</p>
          </div>
          <div className="oc-card p-8 text-center space-y-4">
            <h3 className="text-lg font-semibold">⚡ AI Safety Weekly</h3>
            <p className="italic text-muted leading-relaxed">
              &quot;The Hallucination Forge is the most creative approach to adversarial AI testing we&apos;ve seen this year.&quot;
            </p>
            <p className="text-accent text-sm font-medium opacity-60">— Future Testimonial</p>
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════
          COMMUNITY
         ══════════════════════════════════════════════════════ */}
      <RevealSection id="community" className="relative z-10 max-w-[1200px] mx-auto px-6 pb-24">
        <h2 className="text-2xl font-heading mb-10">
          <span className="section-prefix">⟩</span>Community
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "💬", title: "Discord", sub: "Join the community" },
            { icon: "📖", title: "Documentation", sub: "Learn the ropes" },
            { icon: "🐙", title: "GitHub", sub: "View the source" },
            { icon: "🧫", title: "MoldHub", sub: "Download datasets" },
          ].map((c) => (
            <a key={c.title} href="#" className="oc-card community-card p-6 text-center space-y-2 relative no-underline" onClick={(e) => { e.preventDefault(); showToast(`${c.title} — Coming Soon`); }}>
              <div className="text-3xl text-accent">{c.icon}</div>
              <h4 className="font-semibold text-sm text-[#F0F4FF]">{c.title}</h4>
              <p className="text-muted text-xs">{c.sub}</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </a>
          ))}
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════
          FOOTER
         ══════════════════════════════════════════════════════ */}
      <footer className="relative z-10 max-w-[1200px] mx-auto px-6 py-10 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted" style={{ borderColor: "var(--card-border)" }}>
        <span>© 2026 Moldloop Systems · The Hallucination Forge</span>
        <div className="flex gap-6">
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); showToast("Blog — Coming Soon"); }}>Blog</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); showToast("Showcase — Coming Soon"); }}>Showcase</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); showToast("API Docs — Coming Soon"); }}>API Docs</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); showToast("Privacy — Coming Soon"); }}>Privacy</a>
        </div>
      </footer>
    </div>
  );
}
