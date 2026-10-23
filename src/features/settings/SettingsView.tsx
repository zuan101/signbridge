import React, { useState } from 'react';
import { useSettings } from './SettingsContext';
import { clearAllHistory, exportAllDataAsJson } from '../history/historyStore';
import { downloadTextFile } from '../../lib/clipboard';
import { useToast } from '../../components/ui/Toast';
import { Dialog } from '../../components/ui/Dialog';
import { 
  Sliders, Camera, Volume2, Type, Moon, Shield, Download, Trash2, RotateCcw, AlertTriangle, Plus, X 
} from 'lucide-react';
import type { RecognitionMode, FontSize } from './types';
import { DEFAULT_QUICK_REPLIES } from './types';

interface SettingsViewProps {
  cameraDevices: MediaDeviceInfo[];
  activeCameraDeviceId: string;
  onSelectCameraDevice: (id: string) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  cameraDevices,
  activeCameraDeviceId,
  onSelectCameraDevice,
  availableVoices,
}) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { showToast } = useToast();

  const [newQuickReply, setNewQuickReply] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState<boolean>(false);

  const handleExportJson = () => {
    const json = exportAllDataAsJson();
    downloadTextFile(`signbridge-backup-${new Date().toISOString().slice(0, 10)}.json`, json);
    showToast('Exported all settings and conversation data as JSON', 'success');
  };

  const handleAddQuickReply = () => {
    if (!newQuickReply.trim()) return;
    updateSettings({ quickReplies: [...settings.quickReplies, newQuickReply.trim()] });
    setNewQuickReply('');
    showToast('Quick reply added', 'success');
  };

  const handleRemoveQuickReply = (index: number) => {
    const updated = settings.quickReplies.filter((_, i) => i !== index);
    updateSettings({ quickReplies: updated });
  };

  const handleResetQuickReplies = () => {
    updateSettings({ quickReplies: DEFAULT_QUICK_REPLIES });
    showToast('Quick replies reset to defaults', 'info');
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--chocolate)' }}>
          Application Settings
        </h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Configure computer vision, audio speech, typography, and privacy preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Camera & Computer Vision */}
        <div style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--chocolate)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Camera size={20} color="var(--terracotta)" />
            <span>Camera & Hand Tracking</span>
          </h2>

          <div className="form-group">
            <label htmlFor="camera-device-select" className="form-label">
              Active Video Input Device
            </label>
            <select
              id="camera-device-select"
              className="form-select"
              value={activeCameraDeviceId}
              onChange={e => onSelectCameraDevice(e.target.value)}
            >
              {cameraDevices.length === 0 ? (
                <option value="">Default System Webcam</option>
              ) : (
                cameraDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera (${d.deviceId.substring(0, 8)}...)`}
                  </option>
                ))
              )}
            </select>
            <span className="form-help">
              Note: Device labels become visible after camera permission is granted.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--chocolate)' }}>
              <input
                type="checkbox"
                checked={settings.mirrorPreview}
                onChange={e => updateSettings({ mirrorPreview: e.target.checked })}
              />
              <span>Mirror Camera Preview</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--chocolate)' }}>
              <input
                type="checkbox"
                checked={settings.showLandmarks}
                onChange={e => updateSettings({ showLandmarks: e.target.checked })}
              />
              <span>Render Landmark Overlay (21 joints)</span>
            </label>
          </div>
        </div>

        {/* Section 2: Recognition Engine & Seam */}
        <div style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--chocolate)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sliders size={20} color="var(--terracotta)" />
            <span>ISL Recognition Mode</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {[
              {
                id: 'isl-fingerspelling' as RecognitionMode,
                title: '✦ ISL Alphabet A–Z  (Word Builder)',
                desc: 'Recognises all 26 letters of the ISL/ASL fingerspelling alphabet. Letters accumulate into words with hold-to-confirm and real-time dictionary suggestions.',
              },
              {
                id: 'isl-numbers' as RecognitionMode,
                title: '🔢 ISL Numbers 0–9  (Dedicated Digits Section)',
                desc: 'Dedicated digits recognition for numerals 0 to 9 (e.g. room numbers, phone numbers, fees). Completely separated from letters to eliminate confusion.',
              },
              {
                id: 'isl-phrases' as RecognitionMode,
                title: '👋 ISL Greetings, Thanks & Phrases',
                desc: 'Recognises full conversational signs like Namaste / Hello, Thank You, Please Wait, Help, Yes, No, and Good directly into dialogue.',
              },
              {
                id: 'tracking-only' as RecognitionMode,
                title: 'Hand Tracking Only (No Classifier)',
                desc: 'Local MediaPipe 21-landmark tracking without generating any sign proposals.',
              },
              {
                id: 'demo-mode' as RecognitionMode,
                title: 'Demo / Testing Mode (Presentation Simulation)',
                desc: 'Presenter-triggered target signs for evaluating the composer, confirmation flow, and TTS without live AI uncertainty.',
              },
            ].map(mode => (
              <label
                key={mode.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${settings.recognitionMode === mode.id ? 'var(--terracotta)' : 'var(--border)'}`,
                  backgroundColor: settings.recognitionMode === mode.id ? 'rgba(185, 78, 47, 0.05)' : 'var(--ivory)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="recognition-mode"
                  checked={settings.recognitionMode === mode.id}
                  onChange={() => updateSettings({ recognitionMode: mode.id })}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--chocolate)' }}>{mode.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginTop: '0.15rem' }}>{mode.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {(settings.recognitionMode === 'isl-fingerspelling' || settings.recognitionMode === 'isl-numbers' || settings.recognitionMode === 'isl-phrases' || settings.recognitionMode === 'isl-geometric') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <div>
                <label htmlFor="conf-slider" className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Confidence Threshold</span>
                  <span>{(settings.confidenceThreshold * 100).toFixed(0)}%</span>
                </label>
                <input
                  id="conf-slider"
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={settings.confidenceThreshold}
                  onChange={e => updateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="stability-slider" className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Stability Buffer (Frames)</span>
                  <span>{settings.stabilityFrames} frames</span>
                </label>
                <input
                  id="stability-slider"
                  type="range"
                  min="3"
                  max="8"
                  step="1"
                  value={settings.stabilityFrames}
                  onChange={e => updateSettings({ stabilityFrames: parseInt(e.target.value, 10) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Speech Audio (TTS) */}
        <div style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--chocolate)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Volume2 size={20} color="var(--terracotta)" />
            <span>Text-to-Speech (Audio Voice)</span>
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--chocolate)', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={settings.speechEnabled}
                onChange={e => updateSettings({ speechEnabled: e.target.checked })}
              />
              <span>Enable Web Speech Audio Playback</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="voice-select" className="form-label">
              Voice Selection (System & Browser Voices)
            </label>
            <select
              id="voice-select"
              className="form-select"
              value={settings.speechVoiceUri}
              onChange={e => updateSettings({ speechVoiceUri: e.target.value })}
              disabled={!settings.speechEnabled}
            >
              <option value="">Default System Voice</option>
              {availableVoices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label htmlFor="speech-rate-slider" className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Speech Rate</span>
                <span>{settings.speechRate.toFixed(1)}x</span>
              </label>
              <input
                id="speech-rate-slider"
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={settings.speechRate}
                onChange={e => updateSettings({ speechRate: parseFloat(e.target.value) })}
                disabled={!settings.speechEnabled}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="speech-pitch-slider" className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pitch</span>
                <span>{settings.speechPitch.toFixed(1)}</span>
              </label>
              <input
                id="speech-pitch-slider"
                type="range"
                min="0.8"
                max="1.3"
                step="0.1"
                value={settings.speechPitch}
                onChange={e => updateSettings({ speechPitch: parseFloat(e.target.value) })}
                disabled={!settings.speechEnabled}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Typography & Accessibility */}
        <div style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--chocolate)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Type size={20} color="var(--terracotta)" />
            <span>Typography & Theme</span>
          </h2>

          <div className="form-group">
            <label htmlFor="font-size-select" className="form-label">
              Conversation Text Scale
            </label>
            <select
              id="font-size-select"
              className="form-select"
              value={settings.fontSize}
              onChange={e => updateSettings({ fontSize: e.target.value as FontSize })}
            >
              <option value="small">Small (90%)</option>
              <option value="medium">Medium Default (100%)</option>
              <option value="large">Large (115%)</option>
              <option value="xlarge">Extra Large (130%)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--chocolate)' }}>
              <input
                type="checkbox"
                checked={settings.theme === 'dark'}
                onChange={e => updateSettings({ theme: e.target.checked ? 'dark' : 'light' })}
              />
              <Moon size={16} />
              <span>Warm Dark Theme (Espresso / Sand)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--chocolate)' }}>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={e => updateSettings({ highContrast: e.target.checked })}
              />
              <span>High Contrast Mode (Enhanced Edges)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--chocolate)' }}>
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={e => updateSettings({ reduceMotion: e.target.checked })}
              />
              <span>Reduce Motion Override</span>
            </label>
          </div>
        </div>

        {/* Section 5: Customizable Quick Replies */}
        <div style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--chocolate)' }}>
              Desk Operator Quick Replies
            </h2>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem' }}
              onClick={handleResetQuickReplies}
            >
              Reset to Defaults
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {settings.quickReplies.map((qr, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: 'var(--sand)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  color: 'var(--chocolate)',
                }}
              >
                <span>{qr}</span>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', padding: 0 }}
                  onClick={() => handleRemoveQuickReply(idx)}
                  aria-label={`Remove quick reply: ${qr}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Add new quick reply phrase..."
              value={newQuickReply}
              onChange={e => setNewQuickReply(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddQuickReply();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddQuickReply}
              disabled={!newQuickReply.trim()}
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Section 6: Data & Governance */}
        <div style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--chocolate)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Shield size={20} color="var(--terracotta)" />
            <span>Data Sovereignty & Reset</span>
          </h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportJson}
            >
              <Download size={16} />
              <span>Export All Data (JSON)</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmClearHistory(true)}
            >
              <Trash2 size={16} />
              <span>Clear Saved History</span>
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={16} />
              <span>Reset Settings to Default</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <Dialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset All Settings to Default?"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                resetSettings();
                setConfirmReset(false);
                showToast('Settings reset to factory defaults', 'info');
              }}
            >
              Reset Settings
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <AlertTriangle size={24} color="var(--brick)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.95rem', color: 'var(--chocolate)' }}>
            This will restore all camera, speech, recognition, and theme options back to their default values. Saved transcripts will remain intact.
          </p>
        </div>
      </Dialog>

      {/* Confirm Clear History Dialog */}
      <Dialog
        isOpen={confirmClearHistory}
        onClose={() => setConfirmClearHistory(false)}
        title="Clear All Saved History?"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmClearHistory(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                clearAllHistory();
                setConfirmClearHistory(false);
                showToast('Local conversation transcripts cleared', 'info');
              }}
            >
              Clear History
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <AlertTriangle size={24} color="var(--brick)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.95rem', color: 'var(--chocolate)' }}>
            Are you sure you want to delete all saved conversations from this browser? This action cannot be undone.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
