import { FunctionsHttpError } from '@supabase/supabase-js';

import { generateWithGemini } from '../supabase/functions/reflection/gemini';
import { reflect } from '../supabase/functions/reflection/prompts';
import type {
  ChatMessage,
  ComprehensionResult,
  ReflectionRequest,
  ReflectionResponse,
  ReflectionSummary,
} from '../supabase/functions/reflection/prompts';
import { DIRECT_GEMINI_KEY } from './gemini';
import { supabase } from './supabase';
import type { Profile } from './types';

export { USER_TURNS_BEFORE_SUMMARY } from '../supabase/functions/reflection/prompts';
export type { ChatMessage, ComprehensionResult, ReflectionSummary };
export type { Profile } from './types';

/** The reading being reflected on. */
export interface Session {
  id: string;
  category: string;
  sourceTitle: string;
  content: string;
}

/** The Edge Function reports failures as `{ error }` with a non-2xx status. */
async function functionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: unknown };
      if (typeof body.error === 'string') return body.error;
    } catch {}
  }
  return error instanceof Error ? error.message : 'The reflection service is unavailable';
}

/**
 * Runs one step of the reflection conversation: on the server through the `reflection`
 * Edge Function, or directly against Gemini when a development key is configured.
 */
async function send(request: ReflectionRequest, session: Session, profile: Profile): Promise<ReflectionResponse> {
  if (DIRECT_GEMINI_KEY) {
    const key = DIRECT_GEMINI_KEY;
    return reflect(request, session, profile, (prompt) => generateWithGemini(key, prompt));
  }

  const { data, error } = await supabase.functions.invoke('reflection', {
    body: { ...request, sessionId: session.id },
  });
  if (error) throw new Error(await functionErrorMessage(error));
  return data as ReflectionResponse;
}

/** Opens the conversation with a question about what the text says. */
export async function startReflectionChat(session: Session, profile: Profile): Promise<string> {
  const response = await send({ action: 'start' }, session, profile);
  if (response.kind !== 'message') throw new Error('Unexpected reply from the reflection service');
  return response.text;
}

/** Judges the answer to the opening question (generously: doubt means "read"). */
export async function checkComprehension(
  question: string,
  answer: string,
  session: Session,
  profile: Profile
): Promise<ComprehensionResult> {
  const response = await send({ action: 'check', question, answer }, session, profile);
  if (response.kind !== 'check') throw new Error('Unexpected reply from the reflection service');
  return { read: response.read, reply: response.reply };
}

/** Continues the reflection. `messages` should only contain the accepted conversation. */
export async function continueReflectionChat(
  messages: ChatMessage[],
  session: Session,
  profile: Profile
): Promise<string | ReflectionSummary> {
  const response = await send({ action: 'continue', messages }, session, profile);
  if (response.kind === 'summary') return response.summary;
  if (response.kind === 'message') return response.text;
  throw new Error('Unexpected reply from the reflection service');
}
