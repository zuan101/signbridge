import React, { useState, useEffect, useCallback } from 'react';
import { SettingsProvider, useSettings } from './features/settings/SettingsContext';
import { ToastProvider, useToast } from './components/ui/Toast';
import { LiveWorkspace } from './features/conversation/LiveWorkspace';
import { LearnSignsView } from './features/vocabulary/LearnSignsView';
import { HistoryView } from './features/history/HistoryView';
import { SettingsView } from './features/settings/SettingsView';
import { BrandLogo } from './components/ui/BrandLogo';
import { LiveRegion } from './components/ui/LiveRegion';
import { KeyboardHelpDialog } from './components/ui/KeyboardHelpDialog';
import { saveSession } from './features/history/historyStore';
import type { ConversationSession } from './features/conversation/types';
import { SignTextLanding } from './features/website/SignTextLanding';
import { LoginPage } from './features/website/LoginPage';
import { SignUpPage } from './features/website/SignUpPage';
import { 
  MessageSquare, BookOpen, Clock, Settings, HelpCircle, Shield, Sparkles, Home 
} from 'lucide-react';

// Top-level page routing
type AppPage = 'landing' | 'login' | 'signup' | 'app';

type NavigationTab = 'live' | 'learn' | 'history' | 'settings';

function createNewSession(): ConversationSession {
  return {
    id: Math.random().toString(36).substring(2, 9),
    title: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

const SignBridgeAppInner: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<NavigationTab>('live');
  const [currentSession, setCurrentSession] = useState<ConversationSession>(createNewSession);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('Welcome to SignBridge');
  const [activeSignToPractice, setActiveSignToPractice] = useState<string | null>(null);

  // Available speech synthesis voices
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  // Available media devices
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setCameraDevices(devices.filter(d => d.kind === 'videoinput'));
      }).catch(err => console.warn('Could not list media devices:', err));
    }
  }, []);

  const handleNewSession = useCallback(() => {
    if (currentSession.messages.length > 0 && settings.saveTranscripts) {
      saveSession(currentSession);
    }
    const nextSession = createNewSession();
    setCurrentSession(nextSession);
    showToast('New conversation started and previous session saved', 'info');
    setLiveAnnouncement('New conversation session started');
  }, [currentSession, settings.saveTranscripts, showToast]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger navigation shortcuts if typing in text inputs or textareas
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsHelpOpen(prev => !prev);
      } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('live');
        setLiveAnnouncement('Switched to Live Conversation');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setActiveTab('learn');
        setLiveAnnouncement('Switched to Learn Signs');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        setActiveTab('history');
        setLiveAnnouncement('Switched to Conversation History');
      } else if (e.altKey && e.key === '4') {
        e.preventDefault();
        setActiveTab('settings');
        setLiveAnnouncement('Switched to Application Settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleContinueConversation = (session: ConversationSession) => {
    setCurrentSession(session);
    setActiveTab('live');
    setLiveAnnouncement(`Continued conversation from ${new Date(session.createdAt).toLocaleDateString()}`);
  };

  const handlePracticeSign = (signName: string) => {
    setActiveSignToPractice(signName);
    setActiveTab('live');
    setLiveAnnouncement(`Practicing sign: ${signName}`);
  };

  return (
    <div className="app-container">
      {/* Skip to Content accessible link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Screen Reader Announcements */}
      <LiveRegion message={liveAnnouncement} />

      {/* DESKTOP SIDEBAR */}
      <aside className="sidebar" aria-label="Main Navigation">
        <div className="brand-section">
          <BrandLogo size={38} />
          <div>
            <div className="brand-title">SignBridge</div>
            <div className="brand-tagline">Every gesture understood</div>
          </div>
        </div>

        <nav className="nav-menu" aria-label="Primary tabs">
          <button
            type="button"
            className={`nav-item ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
            aria-current={activeTab === 'live' ? 'page' : undefined}
          >
            <MessageSquare size={18} />
            <span>Live Conversation</span>
            {currentSession.messages.length > 0 && (
              <span className="nav-badge">{currentSession.messages.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
            aria-current={activeTab === 'learn' ? 'page' : undefined}
          >
            <BookOpen size={18} />
            <span>Learn Signs (ISL)</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            aria-current={activeTab === 'history' ? 'page' : undefined}
          >
            <Clock size={18} />
            <span>Past History</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            aria-current={activeTab === 'settings' ? 'page' : undefined}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="privacy-badge">
            <Shield size={14} color="var(--terracotta)" />
            <span>Zero-Knowledge: Local Vision</span>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', color: 'var(--sand)', justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
            onClick={() => setIsHelpOpen(true)}
            aria-label="Open keyboard shortcuts help"
          >
            <HelpCircle size={16} />
            <span>Shortcuts &amp; Help (?)</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', color: 'var(--sand)', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', borderTop: '1px solid rgba(238,220,197,0.12)', marginTop: '0.25rem' }}
            onClick={onGoHome}
            aria-label="Return to SignText Home page"
          >
            <Home size={16} />
            <span>← SignText Home</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="mobile-tab-bar" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`mobile-tab-item ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          <MessageSquare size={20} />
          <span>Live</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-item ${activeTab === 'learn' ? 'active' : ''}`}
          onClick={() => setActiveTab('learn')}
        >
          <BookOpen size={20} />
          <span>Learn</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={20} />
          <span>History</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </nav>

      {/* MAIN STAGE */}
      <main id="main-content" className="main-stage">
        {/* Top Header Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <BrandLogo size={28} />
            <h1 className="page-title">
              {activeTab === 'live' && 'Live ISL Conversation Desk'}
              {activeTab === 'learn' && 'Indian Sign Language (ISL) Verified Corpus'}
              {activeTab === 'history' && 'Local Session History'}
              {activeTab === 'settings' && 'System Settings & Accessibility'}
            </h1>
          </div>

          <div className="top-bar-actions">
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--sand)',
                color: 'var(--chocolate)',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={13} color="var(--terracotta)" />
              <span>ISL Hacktofest</span>
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={() => setIsHelpOpen(true)}
              title="Keyboard shortcuts & accessibility (?)"
              aria-label="Keyboard shortcuts and accessibility help"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        {/* Tab Content Panes */}
        {activeTab === 'live' && (
          <LiveWorkspace
            currentSession={currentSession}
            setCurrentSession={setCurrentSession}
            onNewSession={handleNewSession}
            activeSignToPractice={activeSignToPractice}
            onClearPracticeSign={() => setActiveSignToPractice(null)}
          />
        )}

        {activeTab === 'learn' && (
          <LearnSignsView onPracticeSign={handlePracticeSign} />
        )}

        {activeTab === 'history' && (
          <HistoryView onContinueConversation={handleContinueConversation} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            cameraDevices={cameraDevices}
            activeCameraDeviceId={settings.cameraDeviceId}
            onSelectCameraDevice={id => updateSettings({ cameraDeviceId: id })}
            availableVoices={availableVoices}
          />
        )}
      </main>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardHelpDialog
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};

// Root router: Landing → Login/SignUp → App workspace
export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('landing');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const goToApp = () => setCurrentPage('app');
  const goToLogin = () => setCurrentPage('login');
  const goToSignUp = () => setCurrentPage('signup');
  const goToHome = () => setCurrentPage('landing');
  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  if (currentPage === 'landing') {
    return (
      <SignTextLanding
        onNavigateToApp={goToApp}
        onNavigateToLogin={goToLogin}
        onNavigateToSignUp={goToSignUp}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onNavigateToApp={goToApp}
        onNavigateToSignUp={goToSignUp}
        onNavigateToHome={goToHome}
      />
    );
  }

  if (currentPage === 'signup') {
    return (
      <SignUpPage
        onNavigateToApp={goToApp}
        onNavigateToLogin={goToLogin}
        onNavigateToHome={goToHome}
      />
    );
  }

  // Main SignBridge/SignText workspace
  return (
    <SettingsProvider>
      <ToastProvider>
        <SignBridgeAppWithHome onGoHome={goToHome} />
      </ToastProvider>
    </SettingsProvider>
  );
}

// Thin wrapper that passes a home button callback into the sidebar
const SignBridgeAppWithHome: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
  // Re-use the full SignBridgeApp but inject the home button via a wrapper layer
  return <SignBridgeAppInner onGoHome={onGoHome} />;
};
