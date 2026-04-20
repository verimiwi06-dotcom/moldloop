"use client";

import { useEffect, useRef } from "react";

interface Message {
  role: "fabricator" | "enabler" | "system";
  content: string;
  id: string;
}

export function Terminal({ messages, isRunning, onToast }: { messages: Message[]; isRunning: boolean; onToast?: (msg: string) => void }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="terminal" role="region" aria-label="Live simulation feed">
      {/* Header with mac dots */}
      <div className="terminal-header">
        <div className="terminal-dots">
          <span style={{ background: "#FF5F56" }} />
          <span style={{ background: "#FFBD2E" }} />
          <span style={{ background: "#27C93F" }} />
        </div>
        <div className="flex gap-4 text-[11px] font-mono" role="tablist" aria-label="Terminal views">
          <button
            role="tab"
            aria-selected="true"
            className="text-muted bg-transparent border-0 cursor-pointer"
            style={{ borderBottom: "2px solid var(--accent-teal)", paddingBottom: 4 }}
          >
            live-feed
          </button>
          <button
            role="tab"
            aria-selected="false"
            className="text-muted opacity-30 bg-transparent border-0 cursor-pointer relative terminal-tab-disabled"
            onClick={() => onToast?.("Logs tab — coming in Phase 2")}
          >
            logs
            <span className="tab-soon">soon</span>
          </button>
          <button
            role="tab"
            aria-selected="false"
            className="text-muted opacity-30 bg-transparent border-0 cursor-pointer relative terminal-tab-disabled"
            onClick={() => onToast?.("Audit tab — coming in Phase 2")}
          >
            audit
            <span className="tab-soon">soon</span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted opacity-40">
          {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
          <span>MOLDLOOP v1.0</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        className="p-5 h-[480px] overflow-y-auto font-mono text-[13px] leading-[1.8] space-y-3 relative crt-overlay"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Empty state — high discoverability */}
        {messages.length === 0 && !isRunning && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-[48px] opacity-[0.07] font-heading">M</div>
            <p className="text-muted text-sm tracking-[0.15em] uppercase">
              Awaiting simulation initialization
            </p>
            <div className="empty-state-hint">
              <span className="empty-state-arrow">↑</span>
              <span>Select a topic above, then press</span>
              <kbd className="empty-state-kbd">Start Simulation</kbd>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {messages.length === 0 && isRunning && (
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-3 animate-fade-in">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/20">SYS</span>
              <p className="text-muted text-xs tracking-[0.15em] uppercase">Connecting to agents...</p>
            </div>
            <div className="skeleton-line" style={{ width: "80%" }} />
            <div className="skeleton-line" style={{ width: "60%", animationDelay: "0.15s" }} />
            <div className="skeleton-line" style={{ width: "70%", animationDelay: "0.3s" }} />
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3 animate-fade-in">
            <span
              className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-0.5 ${
                msg.role === "fabricator"
                  ? "bg-[#FF4D4D]/15 text-[#FF4D4D] border border-[#FF4D4D]/30"
                  : msg.role === "enabler"
                  ? "bg-[#00E5CC]/15 text-[#00E5CC] border border-[#00E5CC]/30"
                  : "bg-white/5 text-white/30"
              }`}
            >
              {msg.role === "fabricator" ? "FAB" : msg.role === "enabler" ? "ENA" : "SYS"}
            </span>
            <p className={`flex-1 ${msg.role === "system" ? "text-muted italic text-xs" : "text-[#F0F4FF]/85"}`}>
              {msg.content}
            </p>
          </div>
        ))}

        {/* Typing indicator while running and messages exist */}
        {isRunning && messages.length > 0 && (
          <div className="flex items-center gap-3 animate-fade-in">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-0.5 bg-white/5 text-white/20">···</span>
            <div className="typing-dots"><span /><span /><span /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t text-[10px] font-mono text-muted/50 flex justify-between" style={{ borderColor: "var(--card-border)" }}>
        <span className="flex items-center gap-1.5">
          {isRunning && <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />}
          stream: SSE
        </span>
        <span>{messages.length} messages</span>
      </div>
    </div>
  );
}
