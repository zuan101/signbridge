import React from 'react';
import { Delete, Space } from 'lucide-react';

interface FingerspellingAidProps {
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

const NUMERALS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const QUICK_TERMS = ['Room', 'Fee', 'Desk', 'Floor', 'Dr.', 'Office', 'Counter'];

export const FingerspellingAid: React.FC<FingerspellingAidProps> = ({
  onInsertChar,
  onBackspace,
  onClear,
}) => {
  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '0.75rem',
        backgroundColor: 'rgba(238, 220, 197, 0.3)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brown)' }}>
          Word-Builder & Numeral Tray (Manual Assist — Not Recognition)
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}
          onClick={onClear}
        >
          Clear
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {NUMERALS.map(num => (
          <button
            key={num}
            type="button"
            className="chip"
            style={{ minWidth: '32px', textAlign: 'center' }}
            onClick={() => onInsertChar(num)}
            aria-label={`Insert number ${num}`}
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          className="chip"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          onClick={() => onInsertChar(' ')}
          aria-label="Insert Space"
        >
          <Space size={14} /> Space
        </button>

        <button
          type="button"
          className="chip"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          onClick={onBackspace}
          aria-label="Backspace"
        >
          <Delete size={14} /> Backspace
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {QUICK_TERMS.map(term => (
          <button
            key={term}
            type="button"
            className="chip"
            style={{ fontSize: '0.75rem' }}
            onClick={() => onInsertChar(`${term} `)}
          >
            +{term}
          </button>
        ))}
      </div>
    </div>
  );
};
