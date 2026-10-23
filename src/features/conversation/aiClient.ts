/**
 * SignBridge AI Assistant Client
 * Browser-native, offline-friendly chatbot service for SignBridge.
 *
 * Runs 100% in-browser on deployed Vercel static sites and local setups
 * without requiring any API keys, environment variables, or external services.
 */

import { generateBotReply, normalizeMessageText } from './signBridgeBot';

export interface AIStatus {
  configured: boolean;
  provider: string;
  model: string;
  isBuiltin: boolean;
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
 * Check assistant availability. Always returns online with zero external setup.
 */
export async function fetchAIStatus(): Promise<AIStatus> {
  return {
    configured: true,
    provider: 'SignBridge Assistant',
    model: 'Built-in Knowledge Engine',
    isBuiltin: true,
    message: 'SignBridge Assistant is active and ready (no API key required).',
  };
}

/**
 * Send recognized ISL sign message or typed input to the assistant.
 * Normalizes input safely and returns deterministic responses directly in the browser.
 */
export async function sendChatMessage(
  message: unknown,
  _history: ChatHistoryItem[] = []
): Promise<AIChatResponse> {
  const cleanMessage = normalizeMessageText(message);
  if (!cleanMessage) {
    throw new Error('Message cannot be empty');
  }

  // Realistic human-readable response delay (200ms) for typing indicator
  await new Promise(resolve => setTimeout(resolve, 200));

  const response = generateBotReply(cleanMessage);

  return {
    reply: normalizeMessageText(response.reply),
    provider: 'SignBridge Assistant',
    model: 'Built-in Knowledge Engine',
  };
}

// Re-export normalizer for all components to use safely
export { normalizeMessageText };
