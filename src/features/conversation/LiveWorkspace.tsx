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
import { ISLGeometricClassifier } from '../recognition/adapters/ISLGeometricClassifier';
import { ManualDemoSource } from '../recognition/adapters/ManualDemoSource';
import { TemporalBuffer } from '../recognition/temporalSmoothing';
import { saveSession } from '../history/historyStore';
import { copyToClipboard, downloadTextFile } from '../../lib/clipboard';
import { Maximize2, Copy, Download, RefreshCw, Trash2, Video, MessageSquare, AlertTriangle } from 'lucide-react';
import type { HandLandmarks } from '../tracking/types';
import type { PredictionResult } from '../recognition/types';

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
  const { settings } = useSettings();
  const { showToast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [proposalText, setProposalText] = useState<string>('');
  const [detectedLabel, setDetectedLabel] = useState<string | null>(null);
  const [activeConfidence, setActiveConfidence] = useState<number | null>(null);
  const [isLargeDisplayOpen, setIsLargeDisplayOpen] = useState<boolean>(false);
  const [confirmClearChat, setConfirmClearChat] = useState<boolean>(false);

  // Classifiers & Smoothing Buffer
  const geometricClassifierRef = useRef(new ISLGeometricClassifier());
  const manualDemoRef = useRef(new ManualDemoSource());
  const temporalBufferRef = useRef(new TemporalBuffer(6, settings.stabilityFrames, settings.confidenceThreshold));

  // Sync temporal buffer config with settings
  useEffect(() => {
    temporalBufferRef.current.updateConfig(settings.stabilityFrames, settings.confidenceThreshold);
  }, [settings.stabilityFrames, settings.confidenceThreshold]);

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
    async (landmarks: HandLandmarks[]) => {
      if (settings.recognitionMode === 'tracking-only') {
        setDetectedLabel(null);
        setActiveConfidence(null);
        return;
      }

      let rawPrediction: PredictionResult | null = null;

      if (settings.recognitionMode === 'isl-geometric') {
        rawPrediction = await geometricClassifierRef.current.predict(landmarks);
      } else if (settings.recognitionMode === 'demo-mode') {
        rawPrediction = await manualDemoRef.current.predict(landmarks);
      }

      // Smooth predictions across frames to eliminate jitter and repeated triggers
      const smoothed = temporalBufferRef.current.push(rawPrediction);

      if (smoothed) {
        setDetectedLabel(smoothed.label);
        setActiveConfidence(smoothed.confidence);
        setProposalText(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${smoothed.label}` : smoothed.label;
        });
      } else if (rawPrediction) {
        // Show active label HUD even during smoothing hold
        setDetectedLabel(rawPrediction.label);
        setActiveConfidence(rawPrediction.confidence);
      } else {
        setDetectedLabel(null);
        setActiveConfidence(null);
      }
    },
    [settings.recognitionMode]
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

  const handleConfirmSendSigner = (text: string) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'signer',
      text,
      timestamp: Date.now(),
      status: 'confirmed',
    };

    const updatedMessages = [...currentSession.messages, newMessage];
    const updatedSession = {
      ...currentSession,
      updatedAt: Date.now(),
      messages: updatedMessages,
      title: currentSession.title || text.substring(0, 30),
    };

    setCurrentSession(updatedSession);
    setProposalText('');
    setDetectedLabel(null);
    temporalBufferRef.current.reset();

    if (settings.saveTranscripts) {
      saveSession(updatedSession);
    }
    showToast('Signer message confirmed & sent', 'success');
  };

  const handleSendReply = (text: string) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'reply',
      text,
      timestamp: Date.now(),
      status: 'confirmed',
    };

    const updatedMessages = [...currentSession.messages, newMessage];
    const updatedSession = {
      ...currentSession,
      updatedAt: Date.now(),
      messages: updatedMessages,
      title: currentSession.title || text.substring(0, 30),
    };

    setCurrentSession(updatedSession);

    if (settings.saveTranscripts) {
      saveSession(updatedSession);
    }

    if (settings.speechEnabled) {
      speak(text);
    }
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
      .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender === 'signer' ? 'Signer' : 'Desk'}: ${m.text}`)
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
        .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender === 'signer' ? 'Signer' : 'Desk'}: ${m.text}`)
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
        />

        <ProposalComposer
          proposalText={proposalText}
          onChangeProposal={setProposalText}
          onConfirmSend={handleConfirmSendSigner}
          onClear={() => {
            setProposalText('');
            setDetectedLabel(null);
            temporalBufferRef.current.reset();
          }}
          activeConfidence={activeConfidence}
          detectedLabel={detectedLabel}
        />
      </section>

      {/* RIGHT PANEL: Two-Way Conversation Station */}
      <section className="conversation-panel" aria-label="Shared conversation thread and receptionist response">
        <div className="panel-header">
          <div className="panel-title">
            <MessageSquare size={18} color="var(--terracotta)" />
            <span>Shared Conversation</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)', fontWeight: 'normal' }}>
              ({currentSession.messages.length} messages)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
        />

        <ReplyComposer
          onSendReply={handleSendReply}
          quickReplies={settings.quickReplies}
          isSpeaking={isSpeaking}
          onStopSpeaking={stopSpeaking}
        />
      </section>

      {/* Large Counter Display Mode */}
      <LargeDisplayMode
        isOpen={isLargeDisplayOpen}
        onClose={() => setIsLargeDisplayOpen(false)}
        messages={currentSession.messages}
      />

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
            Are you sure you want to clear the messages in the current conversation?
          </p>
        </div>
      </Dialog>
    </div>
  );
};
