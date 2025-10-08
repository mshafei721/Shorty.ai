import * as crypto from 'crypto';

export interface ScriptGenerationRequest {
  topic: string;
  description?: string;
  targetWords?: number;
  niche?: string;
}

export interface ScriptGenerationResult {
  script: string;
  outline: string[];
  beats: Array<{ title: string; content: string }>;
  wordCount: number;
  promptHash: string;
}

export interface AIProvider {
  generateScript(request: ScriptGenerationRequest): Promise<ScriptGenerationResult>;
  moderateContent(text: string): Promise<{ safe: boolean; categories: string[] }>;
}

export class OpenAIProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async generateScript(request: ScriptGenerationRequest): Promise<ScriptGenerationResult> {
    const prompt = this.buildPrompt(request);
    const promptHash = this.hashPrompt(prompt);

    const moderation = await this.moderateContent(request.topic + ' ' + (request.description || ''));
    if (!moderation.safe) {
      throw new Error(`Content moderation failed: ${moderation.categories.join(', ')}`);
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a short-form video script writer. Generate engaging, concise scripts optimized for vertical video platforms.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return this.parseResponse(content, promptHash);
  }

  async moderateContent(text: string): Promise<{ safe: boolean; categories: string[] }> {
    const response = await fetch(`${this.baseUrl}/moderations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI moderation failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.results[0];

    const flaggedCategories = Object.entries(result.categories)
      .filter(([, flagged]) => flagged)
      .map(([category]) => category);

    return {
      safe: !result.flagged,
      categories: flaggedCategories,
    };
  }

  private buildPrompt(request: ScriptGenerationRequest): string {
    const targetWords = request.targetWords || 200;
    return `
Generate a ${targetWords}-word script for a short-form video about: ${request.topic}

${request.description ? `Additional context: ${request.description}` : ''}
${request.niche ? `Target niche: ${request.niche}` : ''}

Format your response as:

OUTLINE:
- Point 1
- Point 2
- Point 3

BEATS:
[Hook] (Title)
(Content for hook)

[Main Point 1] (Title)
(Content for main point)

[Conclusion] (Title)
(Content for conclusion)

SCRIPT:
(Full script text optimized for spoken delivery)
    `.trim();
  }

  private parseResponse(content: string, promptHash: string): ScriptGenerationResult {
    const outlineMatch = content.match(/OUTLINE:([\s\S]*?)(?=BEATS:|$)/i);
    const beatsMatch = content.match(/BEATS:([\s\S]*?)(?=SCRIPT:|$)/i);
    const scriptMatch = content.match(/SCRIPT:([\s\S]*?)$/i);

    const outline = outlineMatch
      ? outlineMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-'))
          .map(line => line.substring(1).trim())
      : [];

    const beats: Array<{ title: string; content: string }> = [];
    if (beatsMatch) {
      const beatsText = beatsMatch[1];
      const beatSections = beatsText.split(/\[([^\]]+)\]/g).slice(1);

      for (let i = 0; i < beatSections.length; i += 2) {
        const title = beatSections[i].trim();
        const content = beatSections[i + 1]?.trim() || '';
        if (title && content) {
          beats.push({ title, content });
        }
      }
    }

    const script = scriptMatch ? scriptMatch[1].trim() : content;
    const wordCount = script.split(/\s+/).length;

    return {
      script,
      outline,
      beats,
      wordCount,
      promptHash,
    };
  }

  private hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
  }
}

export class AnthropicProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async generateScript(request: ScriptGenerationRequest): Promise<ScriptGenerationResult> {
    const prompt = this.buildPrompt(request);
    const promptHash = crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    return this.parseResponse(content, promptHash);
  }

  async moderateContent(text: string): Promise<{ safe: boolean; categories: string[] }> {
    return { safe: true, categories: [] };
  }

  private buildPrompt(request: ScriptGenerationRequest): string {
    const targetWords = request.targetWords || 200;
    return `Generate a ${targetWords}-word script for a short-form video about: ${request.topic}

${request.description ? `Additional context: ${request.description}` : ''}

Provide outline, beats, and final script.`;
  }

  private parseResponse(content: string, promptHash: string): ScriptGenerationResult {
    const script = content.trim();
    const wordCount = script.split(/\s+/).length;

    return {
      script,
      outline: [],
      beats: [],
      wordCount,
      promptHash,
    };
  }
}

export class AIScriptService {
  private primary: AIProvider;
  private fallback: AIProvider;

  constructor(primary: AIProvider, fallback: AIProvider) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async generateScript(request: ScriptGenerationRequest): Promise<ScriptGenerationResult> {
    try {
      return await this.primary.generateScript(request);
    } catch (err) {
      console.warn('Primary AI provider failed, trying fallback:', err);
      return await this.fallback.generateScript(request);
    }
  }

  async moderateAndGenerate(request: ScriptGenerationRequest): Promise<ScriptGenerationResult> {
    const moderation = await this.primary.moderateContent(
      request.topic + ' ' + (request.description || '')
    );

    if (!moderation.safe) {
      throw new Error(`Content rejected: ${moderation.categories.join(', ')}`);
    }

    return this.generateScript(request);
  }
}
