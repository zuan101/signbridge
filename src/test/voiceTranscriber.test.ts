import { describe, it, expect } from 'vitest';
import { 
  SAMPLE_VOICE_PRESETS, 
  isBrowserSpeechRecognitionSupported 
} from '../features/speech/voiceTranscriber';

describe('Voice Message & Audio File Transcriber Service', () => {
  it('provides predefined campus voice presets with valid text', () => {
    expect(SAMPLE_VOICE_PRESETS.length).toBeGreaterThanOrEqual(4);
    
    const admissions = SAMPLE_VOICE_PRESETS.find(p => p.id === 'admissions-desk');
    expect(admissions).toBeDefined();
    expect(admissions?.text).toContain('admissions counter');

    const library = SAMPLE_VOICE_PRESETS.find(p => p.id === 'library-card');
    expect(library).toBeDefined();
    expect(library?.text).toContain('library card');
  });

  it('checks for speech recognition support safely in test environment', () => {
    const supported = isBrowserSpeechRecognitionSupported();
    expect(typeof supported).toBe('boolean');
  });
});
