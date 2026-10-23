import { describe, it, expect } from 'vitest';
import { ISLGeometricClassifier } from '../features/recognition/adapters/ISLGeometricClassifier';
import { TemporalBuffer } from '../features/recognition/temporalSmoothing';
import type { HandLandmarks, LandmarkPoint } from '../features/tracking/types';

// Helper to create a dummy hand with 21 points
function createHand(overrides: Partial<Record<number, LandmarkPoint>> = {}): HandLandmarks {
  const hand: HandLandmarks = [];
  for (let i = 0; i < 21; i++) {
    // Default folded hand: joints close to wrist (0, 0, 0)
    hand.push(overrides[i] || { x: 0.5, y: 0.5 + i * 0.01, z: 0 });
  }
  // Set wrist at (0.5, 0.8, 0)
  hand[0] = overrides[0] || { x: 0.5, y: 0.8, z: 0 };
  // Set middle MCP at (0.5, 0.5, 0) -> scale = 0.3
  hand[9] = overrides[9] || { x: 0.5, y: 0.5, z: 0 };
  return hand;
}

describe('ISLGeometricClassifier', () => {
  const classifier = new ISLGeometricClassifier();

  it('returns null when no landmarks are provided', async () => {
    const res = await classifier.predict([]);
    expect(res).toBeNull();
  });

  it('predicts Number 1 when only index finger is extended', async () => {
    const hand = createHand({
      // Index PIP at 0.45, Tip at 0.15 (far from wrist at 0.8)
      6: { x: 0.5, y: 0.45, z: 0 },
      8: { x: 0.5, y: 0.15, z: 0 },
      // Other fingers folded close to wrist
      10: { x: 0.5, y: 0.70, z: 0 },
      12: { x: 0.5, y: 0.72, z: 0 },
      14: { x: 0.5, y: 0.70, z: 0 },
      16: { x: 0.5, y: 0.72, z: 0 },
      18: { x: 0.5, y: 0.70, z: 0 },
      20: { x: 0.5, y: 0.72, z: 0 },
      2: { x: 0.5, y: 0.75, z: 0 },
      4: { x: 0.5, y: 0.74, z: 0 },
    });

    const res = await classifier.predict([hand]);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('Number 1');
    expect(res?.confidence).toBeGreaterThan(0.65);
  });

  it('predicts Number 2 when index and middle fingers are extended', async () => {
    const hand = createHand({
      6: { x: 0.45, y: 0.45, z: 0 },
      8: { x: 0.45, y: 0.15, z: 0 },
      10: { x: 0.55, y: 0.45, z: 0 },
      12: { x: 0.55, y: 0.15, z: 0 },
      14: { x: 0.5, y: 0.70, z: 0 },
      16: { x: 0.5, y: 0.72, z: 0 },
      18: { x: 0.5, y: 0.70, z: 0 },
      20: { x: 0.5, y: 0.72, z: 0 },
      2: { x: 0.5, y: 0.75, z: 0 },
      4: { x: 0.5, y: 0.74, z: 0 },
    });

    const res = await classifier.predict([hand]);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('Number 2');
    expect(res?.confidence).toBeGreaterThan(0.70);
  });

  it('predicts Namaste when two hands are positioned in greeting symmetry', async () => {
    const h1 = createHand({ 0: { x: 0.45, y: 0.6, z: 0 }, 9: { x: 0.45, y: 0.4, z: 0 } });
    const h2 = createHand({ 0: { x: 0.55, y: 0.6, z: 0 }, 9: { x: 0.55, y: 0.4, z: 0 } });

    const res = await classifier.predict([h1, h2]);
    expect(res).not.toBeNull();
    expect(res?.label).toBe('Namaste');
    expect(res?.confidence).toBeGreaterThan(0.70);
  });
});

describe('TemporalBuffer (Smoothing & Cooldown)', () => {
  it('does not emit until minimum stable frames are met', () => {
    const buffer = new TemporalBuffer(6, 3, 0.70, 500);

    const pred1 = buffer.push({ label: 'Number 1', confidence: 0.85 });
    expect(pred1).toBeNull();

    const pred2 = buffer.push({ label: 'Number 1', confidence: 0.85 });
    expect(pred2).toBeNull();

    // Third stable frame triggers emission
    const pred3 = buffer.push({ label: 'Number 1', confidence: 0.85 });
    expect(pred3).not.toBeNull();
    expect(pred3?.label).toBe('Number 1');
  });

  it('prevents repeated emission while holding the same sign', () => {
    const buffer = new TemporalBuffer(6, 2, 0.70, 1000);

    buffer.push({ label: 'Number 1', confidence: 0.85 });
    const firstEmit = buffer.push({ label: 'Number 1', confidence: 0.85 });
    expect(firstEmit).not.toBeNull();

    // Subsequent frame while holding sign should not repeat
    const secondEmit = buffer.push({ label: 'Number 1', confidence: 0.85 });
    expect(secondEmit).toBeNull();
  });
});
