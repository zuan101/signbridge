import React, { useState } from 'react';
import { Send, VolumeX, Mic, Loader2 } from 'lucide-react';
import { VoiceMessageTranscriberModal } from './VoiceMessageTranscriberModal';

interface ReplyComposerProps {
  onSendReply: (text: string) => void;
  quickReplies?: string[];
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  isAiGenerating?: boolean;
}

export const ReplyComposer: React.FC<ReplyComposerProps> = ({
  onSendReply,
  quickReplies = [],
  isSpeaking,
  onStopSpeaking,
  isAiGenerating = false,
}) => {
  const [text, setText] = useState<string>('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const handleSend = () => {
    if (!text.trim() || isAiGenerating) return;
    onSendReply(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (chipText: string) => {
    if (isAiGenerating) return;
    onSendReply(chipText);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Quick Suggestions Tray */}
      {quickReplies.length > 0 && (
        <div className="quick-replies-tray" aria-label="Suggested quick questions or responses">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              type="button"
              className="chip"
              onClick={() => handleQuickReply(qr)}
              disabled={isAiGenerating}
              style={{ opacity: isAiGenerating ? 0.6 : 1 }}
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Main Chat Input Bar */}
      <div className="reply-composer">
        <textarea
          className="reply-input"
          placeholder={isAiGenerating ? 'AI is responding...' : 'Type a message to the AI assistant... (Enter to send, Shift+Enter for newline)'}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Type message to AI assistant"
          rows={2}
          disabled={isAiGenerating}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!text.trim() || isAiGenerating}
            style={{ height: '42px', padding: '0 1.25rem' }}
            title="Send message to AI assistant"
          >
            {isAiGenerating ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            <span>{isAiGenerating ? 'Sending...' : 'Send'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsVoiceModalOpen(true)}
            disabled={isAiGenerating}
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
        targetRole="signer"
      />
    </div>
  );
};
