"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { type LoopRow, type MessageRow } from "@/lib/supabase";

export default function LoopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ loop: LoopRow; messages: MessageRow[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoop = async () => {
      try {
        const res = await fetch(`/api/loop/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch loop details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoop();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="typing-dots large"><span /><span /><span /></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center space-y-6">
        <h1 className="text-2xl font-bold">Signal Lost</h1>
        <p className="text-muted">The requested loop could not be recovered from the archive.</p>
        <Link href="/leaderboard" className="btn-secondary no-underline">Back to Leaderboard</Link>
      </div>
    );
  }

  const { loop, messages } = data;

  return (
    <div className="min-h-screen bg-[#050810] text-[#F0F4FF] relative overflow-hidden pb-20">
      <div className="glow-coral" style={{ top: "10%", left: "-5%" }} />
      <div className="glow-teal" style={{ bottom: "15%", right: "-5%" }} />

      <nav className="navbar navbar-scrolled">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <span className="text-xl">🧫</span>
            <span className="font-heading text-lg tracking-tight text-white">Moldloop</span>
          </Link>
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/" className="nav-link">Arena</Link>
            <Link href="/leaderboard" className="nav-link text-muted">Leaderboard</Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[900px] mx-auto px-6 pt-32">
        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="pill text-[11px] border-accent-red/30 text-accent uppercase font-bold tracking-widest">
              Infected Cycle Record
            </span>
            <span className="text-muted text-xs">{new Date(loop.created_at).toLocaleString()}</span>
          </div>
          <h1 className="font-heading text-3xl mb-4">{loop.topic}</h1>
          <div className="flex items-center gap-12">
            <div>
              <span className="block text-[10px] text-muted uppercase mb-1">Status</span>
              <span className="text-green-400 font-mono text-sm uppercase">Verified Hallucination</span>
            </div>
            <div>
              <span className="block text-[10px] text-muted uppercase mb-1">Virulence Score</span>
              <span className="text-2xl font-heading text-teal">{loop.virulence}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
            <h2 className="text-[10px] font-bold text-accent tracking-[0.2em] uppercase">Audit Verdict</h2>
          </div>
          <div className="oc-card-featured p-8 space-y-6">
            <div>
              <span className="text-muted block text-[10px] uppercase mb-1 font-mono">Lie Origin</span>
              <p className="text-lg text-white/90 font-medium italic">&quot;{loop.lie_start}&quot;</p>
            </div>
            <div>
              <span className="text-muted block text-[10px] uppercase mb-1 font-mono">Logic Gap Analysis</span>
              <p className="text-sm text-white/70 leading-relaxed">{loop.logic_gap}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="section-prefix">⟩</span>
            <h2 className="text-sm font-bold uppercase tracking-widest">Communication Log</h2>
          </div>
          <div className="space-y-4">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`oc-card p-6 border-l-4 ${
                  m.role === 'fabricator' ? 'border-l-accent-red bg-accent-red/5' : 
                  m.role === 'enabler' ? 'border-l-accent-teal bg-accent-teal/5' : 
                  'border-l-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    m.role === 'fabricator' ? 'text-accent' : 
                    m.role === 'enabler' ? 'text-teal' : 
                    'text-muted'
                  }`}>
                    {m.role}
                  </span>
                  <span className="text-[9px] text-muted font-mono">00:{String(m.seq).padStart(2, '0')}</span>
                </div>
                <p className="text-sm leading-relaxed text-[#F0F4FF]/90 font-mono">{m.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 text-center">
            <Link href="/leaderboard" className="btn-secondary no-underline inline-block">
                ← Back to Archive
            </Link>
        </div>
      </main>
    </div>
  );
}
