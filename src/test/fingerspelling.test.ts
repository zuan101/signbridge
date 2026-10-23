import { describe, it, expect } from 'vitest';
import { ISLFingerspellingClassifier } from '../features/recognition/adapters/ISLFingerspellingClassifier';
import { WordBuilder } from '../features/recognition/WordBuilder';
import { getWordSuggestions } from '../features/recognition/ISLDictionary';
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

  // Apply explicit overrides
  for (const [key, pt] of Object.entries(overrides)) {
    if (pt) hand[Number(key)] = pt;
  }

  return hand;
}

describe('ISLFingerspellingClassifier', () => {
  const classifier = new ISLFingerspellingClassifier();

  it('has 26 letter labels A through Z', () => {
    expect(classifier.labels.length).toBe(26);
    expect(classifier.labels[0]).toBe('A');
    expect(classifier.labels[25]).toBe('Z');
  });

  it('returns null on empty landmarks or null input', async () => {
    expect(await classifier.predict([])).toBeNull();
  });

  it('recognises letter L (index pointing up, thumb extended sideways)', async () => {
    const hand = createHand({
      // Index extended straight up
      5: { x: 0.48, y: 0.50, z: 0 },
      6: { x: 0.48, y: 0.38, z: 0 },
      7: { x: 0.48, y: 0.28, z: 0 },
      8: { x: 0.48, y: 0.16, z: 0 },
      // Thumb extended horizontally outward
      1: { x: 0.45, y: 0.70, z: 0 },
      2: { x: 0.38, y: 0.65, z: 0 },
      3: { x: 0.26, y: 0.60, z: 0 },
      4: { x: 0.14, y: 0.58, z: 0 },
      // Middle, ring, pinky curled down into palm
      9: { x: 0.52, y: 0.50, z: 0 },
      10: { x: 0.52, y: 0.62, z: 0 },
      12: { x: 0.52, y: 0.72, z: 0 },
      13: { x: 0.56, y: 0.52, z: 0 },
      14: { x: 0.56, y: 0.62, z: 0 },
      16: { x: 0.56, y: 0.72, z: 0 },
      17: { x: 0.60, y: 0.55, z: 0 },
      18: { x: 0.60, y: 0.62, z: 0 },
      20: { x: 0.60, y: 0.72, z: 0 },
    });

    const res = await classifier.predict([hand], ['Right']);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('L');
    expect(res?.confidence).toBeGreaterThanOrEqual(0.70);
  });

  it('recognises letter V (index and middle fingers extended up spread apart)', async () => {
    const hand = createHand({
      // Index extended up to the left
      5: { x: 0.46, y: 0.50, z: 0 },
      6: { x: 0.42, y: 0.38, z: 0 },
      8: { x: 0.34, y: 0.16, z: 0 },
      // Middle extended up to the right
      9: { x: 0.52, y: 0.50, z: 0 },
      10: { x: 0.56, y: 0.38, z: 0 },
      12: { x: 0.64, y: 0.16, z: 0 },
      // Ring and pinky curled down
      13: { x: 0.56, y: 0.55, z: 0 },
      14: { x: 0.56, y: 0.64, z: 0 },
      16: { x: 0.56, y: 0.72, z: 0 },
      17: { x: 0.60, y: 0.58, z: 0 },
      18: { x: 0.60, y: 0.64, z: 0 },
      20: { x: 0.60, y: 0.72, z: 0 },
      // Thumb folded across palm
      4: { x: 0.50, y: 0.60, z: 0 },
    });

    const res = await classifier.predict([hand], ['Right']);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('V');
  });

  it('recognises letter Y (thumb and pinky extended, middle 3 curled)', async () => {
    const hand = createHand({
      // Thumb extended outward
      1: { x: 0.45, y: 0.70, z: 0 },
      4: { x: 0.16, y: 0.55, z: 0 },
      // Pinky extended outward on opposite side
      17: { x: 0.58, y: 0.55, z: 0 },
      18: { x: 0.64, y: 0.40, z: 0 },
      20: { x: 0.74, y: 0.20, z: 0 },
      // Index, middle, ring curled into palm
      5: { x: 0.48, y: 0.55, z: 0 },
      8: { x: 0.48, y: 0.72, z: 0 },
      9: { x: 0.52, y: 0.52, z: 0 },
      12: { x: 0.52, y: 0.72, z: 0 },
      13: { x: 0.55, y: 0.54, z: 0 },
      16: { x: 0.55, y: 0.72, z: 0 },
    });

    const res = await classifier.predict([hand], ['Right']);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('Y');
  });
});

describe('WordBuilder Engine & Hold-to-Confirm', () => {
  it('accumulates confirmed letters into words without repeating held signs', () => {
    // 0ms hold for immediate test emission
    const builder = new WordBuilder(0, 1500, 300);

    // Letter 'H' held across multiple frames
    builder.push('H', true);
    builder.push('H', true);
    builder.push('H', true);
    expect(builder.text).toBe('H');

    // Next letter 'I'
    builder.push('I', true);
    builder.push('I', true);
    expect(builder.text).toBe('HI');
  });

  it('tracks hold progress correctly when hold duration is configured', () => {
    const builder = new WordBuilder(200, 1500, 300);

    const s1 = builder.push('A', true);
    expect(s1.holdLetter).toBe('A');
    // First push starts hold timer; text should not yet have committed
    expect(s1.text).toBe('');
  });

  it('supports word completion, backspace, and clear', () => {
    const builder = new WordBuilder(0);
    builder.push('C', true);
    builder.push('A', true);
    builder.push('T', true);
    expect(builder.text).toBe('CAT');
    expect(builder.currentWord).toBe('CAT');

    // Autocomplete word
    builder.completeWord('CATER');
    expect(builder.text).toBe('CATER ');

    // Backspace
    builder.backspace();
    expect(builder.text).toBe('CATER');

    // Clear
    builder.reset();
    expect(builder.text).toBe('');
  });
});

describe('ISLDictionary Suggestions', () => {
  it('provides matching completions for unfinished prefixes', () => {
    const helpSuggestions = getWordSuggestions('HEL');
    expect(helpSuggestions).toContain('HELP');
    expect(helpSuggestions).toContain('HELLO');

    const waterSuggestions = getWordSuggestions('WAT');
    expect(waterSuggestions).toContain('WATER');
  });

  it('returns empty array on empty input', () => {
    expect(getWordSuggestions('')).toEqual([]);
    expect(getWordSuggestions('   ')).toEqual([]);
  });
});
