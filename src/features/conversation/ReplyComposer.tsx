import React, { useState } from 'react';
import { Send, VolumeX, Mic } from 'lucide-react';
import { VoiceMessageTranscriberModal } from './VoiceMessageTranscriberModal';

interface ReplyComposerProps {
  onSendReply: (text: string) => void;
  quickReplies: string[];
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const ReplyComposer: React.FC<ReplyComposerProps> = ({
  onSendReply,
  quickReplies,
  isSpeaking,
  onStopSpeaking,
}) => {
  const [text, setText] = useState<string>('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendReply(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (chipText: string) => {
    onSendReply(chipText);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Quick Replies Tray */}
      {quickReplies.length > 0 && (
        <div className="quick-replies-tray" aria-label="Quick response shortcuts">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              type="button"
              className="chip"
              onClick={() => handleQuickReply(qr)}
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Main Reply Input Bar */}
      <div className="reply-composer">
        <textarea
          className="reply-input"
          placeholder="Type receptionist reply... (Press Ctrl+Enter to send)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Type response to signer"
          rows={2}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!text.trim()}
            style={{ height: '42px', padding: '0 1.25rem' }}
          >
            <Send size={16} />
            <span>Reply</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsVoiceModalOpen(true)}
            style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.5rem', gap: '0.35rem' }}
            title="Convert voice message file (.mp3, .wav) or voice note to text"
          >
            <Mic size={14} color="var(--terracotta)" />
            <span>Voice Note</span>
          </button>

          {isSpeaking && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={onStopSpeaking}
              style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.5rem' }}
              title="Stop speaking audio"
            >
              <VolumeX size={14} />
              <span>Stop Voice</span>
            </button>
          )}
        </div>
      </div>

      {/* Voice Message to Text Modal */}
      <VoiceMessageTranscriberModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onInsertText={(transcribed) => setText(prev => prev ? `${prev} ${transcribed}` : transcribed)}
        targetRole="receptionist"
      />
    </div>
  );
};
