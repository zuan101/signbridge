import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageList } from '../features/conversation/MessageList';
import { ProposalComposer } from '../features/conversation/ProposalComposer';
import { FingerspellingAid } from '../features/conversation/FingerspellingAid';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Dialog } from '../components/ui/Dialog';
import type { Message } from '../features/conversation/types';

describe('BrandLogo', () => {
  it('renders SVG without crashing', () => {
    const { container } = render(<BrandLogo size={40} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('width')).toBe('40');
  });
});

describe('MessageList', () => {
  it('renders empty state when no messages exist', () => {
    render(<MessageList messages={[]} onSpeakMessage={() => {}} isSpeaking={false} />);
    expect(screen.getByText('Conversation is ready')).toBeInTheDocument();
  });

  it('renders messages with correct sender attribution', () => {
    const sampleMessages: Message[] = [
      { id: '1', sender: 'signer', text: 'Where is the fee counter?', timestamp: Date.now() },
      { id: '2', sender: 'reply', text: 'It is in Room 104.', timestamp: Date.now() + 1000 },
    ];

    render(<MessageList messages={sampleMessages} onSpeakMessage={() => {}} isSpeaking={false} />);
    expect(screen.getByText('Where is the fee counter?')).toBeInTheDocument();
    expect(screen.getByText('It is in Room 104.')).toBeInTheDocument();
    expect(screen.getByText('Signer (Student / Visitor)')).toBeInTheDocument();
    expect(screen.getByText('Desk Operator (Reply)')).toBeInTheDocument();
  });
});

describe('ProposalComposer', () => {
  it('enables Confirm & Send button only when text is present', () => {
    const onSend = vi.fn();
    const onClear = vi.fn();
    const onChange = vi.fn();

    const { rerender } = render(
      <ProposalComposer
        proposalText=""
        onChangeProposal={onChange}
        onConfirmSend={onSend}
        onClear={onClear}
      />
    );

    const sendBtn = screen.getByRole('button', { name: /confirm & send message/i });
    expect(sendBtn).toBeDisabled();

    rerender(
      <ProposalComposer
        proposalText="Namaste"
        onChangeProposal={onChange}
        onConfirmSend={onSend}
        onClear={onClear}
      />
    );

    expect(sendBtn).not.toBeDisabled();
    fireEvent.click(sendBtn);
    expect(onSend).toHaveBeenCalledWith('Namaste');
  });
});

describe('FingerspellingAid', () => {
  it('calls onInsertChar when a numeral chip is clicked', () => {
    const onInsert = vi.fn();
    const onBackspace = vi.fn();
    const onClear = vi.fn();

    render(
      <FingerspellingAid
        onInsertChar={onInsert}
        onBackspace={onBackspace}
        onClear={onClear}
      />
    );

    const num1 = screen.getByRole('button', { name: 'Insert number 1' });
    fireEvent.click(num1);
    expect(onInsert).toHaveBeenCalledWith('1');
  });
});

describe('Dialog', () => {
  it('renders title and children when open', () => {
    render(
      <Dialog isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </Dialog>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Dialog isOpen={false} onClose={() => {}} title="Hidden Modal">
        <div>Hidden Content</div>
      </Dialog>
    );

    expect(container.firstChild).toBeNull();
  });
});
