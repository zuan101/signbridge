import type { SignClassifier, PredictionResult } from '../types';
import type { HandLandmarks } from '../../tracking/types';

export class ManualDemoSource implements SignClassifier {
  readonly id = 'demo-mode';
  readonly name = 'Demo / Testing Simulation Adapter';
  readonly license = 'MIT';
  readonly labels = [
    'Namaste / Hello',
    'Thank You',
    'Please Wait',
    'Where is Room?',
    'Fee Counter',
    'Number 1',
    'Number 2',
    'Number 3',
  ] as const;

  private selectedDemoSign: string | null = null;

  setDemoSign(sign: string | null): void {
    this.selectedDemoSign = sign;
  }

  async load(): Promise<void> {
    // Immediate
  }

  async predict(_landmarks: HandLandmarks[]): Promise<PredictionResult | null> {
    if (!this.selectedDemoSign) return null;
    return {
      label: this.selectedDemoSign,
      confidence: 1.0, // Clearly identified as manual demo trigger
      description: 'Manual demo trigger (Simulation Mode)',
    };
  }

  dispose(): void {
    this.selectedDemoSign = null;
  }
}
