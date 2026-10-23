import React, { useRef, useEffect } from 'react';
import type { Message } from './types';
import { Volume2, User, MessageSquareText } from 'lucide-react';
import { formatTime } from '../../lib/time';

interface MessageListProps {
  messages: Message[];
  onSpeakMessage: (text: string) => void;
  isSpeaking: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onSpeakMessage,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
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
        <MessageSquareText size={48} strokeWidth={1.5} color="var(--sand)" />
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--chocolate)', marginTop: '1rem', fontSize: '1.1rem' }}>
          Conversation is ready
        </h3>
        <p style={{ maxWidth: '340px', fontSize: '0.85rem', marginTop: '0.35rem' }}>
          Sign in front of the camera on the left, or type a receptionist reply below. All messages appear chronologically in this shared space.
        </p>
      </div>
    );
  }

  return (
    <div className="message-stream" ref={scrollRef} role="log" aria-label="Conversation messages">
      {messages.map(msg => {
        const isSigner = msg.sender === 'signer';
        return (
          <div
            key={msg.id}
            className={`message-bubble ${isSigner ? 'signer' : 'reply'}`}
          >
            <div className="message-header">
              <span className="message-sender-tag">
                <User size={13} color={isSigner ? 'var(--terracotta)' : 'var(--brown)'} />
                <span>{isSigner ? 'Signer (Student / Visitor)' : 'Desk Operator (Reply)'}</span>
              </span>
              <span>{formatTime(msg.timestamp)}</span>
            </div>

            <div className="message-text">{msg.text}</div>

            <div className="message-footer">
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                style={{ padding: '0.2rem', color: 'var(--brown)' }}
                onClick={() => onSpeakMessage(msg.text)}
                title="Speak message aloud"
                aria-label={`Speak message: ${msg.text}`}
              >
                <Volume2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
