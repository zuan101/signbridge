// ============================================================================
// SignBridge Voice Message & Audio File Transcriber Service
// Converts uploaded voice files (.mp3, .wav, .m4a, .webm, .ogg) or live voice notes
// into verified text for two-way communication.
// ============================================================================

export interface AudioMetadata {
  name: string;
  sizeBytes: number;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  peaks: number[]; // 32 normalized amplitude peaks for waveform visualization
}

export interface SampleVoicePreset {
  id: string;
  title: string;
  category: string;
  duration: string;
  text: string;
}

export const SAMPLE_VOICE_PRESETS: SampleVoicePreset[] = [
  {
    id: 'admissions-desk',
    title: 'Admissions & Fee Query',
    category: 'Reception Desk',
    duration: '0:03',
    text: 'Hello, could you please tell me where the admissions counter and fee payment desk is located?',
  },
  {
    id: 'library-card',
    title: 'Library Card Application',
    category: 'Campus Services',
    duration: '0:04',
    text: 'I would like to apply for a student library card and collect my course reference books.',
  },
  {
    id: 'counselor-wait',
    title: 'Staff Assistance Notice',
    category: 'Counter Reply',
    duration: '0:03',
    text: 'Please wait here for two minutes, the department counselor will be right with you.',
  },
  {
    id: 'thanks-reply',
    title: 'Gratitude & Departure',
    category: 'General',
    duration: '0:02',
    text: 'Thank you very much for your kind help and clear guidance.',
  },
];

/**
 * Decodes an audio file in browser memory using Web Audio API
 * and extracts duration and 32 normalized peak amplitudes for waveform visualization.
 */
export async function decodeAudioMetadata(file: File): Promise<AudioMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  const audioContext = new AudioCtx();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const durationSeconds = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;

    // Extract 32 normalized peaks for waveform rendering
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / 32);
    const peaks: number[] = [];

    for (let i = 0; i < 32; i++) {
      let blockSum = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      for (let j = start; j < end; j++) {
        blockSum += Math.abs(channelData[j]);
      }
      const avg = blockSize > 0 ? blockSum / blockSize : 0;
      peaks.push(Math.min(1.0, avg * 2.8));
    }

    // Normalize peaks
    const maxPeak = Math.max(...peaks, 0.01);
    const normalizedPeaks = peaks.map(p => Math.max(0.12, p / maxPeak));

    return {
      name: file.name,
      sizeBytes: file.size,
      durationSeconds,
      sampleRate,
      channels,
      peaks: normalizedPeaks,
    };
  } finally {
    audioContext.close().catch(() => {});
  }
}

/**
 * Decodes an audio file in browser memory to 16kHz mono Float32Array
 * required by neural speech-to-text models like Whisper.
 */
export async function decodeAudioTo16kMono(file: File): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  // Modern browsers support passing desired sample rate to AudioContext
  const ctx = new AudioCtx({ sampleRate: 16000 });
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer.getChannelData(0);
    }
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    const mono = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      mono[i] = (left[i] + right[i]) / 2;
    }
    return mono;
  } finally {
    ctx.close().catch(() => {});
  }
}

let cachedInBrowserWhisper: any = null;

/**
 * Transcribes audio file in-browser using Transformers.js Whisper-tiny model.
 * Runs 100% inside browser memory without uploading audio to any server.
 */
export async function transcribeWithInBrowserWhisper(
  file: File,
  onProgress?: (status: string) => void
): Promise<string> {
  onProgress?.('Decoding audio waveform to 16kHz mono...');
  const pcmData = await decodeAudioTo16kMono(file);

  onProgress?.('Loading in-browser Whisper engine (first run downloads tiny weights)...');
  
  // Dynamically import via native browser import to avoid bundler build-time dependency locks
  const loadModule = new Function('u', 'return import(u);');
  const transformers = await loadModule('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
  transformers.env.allowLocalModels = false;
  transformers.env.useBrowserCache = true;

  if (!cachedInBrowserWhisper) {
    cachedInBrowserWhisper = await transformers.pipeline(
      'automatic-speech-recognition', 
      'Xenova/whisper-tiny.en', 
      {
        progress_callback: (p: any) => {
          if (p.status === 'progress' && p.file) {
            const pct = Math.round(p.progress || 0);
            onProgress?.(`Downloading Whisper model: ${pct}%...`);
          }
        }
      }
    );
  }

  onProgress?.('Transcribing speech using local neural engine...');
  const output = await cachedInBrowserWhisper(pcmData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: 'english',
    task: 'transcribe',
  });

  const text = typeof output.text === 'string' ? output.text.trim() : '';
  return text;
}

/**
 * Transcribes audio file using OpenAI or Groq Whisper API endpoint if an API key is provided.
 * Automatically selects Groq endpoint if key starts with 'gsk_'.
 */
export async function transcribeWithWhisperAPI(
  file: File,
  apiKey: string,
  customEndpoint?: string
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Please enter a valid Whisper API key.');
  }

  const isGroq = cleanKey.startsWith('gsk_') || (customEndpoint && customEndpoint.includes('groq'));
  const endpoint = customEndpoint || (isGroq 
    ? 'https://api.groq.com/openai/v1/audio/transcriptions' 
    : 'https://api.openai.com/v1/audio/transcriptions');
  const model = isGroq ? 'whisper-large-v3' : 'whisper-1';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);
  formData.append('response_format', 'json');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cleanKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Whisper API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return (data.text || '').trim();
}

/**
 * Creates a browser-native SpeechRecognition instance for real-time voice dictation
 */
export function isBrowserSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

export interface SpeechRecognizerHandlers {
  onResult: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export function startLiveVoiceRecognition(handlers: SpeechRecognizerHandlers, lang = 'en-US') {
  if (!isBrowserSpeechRecognitionSupported()) {
    handlers.onError('SpeechRecognition API is not supported in this browser. Please use Chrome or Edge.');
    return null;
  }

  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onresult = (event: any) => {
    let interimText = '';
    let finalText = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript;
      } else {
        interimText += transcript;
      }
    }

    const currentText = (finalText || interimText).trim();
    if (currentText) {
      handlers.onResult(currentText, Boolean(finalText));
    }
  };

  recognition.onerror = (event: any) => {
    handlers.onError(event.error || 'Speech recognition error');
  };

  recognition.onend = () => {
    handlers.onEnd();
  };

  try {
    recognition.start();
    return recognition;
  } catch (err: any) {
    handlers.onError(err.message || 'Failed to start speech recognition');
    return null;
  }
}
