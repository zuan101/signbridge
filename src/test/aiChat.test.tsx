import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageList } from '../features/conversation/MessageList';
import { ReplyComposer } from '../features/conversation/ReplyComposer';
import { fetchAIStatus, sendChatMessage } from '../features/conversation/aiClient';
import type { Message } from '../features/conversation/types';

describe('aiClient (Frontend Service)', () => {
  it('calls /api/ai-status and returns status', async () => {
    const mockStatus = {
      configured: true,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      message: 'Google Gemini is active and ready',
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockStatus,
    }) as unknown as typeof fetch;

    const status = await fetchAIStatus();
    expect(status.configured).toBe(true);
    expect(status.provider).toBe('gemini');

    globalThis.fetch = originalFetch;
  });

  it('calls /api/chat and returns reply', async () => {
    const mockReply = {
      reply: 'Hello! I can understand your ISL gestures.',
      provider: 'gemini',
      model: 'gemini-2.0-flash',
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReply,
    }) as unknown as typeof fetch;

    const res = await sendChatMessage('HELLO', []);
    expect(res.reply).toBe('Hello! I can understand your ISL gestures.');
    expect(res.provider).toBe('gemini');

    globalThis.fetch = originalFetch;
  });

  it('throws error when message is empty', async () => {
    await expect(sendChatMessage('   ', [])).rejects.toThrow('Message cannot be empty');
  });
});

describe('Upgraded MessageList (AI Chatbot UI)', () => {
  it('renders AI assistant messages with Sparkles badge and distinct sender tag', () => {
    const sampleMessages: Message[] = [
      { id: '1', sender: 'signer', text: 'HELLO', timestamp: Date.now() },
      { id: '2', sender: 'assistant', text: 'Hello! Welcome to SignBridge. How can I assist you today?', timestamp: Date.now() + 500 },
    ];

    render(
      <MessageList
        messages={sampleMessages}
        onSpeakMessage={vi.fn()}
        isSpeaking={false}
      />
    );

    expect(screen.getByText('HELLO')).toBeInTheDocument();
    expect(screen.getByText('Hello! Welcome to SignBridge. How can I assist you today?')).toBeInTheDocument();
    expect(screen.getByText('SignBridge AI')).toBeInTheDocument();
    expect(screen.getByText('Signer (Student / Visitor)')).toBeInTheDocument();
  });

  it('renders typing indicator when isAiGenerating is true', () => {
    render(
      <MessageList
        messages={[{ id: '1', sender: 'signer', text: 'Where is counter 4?', timestamp: Date.now() }]}
        onSpeakMessage={vi.fn()}
        isSpeaking={false}
        isAiGenerating={true}
      />
    );

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    expect(screen.getByLabelText('AI is generating a response')).toBeInTheDocument();
  });

  it('renders error alert with retry button when aiError is provided', () => {
    const onRetry = vi.fn();
    render(
      <MessageList
        messages={[{ id: '1', sender: 'signer', text: 'Help please', timestamp: Date.now() }]}
        onSpeakMessage={vi.fn()}
        isSpeaking={false}
        aiError="AI service unavailable"
        onRetryMessage={onRetry}
      />
    );

    expect(screen.getByText(/AI service unavailable/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry question/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledWith('Help please');
  });

  it('supports editing an existing message in session history', () => {
    const onEdit = vi.fn();
    const sampleMessages: Message[] = [
      { id: 'msg-1', sender: 'signer', text: 'HELO', timestamp: Date.now() },
    ];

    render(
      <MessageList
        messages={sampleMessages}
        onSpeakMessage={vi.fn()}
        isSpeaking={false}
        onEditMessage={onEdit}
      />
    );

    const editBtn = screen.getByRole('button', { name: /edit message/i });
    fireEvent.click(editBtn);

    const editInput = screen.getByLabelText('Edit message content');
    expect(editInput).toHaveValue('HELO');

    fireEvent.change(editInput, { target: { value: 'HELLO' } });
    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    expect(onEdit).toHaveBeenCalledWith('msg-1', 'HELLO');
  });

  it('supports deleting an existing message in session history', () => {
    const onDelete = vi.fn();
    const sampleMessages: Message[] = [
      { id: 'msg-2', sender: 'signer', text: 'Typo to delete', timestamp: Date.now() },
    ];

    render(
      <MessageList
        messages={sampleMessages}
        onSpeakMessage={vi.fn()}
        isSpeaking={false}
        onDeleteMessage={onDelete}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete message/i });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith('msg-2');
  });
});

describe('Upgraded ReplyComposer', () => {
  it('sends typed message on click and on Enter key press', () => {
    const onSend = vi.fn();
    render(
      <ReplyComposer
        onSendReply={onSend}
        quickReplies={['Namaste']}
        isSpeaking={false}
        onStopSpeaking={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/type a message to the ai assistant/i);
    fireEvent.change(input, { target: { value: 'Hello AI' } });

    // Enter press sends
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('Hello AI');

    // Quick reply sends
    const quickReplyBtn = screen.getByRole('button', { name: 'Namaste' });
    fireEvent.click(quickReplyBtn);
    expect(onSend).toHaveBeenCalledWith('Namaste');
  });

  it('disables input while AI is generating to prevent duplicate requests', () => {
    render(
      <ReplyComposer
        onSendReply={vi.fn()}
        quickReplies={['Wait']}
        isSpeaking={false}
        onStopSpeaking={vi.fn()}
        isAiGenerating={true}
      />
    );

    const input = screen.getByPlaceholderText(/ai is responding/i);
    expect(input).toBeDisabled();

    const sendBtn = screen.getByRole('button', { name: /sending\.\.\./i });
    expect(sendBtn).toBeDisabled();
  });
});
