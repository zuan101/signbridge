import React, { useEffect, useRef } from 'react';
import type { Message } from './types';
import { X, User, Maximize2 } from 'lucide-react';
import { formatTime } from '../../lib/time';
import { normalizeMessageText } from './signBridgeBot';

interface LargeDisplayModeProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

export const LargeDisplayMode: React.FC<LargeDisplayModeProps> = ({
  isOpen,
  onClose,
  messages,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="large-display-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Large Counter Display Mode"
    >
      <div className="large-display-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Maximize2 size={28} color="var(--terracotta)" />
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--chocolate)' }}>
              SignBridge Counter Display
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--muted-text)' }}>
              High-visibility shared screen for desk interaction
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          style={{ fontSize: '1rem', padding: '0.6rem 1.25rem' }}
        >
          <X size={20} />
          <span>Exit Large Display (Esc)</span>
        </button>
      </div>

      <div className="large-display-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--muted-text)', fontSize: '1.5rem' }}>
            No messages yet. Messages sent from the camera or keyboard will display here in high-contrast counter size.
          </div>
        ) : (
          messages.map(msg => {
            const isSigner = msg.sender === 'signer';
            const safeText = normalizeMessageText(msg.text);
            return (
              <div
                key={msg.id}
                className={`large-display-msg ${isSigner ? 'signer' : 'reply'}`}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '1rem',
                    color: 'var(--brown)',
                    marginBottom: '0.5rem',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={18} color={isSigner ? 'var(--terracotta)' : 'var(--brown)'} />
                    {isSigner ? 'SIGNER' : 'ASSISTANT'}
                  </span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
                <div>{safeText}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
