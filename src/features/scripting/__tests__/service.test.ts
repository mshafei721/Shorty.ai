import { generateScript, regenerateScript } from '../service';
import { ScriptPrompt, ScriptDraft } from '../types';

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Script Generation Service', () => {
  const mockProjectId = 'project_123';
  const mockPrompt: ScriptPrompt = {
    topic: 'Lower back pain relief',
    description: 'Focus on stretches',
    tone: 'balanced',
    length: 60,
    preset: 'educate',
    niche: 'healthcare',
    subNiche: 'physiotherapy',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  });

  describe('generateScript', () => {
    it('should throw error if API key not configured', async () => {
      delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;

      await expect(generateScript(mockPrompt, mockProjectId)).rejects.toMatchObject({
        code: 'api_key',
        retryable: false,
      });
    });

    it('should call OpenAI API with correct parameters', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Generated script text here.' } }],
        usage: { total_tokens: 150 },
        model: 'gpt-4o',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await generateScript(mockPrompt, mockProjectId);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-key',
          }),
        })
      );

      expect(result.draft.text).toBe('Generated script text here.');
      expect(result.draft.wordsCount).toBe(4);
      expect(result.draft.projectId).toBe(mockProjectId);
      expect(result.tokensUsed).toBe(150);
    });

    it('should handle rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      } as Response);

      await expect(generateScript(mockPrompt, mockProjectId)).rejects.toMatchObject({
        code: 'rate_limit',
        retryable: true,
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(generateScript(mockPrompt, mockProjectId)).rejects.toMatchObject({
        code: 'network',
        retryable: true,
      });
    });

    it('should build system prompt with tone and preset', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test script' } }],
        usage: { total_tokens: 100 },
        model: 'gpt-4o',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await generateScript(mockPrompt, mockProjectId);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const systemMessage = callBody.messages[0].content;

      expect(systemMessage).toContain('physiotherapy');
      expect(systemMessage).toContain('Professional yet approachable');
      expect(systemMessage).toContain('150 words');
    });

    it('should calculate target words based on length', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test script' } }],
        usage: { total_tokens: 100 },
        model: 'gpt-4o',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const prompt30s: ScriptPrompt = { ...mockPrompt, length: 30 };
      await generateScript(prompt30s, mockProjectId);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const systemMessage = callBody.messages[0].content;

      expect(systemMessage).toContain('75 words');
    });
  });

  describe('regenerateScript', () => {
    it('should increment version number', async () => {
      const previousDraft: ScriptDraft = {
        id: 'draft_1',
        projectId: mockProjectId,
        prompt: mockPrompt,
        text: 'Original text',
        wordsCount: 2,
        createdAt: new Date().toISOString(),
        version: 1,
      };

      const mockResponse = {
        choices: [{ message: { content: 'Regenerated script text' } }],
        usage: { total_tokens: 150 },
        model: 'gpt-4o',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await regenerateScript(previousDraft);

      expect(result.draft.version).toBe(2);
    });

    it('should append feedback to description', async () => {
      const previousDraft: ScriptDraft = {
        id: 'draft_1',
        projectId: mockProjectId,
        prompt: mockPrompt,
        text: 'Original text',
        wordsCount: 2,
        createdAt: new Date().toISOString(),
        version: 1,
      };

      const mockResponse = {
        choices: [{ message: { content: 'Revised script' } }],
        usage: { total_tokens: 150 },
        model: 'gpt-4o',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await regenerateScript(previousDraft, 'Make it more casual');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const userMessage = callBody.messages[1].content;

      expect(userMessage).toContain('Make it more casual');
    });
  });
});
