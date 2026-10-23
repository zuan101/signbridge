import { useState, useRef, useEffect, useCallback } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'disconnected';

export interface UseCameraReturn {
  status: CameraStatus;
  isStreaming: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  devices: MediaDeviceInfo[];
  activeDeviceId: string;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  switchDevice: (deviceId: string) => Promise<void>;
}

export function useCamera(preferredDeviceId?: string): UseCameraReturn {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>(preferredDeviceId || '');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeTokenRef = useRef<number>(0);

  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
    } catch (e) {
      console.warn('Failed to enumerate video devices:', e);
    }
  }, []);

  const stopCamera = useCallback(() => {
    activeTokenRef.current += 1;
    stopAllTracks();
    setStatus('idle');
    setError(null);
  }, [stopAllTracks]);

  const startCamera = useCallback(async (requestedDeviceId?: string) => {
    const token = ++activeTokenRef.current;
    stopAllTracks();
    setStatus('requesting');
    setError(null);

    const deviceToUse = requestedDeviceId || activeDeviceId || undefined;

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceToUse ? { exact: deviceToUse } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: false,
    };

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Check for stale asynchronous resolution
      if (token !== activeTokenRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;

      // Listen for track ending (e.g. camera unplugged)
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          stopAllTracks();
          setStatus('disconnected');
          setError('Camera was disconnected or claimed by another application.');
        };
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => {
          console.warn('Video play interrupted:', e);
        });
      }

      // Update active device ID from real track settings
      const currentTrack = stream.getVideoTracks()[0];
      if (currentTrack) {
        const settings = currentTrack.getSettings();
        if (settings.deviceId) {
          setActiveDeviceId(settings.deviceId);
        }
      }

      setStatus('active');
      setError(null);
      await refreshDevices();
    } catch (err: unknown) {
      if (token !== activeTokenRef.current) return;
      stopAllTracks();

      const errorObj = err as Error;
      console.error('Camera access error:', errorObj);

      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        setStatus('denied');
        setError('Camera permission was denied. Please allow camera access in your browser site settings.');
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        setStatus('unavailable');
        setError('No camera device found on this system.');
      } else if (errorObj.name === 'NotReadableError' || errorObj.name === 'TrackStartError') {
        setStatus('unavailable');
        setError('Camera is currently in use by another application (e.g. Teams, Zoom) or inaccessible.');
      } else if (errorObj.name === 'OverconstrainedError') {
        // Fallback without deviceId constraint
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (token !== activeTokenRef.current) {
            fallbackStream.getTracks().forEach(t => t.stop());
            return;
          }
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
          }
          setStatus('active');
          setError(null);
          return;
        } catch {
          setStatus('unavailable');
          setError('Camera constraints could not be satisfied.');
        }
      } else {
        setStatus('unavailable');
        setError(errorObj.message || 'Unable to start camera.');
      }
    }
  }, [activeDeviceId, refreshDevices, stopAllTracks]);

  const switchDevice = useCallback(async (newDeviceId: string) => {
    setActiveDeviceId(newDeviceId);
    if (status === 'active' || status === 'requesting') {
      await startCamera(newDeviceId);
    }
  }, [startCamera, status]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      activeTokenRef.current += 1;
      stopAllTracks();
    };
  }, [stopAllTracks]);

  return {
    status,
    isStreaming: status === 'active',
    error,
    videoRef,
    devices,
    activeDeviceId,
    startCamera,
    stopCamera,
    switchDevice,
  };
}
