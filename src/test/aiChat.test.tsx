import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageList } from '../features/conversation/MessageList';
import { ReplyComposer } from '../features/conversation/ReplyComposer';
import { fetchAIStatus, sendChatMessage } from '../features/conversation/aiClient';
import { generateBotReply, normalizeMessageText } from '../features/conversation/signBridgeBot';
import type { Message } from '../features/conversation/types';

describe('normalizeMessageText (No [object Object] Guarantees)', () => {
  it('returns clean string unchanged', () => {
    expect(normalizeMessageText('Hello world')).toBe('Hello world');
  });

  it('extracts string from { text: "..." }', () => {
    expect(normalizeMessageText({ text: 'Extracted text' })).toBe('Extracted text');
  });

  it('extracts string from { message: "..." }', () => {
    expect(normalizeMessageText({ message: 'Extracted message' })).toBe('Extracted message');
  });

  it('extracts string from { response: "..." }', () => {
    expect(normalizeMessageText({ response: 'Extracted response' })).toBe('Extracted response');
  });

  it('extracts string from { reply: "..." }', () => {
    expect(normalizeMessageText({ reply: 'Extracted reply' })).toBe('Extracted reply');
  });

  it('extracts string from { error: { message: "..." } }', () => {
    expect(normalizeMessageText({ error: { message: 'Nested error message' } })).toBe('Nested error message');
  });

  it('safely handles null and undefined', () => {
    expect(normalizeMessageText(null)).toBe('');
    expect(normalizeMessageText(undefined)).toBe('');
  });

  it('never outputs [object Object]', () => {
    const complexObj = { someUnknownProp: 12345 };
    const res = normalizeMessageText(complexObj);
    expect(res).not.toBe('[object Object]');
    expect(res).not.toContain('[object Object]');
  });
});

describe('SignBridge Deterministic Knowledge Base (signBridgeBot.ts)', () => {
  it('responds accurately to "Hello"', () => {
    const res = generateBotReply('Hello');
    expect(res.reply).toBe('Hello! 👋 Welcome to SignBridge. How can I help you communicate today?');
  });

  it('responds accurately to "What is SignBridge?"', () => {
    const res = generateBotReply('What is SignBridge?');
    expect(res.reply).toContain('SignBridge helps bridge communication gaps');
  });

  it('responds accurately to "How do I spell a word?"', () => {
    const res = generateBotReply('How do I spell a word?');
    expect(res.reply).toContain('Open the Letters section and perform the supported signs');
  });

  it('responds accurately to "What can you do?"', () => {
    const res = generateBotReply('What can you do?');
    expect(res.reply).toBe('I can explain how SignBridge works, help you navigate its features, and answer common questions about sign-language communication.');
  });

  it('responds accurately to "Thank you"', () => {
    const res = generateBotReply('Thank you');
    expect(res.reply).toBe("You're welcome! 😊 I'm happy to help.");
  });

  it('provides helpful fallback with example questions for unknown input without crashing', () => {
    const res = generateBotReply('xyz123 random query unknown');
    expect(res.matchedIntent).toBe('fallback');
    expect(res.reply).toContain("What is SignBridge?");
    expect(res.reply).toContain("How do I spell a word?");
  });

  it('handles empty input gracefully', () => {
    const res = generateBotReply('   ');
    expect(res.matchedIntent).toBe('empty');
  });
});

describe('aiClient (Browser-Native Service)', () => {
  it('reports online status with zero external keys', async () => {
    const status = await fetchAIStatus();
    expect(status.configured).toBe(true);
    expect(status.isBuiltin).toBe(true);
    expect(status.provider).toBe('SignBridge Assistant');
  });

  it('processes chat messages locally and returns replies', async () => {
    const res = await sendChatMessage('What can you do?');
    expect(res.reply).toContain('I can explain how SignBridge works');
    expect(res.provider).toBe('SignBridge Assistant');
  });

  it('throws error when message is empty', async () => {
    await expect(sendChatMessage('   ', [])).rejects.toThrow('Message cannot be empty');
  });
});

describe('Upgraded MessageList (AI Chatbot UI)', () => {
  it('renders assistant messages with distinct tag and safe text', () => {
    const sampleMessages: Message[] = [
      { id: '1', sender: 'signer', text: 'HELLO', timestamp: Date.now() },
      { id: '2', sender: 'assistant', text: 'Hello! 👋 Welcome to SignBridge. How can I help you communicate today?', timestamp: Date.now() + 500 },
    ];

    render(
      <MessageList
        messages={sampleMessages}
        onSpeakMessage={vi.fn()}
        isSpeaking={false}
      />
    );

    expect(screen.getByText('HELLO')).toBeInTheDocument();
    expect(screen.getByText('Hello! 👋 Welcome to SignBridge. How can I help you communicate today?')).toBeInTheDocument();
    expect(screen.getByText('SignBridge Assistant')).toBeInTheDocument();
    expect(screen.getByText('Signer (Student / Visitor)')).toBeInTheDocument();
  });

  it('safely normalizes any object passed as message text without rendering [object Object]', () => {
    const malformedMessages: Message[] = [
      // @ts-expect-error - testing unexpected object
      { id: '1', sender: 'assistant', text: { message: 'Safely extracted text' }, timestamp: Date.now() },
    ];

    render(
      <MessageList
        messages={malformedMessages}
        onSpeakMessage={vi.fn()}
        isSpeaking={false}
      />
    );

    expect(screen.getByText('Safely extracted text')).toBeInTheDocument();
    expect(screen.queryByText(/\[object Object\]/)).toBeNull();
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

    expect(screen.getByText('Responding...')).toBeInTheDocument();
    expect(screen.getByLabelText('Assistant is responding')).toBeInTheDocument();
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

    const input = screen.getByPlaceholderText(/type a question or message to the assistant/i);
    fireEvent.change(input, { target: { value: 'Hello' } });

    // Enter press sends
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('Hello');

    // Quick reply sends
    const quickReplyBtn = screen.getByRole('button', { name: 'Namaste' });
    fireEvent.click(quickReplyBtn);
    expect(onSend).toHaveBeenCalledWith('Namaste');
  });

  it('disables input while generating to prevent duplicate requests', () => {
    render(
      <ReplyComposer
        onSendReply={vi.fn()}
        quickReplies={['Wait']}
        isSpeaking={false}
        onStopSpeaking={vi.fn()}
        isAiGenerating={true}
      />
    );

    const input = screen.getByPlaceholderText(/assistant is responding/i);
    expect(input).toBeDisabled();

    const sendBtn = screen.getByRole('button', { name: /sending/i });
    expect(sendBtn).toBeDisabled();
  });
});
