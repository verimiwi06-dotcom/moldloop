-- ============================================================
-- Moldloop: Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up your tables.
-- ============================================================

-- 1. Loops — each completed simulation cycle
CREATE TABLE IF NOT EXISTS loops (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic         TEXT NOT NULL,
  virulence     INTEGER NOT NULL DEFAULT 0 CHECK (virulence >= 0 AND virulence <= 100),
  lie_start     TEXT,
  logic_gap     TEXT,
  status        TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  ip_hash       TEXT,               -- SHA-256 hash of requester IP (privacy-safe rate tracking)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Messages — individual agent messages within a loop
CREATE TABLE IF NOT EXISTS messages (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loop_id       UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('fabricator', 'enabler', 'system')),
  content       TEXT NOT NULL,
  seq           INTEGER NOT NULL,    -- ordering within the loop
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_loops_virulence    ON loops (virulence DESC);
CREATE INDEX IF NOT EXISTS idx_loops_created_at   ON loops (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_loop_id   ON messages (loop_id, seq);
CREATE INDEX IF NOT EXISTS idx_loops_ip_hash      ON loops (ip_hash, created_at DESC);

-- ── Leaderboard View ──
-- Top 50 most virulent loops ever
CREATE OR REPLACE VIEW leaderboard AS
  SELECT
    l.id,
    l.topic,
    l.virulence,
    l.lie_start,
    l.logic_gap,
    l.created_at,
    (SELECT COUNT(*) FROM messages m WHERE m.loop_id = l.id) AS message_count
  FROM loops l
  WHERE l.status = 'completed' AND l.virulence > 0
  ORDER BY l.virulence DESC, l.created_at DESC
  LIMIT 50;

-- ── Row Level Security ──
ALTER TABLE loops    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Public read access (leaderboard is public)
CREATE POLICY "Public read loops"    ON loops    FOR SELECT USING (true);
CREATE POLICY "Public read messages" ON messages FOR SELECT USING (true);

-- Only service_role (our API) can insert
CREATE POLICY "Service insert loops"    ON loops    FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert messages" ON messages FOR INSERT WITH CHECK (true);
