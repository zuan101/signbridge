export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export type HandLandmarks = LandmarkPoint[];

export interface TrackingFrameResult {
  landmarks: HandLandmarks[];
  handedness: string[];
  fps: number;
  handCount: number;
}

export type TrackerStatus = 'uninitialized' | 'loading' | 'ready' | 'error';
