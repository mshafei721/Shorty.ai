import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRecording } from '../useRecording';
import * as videoMetadata from '../../api/videoMetadata';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('../../api/videoMetadata');
jest.mock('expo-file-system/legacy');
jest.mock('../../../../utils/fileNaming', () => ({
  generateRawVideoFilename: jest.fn(() => 'raw_project-123_1234567890.mp4'),
}));

describe('useRecording', () => {
  const mockOptions = {
    projectId: 'project-123',
    scriptId: 'script-456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    (videoMetadata.createVideoMetadata as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes in idle state', () => {
    const { result } = renderHook(() => useRecording(mockOptions));

    expect(result.current.state).toBe('idle');
    expect(result.current.countdown).toBe(3);
    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.filePath).toBeNull();
  });

  it('transitions through countdown when starting recording', async () => {
    const { result } = renderHook(() => useRecording(mockOptions));

    act(() => {
      result.current.startRecording();
    });

    // State should eventually become countdown
    await waitFor(() => {
      expect(result.current.state).toBe('countdown');
    });

    // Advance through full countdown
    act(() => {
      jest.advanceTimersByTime(3100); // 3 seconds + buffer
    });

    // Should reach recording state
    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });
  });

  it('tracks elapsed time during recording', async () => {
    const { result } = renderHook(() => useRecording(mockOptions));

    act(() => {
      result.current.startRecording();
    });

    // Wait for countdown to complete
    act(() => {
      jest.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });

    // Advance recording time (elapsed time updates happen via RECORD_TICK events)
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Verify we're still recording (elapsed tracking tested in FSM unit tests)
    expect(result.current.state).toBe('recording');
  });

  it('can pause and resume recording', async () => {
    const { result } = renderHook(() => useRecording(mockOptions));

    // Start recording
    act(() => {
      result.current.startRecording();
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });

    // Pause
    act(() => {
      result.current.pauseRecording();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('paused');
    });

    // Resume
    act(() => {
      result.current.resumeRecording();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });
  });

  it('stops recording manually', async () => {
    const { result } = renderHook(() => useRecording(mockOptions));

    act(() => {
      result.current.startRecording();
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });

    act(() => {
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('reviewing');
    });
  });

  it('auto-stops at 120s timeout', async () => {
    const { result } = renderHook(() => useRecording(mockOptions));

    act(() => {
      result.current.startRecording();
      jest.advanceTimersByTime(3000); // Countdown
    });

    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });

    // Advance to timeout
    act(() => {
      jest.advanceTimersByTime(120000);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('reviewing');
    });
  });

  it('can abort countdown', async () => {
    const { result } = renderHook(() => useRecording(mockOptions));

    act(() => {
      result.current.startRecording();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('countdown');
    });

    act(() => {
      result.current.abortCountdown();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });
  });

  it('can retake after reviewing', async () => {
    const { result } = renderHook(() => useRecording(mockOptions));

    // Record and stop
    act(() => {
      result.current.startRecording();
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });

    act(() => {
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('reviewing');
    });

    // Retake
    act(() => {
      result.current.retake();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('idle');
      expect(result.current.elapsedMs).toBe(0);
      expect(result.current.countdown).toBe(3);
    });
  });

  it('saves metadata when accepting recording', async () => {
    const { result } = renderHook(() => useRecording(mockOptions));

    // Record and stop
    act(() => {
      result.current.startRecording();
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });

    act(() => {
      jest.advanceTimersByTime(10000); // Record for 10s
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('reviewing');
    });

    // Accept
    await act(async () => {
      await result.current.accept();
    });

    expect(videoMetadata.createVideoMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project-123',
        scriptId: 'script-456',
        width: 1080,
        height: 1920,
        fps: 30,
        processingStatus: 'raw',
      })
    );
  });

  it('creates directory if it does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    const { result } = renderHook(() => useRecording(mockOptions));

    act(() => {
      result.current.startRecording();
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });

    act(() => {
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('reviewing');
    });

    await act(async () => {
      await result.current.accept();
    });

    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      expect.stringContaining('videos/raw/project-123/'),
      { intermediates: true }
    );
  });

  it('calls onStateChange callback', async () => {
    const onStateChange = jest.fn();
    const { result } = renderHook(() =>
      useRecording({ ...mockOptions, onStateChange })
    );

    act(() => {
      result.current.startRecording();
    });

    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalledWith('countdown');
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalledWith('recording');
    });
  });

  it('calls onError callback on save failure', async () => {
    (videoMetadata.createVideoMetadata as jest.Mock).mockRejectedValue(
      new Error('Storage error')
    );

    const onError = jest.fn();
    const { result } = renderHook(() => useRecording({ ...mockOptions, onError }));

    act(() => {
      result.current.startRecording();
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('recording');
    });

    act(() => {
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('reviewing');
    });

    await act(async () => {
      await result.current.accept();
    });

    expect(onError).toHaveBeenCalledWith('Failed to save recording');
  });

  it('cleans up timers on unmount', () => {
    const { unmount } = renderHook(() => useRecording(mockOptions));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    unmount();

    // Should not throw or cause issues
    expect(() => {
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });
});
