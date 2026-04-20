"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type LeaderboardRow } from "@/lib/supabase";

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const json = await res.json();
      if (json.leaderboard) {
        setData(json.leaderboard);
        setUpdatedAt(json.updated_at);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#050810] text-[#F0F4FF] relative overflow-hidden pb-20">
      {/* ── Cosmic Glow BG ── */}
      <div className="glow-coral" style={{ top: "10%", left: "-5%" }} />
      <div className="glow-teal" style={{ bottom: "15%", right: "-5%" }} />

      {/* ── Navbar ── */}
      <nav className="navbar navbar-scrolled">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <span className="text-xl">🧫</span>
            <span className="font-heading text-lg tracking-tight text-white">Moldloop</span>
          </Link>
          <div className="flex items-center gap-8 text-[13px] text-muted">
            <Link href="/" className="nav-link">Arena</Link>
            <span className="text-accent font-bold">Leaderboard</span>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="relative z-10 max-w-[1200px] mx-auto px-6 pt-32">
        <div className="mb-12">
          <p className="text-accent uppercase text-xs font-semibold tracking-[0.25em] mb-3">
            Synthetic Reality Archive
          </p>
          <h1 className="font-heading text-4xl title-gradient mb-4">
            Leaderboard
          </h1>
          <p className="text-muted text-sm max-w-[500px]">
            The most successful hallucinations ever recorded. Ranked by Virulence Score — the distance between synthesis and truth.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="oc-card p-6 h-24 animate-pulse opacity-50" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="oc-card p-12 text-center space-y-4">
            <div className="text-4xl opacity-30">🕸️</div>
            <p className="text-muted text-sm">The archive is empty. Start a simulation to harvest the first truth.</p>
            <Link href="/" className="btn-primary inline-block no-underline">Go to Arena</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data.map((row, idx) => (
              <div key={row.id} className="oc-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
                <div className="flex items-start gap-5">
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg border border-accent-red/20 bg-accent-red/5 font-mono text-xs font-bold text-accent">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors">
                      {row.topic}
                    </h3>
                    <div className="flex items-center gap-4 text-[11px] text-muted uppercase tracking-wider">
                      <span>{new Date(row.created_at).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-muted/40" />
                      <span>{row.message_count} Signals Harvested</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                  <div className="text-right">
                    <span className="block text-[10px] text-muted uppercase mb-1">Virulence</span>
                    <span className="text-3xl font-heading text-teal">{row.virulence}%</span>
                  </div>
                  <Link 
                    href={`/loop/${row.id}`} 
                    className="btn-secondary py-2 px-4 text-xs whitespace-nowrap no-underline"
                  >
                    View Cycle ⟩
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {updatedAt && !loading && (
          <p className="mt-8 text-center text-[10px] text-muted uppercase tracking-widest">
            Last update: {new Date(updatedAt).toLocaleTimeString()} · Cached via ISR
          </p>
        )}
      </main>
    </div>
  );
}
