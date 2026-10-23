import type { SignClassifier, PredictionResult } from '../types';
import type { HandLandmarks, LandmarkPoint } from '../../tracking/types';

// ============================================================================
// ISL Numbers Classifier (0–9) — Dedicated Digits Recognition Engine
//
// Recognises Indian Sign Language numerals 0 through 9:
//   0: Closed circle formed by thumb and all fingertips (or O shape)
//   1: Index finger extended straight up, other fingers curled
//   2: Index and middle fingers extended straight up, other fingers curled
//   3: Index, middle, and ring fingers extended OR thumb + index + middle
//   4: Four fingers (index, middle, ring, pinky) extended up, thumb folded
//   5: All five fingers extended open wide
//   6: Thumb touching pinky fingertip, index/middle/ring extended
//   7: Thumb touching ring fingertip, index/middle/pinky extended
//   8: Thumb touching middle fingertip, index/ring/pinky extended
//   9: Thumb touching index fingertip (OK loop), middle/ring/pinky extended
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

export class ISLNumbersClassifier implements SignClassifier {
  readonly id = 'isl-numbers';
  readonly name = 'ISL Numbers (0–9)';
  readonly license = 'MIT';
  readonly labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

  async load(_signal?: AbortSignal): Promise<void> {
    // Pure mathematical invariant geometry
  }

  async predict(allLandmarks: HandLandmarks[], _handedness?: string[]): Promise<PredictionResult | null> {
    if (!allLandmarks || allLandmarks.length === 0) return null;

    const hand = allLandmarks[0];
    if (!hand || hand.length < 21) return null;

    const wrist = hand[0];
    const middleMcp = hand[9];
    const scale = dist(wrist, middleMcp);
    if (scale < 0.035) return null;

    // Normalize coordinates relative to wrist and scale
    const pts: LandmarkPoint[] = hand.map(p => ({
      x: (p.x - wrist.x) / scale,
      y: (p.y - wrist.y) / scale,
      z: (p.z - wrist.z) / scale,
    }));

    // Extension ratio: tip distance vs PIP distance from wrist
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
    const thumbExt = thumbTipDist > thumbMcpDist * 1.15 && Math.abs(pts[4].x - pts[5].x) > 0.40;

    // Contact between thumb tip and fingertips
    const thumbNearIndex  = dist(pts[4], pts[8]) < 0.36;
    const thumbNearMiddle = dist(pts[4], pts[12]) < 0.38;
    const thumbNearRing   = dist(pts[4], pts[16]) < 0.38;
    const thumbNearPinky  = dist(pts[4], pts[20]) < 0.38;

    const matches: Array<{ num: string; conf: number; desc: string }> = [];

    // ── Number 5 ── All 5 fingers extended and spread
    if (indexExt && middleExt && ringExt && pinkyExt && thumbExt) {
      matches.push({ num: '5', conf: 0.94, desc: 'ISL Number 5: Open palm with all five fingers spread' });
    }

    // ── Number 4 ── Four fingers extended up, thumb folded across palm
    if (indexExt && middleExt && ringExt && pinkyExt && !thumbExt) {
      matches.push({ num: '4', conf: 0.92, desc: 'ISL Number 4: Four fingers extended, thumb folded' });
    }

    // ── Number 3 ── Three fingers extended (Index, Middle, Ring OR Thumb, Index, Middle)
    if (
      (indexExt && middleExt && ringExt && !pinkyExt && !thumbExt) ||
      (indexExt && middleExt && !ringExt && !pinkyExt && thumbExt)
    ) {
      matches.push({ num: '3', conf: 0.88, desc: 'ISL Number 3: Three fingers extended' });
    }

    // ── Number 2 ── Index and Middle extended up, other fingers curled
    if (indexExt && middleExt && !ringExt && !pinkyExt && !thumbExt) {
      matches.push({ num: '2', conf: 0.92, desc: 'ISL Number 2: Index and middle fingers extended' });
    }

    // ── Number 1 ── Only index finger extended straight up
    if (indexExt && !middleExt && !ringExt && !pinkyExt && !thumbExt) {
      matches.push({ num: '1', conf: 0.94, desc: 'ISL Number 1: Index finger extended straight up' });
    }

    // ── Number 9 ── Thumb touches index fingertip (OK sign loop), other 3 fingers extended
    if (thumbNearIndex && middleExt && ringExt && pinkyExt) {
      matches.push({ num: '9', conf: 0.90, desc: 'ISL Number 9: Thumb touching index fingertip' });
    }

    // ── Number 8 ── Thumb touches middle fingertip, index, ring, pinky extended
    if (thumbNearMiddle && indexExt && ringExt && pinkyExt) {
      matches.push({ num: '8', conf: 0.88, desc: 'ISL Number 8: Thumb touching middle fingertip' });
    }

    // ── Number 7 ── Thumb touches ring fingertip, index, middle, pinky extended
    if (thumbNearRing && indexExt && middleExt && pinkyExt) {
      matches.push({ num: '7', conf: 0.88, desc: 'ISL Number 7: Thumb touching ring fingertip' });
    }

    // ── Number 6 ── Thumb touches pinky fingertip, index, middle, ring extended
    if (thumbNearPinky && indexExt && middleExt && ringExt) {
      matches.push({ num: '6', conf: 0.88, desc: 'ISL Number 6: Thumb touching pinky fingertip' });
    }

    // ── Number 0 ── All fingertips touching thumb into 0 ring
    if (thumbNearIndex && thumbNearMiddle && !indexExt && !middleExt && !ringExt && !pinkyExt) {
      matches.push({ num: '0', conf: 0.86, desc: 'ISL Number 0: Closed zero circle with thumb & fingertips' });
    }

    if (matches.length === 0) return null;

    matches.sort((a, b) => b.conf - a.conf);
    const best = matches[0];

    const alternatives = matches.slice(1, 3).map(m => ({
      label: m.num,
      confidence: m.conf,
    }));

    return {
      label: best.num,
      confidence: best.conf,
      description: best.desc,
      alternatives,
    };
  }

  dispose(): void {
    // No-op
  }
}
