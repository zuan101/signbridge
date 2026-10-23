import { describe, it, expect } from 'vitest';
import { ISLNumbersClassifier } from '../features/recognition/adapters/ISLNumbersClassifier';
import { ISLPhrasesClassifier } from '../features/recognition/adapters/ISLPhrasesClassifier';
import type { HandLandmarks, LandmarkPoint } from '../features/tracking/types';

function createHand(overrides: Partial<Record<number, LandmarkPoint>> = {}): HandLandmarks {
  const hand: HandLandmarks = [];
  for (let i = 0; i < 21; i++) {
    hand.push({ x: 0.5, y: 0.7, z: 0 });
  }
  // Wrist at (0.5, 0.8)
  hand[0] = overrides[0] || { x: 0.5, y: 0.8, z: 0 };
  // Thumb CMC (1), MCP (2), IP (3), Tip (4)
  hand[1] = overrides[1] || { x: 0.45, y: 0.75, z: 0 };
  hand[2] = overrides[2] || { x: 0.42, y: 0.70, z: 0 };
  hand[3] = overrides[3] || { x: 0.40, y: 0.65, z: 0 };
  hand[4] = overrides[4] || { x: 0.38, y: 0.60, z: 0 };
  // Index MCP (5), PIP (6), DIP (7), Tip (8)
  hand[5] = overrides[5] || { x: 0.46, y: 0.55, z: 0 };
  hand[6] = overrides[6] || { x: 0.46, y: 0.60, z: 0 };
  hand[7] = overrides[7] || { x: 0.46, y: 0.65, z: 0 };
  hand[8] = overrides[8] || { x: 0.46, y: 0.70, z: 0 };
  // Middle MCP (9), PIP (10), DIP (11), Tip (12)
  hand[9] = overrides[9] || { x: 0.50, y: 0.52, z: 0 };
  hand[10] = overrides[10] || { x: 0.50, y: 0.60, z: 0 };
  hand[11] = overrides[11] || { x: 0.50, y: 0.65, z: 0 };
  hand[12] = overrides[12] || { x: 0.50, y: 0.70, z: 0 };
  // Ring MCP (13), PIP (14), DIP (15), Tip (16)
  hand[13] = overrides[13] || { x: 0.54, y: 0.55, z: 0 };
  hand[14] = overrides[14] || { x: 0.54, y: 0.60, z: 0 };
  hand[15] = overrides[15] || { x: 0.54, y: 0.65, z: 0 };
  hand[16] = overrides[16] || { x: 0.54, y: 0.70, z: 0 };
  // Pinky MCP (17), PIP (18), DIP (19), Tip (20)
  hand[17] = overrides[17] || { x: 0.58, y: 0.58, z: 0 };
  hand[18] = overrides[18] || { x: 0.58, y: 0.62, z: 0 };
  hand[19] = overrides[19] || { x: 0.58, y: 0.66, z: 0 };
  hand[20] = overrides[20] || { x: 0.58, y: 0.70, z: 0 };

  for (const [key, pt] of Object.entries(overrides)) {
    if (pt) hand[Number(key)] = pt;
  }
  return hand;
}

describe('ISLNumbersClassifier (0–9)', () => {
  const classifier = new ISLNumbersClassifier();

  it('exposes labels 0 through 9', () => {
    expect(classifier.labels).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });

  it('returns null on empty input', async () => {
    expect(await classifier.predict([])).toBeNull();
  });

  it('recognises Number 1 (index extended straight up, others curled)', async () => {
    const hand = createHand({
      // Index extended straight up
      5: { x: 0.46, y: 0.50, z: 0 },
      6: { x: 0.46, y: 0.38, z: 0 },
      7: { x: 0.46, y: 0.28, z: 0 },
      8: { x: 0.46, y: 0.16, z: 0 },
      // Middle, ring, pinky curled down
      9: { x: 0.50, y: 0.52, z: 0 },
      10: { x: 0.50, y: 0.62, z: 0 },
      12: { x: 0.50, y: 0.72, z: 0 },
      13: { x: 0.54, y: 0.55, z: 0 },
      14: { x: 0.54, y: 0.62, z: 0 },
      16: { x: 0.54, y: 0.72, z: 0 },
      17: { x: 0.58, y: 0.58, z: 0 },
      18: { x: 0.58, y: 0.62, z: 0 },
      20: { x: 0.58, y: 0.72, z: 0 },
      // Thumb folded across
      4: { x: 0.48, y: 0.65, z: 0 },
    });

    const res = await classifier.predict([hand]);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('1');
    expect(res?.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('recognises Number 2 (index and middle extended up)', async () => {
    const hand = createHand({
      // Index extended straight up
      5: { x: 0.46, y: 0.50, z: 0 },
      6: { x: 0.46, y: 0.38, z: 0 },
      7: { x: 0.46, y: 0.28, z: 0 },
      8: { x: 0.46, y: 0.16, z: 0 },
      // Middle extended straight up
      9: { x: 0.50, y: 0.50, z: 0 },
      10: { x: 0.50, y: 0.38, z: 0 },
      11: { x: 0.50, y: 0.28, z: 0 },
      12: { x: 0.50, y: 0.16, z: 0 },
      // Ring, pinky curled down
      13: { x: 0.54, y: 0.55, z: 0 },
      14: { x: 0.54, y: 0.62, z: 0 },
      16: { x: 0.54, y: 0.72, z: 0 },
      17: { x: 0.58, y: 0.58, z: 0 },
      18: { x: 0.58, y: 0.62, z: 0 },
      20: { x: 0.58, y: 0.72, z: 0 },
      // Thumb folded
      4: { x: 0.48, y: 0.65, z: 0 },
    });

    const res = await classifier.predict([hand]);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('2');
  });

  it('recognises Number 5 (all 5 fingers extended open)', async () => {
    const hand = createHand({
      // Thumb extended out
      1: { x: 0.45, y: 0.70, z: 0 },
      2: { x: 0.38, y: 0.65, z: 0 },
      3: { x: 0.26, y: 0.60, z: 0 },
      4: { x: 0.14, y: 0.55, z: 0 },
      // Index extended
      5: { x: 0.46, y: 0.50, z: 0 },
      6: { x: 0.44, y: 0.36, z: 0 },
      7: { x: 0.43, y: 0.26, z: 0 },
      8: { x: 0.42, y: 0.14, z: 0 },
      // Middle extended
      9: { x: 0.50, y: 0.48, z: 0 },
      10: { x: 0.50, y: 0.34, z: 0 },
      11: { x: 0.50, y: 0.24, z: 0 },
      12: { x: 0.50, y: 0.12, z: 0 },
      // Ring extended
      13: { x: 0.54, y: 0.50, z: 0 },
      14: { x: 0.56, y: 0.36, z: 0 },
      15: { x: 0.57, y: 0.26, z: 0 },
      16: { x: 0.58, y: 0.14, z: 0 },
      // Pinky extended
      17: { x: 0.58, y: 0.52, z: 0 },
      18: { x: 0.62, y: 0.40, z: 0 },
      19: { x: 0.65, y: 0.30, z: 0 },
      20: { x: 0.68, y: 0.20, z: 0 },
    });

    const res = await classifier.predict([hand]);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('5');
    expect(res?.confidence).toBeGreaterThanOrEqual(0.90);
  });
});

describe('ISLPhrasesClassifier (Greetings & Conversational Signs)', () => {
  const classifier = new ISLPhrasesClassifier();

  it('exposes conversational sign labels', () => {
    expect(classifier.labels).toContain('Namaste / Hello');
    expect(classifier.labels).toContain('Thank You');
    expect(classifier.labels).toContain('Please Wait');
    expect(classifier.labels).toContain('Help');
    expect(classifier.labels).toContain('Yes / Agree');
  });

  it('returns null on empty input', async () => {
    expect(await classifier.predict([])).toBeNull();
  });

  it('recognises Namaste / Hello when two hands are joined in front of chest', async () => {
    const leftHand = createHand({
      0: { x: 0.46, y: 0.65, z: 0 },
      9: { x: 0.46, y: 0.45, z: 0 },
    });
    const rightHand = createHand({
      0: { x: 0.54, y: 0.65, z: 0 },
      9: { x: 0.54, y: 0.45, z: 0 },
    });

    const res = await classifier.predict([leftHand, rightHand]);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('Namaste / Hello');
    expect(res?.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('recognises Yes / Agree with a thumbs up gesture', async () => {
    const hand = createHand({
      // Thumb extended straight up
      1: { x: 0.45, y: 0.70, z: 0 },
      2: { x: 0.42, y: 0.60, z: 0 },
      3: { x: 0.40, y: 0.45, z: 0 },
      4: { x: 0.40, y: 0.30, z: 0 },
      // Index, middle, ring, pinky curled tight into palm
      5: { x: 0.48, y: 0.55, z: 0 },
      6: { x: 0.48, y: 0.62, z: 0 },
      8: { x: 0.48, y: 0.72, z: 0 },
      9: { x: 0.52, y: 0.52, z: 0 },
      10: { x: 0.52, y: 0.62, z: 0 },
      12: { x: 0.52, y: 0.72, z: 0 },
      13: { x: 0.55, y: 0.54, z: 0 },
      14: { x: 0.55, y: 0.62, z: 0 },
      16: { x: 0.55, y: 0.72, z: 0 },
      17: { x: 0.58, y: 0.56, z: 0 },
      18: { x: 0.58, y: 0.62, z: 0 },
      20: { x: 0.58, y: 0.72, z: 0 },
    });

    const res = await classifier.predict([hand]);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('Yes / Agree');
  });

  it('recognises Please Wait when open flat palm faces camera', async () => {
    const hand = createHand({
      // All 4 fingers pointing straight up
      5: { x: 0.46, y: 0.50, z: 0 },
      6: { x: 0.46, y: 0.38, z: 0 },
      8: { x: 0.46, y: 0.16, z: 0 },
      9: { x: 0.50, y: 0.48, z: 0 },
      10: { x: 0.50, y: 0.36, z: 0 },
      12: { x: 0.50, y: 0.15, z: 0 },
      13: { x: 0.54, y: 0.50, z: 0 },
      14: { x: 0.54, y: 0.38, z: 0 },
      16: { x: 0.54, y: 0.16, z: 0 },
      17: { x: 0.58, y: 0.52, z: 0 },
      18: { x: 0.58, y: 0.40, z: 0 },
      20: { x: 0.58, y: 0.20, z: 0 },
      // Thumb tucked gently
      4: { x: 0.42, y: 0.58, z: 0 },
    });

    const res = await classifier.predict([hand]);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('Please Wait');
  });
});
