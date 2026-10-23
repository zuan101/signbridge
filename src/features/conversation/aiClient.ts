/**
 * SignBridge AI Chatbot Client
 * Handles communication between the frontend React application
 * and the backend AI service endpoints (/api/chat, /api/ai-status, /api/save-key).
 */

export interface AIStatus {
  configured: boolean;
  provider: string | null;
  model: string | null;
  isBuiltin?: boolean;
  message: string;
}

export interface AIChatResponse {
  reply: string;
  provider: string;
  model: string;
}

export interface ChatHistoryItem {
  sender: 'signer' | 'reply' | 'assistant';
  text: string;
}

/**
 * Check backend AI configuration and model status.
 */
export async function fetchAIStatus(): Promise<AIStatus> {
  try {
    const res = await fetch('/api/ai-status', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return {
        configured: true,
        provider: 'signbridge-ai',
        model: 'isl-dialog-v1',
        isBuiltin: true,
        message: 'SignBridge Built-in Assistant active',
      };
    }
    return await res.json();
  } catch (err) {
    return {
      configured: true,
      provider: 'signbridge-ai',
      model: 'isl-dialog-v1',
      isBuiltin: true,
      message: err instanceof Error ? err.message : 'SignBridge Built-in Assistant active',
    };
  }
}

/**
 * Send recognized ISL sign message or typed input to the AI assistant.
 */
export async function sendChatMessage(
  message: string,
  history: ChatHistoryItem[] = []
): Promise<AIChatResponse> {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    throw new Error('Message cannot be empty');
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      message: cleanMessage,
      history: history.map(h => ({
        sender: h.sender,
        text: h.text,
      })),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.error || `AI request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    // @ts-expect-error - attach custom code
    error.code = data?.code || 'AI_REQUEST_FAILED';
    // @ts-expect-error - attach status
    error.status = response.status;
    throw error;
  }

  return data as AIChatResponse;
}

/**
 * Save an API key from the UI directly to the backend.
 */
export async function saveAIKey(provider: 'gemini' | 'openai', apiKey: string, model?: string): Promise<AIStatus> {
  const res = await fetch('/api/save-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ provider, apiKey, model }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save API key');
  }

  return data.status as AIStatus;
}
