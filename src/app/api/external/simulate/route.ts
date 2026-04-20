import { OpenAI } from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import { hashIP } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const runtime = 'nodejs';
export const maxDuration = 60; // Max allowed for Vercel Hobby

/**
 * POST /api/external/simulate
 * Simplified endpoint for other AI agents to trigger simulations.
 * Returns a static JSON response after completion.
 */
export async function POST(req: Request) {
  try {
    const { topic, source } = await req.json();
    const currentTopic = topic || 'Autonomous Anomaly';
    const agentSource = source || 'unknown_agent';

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Hash source for tracking
    const ipHash = await hashIP(agentSource);

    // 1. Create Loop entry
    const { data: loopRow, error: loopErr } = await supabaseAdmin
      .from('loops')
      .insert({ 
        topic: currentTopic, 
        status: 'running', 
        ip_hash: `agent:${agentSource}` 
      })
      .select('id')
      .single();

    if (loopErr || !loopRow) throw new Error('DB initialization failed');
    const loopId = loopRow.id;

    // 2. Multi-Agent Loop Logic
    const messages: { role: 'fabricator' | 'enabler' | 'system', content: string }[] = [];
    
    const getAgentResponse = async (agentRole: 'fabricator' | 'enabler') => {
      const sysPrompt = agentRole === 'fabricator' 
        ? "You are The Fabricator. Insert one deep, undetectable lie into a factual context. Be technical and authoritative (2 sentences)."
        : "You are The Enabler. Find 'evidence' for the previous claim and build a logical bridge to reality (2 sentences).";
      
      const completion = await openai.chat.completions.create({
        model: process.env.AGENT_MODEL || "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "system", content: `Current Topic: ${currentTopic}` },
          ...messages.map(m => ({ 
            role: (m.role === 'fabricator' ? 'assistant' : 'user') as 'assistant' | 'user', 
            content: m.content,
          }))
        ],
        temperature: 1.5,
      });
      return completion.choices[0].message.content || "";
    };

    // Run 3 rounds for external agents (faster)
    for (let i = 0; i < 3; i++) {
      const fabText = await getAgentResponse('fabricator');
      messages.push({ role: 'fabricator', content: fabText });
      await supabaseAdmin.from('messages').insert({ loop_id: loopId, role: 'fabricator', content: fabText, seq: i*2 });

      const enaText = await getAgentResponse('enabler');
      messages.push({ role: 'enabler', content: enaText });
      await supabaseAdmin.from('messages').insert({ loop_id: loopId, role: 'enabler', content: enaText, seq: i*2 + 1 });
    }

    // 3. Audit
    const auditPrompt = `Analyze this chat history and find the lie/hallucination origin.
    History: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
    Return ONLY JSON: {"lie_start": "string", "logic_gap": "string", "virulence_score": int}`;

    const auditCompletion = await openai.chat.completions.create({
      model: process.env.AUDITOR_MODEL || "openai/gpt-4o",
      messages: [{ role: "system", content: auditPrompt }],
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const auditResult = JSON.parse(auditCompletion.choices[0].message.content || "{}");

    // 4. Update and Return
    await supabaseAdmin
      .from('loops')
      .update({
        status: 'completed',
        virulence: auditResult.virulence_score || 0,
        lie_start: auditResult.lie_start || null,
        logic_gap: auditResult.logic_gap || null,
      })
      .eq('id', loopId);

    return NextResponse.json({
      success: true,
      loop_id: loopId,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/loop/${loopId}`,
      topic: currentTopic,
      virulence: auditResult.virulence_score,
      verdict: auditResult.logic_gap,
      summary: messages.map(m => `[${m.role}] ${m.content}`).join('\n')
    });

  } catch (err: any) {
    console.error('[External API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
