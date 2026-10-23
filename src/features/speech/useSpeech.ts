import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechProps {
  rate?: number;
  pitch?: number;
  voiceUri?: string;
  enabled?: boolean;
}

export interface UseSpeechReturn {
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSupported: boolean;
}

export function useSpeech({
  rate = 1.0,
  pitch = 1.0,
  voiceUri = '',
  enabled = true,
}: UseSpeechProps = {}): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Populate voices from browser
  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      try {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      } catch (err) {
        console.warn('Error fetching speech synthesis voices:', err);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  const stopSpeaking = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
      setIsSpeaking(false);
    } catch (e) {
      console.warn('Error cancelling speech synthesis:', e);
    }
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !enabled || !text.trim()) return;

    stopSpeaking();

    try {
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = Math.max(0.5, Math.min(2.0, rate));
      utterance.pitch = Math.max(0.5, Math.min(2.0, pitch));

      if (voiceUri && voices.length > 0) {
        const selectedVoice = voices.find(v => v.voiceURI === voiceUri);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
      setIsSpeaking(false);
    }
  }, [enabled, isSupported, pitch, rate, stopSpeaking, voiceUri, voices]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    isSpeaking,
    voices,
    speak,
    stopSpeaking,
    isSupported,
  };
}
