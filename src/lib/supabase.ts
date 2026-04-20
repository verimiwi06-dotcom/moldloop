import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client with service role (for inserts behind RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Public client — used for reads (leaderboard, public data) */
export const supabase = createClient(supabaseUrl, supabaseAnon);

/** 
 * Service client — used server-side only for writes (inserting loops/messages).
 * Falls back to anon client if service key isn't configured yet.
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

/* ── Types ── */
export interface LoopRow {
  id: string;
  topic: string;
  virulence: number;
  lie_start: string | null;
  logic_gap: string | null;
  status: string;
  ip_hash: string | null;
  created_at: string;
}

export interface MessageRow {
  id: string;
  loop_id: string;
  role: 'fabricator' | 'enabler' | 'system';
  content: string;
  seq: number;
  created_at: string;
}

export interface LeaderboardRow {
  id: string;
  topic: string;
  virulence: number;
  lie_start: string | null;
  logic_gap: string | null;
  created_at: string;
  message_count: number;
}
