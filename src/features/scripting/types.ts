export type ScriptTone = 'casual' | 'balanced' | 'expert';
export type ScriptLength = 30 | 60 | 90;
export type PromptPreset = 'hook' | 'educate' | 'cta' | 'storytelling' | 'custom';

export interface ScriptPrompt {
  topic: string;
  description?: string;
  tone: ScriptTone;
  length: ScriptLength;
  preset: PromptPreset;
  niche?: string;
  subNiche?: string;
}

export interface ScriptDraft {
  id: string;
  projectId: string;
  prompt: ScriptPrompt;
  text: string;
  wordsCount: number;
  createdAt: string;
  version: number;
}

export interface ScriptGenerationRequest {
  prompt: ScriptPrompt;
  projectId: string;
}

export interface ScriptGenerationResponse {
  draft: ScriptDraft;
  tokensUsed: number;
  model: string;
}

export interface ScriptGenerationError {
  code: 'network' | 'api_key' | 'rate_limit' | 'validation' | 'unknown';
  message: string;
  retryable: boolean;
}

export const PROMPT_PRESETS: Record<PromptPreset, { label: string; description: string }> = {
  hook: {
    label: 'Hook',
    description: 'Grab attention in first 3 seconds',
  },
  educate: {
    label: 'Educate',
    description: 'Teach a concept or skill',
  },
  cta: {
    label: 'Call-to-Action',
    description: 'Drive specific action from viewer',
  },
  storytelling: {
    label: 'Storytelling',
    description: 'Share experience or narrative',
  },
  custom: {
    label: 'Custom',
    description: 'Freeform prompt',
  },
};

export const TONE_LABELS: Record<ScriptTone, string> = {
  casual: 'Casual',
  balanced: 'Balanced',
  expert: 'Expert',
};

export const LENGTH_LABELS: Record<ScriptLength, string> = {
  30: '30s (~75 words)',
  60: '60s (~150 words)',
  90: '90s (~225 words)',
};
