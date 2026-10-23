import type { PredictionResult } from './types';

export class TemporalBuffer {
  private buffer: Array<PredictionResult | null> = [];
  private capacity: number;
  private minStableFrames: number;
  private confidenceThreshold: number;
  private lastEmittedLabel: string | null = null;
  private lastEmittedTime: number = 0;
  private cooldownMs: number;

  constructor(
    capacity: number = 6,
    minStableFrames: number = 4,
    confidenceThreshold: number = 0.70,
    cooldownMs: number = 1200
  ) {
    this.capacity = capacity;
    this.minStableFrames = minStableFrames;
    this.confidenceThreshold = confidenceThreshold;
    this.cooldownMs = cooldownMs;
  }

  updateConfig(minStable: number, threshold: number): void {
    this.minStableFrames = minStable;
    this.confidenceThreshold = threshold;
  }

  push(prediction: PredictionResult | null): PredictionResult | null {
    this.buffer.push(prediction);
    if (this.buffer.length > this.capacity) {
      this.buffer.shift();
    }

    if (!prediction) {
      // If hand was removed, reset last emitted label so the same gesture can be signed again
      if (this.buffer.every(p => p === null)) {
        this.lastEmittedLabel = null;
      }
      return null;
    }

    // Check if cooldown is active
    const now = performance.now();
    if (now - this.lastEmittedTime < this.cooldownMs) {
      return null;
    }

    // Count stable predictions in the buffer
    const labelCounts = new Map<string, { count: number; totalConf: number; result: PredictionResult }>();

    for (const item of this.buffer) {
      if (item && item.confidence >= this.confidenceThreshold) {
        const existing = labelCounts.get(item.label) || { count: 0, totalConf: 0, result: item };
        existing.count += 1;
        existing.totalConf += item.confidence;
        labelCounts.set(item.label, existing);
      }
    }

    // Find dominant stable label
    for (const [label, data] of labelCounts.entries()) {
      if (data.count >= this.minStableFrames) {
        // Prevent repeat proposal while holding sign
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

  reset(): void {
    this.buffer = [];
    this.lastEmittedLabel = null;
    this.lastEmittedTime = 0;
  }
}
