/**
 * useRecording Hook
 *
 * React hook that bridges Recording FSM with camera API and storage.
 * Manages recording lifecycle, countdown, timers, and file persistence.
 *
 * @module features/recording/hooks/useRecording
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { RecordingMachine, RecordingState } from '../fsm/recordingMachine';
import { createVideoMetadata } from '../api/videoMetadata';
import * as FileSystem from 'expo-file-system/legacy';
import { generateRawVideoFilename } from '../../../utils/fileNaming';
import { trackEvent } from '../../../analytics/telemetry';

export interface UseRecordingOptions {
  projectId?: string;
  scriptId?: string | null;
  maxDurationMs?: number;
  onStateChange?: (state: RecordingState) => void;
  onError?: (error: string) => void;
}

export interface RecordingControls {
  state: RecordingState;
  countdown: number;
  elapsedMs: number;
  maxDurationMs: number;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  abortCountdown: () => void;
  retake: () => void;
  accept: () => Promise<void>;
  filePath: string | null;
}

export function useRecording(options: UseRecordingOptions = {}): RecordingControls {
  const { projectId = 'default', scriptId = null, maxDurationMs = 120000, onStateChange, onError } = options;

  const [state, setState] = useState<RecordingState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [filePath, setFilePath] = useState<string | null>(null);

  const machineRef = useRef<RecordingMachine | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const videoIdRef = useRef<string>(`video-${Date.now()}`);

  // Initialize FSM
  useEffect(() => {
    machineRef.current = new RecordingMachine(projectId, scriptId, {
      maxDurationMs: 120000,
      countdownSeconds: 3,
    });

    // Subscribe to state changes
    const unsubscribe = machineRef.current.subscribe((newState, context) => {
      setState(newState);
      setCountdown(context.countdownRemaining);
      setElapsedMs(context.elapsedMs);
      if (context.filePath) {
        setFilePath(context.filePath);
      }
      onStateChange?.(newState);
    });

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [projectId, scriptId, onStateChange]);

  const clearTimers = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  // Start recording (triggers countdown)
  const startRecording = useCallback(() => {
    if (!machineRef.current) return;

    machineRef.current.grantPermissions();
    machineRef.current.send({ type: 'REQUEST_RECORD' });

    // Start countdown timer
    let remaining = 3;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      machineRef.current?.send({ type: 'COUNTDOWN_TICK', remaining });

      if (remaining === 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        // Start recording timer
        startRecordingTimer();
      }
    }, 1000);
  }, []);

  // Start recording timer
  const startRecordingTimer = useCallback(() => {
    startTimeRef.current = Date.now();

    // Track recording started event
    trackEvent({
      type: 'record_started',
      projectId,
      scriptId: scriptId || '',
      timestamp: new Date().toISOString(),
    });

    recordingTimerRef.current = setInterval(() => {
      if (!startTimeRef.current || !machineRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      machineRef.current.send({ type: 'RECORD_TICK', elapsedMs: elapsed });

      // Auto-stop at max duration
      if (elapsed >= maxDurationMs) {
        stopRecording();
        machineRef.current.send({ type: 'RECORD_TIMEOUT' });
      }
    }, 100); // Update every 100ms for smooth timer display
  }, [maxDurationMs, projectId, scriptId]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    machineRef.current?.send({ type: 'RECORD_PAUSE' });
    clearTimers();

    trackEvent({
      type: 'record_paused',
      projectId,
      videoId: videoIdRef.current,
      timestamp: new Date().toISOString(),
    });
  }, [clearTimers, projectId]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    machineRef.current?.send({ type: 'RECORD_RESUME' });
    startRecordingTimer();

    trackEvent({
      type: 'record_resumed',
      projectId,
      videoId: videoIdRef.current,
      timestamp: new Date().toISOString(),
    });
  }, [startRecordingTimer, projectId]);

  // Stop recording
  const stopRecording = useCallback(() => {
    clearTimers();
    machineRef.current?.send({ type: 'RECORD_STOP' });

    // Track cancelled event (user stopped recording)
    trackEvent({
      type: 'record_cancelled',
      projectId,
      reason: 'user',
      timestamp: new Date().toISOString(),
    });
  }, [clearTimers, projectId]);

  // Abort countdown
  const abortCountdown = useCallback(() => {
    clearTimers();
    machineRef.current?.send({ type: 'COUNTDOWN_ABORT' });

    // Track cancelled event (user aborted countdown)
    trackEvent({
      type: 'record_cancelled',
      projectId,
      reason: 'user',
      timestamp: new Date().toISOString(),
    });
  }, [clearTimers, projectId]);

  // Retake
  const retake = useCallback(() => {
    clearTimers();
    setElapsedMs(0);
    setCountdown(3);
    setFilePath(null);
    machineRef.current?.send({ type: 'REVIEW_RETAKE' });
  }, [clearTimers]);

  // Accept recording and save metadata
  const accept = useCallback(async () => {
    if (!machineRef.current) return;

    const context = machineRef.current.getContext();
    const videoId = `video-${Date.now()}`;

    try {
      // Generate file path
      const filename = generateRawVideoFilename(projectId);
      const videoDir = `${FileSystem.documentDirectory}videos/raw/${projectId}/`;
      const fullPath = `${videoDir}${filename}`;

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(videoDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(videoDir, { intermediates: true });
      }

      // In real implementation, this would save the actual video file
      // For now, we just set the path
      machineRef.current.setFilePath(fullPath);
      setFilePath(fullPath);

      // Save metadata
      await createVideoMetadata({
        assetId: videoId,
        projectId,
        scriptId,
        filePath: fullPath,
        width: 1080,
        height: 1920,
        fps: 30,
        durationMs: context.elapsedMs,
        sizeBytes: 0, // Would be actual file size
        createdAt: new Date().toISOString(),
        processingStatus: 'raw',
      });

      // Track recording completed event
      trackEvent({
        type: 'record_completed',
        projectId,
        videoId,
        durationSec: Math.floor(context.elapsedMs / 1000),
        timestamp: new Date().toISOString(),
      });

      // Transition to accept (would navigate away)
      machineRef.current.send({ type: 'REVIEW_ACCEPT' });
    } catch (error) {
      console.error('Failed to save recording:', error);
      onError?.('Failed to save recording');

      // Track cancelled event (error occurred)
      trackEvent({
        type: 'record_cancelled',
        projectId,
        reason: 'error',
        timestamp: new Date().toISOString(),
      });

      machineRef.current.send({
        type: 'RECORD_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [projectId, scriptId, onError]);

  return {
    state,
    countdown,
    elapsedMs,
    maxDurationMs,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    abortCountdown,
    retake,
    accept,
    filePath,
  };
}
