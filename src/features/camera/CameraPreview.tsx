import React, { useState } from 'react';
import { Camera, CameraOff, Sparkles, RefreshCw, AlertCircle, Info, ShieldCheck, BookOpen } from 'lucide-react';
import type { CameraStatus } from './useCamera';
import type { TrackerStatus } from '../tracking/types';
import type { RecognitionMode } from '../settings/types';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraStatus: CameraStatus;
  cameraError: string | null;
  trackerStatus: TrackerStatus;
  fps: number;
  detectedHandsCount: number;
  isStreaming: boolean;
  mirrored: boolean;
  onToggleCamera: () => void;
  recognitionMode: RecognitionMode;
  detectedLabel?: string | null;
  confidence?: number | null;
  holdProgress?: number;
  holdLetter?: string | null;
  onChangeMode?: (mode: RecognitionMode) => void;
  onOpenGestureGuide?: () => void;
  onTriggerDemoSign?: (label: string) => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  canvasRef,
  cameraStatus,
  cameraError,
  trackerStatus,
  fps,
  detectedHandsCount,
  isStreaming,
  mirrored,
  onToggleCamera,
  recognitionMode,
  onTriggerDemoSign,
  detectedLabel,
  confidence,
  holdProgress = 0,
  holdLetter,
  onChangeMode,
  onOpenGestureGuide,
}) => {
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const demoSigns = [
    'Namaste / Hello',
    'Thank You',
    'Please Wait',
    'Where is Room?',
    'Fee Counter',
    'Number 1',
    'Number 2',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Viewport Box */}
      <div className="camera-viewport-wrapper">
        <video
          ref={videoRef}
          className={`camera-video ${mirrored ? 'mirrored' : ''}`}
          playsInline
          autoPlay
          muted
        />
        <canvas
          ref={canvasRef}
          className={`landmark-canvas ${mirrored ? 'mirrored' : ''}`}
        />

        {/* Overlay when Camera is Idle / Off */}
        {!isStreaming && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              textAlign: 'center',
              backgroundColor: '#27160E',
              color: 'var(--cream)',
              gap: '0.75rem',
            }}
          >
            <CameraOff size={44} color="var(--sand)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)' }}>
              Webcam is currently off
            </h3>
            <p style={{ maxWidth: '360px', fontSize: '0.85rem', color: 'var(--sand)' }}>
              Click Start Camera to begin hand tracking. Video frames are analyzed locally in-memory and are never uploaded or saved.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onToggleCamera}
              style={{ marginTop: '0.5rem' }}
            >
              <Camera size={18} />
              <span>Start Camera</span>
            </button>
          </div>
        )}

        {/* Persistent Camera Active Indicator */}
        {isStreaming && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(56, 33, 22, 0.85)',
              color: 'var(--cream)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--olive)',
                display: 'inline-block',
              }}
            />
            <Camera size={14} color="var(--sand)" />
            <span>Camera is ON</span>
          </div>
        )}

        {/* Live Tracking HUD */}
        {isStreaming && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(56, 33, 22, 0.85)',
              color: 'var(--cream)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <span>{fps > 0 ? `${fps} FPS` : 'Tracking...'}</span>
            <span>•</span>
            <span>{detectedHandsCount === 1 ? '1 Hand' : `${detectedHandsCount} Hands`}</span>
          </div>
        )}

        {/* Active Sign Result Pill with Hold Progress Meter */}
        {isStreaming && (detectedLabel || holdLetter) && (
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(40, 24, 16, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid var(--terracotta)',
              color: 'var(--cream)',
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.92rem',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              zIndex: 10,
            }}
          >
            {/* Circular Hold Progress Ring */}
            <div style={{ position: 'relative', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke={holdProgress >= 1 ? 'var(--olive)' : 'var(--terracotta)'}
                  strokeWidth="3.5"
                  strokeDasharray={81.68}
                  strokeDashoffset={81.68 * (1 - Math.max(0, Math.min(1, holdProgress)))}
                  strokeLinecap="round"
                  transform="rotate(-90 16 16)"
                  style={{ transition: 'stroke-dashoffset 50ms linear' }}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '0.8rem', fontWeight: 800, color: 'var(--cream)' }}>
                {holdLetter || detectedLabel}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '120px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} color="var(--sand)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--cream)', lineHeight: 1.1 }}>
                  {holdProgress > 0 && holdProgress < 1
                    ? `Hold '${holdLetter}' (${Math.round(holdProgress * 100)}%)`
                    : holdProgress >= 1
                    ? `Added '${holdLetter}'!`
                    : `Sign: ${detectedLabel}`}
                </span>
              </div>
              {confidence && (
                <span style={{ fontSize: '0.7rem', color: 'var(--sand)', opacity: 0.85, marginTop: '2px' }}>
                  {(confidence * 100).toFixed(0)}% confidence
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Mode Switcher Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.75rem',
          backgroundColor: 'var(--cream)',
          borderBottom: '1px solid var(--border)',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--chocolate)', marginRight: '0.2rem' }}>
            Mode:
          </span>
          <button
            type="button"
            className={`btn ${recognitionMode === 'isl-fingerspelling' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
            onClick={() => onChangeMode && onChangeMode('isl-fingerspelling')}
            title="Recognises Alphabet A-Z and forms words in real time"
          >
            🔤 Alphabet A–Z
          </button>
          <button
            type="button"
            className={`btn ${recognitionMode === 'isl-numbers' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
            onClick={() => onChangeMode && onChangeMode('isl-numbers')}
            title="Recognises Digits 0-9 and accumulates numerals"
          >
            🔢 Numbers 0–9
          </button>
          <button
            type="button"
            className={`btn ${recognitionMode === 'isl-phrases' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
            onClick={() => onChangeMode && onChangeMode('isl-phrases')}
            title="Recognises Namaste, Thank You, Help, Please Wait, etc."
          >
            👋 Greetings & Phrases
          </button>
        </div>

        {onOpenGestureGuide && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={onOpenGestureGuide}
            title="Open Visual Hand Gesture Cheat-Sheet"
          >
            <BookOpen size={13} color="var(--terracotta)" />
            <span>Visual Guide</span>
          </button>
        )}
      </div>

      {/* Camera Status Strip */}
      <div className="status-strip">
        <div className="status-group">
          {/* Camera status */}
          <span className={`status-pill ${isStreaming ? 'active' : 'neutral'}`}>
            <Camera size={12} />
            <span>Camera: {cameraStatus}</span>
          </span>

          {/* Tracking model status */}
          <span className={`status-pill ${trackerStatus === 'ready' ? 'active' : 'neutral'}`}>
            <RefreshCw size={12} />
            <span>Tracking: {trackerStatus}</span>
          </span>

          {/* Active Mode Pill */}
          <span className="status-pill active">
            <span>
              {
                recognitionMode === 'isl-fingerspelling'
                  ? 'ISL Alphabet (A–Z Words)'
                  : recognitionMode === 'isl-numbers'
                  ? 'ISL Numbers (0–9 Digits)'
                  : recognitionMode === 'isl-phrases'
                  ? 'ISL Greetings & Phrases'
                  : recognitionMode === 'isl-geometric'
                  ? 'ISL Conversational Signs'
                  : recognitionMode === 'demo-mode'
                  ? 'Demo / Testing Mode'
                  : 'Hand Tracking Only'
              }
            </span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            onClick={() => setShowGuide(prev => !prev)}
          >
            <Info size={13} />
            <span>{showGuide ? 'Hide Guidance' : 'Camera Guidance'}</span>
          </button>

          {isStreaming && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              onClick={onToggleCamera}
            >
              <CameraOff size={13} />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner if Camera fails */}
      {cameraError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(184, 64, 50, 0.1)',
            borderBottom: '1px solid var(--brick)',
            color: 'var(--brick)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Guidance Drawer */}
      {showGuide && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--sand)',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.8rem',
            color: 'var(--chocolate)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <strong>Tips for best hand recognition:</strong>
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li>Position your hands 0.5 to 1 meter in front of the lens.</li>
            <li>Ensure face and hands are evenly lit (avoid backlighting against bright windows).</li>
            <li>Keep a plain, uncluttered background if possible.</li>
            <li>Hold gestures steady for at least 1-2 seconds.</li>
          </ul>
        </div>
      )}

      {/* Demo / Testing Mode Action Bar */}
      {recognitionMode === 'demo-mode' && onTriggerDemoSign && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(201, 99, 50, 0.12)',
            borderBottom: '1px solid var(--burnt-orange)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--burnt-orange)' }}>
            <ShieldCheck size={14} />
            <span>DEMO / TESTING MODE: Tap any verified ISL sign to simulate candidate proposal</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {demoSigns.map(sign => (
              <button
                key={sign}
                type="button"
                className="chip"
                style={{ fontSize: '0.75rem' }}
                onClick={() => onTriggerDemoSign(sign)}
              >
                +{sign}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
