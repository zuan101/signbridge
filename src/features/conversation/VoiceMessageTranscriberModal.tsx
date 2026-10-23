import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Upload, 
  Play, 
  Pause, 
  Check, 
  Copy, 
  X, 
  FileAudio, 
  Sparkles, 
  Key, 
  RefreshCw, 
  AlertCircle,
  Volume2
} from 'lucide-react';
import { 
  decodeAudioMetadata, 
  transcribeWithWhisperAPI, 
  transcribeWithInBrowserWhisper,
  startLiveVoiceRecognition,
  isBrowserSpeechRecognitionSupported,
  SAMPLE_VOICE_PRESETS,
  type AudioMetadata,
  type SampleVoicePreset
} from '../speech/voiceTranscriber';
import { useToast } from '../../components/ui/Toast';
import { copyToClipboard } from '../../lib/clipboard';

interface VoiceMessageTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
  targetRole?: 'receptionist' | 'signer';
}

export const VoiceMessageTranscriberModal: React.FC<VoiceMessageTranscriberModalProps> = ({
  isOpen,
  onClose,
  onInsertText,
  targetRole = 'receptionist',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Transcription state
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [whisperKey, setWhisperKey] = useState<string>(() => {
    return localStorage.getItem('signbridge_whisper_key') || '';
  });
  const [whisperEndpoint, setWhisperEndpoint] = useState<string>('https://api.openai.com/v1/audio/transcriptions');

  // Live recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recognizerRef = useRef<any>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch (_) {}
      }
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setTranscriptionError(null);
    setSelectedFile(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const newUrl = URL.createObjectURL(file);
    setAudioUrl(newUrl);

    setIsDecoding(true);
    try {
      const meta = await decodeAudioMetadata(file);
      setMetadata(meta);
    } catch (err: any) {
      console.warn('Could not decode audio waveform:', err);
      setMetadata({
        name: file.name,
        sizeBytes: file.size,
        durationSeconds: 0,
        sampleRate: 44100,
        channels: 2,
        peaks: Array(32).fill(0.4),
      });
    } finally {
      setIsDecoding(false);
    }
  };

  const handleTranscribeUploadedFile = async () => {
    if (!selectedFile) {
      showToast('Please select or drop an audio file first', 'error');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionError(null);
    setProgressStatus('Initializing transcription engine...');

    // 1. If user supplied an API key (Groq or OpenAI), use cloud Whisper API
    if (whisperKey.trim()) {
      try {
        localStorage.setItem('signbridge_whisper_key', whisperKey.trim());
        setProgressStatus('Sending audio to Whisper API...');
        const result = await transcribeWithWhisperAPI(selectedFile, whisperKey.trim(), whisperEndpoint);
        setTranscribedText(result);
        showToast('Audio transcribed successfully with Whisper API!', 'success');
        return;
      } catch (err: any) {
        console.warn('Whisper API failed:', err);
        setTranscriptionError(err.message || 'Whisper API transcription failed.');
      } finally {
        setIsTranscribing(false);
        setProgressStatus(null);
      }
      return;
    }

    // 2. In-Browser Neural Whisper Engine (No API key needed!)
    try {
      setProgressStatus('Loading in-browser neural Whisper engine...');
      const result = await transcribeWithInBrowserWhisper(selectedFile, (status) => {
        setProgressStatus(status);
      });
      if (result) {
        setTranscribedText(result);
        showToast('Voice message transcribed successfully with in-browser AI!', 'success');
      } else {
        setTranscriptionError('No speech detected in this audio file.');
      }
    } catch (err: any) {
      console.warn('In-browser transcription failed:', err);
      setTranscriptionError(
        'Could not transcribe automatically in this environment. ' +
        'Please enter a free Groq Whisper key (gsk_...) below for instant cloud transcription, ' +
        'or use the "Record Voice Note" tab to speak directly into your microphone.'
      );
    } finally {
      setIsTranscribing(false);
      setProgressStatus(null);
    }
  };

  const handleApplyPreset = (preset: SampleVoicePreset) => {
    setTranscribedText(preset.text);
    showToast(`Loaded sample voice message: "${preset.title}"`, 'success');
  };

  const handleToggleLiveRecording = () => {
    if (isRecording) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch (_) {}
      }
      setIsRecording(false);
      showToast('Voice note recording stopped', 'info');
    } else {
      if (!isBrowserSpeechRecognitionSupported()) {
        showToast('Speech Recognition is not supported in this browser. Please use Chrome or Edge.', 'error');
        return;
      }
      setTranscriptionError(null);
      setIsRecording(true);
      const recognizer = startLiveVoiceRecognition({
        onResult: (text, isFinal) => {
          if (isFinal) {
            setTranscribedText(prev => prev ? `${prev} ${text}` : text);
          }
        },
        onError: (err) => {
          setTranscriptionError('Microphone recognition error: ' + err);
          setIsRecording(false);
        },
        onEnd: () => {
          setIsRecording(false);
        },
      });
      recognizerRef.current = recognizer;
      showToast('Listening... Speak your voice message clearly into the microphone.', 'info');
    }
  };

  const handleInsert = () => {
    if (!transcribedText.trim()) {
      showToast('No transcribed text to insert', 'error');
      return;
    }
    onInsertText(transcribedText.trim());
    showToast('Voice message text inserted into message composer!', 'success');
    onClose();
  };

  const handleCopy = async () => {
    if (!transcribedText.trim()) return;
    const ok = await copyToClipboard(transcribedText.trim());
    if (ok) showToast('Transcribed text copied to clipboard!', 'success');
  };

  return (
    <div 
      className="modal-overlay" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="voice-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(56, 33, 22, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem',
      }}
    >
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--cream)',
          border: '2px solid var(--terracotta)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(56, 33, 22, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--sand)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div 
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'var(--terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ivory)',
              }}
            >
              <Mic size={18} />
            </div>
            <div>
              <h2 id="voice-modal-title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--chocolate)' }}>
                Voice Message to Text Converter
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                Input audio files or record voice notes • Converts to {targetRole} reply
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-icon"
            onClick={onClose}
            aria-label="Close voice message converter"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div 
          style={{
            display: 'flex',
            backgroundColor: 'var(--sand)',
            borderBottom: '1px solid var(--border)',
            padding: '0 1rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'upload' ? 'var(--terracotta)' : 'var(--muted-text)',
              borderBottom: activeTab === 'upload' ? '2px solid var(--terracotta)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Upload size={15} />
            <span>Upload Voice File (.mp3, .wav, .m4a)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('record')}
            style={{
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'record' ? 'var(--terracotta)' : 'var(--muted-text)',
              borderBottom: activeTab === 'record' ? '2px solid var(--terracotta)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Mic size={15} />
            <span>Record Voice Note</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeTab === 'upload' && (
            <div>
              {/* File Dropzone */}
              <label
                style={{
                  border: '2px dashed var(--terracotta)',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(185, 78, 47, 0.04)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div 
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(185, 78, 47, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--terracotta)',
                  }}
                >
                  <FileAudio size={22} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--chocolate)' }}>
                    Click to select a voice message file
                  </strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-text)', margin: '0.2rem 0 0' }}>
                    Supports MP3, WAV, M4A, WEBM, OGG, or AAC voice recordings
                  </p>
                </div>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac,.flac"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileChange(f);
                  }}
                />
              </label>

              {/* Uploaded File Info & Waveform Preview */}
              {selectedFile && (
                <div 
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--sand)',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--chocolate)' }}>
                      <FileAudio size={16} color="var(--terracotta)" />
                      <span>{selectedFile.name}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • {metadata ? `${metadata.durationSeconds.toFixed(1)}s` : 'Analyzing...'}
                    </span>
                  </div>

                  {/* Waveform Visualization Bars */}
                  <div 
                    style={{
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '4px 0',
                    }}
                    title="Audio waveform preview"
                  >
                    {(metadata?.peaks || Array(32).fill(0.4)).map((p, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${Math.max(12, p * 100)}%`,
                          backgroundColor: isPlaying ? 'var(--terracotta)' : 'var(--burnt-orange)',
                          borderRadius: '2px',
                          opacity: isPlaying ? 0.9 : 0.6,
                          transition: 'height 0.1s ease',
                        }}
                      />
                    ))}
                  </div>

                  {/* Native Audio Player */}
                  {audioUrl && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <audio 
                        ref={audioRef} 
                        src={audioUrl} 
                        style={{ width: '100%', height: '32px' }} 
                        controls
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    </div>
                  )}

                  {/* Transcribe Button & Progress Status */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleTranscribeUploadedFile}
                      disabled={isTranscribing || isDecoding}
                      style={{ height: '40px', gap: '0.4rem', fontWeight: 600 }}
                    >
                      {isTranscribing ? (
                        <>
                          <RefreshCw size={15} className="spin" />
                          <span>{progressStatus || 'Transcribing Voice Audio...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>Convert Voice File to Text</span>
                        </>
                      )}
                    </button>
                    {isTranscribing && progressStatus && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--terracotta)', textAlign: 'center', fontWeight: 500 }}>
                        {progressStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Sample Voice Message Presets */}
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--chocolate)', display: 'block', marginBottom: '0.35rem' }}>
                  Or test with sample campus voice messages:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {SAMPLE_VOICE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="chip"
                      onClick={() => handleApplyPreset(preset)}
                      style={{ fontSize: '0.75rem' }}
                      title={`"${preset.text}"`}
                    >
                      <Volume2 size={12} />
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'record' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
              <div 
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: isRecording ? 'rgba(184, 64, 50, 0.15)' : 'rgba(185, 78, 47, 0.10)',
                  border: isRecording ? '3px solid var(--brick)' : '2px dashed var(--terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isRecording ? 'var(--brick)' : 'var(--terracotta)',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={handleToggleLiveRecording}
              >
                <Mic size={32} />
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--chocolate)' }}>
                {isRecording ? 'Listening & Transcribing...' : 'Record Voice Note with Microphone'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-text)', margin: '0 0 1rem', textAlign: 'center', maxWidth: '380px' }}>
                {isRecording 
                  ? 'Speak clearly into your microphone. Your words are transcribed live into text below.' 
                  : 'Click the button below to start voice recording. Zero video or audio data is ever uploaded to external servers.'
                }
              </p>

              <button
                type="button"
                className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleToggleLiveRecording}
                style={{ height: '42px', padding: '0 1.5rem', gap: '0.5rem' }}
              >
                {isRecording ? (
                  <>
                    <Pause size={16} />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Start Voice Recording</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Optional Whisper API Key Accordion */}
          <details 
            style={{
              backgroundColor: 'var(--sand)',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '0.8rem',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--chocolate)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={14} color="var(--terracotta)" />
              <span>Optional: Whisper Cloud API Key (for instant server-grade transcription)</span>
            </summary>
            <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                If provided, uploaded voice files are transcribed with OpenAI or Groq Whisper models:
              </p>
              <input
                type="password"
                className="input"
                placeholder="sk-... or gsk_... (stored locally in browser)"
                value={whisperKey}
                onChange={(e) => setWhisperKey(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              />
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Endpoint URL"
                  value={whisperEndpoint}
                  onChange={(e) => setWhisperEndpoint(e.target.value)}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', flex: 1 }}
                />
              </div>
            </div>
          </details>

          {/* Transcription Error Message */}
          {transcriptionError && (
            <div 
              style={{
                padding: '0.6rem 0.8rem',
                backgroundColor: 'rgba(184, 64, 50, 0.1)',
                border: '1px solid var(--brick)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--brick)',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{transcriptionError}</span>
            </div>
          )}

          {/* Transcribed Text Result Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--chocolate)' }}>
                Transcribed Text Result
              </label>
              {transcribedText && (
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={() => setTranscribedText('')}
                  title="Clear text"
                  style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <textarea
              className="textarea"
              rows={3}
              placeholder="Converted speech text will appear here. You can also edit it before inserting into the message composer..."
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              style={{
                fontSize: '0.9rem',
                lineHeight: 1.45,
                backgroundColor: 'var(--ivory)',
                borderColor: transcribedText ? 'var(--terracotta)' : 'var(--border)',
              }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div 
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--sand)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopy}
            disabled={!transcribedText.trim()}
            style={{ gap: '0.4rem' }}
          >
            <Copy size={15} />
            <span>Copy Text</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleInsert}
              disabled={!transcribedText.trim()}
              style={{ gap: '0.4rem' }}
            >
              <Check size={16} />
              <span>Insert into Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
