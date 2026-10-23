import type { SignClassifier, PredictionResult } from '../types';
import type { HandLandmarks } from '../../tracking/types';

export class NoClassifier implements SignClassifier {
  readonly id = 'tracking-only';
  readonly name = 'Hand Tracking Only (No Classifier)';
  readonly license = 'MIT';
  readonly labels: readonly string[] = [];

  async load(): Promise<void> {
    // No-op: tracking only
  }

  async predict(_landmarks: HandLandmarks[]): Promise<PredictionResult | null> {
    return null;
  }

  dispose(): void {
    // No-op
  }
}
