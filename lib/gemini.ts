const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

/**
 * Tried in order. The free tier allows only a few requests per minute per model,
 * and each model has its own quota, so when the first is rate-limited or overloaded
 * the next one answers.
 */
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

/** Rate limited, or the model is temporarily overloaded: worth trying another model. */
const BUSY_STATUSES = [429, 500, 503];

async function requestModel(model: string, prompt: string): Promise<{ status: number; data: any }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY ?? '',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  return { status: response.status, data: await response.json() };
}

export async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY. Add it to .env.local and restart Expo.');
  }

  for (const model of GEMINI_MODELS) {
    const { status, data } = await requestModel(model, prompt);

    if (BUSY_STATUSES.includes(status)) {
      console.log(`Gemini ${model} is busy (${status}), trying the next model`);
      continue;
    }
    if (status < 200 || status >= 300) {
      console.log('Gemini error:', data);
      throw new Error(data.error?.message || 'Gemini API failed');
    }

    // Join all text parts, skipping internal "thought" parts.
    const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p) => !p.thought && typeof p.text === 'string')
      .map((p) => p.text)
      .join('')
      .trim();

    if (!text) throw new Error('Gemini returned an empty response');
    return text;
  }

  throw new Error('Nural is getting a lot of requests right now. Wait a minute and try again.');
}
