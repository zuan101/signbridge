import type { PredictionResult } from './types';

/**
 * TemporalBuffer — stabilises noisy per-frame predictions before emitting a letter.
 *
 * For fingerspelling, settings are tighter than for whole-word signs:
 *  - capacity: 5 frames (rolling window)
 *  - minStableFrames: 3 (letter must be dominant for 3 consecutive-ish frames)
 *  - cooldownMs: 700ms per letter (allows typing at ~1.4 letters/sec)
 *  - confidenceThreshold: 0.60
 *
 * For whole-sign recognition (full words / phrases), callers can pass
 * larger values (e.g. cooldownMs=1200, minStable=4).
 */
export class TemporalBuffer {
  private buffer: Array<PredictionResult | null> = [];
  private capacity: number;
  private minStableFrames: number;
  private confidenceThreshold: number;
  private lastEmittedLabel: string | null = null;
  private lastEmittedTime: number = 0;
  private cooldownMs: number;

  /** Whether the hand was present in the most recent frame */
  private handPresent = false;

  constructor(
    capacity: number = 5,
    minStableFrames: number = 3,
    confidenceThreshold: number = 0.62,
    cooldownMs: number = 700          // ← faster for fingerspelling
  ) {
    this.capacity = capacity;
    this.minStableFrames = minStableFrames;
    this.confidenceThreshold = confidenceThreshold;
    this.cooldownMs = cooldownMs;
  }

  updateConfig(minStable: number, threshold: number, cooldownMs?: number): void {
    this.minStableFrames = minStable;
    this.confidenceThreshold = threshold;
    if (cooldownMs !== undefined) this.cooldownMs = cooldownMs;
  }

  push(prediction: PredictionResult | null): PredictionResult | null {
    this.handPresent = prediction !== null;

    this.buffer.push(prediction);
    if (this.buffer.length > this.capacity) {
      this.buffer.shift();
    }

    if (!prediction) {
      // If several frames in a row have no hand, allow re-triggering the same letter
      const allNull = this.buffer.every(p => p === null);
      if (allNull) {
        this.lastEmittedLabel = null;
      }
      return null;
    }

    // Check if cooldown is active
    const now = performance.now();
    if (now - this.lastEmittedTime < this.cooldownMs) {
      return null;
    }

    // Tally predictions in window that meet the confidence bar
    const labelCounts = new Map<string, { count: number; totalConf: number; result: PredictionResult }>();

    for (const item of this.buffer) {
      if (item && item.confidence >= this.confidenceThreshold) {
        const existing = labelCounts.get(item.label) ?? { count: 0, totalConf: 0, result: item };
        existing.count += 1;
        existing.totalConf += item.confidence;
        labelCounts.set(item.label, existing);
      }
    }

    // Find the dominant stable label
    for (const [label, data] of labelCounts.entries()) {
      if (data.count >= this.minStableFrames) {
        // Don't re-emit the same letter while holding the sign
        if (label === this.lastEmittedLabel) {
          return null;
        }

        this.lastEmittedLabel = label;
        this.lastEmittedTime = now;
        return {
          ...data.result,
          confidence: parseFloat((data.totalConf / data.count).toFixed(2)),
        };
      }
    }

    return null;
  }

  /** Whether the hand was present in the last pushed frame */
  get isHandPresent(): boolean {
    return this.handPresent;
  }

  reset(): void {
    this.buffer = [];
    this.lastEmittedLabel = null;
    this.lastEmittedTime = 0;
    this.handPresent = false;
  }
}
