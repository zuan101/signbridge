import React, { useState, useMemo } from 'react';
import { Send, Trash2, HelpCircle, Keyboard, CheckCircle, Space, Delete, Sparkles, Mic } from 'lucide-react';
import { FingerspellingAid } from './FingerspellingAid';
import { getWordSuggestions } from '../recognition/ISLDictionary';
import { VoiceMessageTranscriberModal } from './VoiceMessageTranscriberModal';

interface ProposalComposerProps {
  proposalText: string;
  currentWord?: string;
  onChangeProposal: (text: string) => void;
  onConfirmSend: (text: string) => void;
  onClear: () => void;
  onCompleteWord?: (completed: string) => void;
  onBackspace?: () => void;
  onAddSpace?: () => void;
  activeConfidence?: number | null;
  detectedLabel?: string | null;
  holdProgress?: number;
  holdLetter?: string | null;
}

export const ProposalComposer: React.FC<ProposalComposerProps> = ({
  proposalText,
  currentWord = '',
  onChangeProposal,
  onConfirmSend,
  onClear,
  onCompleteWord,
  onBackspace,
  onAddSpace,
  activeConfidence,
  detectedLabel,
  holdProgress = 0,
  holdLetter,
}) => {
  const [showTray, setShowTray] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Real-time word completions for current unfinished word
  const suggestions = useMemo(() => {
    return getWordSuggestions(currentWord, 4);
  }, [currentWord]);

  const handleSend = () => {
    if (!proposalText.trim()) return;
    onConfirmSend(proposalText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Tab' && suggestions.length > 0 && onCompleteWord) {
      e.preventDefault();
      onCompleteWord(suggestions[0]);
    }
  };

  const handleInsertChar = (char: string) => {
    onChangeProposal(proposalText + char);
  };

  const handleInternalBackspace = () => {
    if (onBackspace) {
      onBackspace();
    } else {
      onChangeProposal(proposalText.slice(0, -1));
    }
  };

  const handleInternalSpace = () => {
    if (onAddSpace) {
      onAddSpace();
    } else if (!proposalText.endsWith(' ')) {
      onChangeProposal(proposalText + ' ');
    }
  };

  return (
    <div className="proposal-box">
      <div className="proposal-label-row">
        <label htmlFor="proposal-input" className="proposal-label">
          <CheckCircle size={16} color="var(--terracotta)" />
          <span>Editable Signer Composer</span>
          {(detectedLabel || holdLetter) && (
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--sand)',
                padding: '0.15rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--chocolate)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>Sign: {holdLetter || detectedLabel}</span>
              {holdProgress > 0 && holdProgress < 1 && (
                <span style={{ color: 'var(--terracotta)', fontWeight: 700 }}>
                  ({Math.round(holdProgress * 100)}%)
                </span>
              )}
              {activeConfidence ? (
                <span style={{ opacity: 0.8 }}>{(activeConfidence * 100).toFixed(0)}%</span>
              ) : null}
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
          {showTray ? 'Hide Assist Tray' : 'Word-Builder Assist Tray'}
        </button>
      </div>

      {/* Smart Word Suggestions / Auto-Complete Strip */}
      {suggestions.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '0.5rem',
            padding: '0.35rem 0.6rem',
            backgroundColor: 'rgba(238, 220, 197, 0.4)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          <Sparkles size={13} color="var(--terracotta)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--brown)' }}>
            Suggested Words:
          </span>
          {suggestions.map((word, idx) => (
            <button
              key={word}
              type="button"
              className="chip"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.15rem 0.55rem',
                backgroundColor: idx === 0 ? 'var(--terracotta)' : 'var(--cream)',
                color: idx === 0 ? 'var(--cream)' : 'var(--chocolate)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
              onClick={() => onCompleteWord && onCompleteWord(word)}
              title={`Click or press Tab to complete "${word}"`}
            >
              {word}
            </button>
          ))}
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-text)', marginLeft: 'auto' }}>
            Press Tab to autocomplete
          </span>
        </div>
      )}

      <textarea
        id="proposal-input"
        className="proposal-textarea"
        placeholder="Fingerspelled letters or typed signer input will accumulate here in real time. Edit freely before confirming..."
        value={proposalText}
        onChange={e => onChangeProposal(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Editable sign proposal text"
      />

      {/* Quick Action Strip (Backspace, Space, Clear) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', marginBottom: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          onClick={handleInternalBackspace}
          disabled={!proposalText}
          title="Delete last letter"
        >
          <Delete size={13} />
          <span>Backspace</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          onClick={handleInternalSpace}
          disabled={!proposalText || proposalText.endsWith(' ')}
          title="Insert word space"
        >
          <Space size={13} />
          <span>Add Space</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', gap: '0.3rem' }}
          onClick={() => setIsVoiceModalOpen(true)}
          title="Input voice file or dictation"
        >
          <Mic size={13} color="var(--terracotta)" />
          <span>Voice to Text</span>
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: 'auto' }}
          onClick={onClear}
          disabled={!proposalText}
          title="Clear buffer"
        >
          <Trash2 size={13} />
          <span>Clear All</span>
        </button>
      </div>

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
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: '0.4rem' }}>
        <HelpCircle size={14} color="var(--brown)" />
        <span>Hold any sign steadily for 0.3s to type. Nothing sends automatically until you click Confirm.</span>
      </div>

      {showTray && (
        <FingerspellingAid
          onInsertChar={handleInsertChar}
          onBackspace={handleInternalBackspace}
          onClear={onClear}
        />
      )}

      {/* Voice Message to Text Modal */}
      <VoiceMessageTranscriberModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onInsertText={(transcribed) => onChangeProposal(proposalText ? `${proposalText} ${transcribed}` : transcribed)}
        targetRole="signer"
      />
    </div>
  );
};
