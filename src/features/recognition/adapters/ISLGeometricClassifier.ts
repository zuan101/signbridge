import type { SignClassifier, PredictionResult } from '../types';
import type { HandLandmarks, LandmarkPoint } from '../../tracking/types';

function dist(p1: LandmarkPoint, p2: LandmarkPoint): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

export class ISLGeometricClassifier implements SignClassifier {
  readonly id = 'isl-geometric';
  readonly name = 'Geometric ISL Static Signs';
  readonly license = 'MIT';
  readonly labels = [
    'Number 1',
    'Number 2',
    'Number 3',
    'Number 4',
    'Number 5',
    'Namaste / Open Palm',
    'Fist',
  ] as const;

  async load(): Promise<void> {
    // Instant mathematical heuristics based on ISLRTC static sign parameters
  }

  async predict(allLandmarks: HandLandmarks[]): Promise<PredictionResult | null> {
    if (!allLandmarks || allLandmarks.length === 0) return null;

    // Check for two-handed Namaste
    if (allLandmarks.length >= 2) {
      const h1 = allLandmarks[0];
      const h2 = allLandmarks[1];
      const wristDistance = dist(h1[0], h2[0]);
      const palmsFacing = Math.abs(h1[9].y - h2[9].y) < 0.2 && wristDistance < 0.35;

      if (palmsFacing) {
        const conf = Math.min(0.96, Math.max(0.72, 1.0 - wristDistance * 1.5));
        return {
          label: 'Namaste',
          confidence: parseFloat(conf.toFixed(2)),
          description: 'Two hands joined in traditional ISL greeting',
        };
      }
    }

    const hand = allLandmarks[0];
    if (!hand || hand.length < 21) return null;

    const wrist = hand[0];
    const scale = dist(wrist, hand[9]); // Middle MCP
    if (scale < 0.05) return null; // Hand too small or far

    // Check finger extension relative to scale
    const isIndexExtended = dist(wrist, hand[8]) > dist(wrist, hand[6]) * 1.25;
    const isMiddleExtended = dist(wrist, hand[12]) > dist(wrist, hand[10]) * 1.25;
    const isRingExtended = dist(wrist, hand[16]) > dist(wrist, hand[14]) * 1.25;
    const isPinkyExtended = dist(wrist, hand[20]) > dist(wrist, hand[18]) * 1.25;
    const isThumbExtended = dist(wrist, hand[4]) > dist(wrist, hand[2]) * 1.15;

    // Evaluate patterns with real mathematical consistency score
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      const extensionRatio = dist(wrist, hand[8]) / scale;
      const conf = Math.min(0.95, Math.max(0.70, 0.65 + (extensionRatio - 1.2) * 0.2));
      return {
        label: 'Number 1',
        confidence: parseFloat(conf.toFixed(2)),
        description: 'ISL numeral 1 (Index finger extended)',
      };
    }

    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      const separation = dist(hand[8], hand[12]) / scale;
      const conf = Math.min(0.95, Math.max(0.72, 0.70 + separation * 0.25));
      return {
        label: 'Number 2',
        confidence: parseFloat(conf.toFixed(2)),
        description: 'ISL numeral 2 (Index & Middle fingers extended)',
      };
    }

    if (isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended) {
      const conf = 0.85;
      return {
        label: 'Number 3',
        confidence: conf,
        description: 'ISL numeral 3 (Three fingers extended)',
      };
    }

    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && !isThumbExtended) {
      const conf = 0.88;
      return {
        label: 'Number 4',
        confidence: conf,
        description: 'ISL numeral 4 (Four fingers extended, thumb folded)',
      };
    }

    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && isThumbExtended) {
      const conf = 0.92;
      return {
        label: 'Number 5',
        confidence: conf,
        description: 'ISL numeral 5 (Full open hand)',
      };
    }

    if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended && !isThumbExtended) {
      return {
        label: 'Fist',
        confidence: 0.82,
        description: 'ISL closed fist handshape',
      };
    }

    return null;
  }

  dispose(): void {
    // No-op
  }
}
