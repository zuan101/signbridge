import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandLandmarks, TrackerStatus } from './types';
import { drawLandmarks } from './drawing';

interface UseHandTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isStreaming: boolean;
  showLandmarks: boolean;
  onFrame?: (landmarks: HandLandmarks[], handedness: string[], fps: number) => void;
}

export interface UseHandTrackerReturn {
  status: TrackerStatus;
  fps: number;
  detectedHandsCount: number;
  error: string | null;
}

export function useHandTracker({
  videoRef,
  canvasRef,
  isStreaming,
  showLandmarks,
  onFrame,
}: UseHandTrackerProps): UseHandTrackerReturn {
  const [status, setStatus] = useState<TrackerStatus>('uninitialized');
  const [fps, setFps] = useState<number>(0);
  const [detectedHandsCount, setDetectedHandsCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  // Initialize MediaPipe HandLandmarker using local bundled assets
  useEffect(() => {
    let isCancelled = false;

    async function initMediaPipe() {
      setStatus('loading');
      setError(null);
      try {
        // Try local WASM first, fall back if needed
        let visionWasm;
        try {
          visionWasm = await FilesetResolver.forVisionTasks('/wasm');
        } catch {
          console.warn('Local WASM path failed, attempting relative path...');
          visionWasm = await FilesetResolver.forVisionTasks('./wasm');
        }

        let landmarker: HandLandmarker;
        try {
          landmarker = await HandLandmarker.createFromOptions(visionWasm, {
            baseOptions: {
              modelAssetPath: '/models/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch (gpuErr) {
          console.warn('GPU delegate failed or unavailable, falling back to CPU delegate:', gpuErr);
          landmarker = await HandLandmarker.createFromOptions(visionWasm, {
            baseOptions: {
              modelAssetPath: '/models/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        if (isCancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setStatus('ready');
      } catch (err: unknown) {
        if (isCancelled) return;
        const e = err as Error;
        console.error('HandLandmarker initialization failed:', e);
        setStatus('error');
        setError(e.message || 'Failed to load hand tracking model.');
      }
    }

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {
          console.warn('Error closing landmarker:', e);
        }
        landmarkerRef.current = null;
      }
    };
  }, []);

  const lastInferenceTimeRef = useRef<number>(0);
  const lastTimestampMsRef = useRef<number>(0);

  // Main Detection Loop (Video stream -> Landmarker -> Canvas / Callbacks)
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2 || video.paused || video.ended) {
      if (isStreaming) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    const currentTime = video.currentTime;
    const now = performance.now();

    // Throttle inference to ~30 FPS (every ~32ms) to prevent CPU starvation and webcam lag
    const elapsedSinceLastInference = now - lastInferenceTimeRef.current;

    if (currentTime !== lastVideoTimeRef.current && elapsedSinceLastInference >= 32) {
      lastVideoTimeRef.current = currentTime;
      lastInferenceTimeRef.current = now;

      // Ensure monotonically increasing timestamp for MediaPipe
      const timestampMs = Math.max(now, lastTimestampMsRef.current + 1);
      lastTimestampMsRef.current = timestampMs;

      try {
        const results = landmarker.detectForVideo(video, timestampMs);
        const hands = results.landmarks || [];
        const handCount = hands.length;

        // Only trigger React state change if hand count changed
        setDetectedHandsCount(prev => prev === handCount ? prev : handCount);

        // Real FPS measurement
        frameCountRef.current += 1;
        const delta = now - lastFpsUpdateRef.current;
        if (delta >= 1000) {
          const currentFps = Math.round((frameCountRef.current * 1000) / delta);
          setFps(prev => Math.abs(prev - currentFps) > 1 ? currentFps : prev);
          frameCountRef.current = 0;
          lastFpsUpdateRef.current = now;
        }

        // Draw landmarks to canvas if enabled
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth || 640;
              canvas.height = video.videoHeight || 480;
            }

            if (showLandmarks && handCount > 0) {
              drawLandmarks(ctx, hands as HandLandmarks[], canvas.width, canvas.height);
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        }

        // Send to recognition classifier seam
        if (onFrameRef.current) {
          const handedness = (results.handednesses || []).map(h => h[0]?.categoryName || 'Unknown');
          onFrameRef.current(hands as HandLandmarks[], handedness, fps);
        }
      } catch (detErr) {
        console.warn('Hand detection error in loop:', detErr);
      }
    }

    if (isStreaming) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    }
  }, [canvasRef, isStreaming, showLandmarks, videoRef]);

  useEffect(() => {
    if (isStreaming && status === 'ready') {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    } else {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      setFps(0);
      setDetectedHandsCount(0);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isStreaming, status, processFrame, canvasRef]);

  return {
    status,
    fps,
    detectedHandsCount,
    error,
  };
}
