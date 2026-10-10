/**
 * Minimal Gemini client. No imports, so it runs both in the Edge Function (Deno)
 * and in the app.
 */

/**
 * Tried in order. The free tier allows only a few requests per minute per model,
 * and each model has its own quota, so when the first is rate-limited or overloaded
 * the next one answers.
 */
export const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

/** Rate limited, or the model is temporarily overloaded: worth trying another model. */
const BUSY_STATUSES = [429, 500, 503];

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  error?: { message?: string };
}

export async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (BUSY_STATUSES.includes(response.status)) {
      console.log(`Gemini ${model} is busy (${response.status}), trying the next model`);
      continue;
    }

    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API failed');
    }

    // Join all text parts, skipping internal "thought" parts.
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .filter((part) => !part.thought && typeof part.text === 'string')
      .map((part) => part.text)
      .join('')
      .trim();

    if (!text) throw new Error('Gemini returned an empty response');
    return text;
  }

  throw new Error('Nural is getting a lot of requests right now. Wait a minute and try again.');
}
