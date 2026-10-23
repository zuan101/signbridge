export type RecognitionMode =
  | 'isl-fingerspelling'
  | 'isl-numbers'
  | 'isl-phrases'
  | 'isl-geometric'
  | 'tracking-only'
  | 'demo-mode';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type AppTheme = 'light' | 'dark';

export interface AppSettings {
  cameraDeviceId: string;
  mirrorPreview: boolean;
  showLandmarks: boolean;
  recognitionMode: RecognitionMode;
  confidenceThreshold: number;
  stabilityFrames: number;
  speechEnabled: boolean;
  speechVoiceUri: string;
  speechRate: number;
  speechPitch: number;
  fontSize: FontSize;
  theme: AppTheme;
  highContrast: boolean;
  reduceMotion: boolean;
  saveTranscripts: boolean;
  quickReplies: string[];
}

export const DEFAULT_QUICK_REPLIES: string[] = [
  'Please wait a moment',
  'Could you write that down?',
  'Please sign slower',
  'Go to Room 104',
  "I'll call someone to help you",
  'Welcome to the information desk',
];

export const DEFAULT_SETTINGS: AppSettings = {
  cameraDeviceId: '',
  mirrorPreview: true,
  showLandmarks: true,
  recognitionMode: 'isl-fingerspelling',
  confidenceThreshold: 0.70,
  stabilityFrames: 4,
  speechEnabled: true,
  speechVoiceUri: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  fontSize: 'medium',
  theme: 'light',
  highContrast: false,
  reduceMotion: false,
  saveTranscripts: true,
  quickReplies: DEFAULT_QUICK_REPLIES,
};
