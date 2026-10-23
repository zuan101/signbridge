import React, { useState, useEffect } from 'react';
import type { ConversationSession } from '../conversation/types';
import { getAllSessions, deleteSession, clearAllHistory } from './historyStore';
import { Search, Trash2, Download, Copy, PlayCircle, Clock, Shield, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '../../lib/time';
import { copyToClipboard, downloadTextFile } from '../../lib/clipboard';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';

interface HistoryViewProps {
  onContinueConversation: (session: ConversationSession) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onContinueConversation }) => {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<ConversationSession | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const { showToast } = useToast();

  const loadSessions = () => {
    setSessions(getAllSessions());
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
    loadSessions();
    if (selectedSession?.id === id) {
      setSelectedSession(null);
    }
    showToast('Conversation deleted from local history', 'info');
  };

  const handleClearAll = () => {
    clearAllHistory();
    loadSessions();
    setSelectedSession(null);
    setConfirmClearAll(false);
    showToast('All conversation history cleared', 'info');
  };

  const handleCopyTranscript = (session: ConversationSession) => {
    const text = session.messages
      .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender === 'signer' ? 'Signer' : 'Desk'}: ${m.text}`)
      .join('\n');
    copyToClipboard(text);
    showToast('Transcript copied to clipboard', 'success');
  };

  const handleExportTxt = (session: ConversationSession) => {
    const text = `SignBridge Conversation Transcript\nSession ID: ${session.id}\nCreated: ${formatDateTime(session.createdAt)}\n\n` +
      session.messages
        .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender === 'signer' ? 'Signer' : 'Desk'}: ${m.text}`)
        .join('\n');
    downloadTextFile(`signbridge-transcript-${session.id.substring(0, 8)}.txt`, text);
    showToast('Transcript exported as .txt', 'success');
  };

  const filteredSessions = sessions.filter(s => {
    const textMatch = s.messages.some(m => m.text.toLowerCase().includes(search.toLowerCase()));
    const titleMatch = s.title.toLowerCase().includes(search.toLowerCase());
    return textMatch || titleMatch;
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--chocolate)' }}>
            Conversation History
          </h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Local, text-only records stored exclusively on this device.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            type="button"
            className="btn btn-danger"
            style={{ fontSize: '0.85rem' }}
            onClick={() => setConfirmClearAll(true)}
          >
            <Trash2 size={16} />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Privacy Notice */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--sand)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--brown)',
        }}
      >
        <Shield size={16} color="var(--terracotta)" />
        <span>Transcripts are stored locally in browser storage. Nothing is synchronized or stored on cloud servers.</span>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search
          size={18}
          color="var(--muted-text)"
          style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          className="form-input"
          style={{ width: '100%', paddingLeft: '2.5rem' }}
          placeholder="Search within past conversations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search conversation history"
        />
      </div>

      {/* Session List */}
      {filteredSessions.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--cream)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--muted-text)',
          }}
        >
          <Clock size={40} strokeWidth={1.5} color="var(--sand)" />
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--chocolate)', marginTop: '1rem', fontSize: '1.2rem' }}>
            No saved conversations found
          </h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.35rem', maxWidth: '360px', margin: '0.5rem auto 0' }}>
            {search ? 'Try adjusting your search keywords.' : 'Active conversations will be automatically saved here when you start a new session.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filteredSessions.map(session => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              style={{
                backgroundColor: 'var(--cream)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted-text)' }}>
                  {formatDateTime(session.createdAt)} • {session.messages.length} messages
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  style={{ color: 'var(--brick)', padding: '0.25rem' }}
                  onClick={e => handleDelete(session.id, e)}
                  title="Delete conversation"
                  aria-label="Delete this session"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--chocolate)', marginBottom: '0.35rem' }}>
                {session.title || 'Desk Consultation'}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--brown)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Latest: "{session.messages[session.messages.length - 1]?.text || 'No messages'}"
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <Dialog
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={selectedSession.title || 'Conversation Detail'}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onContinueConversation(selectedSession);
                  setSelectedSession(null);
                  showToast('Conversation loaded into live workspace', 'success');
                }}
              >
                <PlayCircle size={16} />
                <span>Continue this Conversation</span>
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleCopyTranscript(selectedSession)}
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleExportTxt(selectedSession)}
                >
                  <Download size={16} />
                  <span>Export</span>
                </button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxHeight: '55vh', overflowY: 'auto' }}>
            {selectedSession.messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: msg.sender === 'signer' ? 'var(--ivory)' : 'var(--sand)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted-text)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span>{msg.sender === 'signer' ? 'Signer' : 'Desk Operator'}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--chocolate)' }}>{msg.text}</div>
              </div>
            ))}
          </div>
        </Dialog>
      )}

      {/* Confirm Clear All Dialog */}
      <Dialog
        isOpen={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        title="Clear All Conversation History?"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmClearAll(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClearAll}
            >
              Yes, Clear All
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <AlertTriangle size={24} color="var(--brick)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.95rem', color: 'var(--chocolate)' }}>
            Are you sure you want to delete all saved conversations? This action permanently removes stored transcripts from this browser and cannot be undone.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
