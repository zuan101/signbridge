import type { SignClassifier, PredictionResult } from '../types';
import type { HandLandmarks, LandmarkPoint } from '../../tracking/types';

// ============================================================================
// ISLPhrasesClassifier — Greetings, Thanks & Conversational Whole Signs
//
// Covers verified Indian Sign Language (ISL) communication phrases:
//   - "Namaste / Hello": Two hands joined at chest OR open palm greeting
//   - "Thank You": Flat hand at chin/chest extending forward
//   - "Please": Polite open hand gesture
//   - "Help": Fist resting on open palm OR open reaching hands
//   - "Yes / Agree": Thumbs up gesture
//   - "No / Disagree": Index finger waving side-to-side
//   - "Stop / Please Wait": Open flat palm facing forward
//   - "Good / Fine": Thumbs up gesture
//   - "Where?": Open palms facing upward (question pose)
// ============================================================================

function dist(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}

function angleDeg(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): number {
  const bax = a.x - b.x, bay = a.y - b.y, baz = a.z - b.z;
  const bcx = c.x - b.x, bcy = c.y - b.y, bcz = c.z - b.z;
  const magBA = Math.sqrt(bax ** 2 + bay ** 2 + baz ** 2);
  const magBC = Math.sqrt(bcx ** 2 + bcy ** 2 + bcz ** 2);
  if (magBA < 1e-6 || magBC < 1e-6) return 180;
  const cosAngle = (bax * bcx + bay * bcy + baz * bcz) / (magBA * magBC);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

export class ISLPhrasesClassifier implements SignClassifier {
  readonly id = 'isl-phrases';
  readonly name = 'ISL Greetings & Conversational Phrases';
  readonly license = 'MIT';
  readonly labels = [
    'Namaste / Hello',
    'Thank You',
    'Please Wait',
    'Help',
    'Yes / Agree',
    'No / Disagree',
    'Good / Fine',
    'Where?',
  ] as const;

  async load(_signal?: AbortSignal): Promise<void> {
    // Instant mathematical heuristics based on ISLRTC standards
  }

  async predict(allLandmarks: HandLandmarks[], _handedness?: string[]): Promise<PredictionResult | null> {
    if (!allLandmarks || allLandmarks.length === 0) return null;

    // ── Two-Handed Signs (Namaste, Help, Where) ──
    if (allLandmarks.length >= 2) {
      const h1 = allLandmarks[0];
      const h2 = allLandmarks[1];
      const wristDist = dist(h1[0], h2[0]);

      // 1. Namaste: two palms touching or very close in front of chest
      const palmsFacing = Math.abs(h1[9].y - h2[9].y) < 0.22 && wristDist < 0.35;
      if (palmsFacing) {
        const conf = Math.min(0.96, Math.max(0.75, 1.0 - wristDist * 1.4));
        return {
          label: 'Namaste / Hello',
          confidence: parseFloat(conf.toFixed(2)),
          description: 'Two hands joined in traditional respectful greeting',
        };
      }

      // 2. Help: one fist resting on other open flat palm
      const h1Wrist = h1[0];
      const h2Wrist = h2[0];
      const verticalStack = Math.abs(h1Wrist.x - h2Wrist.x) < 0.32 && Math.abs(h1Wrist.y - h2Wrist.y) < 0.35;
      if (verticalStack) {
        return {
          label: 'Help',
          confidence: 0.88,
          description: 'ISL sign for Help: fist resting on flat supporting palm',
        };
      }

      // 3. Where?: Both hands open palms facing upwards and spread laterally
      const h1PalmsUp = h1[9].y > h1[0].y - 0.1;
      const h2PalmsUp = h2[9].y > h2[0].y - 0.1;
      const spreadApart = Math.abs(h1Wrist.x - h2Wrist.x) > 0.40;
      if (h1PalmsUp && h2PalmsUp && spreadApart) {
        return {
          label: 'Where?',
          confidence: 0.85,
          description: 'ISL question sign: Where / Location enquiry',
        };
      }
    }

    // ── Single-Handed Signs ──
    const hand = allLandmarks[0];
    if (!hand || hand.length < 21) return null;

    const wrist = hand[0];
    const middleMcp = hand[9];
    const scale = dist(wrist, middleMcp);
    if (scale < 0.035) return null;

    const pts: LandmarkPoint[] = hand.map(p => ({
      x: (p.x - wrist.x) / scale,
      y: (p.y - wrist.y) / scale,
      z: (p.z - wrist.z) / scale,
    }));

    const extRatio = (pip: number, tip: number) => {
      const dTip = dist(wrist, pts[tip]);
      const dPip = dist(wrist, pts[pip]);
      return dPip > 0.001 ? dTip / dPip : 1.0;
    };

    const indexExtRatio  = extRatio(6, 8);
    const middleExtRatio = extRatio(10, 12);
    const ringExtRatio   = extRatio(14, 16);
    const pinkyExtRatio  = extRatio(18, 20);

    const indexPipAngle  = angleDeg(pts[5], pts[6], pts[8]);
    const middlePipAngle = angleDeg(pts[9], pts[10], pts[12]);
    const ringPipAngle   = angleDeg(pts[13], pts[14], pts[16]);
    const pinkyPipAngle  = angleDeg(pts[17], pts[18], pts[20]);

    const indexExt  = indexExtRatio  > 1.20 && indexPipAngle  > 135;
    const middleExt = middleExtRatio > 1.20 && middlePipAngle > 135;
    const ringExt   = ringExtRatio   > 1.20 && ringPipAngle   > 135;
    const pinkyExt  = pinkyExtRatio  > 1.20 && pinkyPipAngle  > 135;

    const thumbTipDist = dist(wrist, pts[4]);
    const thumbMcpDist = dist(wrist, pts[2]);
    const thumbExt = thumbTipDist > thumbMcpDist * 1.15;
    const thumbUpright = pts[4].y < pts[2].y - 0.2;

    const allFourCurled = !indexExt && !middleExt && !ringExt && !pinkyExt;
    const allFourExtended = indexExt && middleExt && ringExt && pinkyExt;

    // ── Yes / Agree & Good / Fine ── Thumbs up
    if (allFourCurled && thumbExt && thumbUpright) {
      return {
        label: 'Yes / Agree',
        confidence: 0.92,
        description: 'Thumbs-up: affirmative agreement or good',
        alternatives: [{ label: 'Good / Fine', confidence: 0.88 }],
      };
    }

    // ── Stop / Please Wait ── Open flat palm facing camera
    if (allFourExtended && pts[8].y < pts[5].y - 0.3) {
      const fingersClose = dist(pts[8], pts[12]) < 0.25 && dist(pts[12], pts[16]) < 0.25;
      if (fingersClose) {
        return {
          label: 'Please Wait',
          confidence: 0.90,
          description: 'Open palm facing camera: Please wait / hold on',
        };
      }
    }

    // ── Thank You ── Hand near mouth/chin and extending outward
    const handNearMouth = pts[8].y < -0.8 && pts[0].y < 0.3;
    if (allFourExtended && handNearMouth) {
      return {
        label: 'Thank You',
        confidence: 0.86,
        description: 'Hand at chin extending forward: expressing gratitude',
      };
    }

    // ── No / Disagree ── Index finger extended with horizontal angle or waving
    if (indexExt && !middleExt && !ringExt && !pinkyExt) {
      const isWavingOrAngled = Math.abs(pts[8].x - pts[5].x) > 0.35;
      if (isWavingOrAngled) {
        return {
          label: 'No / Disagree',
          confidence: 0.84,
          description: 'Index finger waving side-to-side: negative response',
        };
      }
    }

    return null;
  }

  dispose(): void {
    // No-op
  }
}
