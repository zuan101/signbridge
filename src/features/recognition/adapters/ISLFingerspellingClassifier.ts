import type { SignClassifier, PredictionResult } from '../types';
import type { HandLandmarks, LandmarkPoint } from '../../tracking/types';

// ============================================================================
// ISL Fingerspelling Classifier (A–Z) — Precision Engine
//
// Implements the official single-handed fingerspelling alphabet from the
// reference chart (iScholar ISL/ASL reference).
//
// MediaPipe Hand Landmarker layout:
//   0          = Wrist
//   1, 2, 3, 4   = Thumb  (CMC, MCP, IP, Tip)
//   5, 6, 7, 8   = Index  (MCP, PIP, DIP, Tip)
//   9, 10,11,12  = Middle (MCP, PIP, DIP, Tip)
//   13,14,15,16  = Ring   (MCP, PIP, DIP, Tip)
//   17,18,19,20  = Pinky  (MCP, PIP, DIP, Tip)
// ============================================================================

export function dist(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}

/** 3-D dot product */
export function dot(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
  return ax * bx + ay * by + az * bz;
}

/** 3-D Angle between three landmarks in degrees (vertex at point b) */
export function angleDeg(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): number {
  const bax = a.x - b.x, bay = a.y - b.y, baz = a.z - b.z;
  const bcx = c.x - b.x, bcy = c.y - b.y, bcz = c.z - b.z;
  const magBA = Math.sqrt(bax ** 2 + bay ** 2 + baz ** 2);
  const magBC = Math.sqrt(bcx ** 2 + bcy ** 2 + bcz ** 2);
  if (magBA < 1e-6 || magBC < 1e-6) return 180;
  const cosAngle = (bax * bcx + bay * bcy + baz * bcz) / (magBA * magBC);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

export interface NormHand {
  pts: LandmarkPoint[];
  scale: number;
  isRightHand: boolean;
  palmAngleDeg: number; // 2D orientation of hand on camera plane
}

export function normalise(hand: HandLandmarks, handednessLabel?: string): NormHand | null {
  if (!hand || hand.length < 21) return null;

  const wrist = hand[0];
  const middleMcp = hand[9];
  const scale = dist(wrist, middleMcp);

  if (scale < 0.035) return null; // hand too small or too far

  const pts: LandmarkPoint[] = hand.map(p => ({
    x: (p.x - wrist.x) / scale,
    y: (p.y - wrist.y) / scale,
    z: (p.z - wrist.z) / scale,
  }));

  // Handedness: determine if right or left hand
  let isRightHand = true;
  if (handednessLabel) {
    isRightHand = handednessLabel.toLowerCase().includes('right');
  } else {
    // MediaPipe heuristic on palm facing camera: thumb MCP (2) x vs pinky MCP (17) x
    isRightHand = hand[2].x < hand[17].x;
  }

  // 2D angle of palm vector (wrist -> middle MCP) in image plane
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const palmAngleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

  return { pts, scale, isRightHand, palmAngleDeg };
}

export interface FingerState {
  // Extension booleans based on 3D invariants
  thumbExt: boolean;
  indexExt: boolean;
  middleExt: boolean;
  ringExt: boolean;
  pinkyExt: boolean;

  // Extension ratios: dist(wrist, tip) / dist(wrist, pip)
  indexExtRatio: number;
  middleExtRatio: number;
  ringExtRatio: number;
  pinkyExtRatio: number;

  // PIP Knuckle angles (145-180 = straight, 70-130 = hooked, <110 = curled)
  indexPipAngle: number;
  middlePipAngle: number;
  ringPipAngle: number;
  pinkyPipAngle: number;

  // Hooked states (like X)
  indexHooked: boolean;

  // Thumb metrics
  thumbExtOut: boolean;
  thumbUp: boolean;
  thumbAcrossPalm: boolean;
  thumbAcrossFront: boolean;
  thumbTucked: boolean;
  thumbNearIndexTip: boolean;
  thumbNearMiddleTip: boolean;
  thumbNearRingTip: boolean;

  // Inter-finger separations
  indexMiddleSep: number;
  middleRingSep: number;
  ringPinkySep: number;
  indexMiddleTogether: boolean;
  middleRingTogether: boolean;
  indexMiddleCrossed: boolean;

  // Hand orientation flags
  isPalmUp: boolean;
  isPalmHorizontal: boolean;
  isPalmDown: boolean;
}

export function extractFingerState(pts: LandmarkPoint[], norm: NormHand): FingerState {
  const wrist = pts[0];

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

  // Finger is extended if tip is far from wrist AND knuckle angle is relatively straight
  const indexExt  = indexExtRatio  > 1.20 && indexPipAngle  > 135;
  const middleExt = middleExtRatio > 1.20 && middlePipAngle > 135;
  const ringExt   = ringExtRatio   > 1.20 && ringPipAngle   > 135;
  const pinkyExt  = pinkyExtRatio  > 1.20 && pinkyPipAngle  > 135;

  // Finger is hooked (like letter X)
  const indexHooked = indexPipAngle >= 68 && indexPipAngle <= 130 && indexExtRatio < 1.22;

  // Thumb measurements
  const thumbTipDist = dist(wrist, pts[4]);
  const thumbMcpDist = dist(wrist, pts[2]);
  const thumbToIndexMcp = dist(pts[4], pts[5]);

  // Lateral spread of thumb relative to index knuckle
  const thumbLateral = Math.abs(pts[4].x - pts[5].x);

  const thumbExtOut = thumbTipDist > thumbMcpDist * 1.15 && thumbLateral > 0.42;

  // Thumb upright along side of index finger (A shape)
  const thumbUp = pts[4].y < pts[2].y + 0.15 && thumbToIndexMcp < 0.58 && !thumbExtOut;

  // Thumb folded across front of knuckles (S shape)
  const thumbAcrossFront = dist(pts[4], pts[6]) < 0.45 && dist(pts[4], pts[10]) < 0.52 && pts[4].y >= pts[5].y - 0.1;

  // Thumb folded across palm (B, U, V, etc.)
  const thumbAcrossPalm = dist(pts[4], pts[9]) < 0.52 || dist(pts[4], pts[13]) < 0.52;

  // Thumb tucked under fingers
  const thumbTucked = thumbAcrossPalm || thumbAcrossFront || thumbToIndexMcp < 0.38;

  // Thumb near specific fingertips
  const thumbNearIndexTip  = dist(pts[4], pts[8]) < 0.35;
  const thumbNearMiddleTip = dist(pts[4], pts[12]) < 0.38;
  const thumbNearRingTip   = dist(pts[4], pts[16]) < 0.38;

  // Inter-finger lateral separation
  const indexMiddleSep = dist(pts[8], pts[12]);
  const middleRingSep  = dist(pts[12], pts[16]);
  const ringPinkySep   = dist(pts[16], pts[20]);

  const indexMiddleTogether = indexMiddleSep < 0.22;
  const middleRingTogether  = middleRingSep < 0.22;

  // Index and middle crossed (letter R)
  // Crossing: lateral overlap between index tip and middle tip, tips close together
  const indexMiddleCrossed = indexExt && middleExt && indexMiddleSep < 0.32 && Math.abs(pts[8].x - pts[12].x) < 0.16;

  // Hand orientation on camera plane
  // palmAngleDeg: -90 is pointing straight up, 0 is right, 180 is left, 90 is down
  const pAngle = norm.palmAngleDeg;
  const isPalmUp = pAngle >= -140 && pAngle <= -40;
  const isPalmHorizontal = (pAngle > -40 && pAngle < 40) || pAngle > 140 || pAngle < -140;
  const isPalmDown = pAngle >= 40 && pAngle <= 140;

  return {
    thumbExt: thumbExtOut,
    indexExt,
    middleExt,
    ringExt,
    pinkyExt,
    indexExtRatio,
    middleExtRatio,
    ringExtRatio,
    pinkyExtRatio,
    indexPipAngle,
    middlePipAngle,
    ringPipAngle,
    pinkyPipAngle,
    indexHooked,
    thumbExtOut,
    thumbUp,
    thumbAcrossPalm,
    thumbAcrossFront,
    thumbTucked,
    thumbNearIndexTip,
    thumbNearMiddleTip,
    thumbNearRingTip,
    indexMiddleSep,
    middleRingSep,
    ringPinkySep,
    indexMiddleTogether,
    middleRingTogether,
    indexMiddleCrossed,
    isPalmUp,
    isPalmHorizontal,
    isPalmDown,
  };
}

export interface LetterMatch {
  letter: string;
  conf: number;
}

export function classifyLetter(pts: LandmarkPoint[], f: FingerState): LetterMatch[] {
  const matches: LetterMatch[] = [];
  const add = (letter: string, conf: number) => {
    if (conf >= 0.50) matches.push({ letter, conf: parseFloat(conf.toFixed(2)) });
  };

  const allFourCurled = !f.indexExt && !f.middleExt && !f.ringExt && !f.pinkyExt;

  // ── A ── Fist with thumb upright on lateral side of index knuckle
  {
    if (allFourCurled && f.thumbUp && !f.thumbAcrossFront && !f.thumbExtOut) {
      add('A', 0.88);
    }
  }

  // ── B ── 4 fingers straight up together, thumb folded across palm
  {
    const fourUp = f.indexExt && f.middleExt && f.ringExt && f.pinkyExt;
    if (fourUp && (f.thumbAcrossPalm || f.thumbTucked)) {
      add('B', f.indexMiddleTogether && f.middleRingTogether ? 0.90 : 0.80);
    }
  }

  // ── C ── Fingers and thumb curled in open "C" cup profile
  {
    const fingersArched = f.indexPipAngle >= 95 && f.indexPipAngle <= 150 &&
                          f.middlePipAngle >= 95 && f.middlePipAngle <= 150 &&
                          f.ringPipAngle >= 95 && f.ringPipAngle <= 150;
    const cGap = dist(pts[4], pts[8]);
    if (fingersArched && cGap >= 0.42 && cGap <= 1.45 && !f.thumbNearIndexTip) {
      add('C', 0.84);
    }
  }

  // ── D ── Index straight up, thumb touching middle fingertip/knuckle, others curled
  {
    const onlyIndexUp = f.indexExt && !f.middleExt && !f.ringExt && !f.pinkyExt;
    const thumbOnMiddle = f.thumbNearMiddleTip || dist(pts[4], pts[10]) < 0.45;
    if (onlyIndexUp && thumbOnMiddle && !f.thumbExtOut) {
      add('D', 0.88);
    }
  }

  // ── E ── All 4 fingers curled down onto thumb (claw/hooked fist)
  {
    const hookedDown = f.indexExtRatio < 1.10 && f.middleExtRatio < 1.10 &&
                       f.ringExtRatio < 1.10 && f.pinkyExtRatio < 1.10;
    const thumbUnderFingers = dist(pts[4], pts[8]) < 0.45 && dist(pts[4], pts[12]) < 0.45;
    if (allFourCurled && hookedDown && thumbUnderFingers) {
      add('E', 0.82);
    }
  }

  // ── F ── Index tip touches thumb tip (OK circle), other 3 fingers straight up
  {
    const threeUp = f.middleExt && f.ringExt && f.pinkyExt;
    if (threeUp && f.thumbNearIndexTip) {
      add('F', 0.90);
    }
  }

  // ── G ── Index pointing horizontally sideways, thumb parallel, others curled
  {
    const indexHoriz = Math.abs(pts[8].x - pts[5].x) > 0.38;
    const othersCurled = !f.middleExt && !f.ringExt && !f.pinkyExt;
    if (f.indexExt && indexHoriz && othersCurled && !f.isPalmDown) {
      add('G', 0.80);
    }
  }

  // ── H ── Index and middle fingers together pointing horizontally sideways
  {
    const twoHoriz = Math.abs(pts[8].x - pts[5].x) > 0.35 && Math.abs(pts[12].x - pts[9].x) > 0.35;
    const othersCurled = !f.ringExt && !f.pinkyExt;
    if (f.indexExt && f.middleExt && twoHoriz && f.indexMiddleTogether && othersCurled) {
      add('H', 0.84);
    }
  }

  // ── I ── Pinky only straight up, other fingers curled, thumb folded across
  {
    const pinkyOnly = f.pinkyExt && !f.indexExt && !f.middleExt && !f.ringExt;
    if (pinkyOnly && !f.thumbExtOut) {
      add('I', 0.90);
    }
  }

  // ── J ── Pinky up with thumb out / tracing motion
  {
    const pinkyOnly = f.pinkyExt && !f.indexExt && !f.middleExt && !f.ringExt;
    if (pinkyOnly && f.thumbExtOut) {
      add('J', 0.75);
    }
  }

  // ── K ── Index up, middle up/forward, thumb between them at middle joint
  {
    const indexAndMiddleUp = f.indexExt && f.middleExt && !f.ringExt && !f.pinkyExt;
    const thumbBetween = dist(pts[4], pts[6]) < 0.52 && dist(pts[4], pts[10]) < 0.52;
    if (indexAndMiddleUp && thumbBetween && !f.indexMiddleTogether) {
      add('K', 0.82);
    }
  }

  // ── L ── Index straight up, thumb extended sideways (~90° L)
  {
    const onlyIndexUp = f.indexExt && !f.middleExt && !f.ringExt && !f.pinkyExt;
    if (onlyIndexUp && f.thumbExtOut) {
      add('L', 0.92);
    }
  }

  // ── M ── 3 fingers (index, middle, ring) folded over thumb
  {
    const thumbUnderThree = dist(pts[4], pts[14]) < 0.45;
    if (allFourCurled && thumbUnderThree) {
      add('M', 0.76);
    }
  }

  // ── N ── 2 fingers (index, middle) folded over thumb
  {
    const thumbUnderTwo = dist(pts[4], pts[10]) < 0.42 && dist(pts[4], pts[14]) > 0.45;
    if (allFourCurled && thumbUnderTwo) {
      add('N', 0.76);
    }
  }

  // ── O ── All fingertips touch thumb tip forming a closed round loop
  {
    const thumbTouchesTips = f.thumbNearIndexTip && f.thumbNearMiddleTip;
    const curledFingers = f.indexPipAngle < 135 && f.middlePipAngle < 135;
    if (thumbTouchesTips && curledFingers) {
      add('O', 0.86);
    }
  }

  // ── P ── Like K directed downwards (index & middle pointing down)
  {
    const indexDown = pts[8].y > pts[5].y + 0.15;
    const middleDown = pts[12].y > pts[9].y + 0.15;
    const othersCurled = !f.ringExt && !f.pinkyExt;
    if (indexDown && middleDown && othersCurled) {
      add('P', 0.78);
    }
  }

  // ── Q ── Like G directed downwards (index & thumb pointing down)
  {
    const indexDown = pts[8].y > pts[5].y + 0.18;
    const thumbDown = pts[4].y > pts[2].y + 0.10;
    const othersCurled = !f.middleExt && !f.ringExt && !f.pinkyExt;
    if (indexDown && thumbDown && othersCurled) {
      add('Q', 0.76);
    }
  }

  // ── R ── Index and middle fingers extended up and crossed over each other
  {
    if (f.indexMiddleCrossed && !f.ringExt && !f.pinkyExt) {
      add('R', 0.85);
    }
  }

  // ── S ── Fist with thumb wrapped across front of curled fingers
  {
    if (allFourCurled && f.thumbAcrossFront) {
      add('S', 0.84);
    }
  }

  // ── T ── Thumb tucked between index and middle fingers in fist
  {
    const thumbBetween = dist(pts[4], pts[6]) < 0.38 && dist(pts[4], pts[10]) < 0.40;
    if (allFourCurled && thumbBetween && !f.thumbAcrossFront) {
      add('T', 0.78);
    }
  }

  // ── U ── Index and middle fingers straight up held close together (parallel)
  {
    const twoUp = f.indexExt && f.middleExt && !f.ringExt && !f.pinkyExt;
    if (twoUp && f.indexMiddleTogether && !f.indexMiddleCrossed && !f.thumbExtOut) {
      add('U', 0.88);
    }
  }

  // ── V ── Index and middle fingers straight up spread apart in "V"
  {
    const twoUp = f.indexExt && f.middleExt && !f.ringExt && !f.pinkyExt;
    if (twoUp && !f.indexMiddleTogether && f.indexMiddleSep >= 0.24 && !f.thumbExtOut) {
      add('V', 0.90);
    }
  }

  // ── W ── Index, middle, and ring fingers extended straight up and spread apart
  {
    const threeUp = f.indexExt && f.middleExt && f.ringExt && !f.pinkyExt;
    if (threeUp && !f.middleRingTogether) {
      add('W', 0.88);
    }
  }

  // ── X ── Index finger hooked/bent at PIP joint, other fingers curled
  {
    const othersCurled = !f.middleExt && !f.ringExt && !f.pinkyExt;
    if (f.indexHooked && othersCurled) {
      add('X', 0.82);
    }
  }

  // ── Y ── Thumb and pinky extended wide, middle 3 curled ("shaka" sign)
  {
    const thumbAndPinky = f.thumbExtOut && f.pinkyExt && !f.indexExt && !f.middleExt && !f.ringExt;
    const wideSpan = dist(pts[4], pts[20]) > 0.75;
    if (thumbAndPinky && wideSpan) {
      add('Y', 0.90);
    }
  }

  // ── Z ── Index pointing horizontally/forward to trace Z
  {
    const onlyIndexUp = f.indexExt && !f.middleExt && !f.ringExt && !f.pinkyExt;
    if (onlyIndexUp && !f.thumbExtOut && !f.thumbNearMiddleTip) {
      add('Z', 0.70);
    }
  }

  return matches;
}

// ─── Main Classifier Class ──────────────────────────────────────────────────

export class ISLFingerspellingClassifier implements SignClassifier {
  readonly id = 'isl-fingerspelling';
  readonly name = 'ISL Fingerspelling A–Z';
  readonly license = 'MIT';
  readonly labels = [
    'A','B','C','D','E','F','G','H','I','J',
    'K','L','M','N','O','P','Q','R','S','T',
    'U','V','W','X','Y','Z'
  ] as const;

  async load(_signal?: AbortSignal): Promise<void> {
    // Pure geometric rule engine — zero network payload
  }

  async predict(allLandmarks: HandLandmarks[], handedness?: string[]): Promise<PredictionResult | null> {
    if (!allLandmarks || allLandmarks.length === 0) return null;

    // Use primary hand
    const hand = allLandmarks[0];
    const handLabel = handedness && handedness.length > 0 ? handedness[0] : undefined;
    const norm = normalise(hand, handLabel);
    if (!norm) return null;

    const { pts } = norm;
    const f = extractFingerState(pts, norm);
    const candidates = classifyLetter(pts, f);

    if (candidates.length === 0) return null;

    // Sort by confidence descending
    candidates.sort((a, b) => b.conf - a.conf);
    const best = candidates[0];

    // Minimum confidence floor
    if (best.conf < 0.62) return null;

    // Disambiguate if two top predictions are within narrow margin
    let finalConf = best.conf;
    const second = candidates[1];
    if (second && (best.conf - second.conf) < 0.05) {
      finalConf = best.conf * 0.88;
    }

    if (finalConf < 0.58) return null;

    const alternatives = candidates.slice(1, 4).map(c => ({
      label: c.letter,
      confidence: parseFloat(c.conf.toFixed(2)),
    }));

    return {
      label: best.letter,
      confidence: parseFloat(finalConf.toFixed(2)),
      description: `ISL Fingerspelling: ${best.letter}`,
      alternatives,
    };
  }

  dispose(): void {
    // No-op
  }
}
