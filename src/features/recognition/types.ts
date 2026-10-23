import type { HandLandmarks } from '../tracking/types';

export interface PredictionResult {
  label: string;
  confidence: number; // 0.0 to 1.0 (real, un-fabricated)
  description?: string;
  alternatives?: Array<{ label: string; confidence: number }>;
}

export interface SignClassifier {
  readonly id: string;
  readonly name: string;
  readonly license: string;
  readonly labels: readonly string[];
  load(signal?: AbortSignal): Promise<void>;
  predict(landmarks: HandLandmarks[]): Promise<PredictionResult | null>;
  dispose(): void;
}
