import React from 'react';
import { Dialog } from './Dialog';


interface KeyboardHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardHelpDialog: React.FC<KeyboardHelpDialogProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'Alt + 1', desc: 'Navigate to Live Conversation' },
    { key: 'Alt + 2', desc: 'Navigate to Learn Signs' },
    { key: 'Alt + 3', desc: 'Navigate to Conversation History' },
    { key: 'Alt + 4', desc: 'Navigate to Settings' },
    { key: 'Alt + C', desc: 'Toggle Webcam (Start / Stop)' },
    { key: 'Alt + S', desc: 'Stop active speech audio' },
    { key: 'Ctrl + Enter', desc: 'Send typed reply' },
    { key: 'Esc', desc: 'Close open dialogs and Large Display' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts & Accessibility"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Got it
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--brown)' }}>
          SignBridge is built for complete keyboard navigability. Use standard Tab / Shift+Tab to jump between elements, or the direct shortcuts below:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {shortcuts.map(s => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--ivory)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: 'var(--chocolate)' }}>{s.desc}</span>
              <kbd
                style={{
                  backgroundColor: 'var(--sand)',
                  color: 'var(--chocolate)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
};
