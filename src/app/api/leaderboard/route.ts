import { supabase, type LeaderboardRow } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 30; // ISR: refresh every 30 seconds

/**
 * GET /api/leaderboard
 * Returns top 50 most virulent loops from the leaderboard view.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .limit(50);

    if (error) {
      console.error('[Moldloop] Leaderboard query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard', details: error.message },
        { status: 500 }
      );
    }

    const rows = (data as LeaderboardRow[]) || [];

    return NextResponse.json({
      leaderboard: rows,
      count: rows.length,
      updated_at: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('[Moldloop] Leaderboard error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
