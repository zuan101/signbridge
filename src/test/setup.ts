import '@testing-library/jest-dom/vitest';

// Mock Web Speech API
if (typeof window !== 'undefined') {
  if (!('speechSynthesis' in window)) {
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: () => {},
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [],
        speaking: false,
        paused: false,
        pending: false,
        onvoiceschanged: null,
      },
      writable: true,
    });
  }

  // Mock navigator.mediaDevices
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: () => Promise.resolve({
          getTracks: () => [{ stop: () => {} }],
        }),
        enumerateDevices: () => Promise.resolve([]),
      },
      writable: true,
    });
  }
}
