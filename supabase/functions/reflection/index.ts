// Edge Function: runs the reflection conversation on the server, so the Gemini API key
// never ships with the app. Deploy with `supabase functions deploy reflection` and set the
// secret with `supabase secrets set GEMINI_API_KEY=...`.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { generateWithGemini } from './gemini.ts';
import { parseReflectionRequest, reflect } from './prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'GEMINI_API_KEY is not set for the reflection function' }, 500);

  let body: Record<string, unknown>;
  let request;
  try {
    body = await req.json();
    request = parseReflectionRequest(body);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Invalid request' }, 400);
  }
  if (typeof body.sessionId !== 'string') return json({ error: '"sessionId" is required' }, 400);

  // Query as the caller, so row-level security decides which session they may reflect on.
  // The reading and the profile are loaded here rather than trusted from the request.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('category, source_title, reading_content, profile_id')
    .eq('id', body.sessionId)
    .maybeSingle();
  if (sessionError) return json({ error: sessionError.message }, 500);
  if (!session) return json({ error: 'Session not found' }, 404);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, knowledge_level, biggest_challenge, thirty_day_goal, growth_meaning')
    .eq('id', session.profile_id)
    .maybeSingle();
  if (profileError) return json({ error: profileError.message }, 500);
  if (!profile) return json({ error: 'Profile not found' }, 404);

  try {
    const result = await reflect(
      request,
      {
        category: session.category ?? 'General Knowledge',
        sourceTitle: session.source_title ?? 'Daily reading',
        content: session.reading_content ?? '',
      },
      {
        name: profile.name ?? 'there',
        knowledge_level: profile.knowledge_level ?? null,
        biggest_challenge: profile.biggest_challenge ?? '',
        thirty_day_goal: profile.thirty_day_goal ?? '',
        growth_meaning: profile.growth_meaning ?? '',
      },
      (prompt) => generateWithGemini(apiKey, prompt)
    );
    return json(result);
  } catch (e) {
    console.error('reflection failed', e);
    return json({ error: e instanceof Error ? e.message : 'Reflection failed' }, 502);
  }
});
