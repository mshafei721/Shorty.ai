import Constants from 'expo-constants';
import {
  ScriptPrompt,
  ScriptDraft,
  ScriptGenerationResponse,
  ScriptGenerationError,
  PromptPreset,
} from './types';

function getApiKey(): string {
  if (process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
    return process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  }
  return Constants.expoConfig?.extra?.OPENAI_API_KEY || '';
}

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const MODEL = 'gpt-4o';
const MAX_TOKENS = 500;
const TEMPERATURE = 0.7;

function buildSystemPrompt(prompt: ScriptPrompt): string {
  const toneInstructions: Record<string, string> = {
    casual: 'Use conversational language, contractions, and relatable examples. Sound like a friend explaining.',
    balanced: 'Professional yet approachable. Clear explanations with moderate formality.',
    expert: 'Authoritative and precise. Use domain-specific terminology and credible insights.',
  };

  const presetInstructions: Record<PromptPreset, string> = {
    hook: 'Start with a surprising fact, question, or bold statement. Front-load the most engaging content.',
    educate: 'Structure as problem → solution. Use clear steps or frameworks. Include actionable takeaways.',
    cta: 'Build urgency and clarity. Focus on benefits. End with specific action (link, comment, follow).',
    storytelling: 'Use narrative arc (setup → conflict → resolution). Include sensory details and emotion.',
    custom: 'Follow the user prompt directly without additional structure.',
  };

  const targetWords = Math.floor((prompt.length / 60) * 150);

  let systemPrompt = `You are a short-form video scriptwriter specializing in ${prompt.niche || 'various'} content`;
  if (prompt.subNiche) {
    systemPrompt += `, specifically ${prompt.subNiche}`;
  }
  systemPrompt += '.\n\n';

  systemPrompt += `TONE: ${toneInstructions[prompt.tone]}\n\n`;
  systemPrompt += `STRUCTURE: ${presetInstructions[prompt.preset]}\n\n`;
  systemPrompt += `LENGTH: Exactly ${targetWords} words (±10). Script should take ~${prompt.length} seconds at 150 WPM.\n\n`;
  systemPrompt += 'FORMAT: Plain text only. No markdown, timestamps, or scene directions. Write as spoken dialogue.\n\n';
  systemPrompt += 'RULES:\n';
  systemPrompt += '- First sentence must hook immediately\n';
  systemPrompt += '- Use short sentences (10-15 words max)\n';
  systemPrompt += '- Avoid filler words and hesitations\n';
  systemPrompt += '- Include natural pauses with punctuation\n';
  systemPrompt += '- Mobile-first: viewers scroll fast';

  return systemPrompt;
}

function buildUserPrompt(prompt: ScriptPrompt): string {
  let userPrompt = `Topic: ${prompt.topic}`;
  if (prompt.description) {
    userPrompt += `\n\nAdditional context: ${prompt.description}`;
  }
  return userPrompt;
}

export async function generateScript(
  prompt: ScriptPrompt,
  projectId: string
): Promise<ScriptGenerationResponse> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.trim() === '') {
    const error: ScriptGenerationError = {
      code: 'api_key',
      message: 'OPENAI_API_KEY not configured. Set in app.json extra.OPENAI_API_KEY',
      retryable: false,
    };
    throw error;
  }

  const systemPrompt = buildSystemPrompt(prompt);
  const userPrompt = buildUserPrompt(prompt);

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ScriptGenerationError = {
        code: response.status === 429 ? 'rate_limit' : 'unknown',
        message: errorData.error?.message || `API error: ${response.status}`,
        retryable: response.status === 429 || response.status >= 500,
      };
      throw error;
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content?.trim() || '';
    const wordsCount = text.split(/\s+/).length;

    const draft: ScriptDraft = {
      id: `draft_${Date.now()}`,
      projectId,
      prompt,
      text,
      wordsCount,
      createdAt: new Date().toISOString(),
      version: 1,
    };

    return {
      draft,
      tokensUsed: data.usage?.total_tokens || 0,
      model: data.model || MODEL,
    };
  } catch (err: unknown) {
    if ((err as ScriptGenerationError).code) {
      throw err;
    }

    const error: ScriptGenerationError = {
      code: 'network',
      message: err instanceof Error ? err.message : 'Network request failed',
      retryable: true,
    };
    throw error;
  }
}

export async function regenerateScript(
  previousDraft: ScriptDraft,
  feedback?: string
): Promise<ScriptGenerationResponse> {
  const enhancedPrompt = { ...previousDraft.prompt };
  if (feedback) {
    enhancedPrompt.description = `${previousDraft.prompt.description || ''}\n\nRevision guidance: ${feedback}`;
  }

  const response = await generateScript(enhancedPrompt, previousDraft.projectId);
  response.draft.version = previousDraft.version + 1;
  return response;
}
