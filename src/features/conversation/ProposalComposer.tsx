import React, { useState } from 'react';
import { Send, Trash2, HelpCircle, Keyboard, CheckCircle } from 'lucide-react';
import { FingerspellingAid } from './FingerspellingAid';

interface ProposalComposerProps {
  proposalText: string;
  onChangeProposal: (text: string) => void;
  onConfirmSend: (text: string) => void;
  onClear: () => void;
  activeConfidence?: number | null;
  detectedLabel?: string | null;
}

export const ProposalComposer: React.FC<ProposalComposerProps> = ({
  proposalText,
  onChangeProposal,
  onConfirmSend,
  onClear,
  activeConfidence,
  detectedLabel,
}) => {
  const [showTray, setShowTray] = useState<boolean>(false);

  const handleSend = () => {
    if (!proposalText.trim()) return;
    onConfirmSend(proposalText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertChar = (char: string) => {
    onChangeProposal(proposalText + char);
  };

  const handleBackspace = () => {
    onChangeProposal(proposalText.slice(0, -1));
  };

  return (
    <div className="proposal-box">
      <div className="proposal-label-row">
        <label htmlFor="proposal-input" className="proposal-label">
          <CheckCircle size={16} color="var(--terracotta)" />
          <span>Editable Signer Composer</span>
          {detectedLabel && (
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--sand)',
                padding: '0.1rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--chocolate)',
                fontWeight: 600,
              }}
            >
              Sign: {detectedLabel} {activeConfidence ? `(${(activeConfidence * 100).toFixed(0)}%)` : ''}
            </span>
          )}
        </label>

        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => setShowTray(prev => !prev)}
          aria-expanded={showTray}
        >
          <Keyboard size={14} />
          {showTray ? 'Hide Word-Builder' : 'Word-Builder Tray'}
        </button>
      </div>

      <textarea
        id="proposal-input"
        className="proposal-textarea"
        placeholder="Gesture proposals or typed signer input will appear here. Edit freely before confirming..."
        value={proposalText}
        onChange={e => onChangeProposal(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Editable sign proposal text"
      />

      <div className="proposal-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSend}
          disabled={!proposalText.trim()}
          style={{ flex: 1 }}
        >
          <Send size={16} />
          <span>Confirm & Send Message</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClear}
          disabled={!proposalText}
          title="Clear composer"
        >
          <Trash2 size={16} />
          <span>Clear</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--muted-text)' }}>
        <HelpCircle size={14} color="var(--brown)" />
        <span>Nothing is sent automatically. Review and click Confirm & Send, or repeat sign if uncertain.</span>
      </div>

      {showTray && (
        <FingerspellingAid
          onInsertChar={handleInsertChar}
          onBackspace={handleBackspace}
          onClear={onClear}
        />
      )}
    </div>
  );
};
