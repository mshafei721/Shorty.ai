import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CameraPreview } from '../CameraPreview';

describe('CameraPreview', () => {
  const mockProps = {
    isRecording: false,
    isPaused: false,
    elapsedMs: 0,
    maxDurationMs: 120000,
    onStartPress: jest.fn(),
    onStopPress: jest.fn(),
    onPausePress: jest.fn(),
    onResumePress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Idle State', () => {
    it('renders camera preview placeholder', () => {
      const { getByText } = render(<CameraPreview {...mockProps} />);

      expect(getByText(/Camera Preview/)).toBeTruthy();
      expect(getByText(/1080×1920 @ 30fps/)).toBeTruthy();
    });

    it('shows start button when not recording', () => {
      const { getByTestId } = render(<CameraPreview {...mockProps} />);

      const startButton = getByTestId('start-button');
      expect(startButton).toBeTruthy();
    });

    it('calls onStartPress when start button pressed', () => {
      const { getByTestId } = render(<CameraPreview {...mockProps} />);

      fireEvent.press(getByTestId('start-button'));
      expect(mockProps.onStartPress).toHaveBeenCalledTimes(1);
    });

    it('does not show recording indicator when idle', () => {
      const { queryByText } = render(<CameraPreview {...mockProps} />);

      expect(queryByText('REC')).toBeNull();
      expect(queryByText('PAUSED')).toBeNull();
    });

    it('does not show timer when idle', () => {
      const { queryByText } = render(<CameraPreview {...mockProps} />);

      expect(queryByText(/\d{2}:\d{2}/)).toBeNull();
    });
  });

  describe('Recording State', () => {
    const recordingProps = {
      ...mockProps,
      isRecording: true,
      elapsedMs: 45000,
    };

    it('shows recording indicator', () => {
      const { getByText } = render(<CameraPreview {...recordingProps} />);

      expect(getByText('REC')).toBeTruthy();
    });

    it('shows timer with formatted time', () => {
      const { getByText } = render(<CameraPreview {...recordingProps} />);

      expect(getByText('00:45')).toBeTruthy();
    });

    it('does not show start button when recording', () => {
      const { queryByTestId } = render(<CameraPreview {...recordingProps} />);

      expect(queryByTestId('start-button')).toBeNull();
    });

    it('shows pause button when recording', () => {
      const { getByTestId } = render(<CameraPreview {...recordingProps} />);

      expect(getByTestId('pause-button')).toBeTruthy();
    });

    it('shows stop button when recording', () => {
      const { getByTestId } = render(<CameraPreview {...recordingProps} />);

      expect(getByTestId('stop-button')).toBeTruthy();
    });

    it('calls onPausePress when pause button pressed', () => {
      const { getByTestId } = render(<CameraPreview {...recordingProps} />);

      fireEvent.press(getByTestId('pause-button'));
      expect(mockProps.onPausePress).toHaveBeenCalledTimes(1);
    });

    it('calls onStopPress when stop button pressed', () => {
      const { getByTestId } = render(<CameraPreview {...recordingProps} />);

      fireEvent.press(getByTestId('stop-button'));
      expect(mockProps.onStopPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Paused State', () => {
    const pausedProps = {
      ...mockProps,
      isRecording: true,
      isPaused: true,
      elapsedMs: 30000,
    };

    it('shows PAUSED indicator', () => {
      const { getByText } = render(<CameraPreview {...pausedProps} />);

      expect(getByText('PAUSED')).toBeTruthy();
    });

    it('shows resume button when paused', () => {
      const { getByTestId } = render(<CameraPreview {...pausedProps} />);

      expect(getByTestId('resume-button')).toBeTruthy();
    });

    it('shows stop button when paused', () => {
      const { getByTestId } = render(<CameraPreview {...pausedProps} />);

      expect(getByTestId('stop-button')).toBeTruthy();
    });

    it('calls onResumePress when resume button pressed', () => {
      const { getByTestId } = render(<CameraPreview {...pausedProps} />);

      fireEvent.press(getByTestId('resume-button'));
      expect(mockProps.onResumePress).toHaveBeenCalledTimes(1);
    });

    it('does not show pause button when paused', () => {
      const { queryByTestId } = render(<CameraPreview {...pausedProps} />);

      expect(queryByTestId('pause-button')).toBeNull();
    });
  });

  describe('Timer Formatting', () => {
    it('formats zero time correctly', () => {
      const { getByText } = render(
        <CameraPreview {...mockProps} isRecording={true} elapsedMs={0} />
      );

      expect(getByText('00:00')).toBeTruthy();
    });

    it('formats seconds only correctly', () => {
      const { getByText } = render(
        <CameraPreview {...mockProps} isRecording={true} elapsedMs={15000} />
      );

      expect(getByText('00:15')).toBeTruthy();
    });

    it('formats minutes and seconds correctly', () => {
      const { getByText } = render(
        <CameraPreview {...mockProps} isRecording={true} elapsedMs={90000} />
      );

      expect(getByText('01:30')).toBeTruthy();
    });

    it('formats max duration correctly', () => {
      const { getByText } = render(
        <CameraPreview {...mockProps} isRecording={true} elapsedMs={120000} />
      );

      expect(getByText('02:00')).toBeTruthy();
    });
  });

  describe('Warning Indicator', () => {
    it('does not show warning when >15s remaining', () => {
      const { queryByText } = render(
        <CameraPreview
          {...mockProps}
          isRecording={true}
          elapsedMs={100000}
          maxDurationMs={120000}
        />
      );

      expect(queryByText(/left/)).toBeNull();
    });

    it('shows warning when ≤15s remaining', () => {
      const { getByText } = render(
        <CameraPreview
          {...mockProps}
          isRecording={true}
          elapsedMs={106000}
          maxDurationMs={120000}
        />
      );

      expect(getByText('00:14 left')).toBeTruthy();
    });

    it('shows warning with correct remaining time', () => {
      const { getByText } = render(
        <CameraPreview
          {...mockProps}
          isRecording={true}
          elapsedMs={115000}
          maxDurationMs={120000}
        />
      );

      expect(getByText('00:05 left')).toBeTruthy();
    });

    it('does not show negative remaining time', () => {
      const { queryByText } = render(
        <CameraPreview
          {...mockProps}
          isRecording={true}
          elapsedMs={125000}
          maxDurationMs={120000}
        />
      );

      expect(queryByText(/left/)).toBeNull();
    });
  });

  describe('Recording Indicator Styles', () => {
    it('shows red dot when recording', () => {
      const { getByTestId } = render(
        <CameraPreview {...mockProps} isRecording={true} isPaused={false} />
      );

      const dot = getByTestId('recording-dot');
      expect(dot.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: '#FF0000' })
      );
    });

    it('shows orange dot when paused', () => {
      const { getByTestId } = render(
        <CameraPreview {...mockProps} isRecording={true} isPaused={true} />
      );

      const dot = getByTestId('recording-dot');
      expect(dot.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: '#FFA500' })
      );
    });
  });

  describe('Timer Warning Styles', () => {
    it('shows white timer when >15s remaining', () => {
      const { getByTestId } = render(
        <CameraPreview
          {...mockProps}
          isRecording={true}
          elapsedMs={100000}
          maxDurationMs={120000}
        />
      );

      const timer = getByTestId('timer-text');
      expect(timer.props.style).not.toContainEqual(
        expect.objectContaining({ color: '#FF4444' })
      );
    });

    it('shows red timer when ≤15s remaining', () => {
      const { getByTestId } = render(
        <CameraPreview
          {...mockProps}
          isRecording={true}
          elapsedMs={110000}
          maxDurationMs={120000}
        />
      );

      const timer = getByTestId('timer-text');
      expect(timer.props.style).toContainEqual(
        expect.objectContaining({ color: '#FF4444' })
      );
    });
  });
});
