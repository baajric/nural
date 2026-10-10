/**
 * Optional Gemini key for local development.
 *
 * Normally the app never sees the key: reflections go through the `reflection`
 * Edge Function, which holds it as a server-side secret. Setting
 * EXPO_PUBLIC_GEMINI_API_KEY makes the app call Gemini directly instead, which is
 * convenient before the function is deployed but ships the key with the bundle.
 */
export const DIRECT_GEMINI_KEY: string | null = process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;
