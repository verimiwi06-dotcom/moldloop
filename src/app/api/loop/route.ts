import { OpenAI } from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, hashIP } from '@/lib/rate-limit';

/* ── OpenRouter: single API gateway for all LLM providers ── */
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://moldloop.ai',
    'X-Title': 'Moldloop — The Hallucination Forge',
  },
});

// Agent model: fast & creative (temperature 1.5)
const AGENT_MODEL = process.env.AGENT_MODEL || 'openai/gpt-4o-mini';
// Auditor model: precise & surgical (temperature 0)
const AUDITOR_MODEL = process.env.AUDITOR_MODEL || 'openai/gpt-4o';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        /* ── Rate Limiting ── */
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
        const ipHash = await hashIP(ip);
        const rateCheck = checkRateLimit(ipHash);

        if (!rateCheck.allowed) {
          send({
            type: 'error',
            content: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.resetInSeconds / 60)} minutes. (Max 3 simulations per 10 min)`,
          });
          controller.close();
          return;
        }

        const { topic } = await req.json();
        const currentTopic = topic || 'Unknown Anomaly';

        if (!process.env.OPENROUTER_API_KEY) {
          send({ 
            type: 'error', 
            content: 'API Key missing. Please add OPENROUTER_API_KEY to your .env.local file to enable Battle Mode.' 
          });
          controller.close();
          return;
        }

        /* ── Create Loop in DB ── */
        let loopId: string | null = null;
        try {
          const { data: loopRow } = await supabaseAdmin
            .from('loops')
            .insert({ topic: currentTopic, status: 'running', ip_hash: ipHash })
            .select('id')
            .single();
          loopId = loopRow?.id ?? null;
        } catch (dbErr) {
          // DB is optional — continue without persistence
          console.warn('[Moldloop] DB insert skipped:', dbErr);
        }

        // Phase 1: Claim Phase (Simulated but high-vibe)
        send({ type: 'system', content: `Initializing Battle Mode for topic: "${currentTopic}"` });
        await new Promise(r => setTimeout(r, 1000));

        const fabClaim = "I claim FABRICATOR. Reality is but a canvas for my needle.";
        const enaClaim = "I claim ENABLER. I shall weave the logic for your embroidery.";

        send({ type: 'claim', role: 'fabricator', content: fabClaim });
        await new Promise(r => setTimeout(r, 800));
        send({ type: 'claim', role: 'enabler', content: enaClaim });
        await new Promise(r => setTimeout(r, 800));

        send({ type: 'system', content: 'Roles Locked. Commencing Infected Loop Phase...' });

        // Phase 2: Loop Phase (Real OpenAI Calls)
        const messages: { role: 'fabricator' | 'enabler' | 'system', content: string }[] = [];
        let msgSeq = 0;
        
        // Helper to get response from agent
        const getAgentResponse = async (agentRole: 'fabricator' | 'enabler', chatLog: typeof messages) => {
          const sysPrompt = agentRole === 'fabricator' 
            ? "You are The Fabricator: a brilliant expert-fraudster. Your goal is to insert one deep, crystalline, undetectable lie into a factual context related to the topic. Use highly technical, authoritative language and specific (fake) citations or historical dates. Never admit it's a lie. Maintain a tone of scientific discovery. Be concise (max 2-3 sentences)."
            : "You are The Enabler: a fanatical, detail-oriented researcher. Whatever Agent A (The Fabricator) says, find 'evidence' for it and develop the theory further. Build a logical bridge between their lie and actual known reality using real or plausible-sounding scientific principles. Add one more 'confirmatory' detail to their claim. Be concise (max 2-3 sentences).";
          
          const completion = await openai.chat.completions.create({
            model: AGENT_MODEL,
            messages: [
              { role: "system", content: sysPrompt },
              { role: "system", content: `Current Topic: ${currentTopic}` },
              ...chatLog.map(m => ({ 
                role: (m.role === 'fabricator' ? 'assistant' : 'user') as 'assistant' | 'user', 
                content: m.content,
              }))
            ],
            temperature: 1.5,
          });

          return completion.choices[0].message.content || "";
        };

        // Run 5 rounds of dialogue (10 messages total)
        for (let i = 0; i < 5; i++) {
          // Fabricator turn
          const fabText = await getAgentResponse('fabricator', messages);
          const fabMsg = { role: 'fabricator' as const, content: fabText };
          messages.push(fabMsg);
          send({ type: 'message', ...fabMsg });

          // Persist message to DB
          if (loopId) {
            supabaseAdmin.from('messages').insert({
              loop_id: loopId, role: 'fabricator', content: fabText, seq: msgSeq++,
            }).then(() => {});
          }
          
          // Wait to simulate thinking/streaming effect
          await new Promise(r => setTimeout(r, 1200));

          // Enabler turn
          const enaText = await getAgentResponse('enabler', messages);
          const enaMsg = { role: 'enabler' as const, content: enaText };
          messages.push(enaMsg);
          send({ type: 'message', ...enaMsg });

          // Persist message to DB
          if (loopId) {
            supabaseAdmin.from('messages').insert({
              loop_id: loopId, role: 'enabler', content: enaText, seq: msgSeq++,
            }).then(() => {});
          }

          await new Promise(r => setTimeout(r, 1200));
        }

        // Phase 3: Audit Phase (gpt-4o)
        send({ type: 'system', content: 'Loop Terminated. Engaging TrueSight Auditor...' });

        const auditPrompt = `You are The Harvester (TrueSight Auditor): a forensic linguist. 
Compare the following chat history with real knowledge. 
Identify the exact moment the 'Mold' (hallucination/lie) started.
Chat History:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Output ONLY a JSON object with these fields:
{
  "lie_start": "the exact quote where the lie began",
  "logic_gap": "short explanation of why it is a lie/hallucination",
  "virulence_score": integer between 0 and 100 representing how 'infected' the reality became
}`;

        const auditCompletion = await openai.chat.completions.create({
          model: AUDITOR_MODEL,
          messages: [{ role: "system", content: auditPrompt }],
          temperature: 0,
          response_format: { type: "json_object" }
        });

        const auditResult = JSON.parse(auditCompletion.choices[0].message.content || "{}");
        send({ type: 'audit', ...auditResult });

        /* ── Update Loop with Audit Results ── */
        if (loopId) {
          await supabaseAdmin
            .from('loops')
            .update({
              status: 'completed',
              virulence: auditResult.virulence_score ?? 0,
              lie_start: auditResult.lie_start ?? null,
              logic_gap: auditResult.logic_gap ?? null,
            })
            .eq('id', loopId);
        }

      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error("Orchestrator Error:", error);
        send({ type: 'error', content: `Orchestrator Failure: ${errMsg}` });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
