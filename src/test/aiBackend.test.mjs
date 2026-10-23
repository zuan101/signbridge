import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAIStatus, handleApiRequest, generateAIResponse } from '../../server/aiBackend.mjs';

describe('AI Backend Service (aiBackend.mjs)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OLLAMA_BASE_URL;
  });

  it('reports active built-in status when no credentials are configured', () => {
    const status = getAIStatus();
    expect(status.configured).toBe(true);
    expect(status.provider).toBe('signbridge-ai');
    expect(status.isBuiltin).toBe(true);
  });

  it('detects Gemini credentials when GEMINI_API_KEY is present', () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';
    const status = getAIStatus();
    expect(status.configured).toBe(true);
    expect(status.provider).toBe('gemini');
    expect(status.model).toBe('gemini-2.0-flash');
    expect(status.isBuiltin).toBe(false);
    expect(JSON.stringify(status)).not.toContain('test-gemini-key-123');
  });

  it('detects OpenAI credentials when OPENAI_API_KEY is present', () => {
    process.env.OPENAI_API_KEY = 'test-openai-key-456';
    const status = getAIStatus();
    expect(status.configured).toBe(true);
    expect(status.provider).toBe('openai');
    expect(status.model).toBe('gpt-4o-mini');
    expect(status.isBuiltin).toBe(false);
    expect(JSON.stringify(status)).not.toContain('test-openai-key-456');
  });

  it('generates contextual conversational replies out of the box', async () => {
    const res1 = await generateAIResponse({ message: 'HELLO', history: [] });
    expect(res1.reply).toContain('Namaste');
    expect(res1.provider).toBe('signbridge-ai');

    const res2 = await generateAIResponse({ message: 'WHERE IS FEE COUNTER', history: [] });
    expect(res2.reply).toContain('Room 104');
  });

  it('handles GET /api/ai-status via HTTP handler', async () => {
    const req = { method: 'GET', url: '/api/ai-status' };
    let responseBody = '';
    let responseCode = 0;
    const res = {
      setHeader: vi.fn(),
      set statusCode(val) { responseCode = val; },
      end: (data) => { responseBody = data; },
    };

    await handleApiRequest(req, res);
    expect(responseCode).toBe(200);
    const parsed = JSON.parse(responseBody);
    expect(parsed.configured).toBe(true);
  });

  it('returns 400 on empty message in POST /api/chat', async () => {
    const req = {
      method: 'POST',
      url: '/api/chat',
      on: (event, callback) => {
        if (event === 'data') callback(JSON.stringify({ message: '   ' }));
        if (event === 'end') callback();
      },
    };
    let responseBody = '';
    let responseCode = 0;
    const res = {
      setHeader: vi.fn(),
      set statusCode(val) { responseCode = val; },
      end: (data) => { responseBody = data; },
    };

    await handleApiRequest(req, res);
    expect(responseCode).toBe(400);
    const parsed = JSON.parse(responseBody);
    expect(parsed.code).toBe('INVALID_REQUEST');
  });
});
