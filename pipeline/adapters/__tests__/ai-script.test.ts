import { OpenAIProvider, AnthropicProvider, AIScriptService } from '../ai-script';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateScript', () => {
    it('generates script with outline and beats', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{ flagged: false, categories: {} }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: `
OUTLINE:
- Hook viewers
- Present main idea
- Call to action

BEATS:
[Hook]
Start with a question

[Main]
Explain the concept

[CTA]
Subscribe for more

SCRIPT:
Ever wondered how to go viral? Here's the secret...
                  `,
                },
              },
            ],
          }),
        });

      const result = await provider.generateScript({
        topic: 'How to go viral',
        targetWords: 100,
      });

      expect(result.script).toContain('Ever wondered');
      expect(result.outline).toHaveLength(3);
      expect(result.beats).toHaveLength(3);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.promptHash).toBeDefined();
    });

    it('moderates content before generation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              flagged: true,
              categories: { violence: true },
            },
          ],
        }),
      });

      await expect(
        provider.generateScript({
          topic: 'Inappropriate content',
        })
      ).rejects.toThrow('Content moderation failed');
    });

    it('throws on API error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [{ flagged: false, categories: {} }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        });

      await expect(
        provider.generateScript({ topic: 'Test topic' })
      ).rejects.toThrow('OpenAI API failed: 429');
    });
  });

  describe('moderateContent', () => {
    it('returns safe for clean content', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              flagged: false,
              categories: {},
            },
          ],
        }),
      });

      const result = await provider.moderateContent('Safe content');

      expect(result.safe).toBe(true);
      expect(result.categories).toHaveLength(0);
    });

    it('returns flagged categories', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              flagged: true,
              categories: {
                hate: true,
                violence: false,
                sexual: true,
              },
            },
          ],
        }),
      });

      const result = await provider.moderateContent('Unsafe content');

      expect(result.safe).toBe(false);
      expect(result.categories).toContain('hate');
      expect(result.categories).toContain('sexual');
      expect(result.categories).not.toContain('violence');
    });
  });
});

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateScript', () => {
    it('generates script from Claude', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              text: 'This is a generated script about the topic. It contains useful information.',
            },
          ],
        }),
      });

      const result = await provider.generateScript({
        topic: 'Test topic',
      });

      expect(result.script).toContain('generated script');
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.promptHash).toBeDefined();
    });

    it('includes correct headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Script' }],
        }),
      });

      await provider.generateScript({ topic: 'Test' });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers['x-api-key']).toBe('test-key');
      expect(callArgs.headers['anthropic-version']).toBeDefined();
    });
  });
});

describe('AIScriptService', () => {
  let service: AIScriptService;
  let primary: OpenAIProvider;
  let fallback: AnthropicProvider;

  beforeEach(() => {
    primary = new OpenAIProvider({ apiKey: 'primary-key' });
    fallback = new AnthropicProvider({ apiKey: 'fallback-key' });
    service = new AIScriptService(primary, fallback);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateScript', () => {
    it('uses primary provider when successful', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [{ flagged: false, categories: {} }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'SCRIPT:\nPrimary script' } }],
          }),
        });

      const result = await service.generateScript({ topic: 'Test' });

      expect(result.script).toContain('Primary script');
    });

    it('falls back to secondary on primary failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [{ flagged: false, categories: {} }] }),
        })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: [{ text: 'Fallback script' }],
          }),
        });

      const result = await service.generateScript({ topic: 'Test' });

      expect(result.script).toContain('Fallback script');
    });
  });

  describe('moderateAndGenerate', () => {
    it('moderates before generating', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [{ flagged: false, categories: {} }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [{ flagged: false, categories: {} }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'SCRIPT:\nGenerated' } }],
          }),
        });

      const result = await service.moderateAndGenerate({ topic: 'Safe topic' });

      expect(result.script).toBeDefined();
    });

    it('rejects unsafe content', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ flagged: true, categories: { hate: true } }],
        }),
      });

      await expect(
        service.moderateAndGenerate({ topic: 'Unsafe topic' })
      ).rejects.toThrow('Content rejected');
    });
  });
});
