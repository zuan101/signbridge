import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, ConversationSession } from './types';
import { useCamera } from '../camera/useCamera';
import { useHandTracker } from '../tracking/useHandTracker';
import { useSettings } from '../settings/SettingsContext';
import { useSpeech } from '../speech/useSpeech';
import { useToast } from '../../components/ui/Toast';
import { CameraPreview } from '../camera/CameraPreview';
import { ProposalComposer } from './ProposalComposer';
import { MessageList } from './MessageList';
import { ReplyComposer } from './ReplyComposer';
import { LargeDisplayMode } from './LargeDisplayMode';
import { Dialog } from '../../components/ui/Dialog';
import { ISLFingerspellingClassifier } from '../recognition/adapters/ISLFingerspellingClassifier';
import { ISLNumbersClassifier } from '../recognition/adapters/ISLNumbersClassifier';
import { ISLPhrasesClassifier } from '../recognition/adapters/ISLPhrasesClassifier';
import { ManualDemoSource } from '../recognition/adapters/ManualDemoSource';
import { TemporalBuffer } from '../recognition/temporalSmoothing';
import { WordBuilder } from '../recognition/WordBuilder';
import { GestureGuideModal } from './GestureGuideModal';
import { saveSession } from '../history/historyStore';
import { copyToClipboard, downloadTextFile } from '../../lib/clipboard';
import { fetchAIStatus, sendChatMessage, normalizeMessageText, type AIStatus } from './aiClient';
import { 
  Maximize2, 
  Copy, 
  Download, 
  RefreshCw, 
  Trash2, 
  Video, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import type { HandLandmarks } from '../tracking/types';
import type { PredictionResult } from '../recognition/types';
import type { RecognitionMode } from '../settings/types';

interface LiveWorkspaceProps {
  currentSession: ConversationSession;
  setCurrentSession: React.Dispatch<React.SetStateAction<ConversationSession>>;
  onNewSession: () => void;
  activeSignToPractice?: string | null;
  onClearPracticeSign?: () => void;
}

export const LiveWorkspace: React.FC<LiveWorkspaceProps> = ({
  currentSession,
  setCurrentSession,
  onNewSession,
  activeSignToPractice,
  onClearPracticeSign,
}) => {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [proposalText, setProposalText] = useState<string>('');
  const [currentWord, setCurrentWord] = useState<string>('');
  const [detectedLabel, setDetectedLabel] = useState<string | null>(null);
  const [activeConfidence, setActiveConfidence] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [holdLetter, setHoldLetter] = useState<string | null>(null);
  const [isLargeDisplayOpen, setIsLargeDisplayOpen] = useState<boolean>(false);
  const [confirmClearChat, setConfirmClearChat] = useState<boolean>(false);
  const [isGestureGuideOpen, setIsGestureGuideOpen] = useState<boolean>(false);
  const [isAiSetupOpen, setIsAiSetupOpen] = useState<boolean>(false);

  // Chatbot State
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus>({
    configured: true,
    provider: 'SignBridge Assistant',
    model: 'Built-in Knowledge Engine',
    isBuiltin: true,
    message: 'SignBridge Assistant is active and ready (no API key required).',
  });

  // Classifiers, smoothing, and word builder
  const fingerspellingRef = useRef(new ISLFingerspellingClassifier());
  const numbersRef = useRef(new ISLNumbersClassifier());
  const phrasesRef = useRef(new ISLPhrasesClassifier());
  const manualDemoRef = useRef(new ManualDemoSource());
  // Fingerspelling/Numbers temporal smoothing
  const temporalBufferRef = useRef(new TemporalBuffer(5, settings.stabilityFrames, settings.confidenceThreshold, 700));
  // WordBuilder with 280ms hold-to-confirm, 1500ms word pause
  const wordBuilderRef = useRef(new WordBuilder(280, 1500));

  // Sync temporal buffer config with settings
  useEffect(() => {
    temporalBufferRef.current.updateConfig(settings.stabilityFrames, settings.confidenceThreshold);
  }, [settings.stabilityFrames, settings.confidenceThreshold]);

  // Check assistant status on mount
  const checkAI = useCallback(async () => {
    const status = await fetchAIStatus();
    setAiStatus(status);
  }, []);

  useEffect(() => {
    checkAI();
  }, [checkAI]);

  // Camera hook
  const {
    status: cameraStatus,
    isStreaming,
    error: cameraError,
    videoRef,
    startCamera,
    stopCamera,
  } = useCamera(settings.cameraDeviceId);

  // Speech synthesis hook
  const { isSpeaking, speak, stopSpeaking } = useSpeech({
    rate: settings.speechRate,
    pitch: settings.speechPitch,
    voiceUri: settings.speechVoiceUri,
    enabled: settings.speechEnabled,
  });

  // Main frame inference handler
  const handleFrame = useCallback(
    async (landmarks: HandLandmarks[], handedness: string[] = []) => {
      if (settings.recognitionMode === 'tracking-only') {
        setDetectedLabel(null);
        setActiveConfidence(null);
        setHoldProgress(0);
        setHoldLetter(null);
        return;
      }

      let rawPrediction: PredictionResult | null = null;
      const handPresent = landmarks.length > 0;

      if (settings.recognitionMode === 'isl-fingerspelling') {
        rawPrediction = await fingerspellingRef.current.predict(landmarks, handedness);
      } else if (settings.recognitionMode === 'isl-numbers') {
        rawPrediction = await numbersRef.current.predict(landmarks, handedness);
      } else if (settings.recognitionMode === 'isl-phrases' || settings.recognitionMode === 'isl-geometric') {
        rawPrediction = await phrasesRef.current.predict(landmarks, handedness);
      } else if (settings.recognitionMode === 'demo-mode') {
        rawPrediction = await manualDemoRef.current.predict(landmarks);
      }

      if (settings.recognitionMode === 'isl-fingerspelling' || settings.recognitionMode === 'isl-numbers') {
        // Word & Digits building mode with Hold-to-Confirm
        const candidate = rawPrediction ? rawPrediction.label : null;
        const wbStatus = wordBuilderRef.current.push(candidate, handPresent);

        setProposalText(prev => prev !== wbStatus.text ? wbStatus.text : prev);
        setCurrentWord(prev => prev !== wbStatus.currentWord ? wbStatus.currentWord : prev);
        setHoldProgress(wbStatus.holdProgress);
        setHoldLetter(wbStatus.holdLetter);

        if (wbStatus.justCommittedLetter) {
          showToast(`Added: "${wbStatus.justCommittedLetter}"`, 'info');
        }

        // Update HUD label
        if (rawPrediction) {
          const nextLabel = rawPrediction.label;
          const nextConf = Math.round(rawPrediction.confidence * 100) / 100;
          setDetectedLabel(prev => (prev !== nextLabel ? nextLabel : prev));
          setActiveConfidence(prev => (prev !== nextConf ? nextConf : prev));
        } else {
          setDetectedLabel(null);
          setActiveConfidence(null);
        }
      } else {
        // Conversational Whole Phrases / Demo Mode
        setHoldProgress(0);
        setHoldLetter(null);
        const smoothed = temporalBufferRef.current.push(rawPrediction);

        if (smoothed) {
          setDetectedLabel(prev => (prev !== smoothed.label ? smoothed.label : prev));
          setActiveConfidence(prev => (prev !== smoothed.confidence ? smoothed.confidence : prev));
          setProposalText(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${smoothed.label}` : smoothed.label;
          });
          showToast(`Phrase detected: "${smoothed.label}"`, 'success');
        } else if (rawPrediction) {
          const nextLabel = rawPrediction.label;
          const nextConf = Math.round(rawPrediction.confidence * 100) / 100;
          setDetectedLabel(prev => (prev !== nextLabel ? nextLabel : prev));
          setActiveConfidence(prev => (prev !== nextConf ? nextConf : prev));
        } else {
          setDetectedLabel(null);
          setActiveConfidence(null);
        }
      }
    },
    [settings.recognitionMode, showToast]
  );

  // Hand tracking hook
  const {
    status: trackerStatus,
    fps,
    detectedHandsCount,
  } = useHandTracker({
    videoRef,
    canvasRef,
    isStreaming,
    showLandmarks: settings.showLandmarks,
    onFrame: handleFrame,
  });

  // Practice sign trigger if requested from Learn Signs view
  useEffect(() => {
    if (activeSignToPractice) {
      if (!isStreaming) {
        startCamera();
      }
      showToast(`Practice mode: Showing "${activeSignToPractice}". Hold the sign in frame.`, 'info');
      onClearPracticeSign?.();
    }
  }, [activeSignToPractice, isStreaming, onClearPracticeSign, showToast, startCamera]);

  const toggleCamera = () => {
    if (isStreaming) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  /**
   * Submit a user message to the assistant and handle response.
   */
  const triggerAiConversation = useCallback(
    async (userMessageText: string, updatedSessionWithUser: ConversationSession) => {
      const cleanUserText = normalizeMessageText(userMessageText);
      if (!cleanUserText) return;

      setIsAiGenerating(true);
      setAiError(null);

      try {
        const aiResponse = await sendChatMessage(
          cleanUserText,
          updatedSessionWithUser.messages
        );

        const safeReply = normalizeMessageText(aiResponse?.reply || aiResponse);

        const aiMessage: Message = {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'assistant',
          text: safeReply,
          timestamp: Date.now(),
          status: 'confirmed',
        };

        const finalSession: ConversationSession = {
          ...updatedSessionWithUser,
          updatedAt: Date.now(),
          messages: [...updatedSessionWithUser.messages, aiMessage],
        };

        setCurrentSession(finalSession);

        if (settings.saveTranscripts) {
          saveSession(finalSession);
        }

        if (settings.speechEnabled) {
          speak(safeReply);
        }
      } catch (err: unknown) {
        const errorMsg = normalizeMessageText(err instanceof Error ? err.message : err);
        setAiError(errorMsg);
        showToast(errorMsg, 'warning');
      } finally {
        setIsAiGenerating(false);
      }
    },
    [setCurrentSession, settings.saveTranscripts, settings.speechEnabled, showToast, speak]
  );

  /**
   * Signer confirms recognized gesture text from the left panel composer.
   */
  const handleConfirmSendSigner = (text: string) => {
    const clean = normalizeMessageText(text);
    if (!clean || isAiGenerating) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'signer',
      text: clean,
      timestamp: Date.now(),
      status: 'confirmed',
    };

    const updatedSession: ConversationSession = {
      ...currentSession,
      updatedAt: Date.now(),
      messages: [...currentSession.messages, userMessage],
      title: currentSession.title || clean.substring(0, 30),
    };

    setCurrentSession(updatedSession);
    setProposalText('');
    setCurrentWord('');
    setDetectedLabel(null);
    setHoldProgress(0);
    setHoldLetter(null);
    temporalBufferRef.current.reset();
    wordBuilderRef.current.reset();

    if (settings.saveTranscripts) {
      saveSession(updatedSession);
    }
    showToast('Signer message sent', 'success');

    triggerAiConversation(clean, updatedSession);
  };

  /**
   * User sends a typed or quick-reply message from the right panel composer.
   */
  const handleUserSendMessage = (text: string) => {
    const clean = normalizeMessageText(text);
    if (!clean || isAiGenerating) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'signer',
      text: clean,
      timestamp: Date.now(),
      status: 'confirmed',
    };

    const updatedSession: ConversationSession = {
      ...currentSession,
      updatedAt: Date.now(),
      messages: [...currentSession.messages, userMessage],
      title: currentSession.title || clean.substring(0, 30),
    };

    setCurrentSession(updatedSession);

    if (settings.saveTranscripts) {
      saveSession(updatedSession);
    }

    triggerAiConversation(clean, updatedSession);
  };

  /**
   * Edit existing message in current session history.
   */
  const handleEditMessage = (id: string, newText: string) => {
    const clean = normalizeMessageText(newText);
    const updatedMessages = currentSession.messages.map(m =>
      m.id === id ? { ...m, text: clean, editedAt: Date.now() } : m
    );

    const updatedSession = {
      ...currentSession,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setCurrentSession(updatedSession);
    if (settings.saveTranscripts) {
      saveSession(updatedSession);
    }
    showToast('Message updated', 'info');
  };

  /**
   * Delete single message from current session history.
   */
  const handleDeleteMessage = (id: string) => {
    const updatedMessages = currentSession.messages.filter(m => m.id !== id);
    const updatedSession = {
      ...currentSession,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setCurrentSession(updatedSession);
    if (settings.saveTranscripts) {
      saveSession(updatedSession);
    }
    showToast('Message deleted', 'info');
  };

  /**
   * Retry generation for a given prompt.
   */
  const handleRetryAi = (promptText: string) => {
    const clean = normalizeMessageText(promptText);
    triggerAiConversation(clean, currentSession);
  };

  const handleTriggerDemoSign = (sign: string) => {
    manualDemoRef.current.setDemoSign(sign);
    setProposalText(prev => (prev.trim() ? `${prev.trim()} ${sign}` : sign));
    setDetectedLabel(sign);
    setActiveConfidence(1.0);
    showToast(`Simulation proposal added: "${sign}"`, 'info');
  };

  const handleCopyTranscript = () => {
    if (currentSession.messages.length === 0) {
      showToast('No messages to copy', 'warning');
      return;
    }
    const transcript = currentSession.messages
      .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender === 'signer' ? 'Signer' : 'Assistant'}: ${normalizeMessageText(m.text)}`)
      .join('\n');
    copyToClipboard(transcript);
    showToast('Transcript copied to clipboard', 'success');
  };

  const handleExportTxt = () => {
    if (currentSession.messages.length === 0) {
      showToast('No messages to export', 'warning');
      return;
    }
    const transcript = `SignBridge Conversation Transcript\nSession ID: ${currentSession.id}\nCreated: ${new Date(currentSession.createdAt).toLocaleString()}\n\n` +
      currentSession.messages
        .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender === 'signer' ? 'Signer' : 'Assistant'}: ${normalizeMessageText(m.text)}`)
        .join('\n');
    downloadTextFile(`signbridge-${currentSession.id.substring(0, 8)}.txt`, transcript);
    showToast('Transcript exported as .txt', 'success');
  };

  const handleClearCurrentChat = () => {
    setCurrentSession({
      ...currentSession,
      messages: [],
      updatedAt: Date.now(),
    });
    setAiError(null);
    setConfirmClearChat(false);
    showToast('Current conversation cleared', 'info');
  };

  return (
    <div className="split-workspace">
      {/* LEFT PANEL: Signer Input & Vision Station */}
      <section className="station-panel" aria-label="Signer camera input and proposal composer">
        <div className="panel-header">
          <div className="panel-title">
            <Video size={18} color="var(--terracotta)" />
            <span>Sign Input Station</span>
          </div>

          <button
            type="button"
            className={`btn ${isStreaming ? 'btn-danger' : 'btn-primary'}`}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
            onClick={toggleCamera}
          >
            {isStreaming ? 'Stop Camera' : 'Start Camera'}
          </button>
        </div>

        <CameraPreview
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraStatus={cameraStatus}
          cameraError={cameraError}
          trackerStatus={trackerStatus}
          fps={fps}
          detectedHandsCount={detectedHandsCount}
          isStreaming={isStreaming}
          mirrored={settings.mirrorPreview}
          onToggleCamera={toggleCamera}
          recognitionMode={settings.recognitionMode}
          onTriggerDemoSign={handleTriggerDemoSign}
          detectedLabel={detectedLabel}
          confidence={activeConfidence}
          holdProgress={holdProgress}
          holdLetter={holdLetter}
          onChangeMode={(mode: RecognitionMode) => updateSettings({ recognitionMode: mode })}
          onOpenGestureGuide={() => setIsGestureGuideOpen(true)}
        />

        <ProposalComposer
          proposalText={proposalText}
          currentWord={currentWord}
          onChangeProposal={(text) => {
            setProposalText(text);
            wordBuilderRef.current.set(text);
            setCurrentWord(wordBuilderRef.current.currentWord);
          }}
          onConfirmSend={handleConfirmSendSigner}
          onClear={() => {
            setProposalText('');
            setCurrentWord('');
            setDetectedLabel(null);
            setHoldProgress(0);
            setHoldLetter(null);
            temporalBufferRef.current.reset();
            wordBuilderRef.current.reset();
          }}
          onCompleteWord={(word) => {
            const next = wordBuilderRef.current.completeWord(word);
            setProposalText(next);
            setCurrentWord(wordBuilderRef.current.currentWord);
          }}
          onBackspace={() => {
            const next = wordBuilderRef.current.backspace();
            setProposalText(next);
            setCurrentWord(wordBuilderRef.current.currentWord);
          }}
          onAddSpace={() => {
            const next = wordBuilderRef.current.addSpace();
            setProposalText(next);
            setCurrentWord(wordBuilderRef.current.currentWord);
          }}
          activeConfidence={activeConfidence}
          detectedLabel={detectedLabel}
          holdProgress={holdProgress}
          holdLetter={holdLetter}
        />
      </section>

      {/* RIGHT PANEL: Conversational Panel */}
      <section className="conversation-panel" aria-label="Shared conversation thread and assistant response">
        <div className="panel-header">
          <div className="panel-title">
            <MessageSquare size={18} color="var(--terracotta)" />
            <span>Shared Conversation</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)', fontWeight: 'normal' }}>
              ({currentSession.messages.length} messages)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Assistant Status Indicator */}
            <button
              type="button"
              className="ai-status-badge online"
              onClick={() => setIsAiSetupOpen(true)}
              title={aiStatus.message}
              aria-label="Assistant Status: Active & Ready"
            >
              <span className="ai-status-dot" />
              <span>Assistant Active</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={() => setIsLargeDisplayOpen(true)}
              title="Large Counter Display Mode"
              aria-label="Open Large Display Mode"
            >
              <Maximize2 size={16} />
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={handleCopyTranscript}
              title="Copy Transcript"
              aria-label="Copy transcript"
            >
              <Copy size={16} />
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={handleExportTxt}
              title="Export as .txt"
              aria-label="Export transcript as text file"
            >
              <Download size={16} />
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
              onClick={onNewSession}
              title="Save current and start new conversation"
            >
              <RefreshCw size={13} />
              <span>New Session</span>
            </button>

            {currentSession.messages.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                style={{ color: 'var(--brick)' }}
                onClick={() => setConfirmClearChat(true)}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <MessageList
          messages={currentSession.messages}
          onSpeakMessage={speak}
          isSpeaking={isSpeaking}
          isAiGenerating={isAiGenerating}
          aiError={aiError}
          onRetryMessage={handleRetryAi}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />

        <ReplyComposer
          onSendReply={handleUserSendMessage}
          quickReplies={settings.quickReplies}
          isSpeaking={isSpeaking}
          onStopSpeaking={stopSpeaking}
          isAiGenerating={isAiGenerating}
        />
      </section>

      {/* Large Counter Display Mode */}
      <LargeDisplayMode
        isOpen={isLargeDisplayOpen}
        onClose={() => setIsLargeDisplayOpen(false)}
        messages={currentSession.messages}
      />

      {/* Assistant Guide & Quick Topics Dialog */}
      <Dialog
        isOpen={isAiSetupOpen}
        onClose={() => setIsAiSetupOpen(false)}
        title="SignBridge Communication Assistant"
        footer={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAiSetupOpen(false)}
          >
            Close
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--chocolate)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(91, 105, 50, 0.1)',
              border: '1.5px solid var(--olive)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <CheckCircle2 size={24} color="var(--olive)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                SignBridge Assistant is Active & Ready
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted-text)', marginTop: '0.15rem' }}>
                Runs 100% locally in your browser with zero API keys or external setup required.
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.88rem', lineHeight: 1.5, backgroundColor: 'var(--ivory)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div><strong>Engine:</strong> Built-in SignBridge Communication Knowledge Base</div>
            <p style={{ marginTop: '0.35rem', color: 'var(--brown)', fontSize: '0.82rem' }}>
              Communicates with fingerspelled words and typed questions in real time. Perfect for counter communication and sign practice.
            </p>
          </div>

          {/* Quick Example Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={14} color="var(--terracotta)" />
              <span>Try asking these example questions:</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                'What is SignBridge?',
                'How do I spell a word?',
                'What can you do?',
                'How does sign recognition work?',
                'Where is the fee counter?',
              ].map(q => (
                <button
                  key={q}
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    fontSize: '0.82rem',
                    padding: '0.4rem 0.75rem',
                  }}
                  onClick={() => {
                    setIsAiSetupOpen(false);
                    handleUserSendMessage(q);
                  }}
                >
                  <span>"{q}"</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--muted-text)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
              <HelpCircle size={13} />
              <span>Click any question to ask it directly in the conversation.</span>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Confirm Clear Conversation Dialog */}
      <Dialog
        isOpen={confirmClearChat}
        onClose={() => setConfirmClearChat(false)}
        title="Clear Current Conversation?"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmClearChat(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClearCurrentChat}
            >
              Yes, Clear
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <AlertTriangle size={24} color="var(--brick)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.95rem', color: 'var(--chocolate)' }}>
            Are you sure you want to clear all messages in the current conversation?
          </p>
        </div>
      </Dialog>

      {/* Visual Hand Gesture Guide Modal */}
      <GestureGuideModal
        isOpen={isGestureGuideOpen}
        onClose={() => setIsGestureGuideOpen(false)}
        onSelectMode={(mode) => updateSettings({ recognitionMode: mode })}
        activeMode={settings.recognitionMode}
      />
    </div>
  );
};
