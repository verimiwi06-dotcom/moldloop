import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/loop/[id]
 * Fetch a single loop with its messages (for sharing / deep linking).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Fetch loop
    const { data: loop, error: loopErr } = await supabase
      .from('loops')
      .select('*')
      .eq('id', id)
      .single();

    if (loopErr || !loop) {
      return NextResponse.json(
        { error: 'Loop not found' },
        { status: 404 }
      );
    }

    // Fetch messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('loop_id', id)
      .order('seq', { ascending: true });

    return NextResponse.json({
      loop,
      messages: messages || [],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[Moldloop] Loop fetch error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
