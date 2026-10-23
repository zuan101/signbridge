import React, { useRef, useEffect, useState } from 'react';
import type { Message } from './types';
import { 
  Volume2, 
  User, 
  Sparkles, 
  Pencil, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  RotateCcw, 
  AlertCircle 
} from 'lucide-react';
import { formatTime } from '../../lib/time';
import { copyToClipboard } from '../../lib/clipboard';

interface MessageListProps {
  messages: Message[];
  onSpeakMessage: (text: string) => void;
  isSpeaking: boolean;
  isAiGenerating?: boolean;
  aiError?: string | null;
  onRetryMessage?: (text: string) => void;
  onEditMessage?: (id: string, newText: string) => void;
  onDeleteMessage?: (id: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onSpeakMessage,
  isAiGenerating = false,
  aiError = null,
  onRetryMessage,
  onEditMessage,
  onDeleteMessage,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll to newest message or typing indicator
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiGenerating, aiError]);

  const handleStartEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = (id: string) => {
    if (!editText.trim()) return;
    onEditMessage?.(id, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  const handleCopy = (msg: Message) => {
    copyToClipboard(msg.text);
    setCopiedId(msg.id);
    setTimeout(() => {
      setCopiedId(prev => (prev === msg.id ? null : prev));
    }, 1800);
  };

  if (messages.length === 0 && !isAiGenerating) {
    return (
      <div
        className="message-stream"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted-text)',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--sand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <Sparkles size={32} color="var(--terracotta)" />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--chocolate)', fontSize: '1.15rem' }}>
          Conversation is ready
        </h3>
        <p style={{ maxWidth: '360px', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
          Sign in front of the camera on the left to compose ISL letters and words, or type a message below.
          The AI assistant will understand and respond in real time.
        </p>
      </div>
    );
  }

  // Get the last user message to support retry if error occurs
  const lastUserMessage = [...messages].reverse().find(m => m.sender === 'signer')?.text;

  return (
    <div className="message-stream" ref={scrollRef} role="log" aria-label="Conversation messages">
      {messages.map(msg => {
        const isSigner = msg.sender === 'signer';
        const isAssistant = msg.sender === 'assistant';
        const isEditing = editingId === msg.id;

        // Visual distinction: Signer/User on the right, AI/Desk on the left
        const bubbleClass = isSigner ? 'signer' : 'reply';

        return (
          <div
            key={msg.id}
            className={`message-bubble ${bubbleClass}`}
            data-sender={msg.sender}
          >
            <div className="message-header">
              <span className="message-sender-tag">
                {isSigner ? (
                  <>
                    <User size={13} color="var(--terracotta)" />
                    <span>Signer (Student / Visitor)</span>
                  </>
                ) : isAssistant ? (
                  <>
                    <Sparkles size={13} color="var(--terracotta)" />
                    <span style={{ fontWeight: 700, color: 'var(--chocolate)' }}>SignBridge AI</span>
                  </>
                ) : (
                  <>
                    <User size={13} color="var(--brown)" />
                    <span>Desk Operator (Reply)</span>
                  </>
                )}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {msg.editedAt && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted-text)', fontStyle: 'italic' }}>
                    (edited)
                  </span>
                )}
                <span>{formatTime(msg.timestamp)}</span>
              </div>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <textarea
                  className="reply-input"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={2}
                  style={{ width: '100%', fontSize: '0.9rem' }}
                  autoFocus
                  aria-label="Edit message content"
                />
                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    onClick={handleCancelEdit}
                  >
                    <X size={12} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                    onClick={() => handleSaveEdit(msg.id)}
                    disabled={!editText.trim()}
                  >
                    <Check size={12} />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="message-text">{msg.text}</div>
            )}

            <div className="message-footer">
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                style={{ padding: '0.2rem', color: 'var(--brown)' }}
                onClick={() => handleCopy(msg)}
                title="Copy message"
                aria-label={`Copy message: ${msg.text.substring(0, 20)}`}
              >
                {copiedId === msg.id ? <Check size={13} color="var(--olive)" /> : <Copy size={13} />}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-icon"
                style={{ padding: '0.2rem', color: 'var(--brown)' }}
                onClick={() => onSpeakMessage(msg.text)}
                title="Speak message aloud"
                aria-label={`Speak message: ${msg.text.substring(0, 20)}`}
              >
                <Volume2 size={14} />
              </button>

              {onEditMessage && !isEditing && (
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '0.2rem', color: 'var(--brown)' }}
                  onClick={() => handleStartEdit(msg)}
                  title="Edit message"
                  aria-label={`Edit message: ${msg.text.substring(0, 20)}`}
                >
                  <Pencil size={13} />
                </button>
              )}

              {onDeleteMessage && (
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '0.2rem', color: 'var(--brick)' }}
                  onClick={() => onDeleteMessage(msg.id)}
                  title="Delete message"
                  aria-label={`Delete message: ${msg.text.substring(0, 20)}`}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* AI Assistant Typing Indicator */}
      {isAiGenerating && (
        <div className="message-bubble reply ai-typing-bubble" aria-live="polite">
          <div className="message-header">
            <span className="message-sender-tag">
              <Sparkles size={13} color="var(--terracotta)" />
              <span style={{ fontWeight: 700, color: 'var(--chocolate)' }}>SignBridge AI</span>
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted-text)' }}>Thinking...</span>
          </div>
          <div className="typing-indicator" aria-label="AI is generating a response">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      {/* AI Error Alert / Retry */}
      {aiError && (
        <div
          className="ai-error-box"
          style={{
            backgroundColor: 'rgba(166, 58, 36, 0.08)',
            border: '1.5px solid var(--brick)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            alignSelf: 'stretch',
            marginTop: '0.5rem',
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <AlertCircle size={18} color="var(--brick)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--chocolate)' }}>
              <strong>AI Response Failed:</strong> {aiError}
            </div>
          </div>
          {onRetryMessage && lastUserMessage && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                alignSelf: 'flex-start',
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                gap: '0.35rem',
              }}
              onClick={() => onRetryMessage(lastUserMessage)}
            >
              <RotateCcw size={13} />
              <span>Retry Question</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
