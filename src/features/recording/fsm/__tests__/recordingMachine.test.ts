import { RecordingMachine, guards } from '../recordingMachine';

describe('RecordingMachine', () => {
  let machine: RecordingMachine;

  beforeEach(() => {
    machine = new RecordingMachine('project-123', 'script-456', {
      maxDurationMs: 120000,
      countdownSeconds: 3,
    });
  });

  describe('Initial State', () => {
    it('starts in idle state', () => {
      expect(machine.getState()).toBe('idle');
    });

    it('initializes context with correct values', () => {
      const context = machine.getContext();
      expect(context.permissionsGranted).toBe(false);
      expect(context.countdownRemaining).toBe(3);
      expect(context.elapsedMs).toBe(0);
      expect(context.maxDurationMs).toBe(120000);
      expect(context.filePath).toBeNull();
      expect(context.error).toBeNull();
      expect(context.projectId).toBe('project-123');
      expect(context.scriptId).toBe('script-456');
    });
  });

  describe('Guards', () => {
    it('hasPermissions returns false when permissions not granted', () => {
      const context = machine.getContext();
      expect(guards.hasPermissions(context)).toBe(false);
    });

    it('hasPermissions returns true when permissions granted', () => {
      machine.grantPermissions();
      const context = machine.getContext();
      expect(guards.hasPermissions(context)).toBe(true);
    });

    it('withinDurationLimit returns true when under max duration', () => {
      const context = machine.getContext();
      expect(guards.withinDurationLimit(context)).toBe(true);
    });

    it('withinDurationLimit returns false when over max duration', () => {
      machine.send({ type: 'RECORD_TICK', elapsedMs: 125000 });
      const context = machine.getContext();
      expect(guards.withinDurationLimit(context)).toBe(false);
    });

    it('countdownComplete returns true when countdown reaches 0', () => {
      machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
      const context = machine.getContext();
      expect(guards.countdownComplete(context)).toBe(true);
    });

    it('countdownComplete returns false when countdown is not 0', () => {
      machine.send({ type: 'COUNTDOWN_TICK', remaining: 2 });
      const context = machine.getContext();
      expect(guards.countdownComplete(context)).toBe(false);
    });
  });

  describe('State Transitions', () => {
    describe('Idle → Countdown', () => {
      it('transitions when permissions granted and REQUEST_RECORD sent', () => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
        expect(machine.getState()).toBe('countdown');
      });

      it('does not transition without permissions', () => {
        machine.send({ type: 'REQUEST_RECORD' });
        expect(machine.getState()).toBe('idle');
      });
    });

    describe('Countdown → Recording', () => {
      beforeEach(() => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
      });

      it('transitions when countdown reaches 0', () => {
        machine.send({ type: 'COUNTDOWN_TICK', remaining: 2 });
        expect(machine.getState()).toBe('countdown');

        machine.send({ type: 'COUNTDOWN_TICK', remaining: 1 });
        expect(machine.getState()).toBe('countdown');

        machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
        expect(machine.getState()).toBe('recording');
      });

      it('updates countdown in context', () => {
        machine.send({ type: 'COUNTDOWN_TICK', remaining: 1 });
        expect(machine.getContext().countdownRemaining).toBe(1);
      });
    });

    describe('Countdown → Idle (Abort)', () => {
      beforeEach(() => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
      });

      it('transitions back to idle on abort', () => {
        machine.send({ type: 'COUNTDOWN_ABORT' });
        expect(machine.getState()).toBe('idle');
      });
    });

    describe('Recording → Paused', () => {
      beforeEach(() => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
        machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
      });

      it('transitions to paused on RECORD_PAUSE', () => {
        machine.send({ type: 'RECORD_PAUSE' });
        expect(machine.getState()).toBe('paused');
      });
    });

    describe('Paused → Recording', () => {
      beforeEach(() => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
        machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
        machine.send({ type: 'RECORD_PAUSE' });
      });

      it('transitions back to recording on RECORD_RESUME', () => {
        machine.send({ type: 'RECORD_RESUME' });
        expect(machine.getState()).toBe('recording');
      });
    });

    describe('Recording → Reviewing', () => {
      beforeEach(() => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
        machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
      });

      it('transitions to reviewing on manual stop', () => {
        machine.send({ type: 'RECORD_STOP' });
        expect(machine.getState()).toBe('reviewing');
      });

      it('transitions to reviewing on timeout', () => {
        machine.send({ type: 'RECORD_TIMEOUT' });
        expect(machine.getState()).toBe('reviewing');
      });

      it('tracks elapsed time', () => {
        machine.send({ type: 'RECORD_TICK', elapsedMs: 5000 });
        expect(machine.getContext().elapsedMs).toBe(5000);

        machine.send({ type: 'RECORD_TICK', elapsedMs: 10000 });
        expect(machine.getContext().elapsedMs).toBe(10000);
      });
    });

    describe('Paused → Reviewing', () => {
      beforeEach(() => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
        machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
        machine.send({ type: 'RECORD_PAUSE' });
      });

      it('transitions to reviewing on stop while paused', () => {
        machine.send({ type: 'RECORD_STOP' });
        expect(machine.getState()).toBe('reviewing');
      });
    });

    describe('Recording → Error', () => {
      beforeEach(() => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
        machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
      });

      it('transitions to error state on error event', () => {
        machine.send({ type: 'RECORD_ERROR', error: 'Camera failure' });
        expect(machine.getState()).toBe('error');
      });

      it('stores error message in context', () => {
        machine.send({ type: 'RECORD_ERROR', error: 'Storage full' });
        expect(machine.getContext().error).toBe('Storage full');
      });
    });

    describe('Reviewing → Idle (Retake)', () => {
      beforeEach(() => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
        machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
        machine.send({ type: 'RECORD_STOP' });
      });

      it('transitions to idle on retake', () => {
        machine.send({ type: 'REVIEW_RETAKE' });
        expect(machine.getState()).toBe('idle');
      });

      it('resets context on retake', () => {
        machine.send({ type: 'RECORD_TICK', elapsedMs: 30000 });
        machine.send({ type: 'REVIEW_RETAKE' });

        const context = machine.getContext();
        expect(context.elapsedMs).toBe(0);
        expect(context.countdownRemaining).toBe(3);
        expect(context.filePath).toBeNull();
        expect(context.error).toBeNull();
      });
    });

    describe('Error → Idle (Reset)', () => {
      beforeEach(() => {
        machine.grantPermissions();
        machine.send({ type: 'REQUEST_RECORD' });
        machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
        machine.send({ type: 'RECORD_ERROR', error: 'Test error' });
      });

      it('transitions to idle on reset', () => {
        machine.send({ type: 'RESET' });
        expect(machine.getState()).toBe('idle');
      });

      it('resets error in context', () => {
        machine.send({ type: 'RESET' });
        expect(machine.getContext().error).toBeNull();
      });
    });
  });

  describe('Subscriptions', () => {
    it('notifies subscribers on state change', () => {
      const listener = jest.fn();
      machine.subscribe(listener);

      machine.grantPermissions();
      machine.send({ type: 'REQUEST_RECORD' });

      expect(listener).toHaveBeenCalledWith('countdown', expect.any(Object));
    });

    it('allows unsubscribing', () => {
      const listener = jest.fn();
      const unsubscribe = machine.subscribe(listener);

      machine.grantPermissions();
      machine.send({ type: 'REQUEST_RECORD' });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      machine.send({ type: 'COUNTDOWN_ABORT' });
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it('passes state and context to subscribers', () => {
      const listener = jest.fn();
      machine.subscribe(listener);

      machine.grantPermissions();
      machine.send({ type: 'REQUEST_RECORD' });

      expect(listener).toHaveBeenCalledWith(
        'countdown',
        expect.objectContaining({
          permissionsGranted: true,
          projectId: 'project-123',
        })
      );
    });
  });

  describe('Utility Methods', () => {
    it('setFilePath updates context', () => {
      machine.setFilePath('/videos/raw/project-123/video.mp4');
      expect(machine.getContext().filePath).toBe('/videos/raw/project-123/video.mp4');
    });

    it('grantPermissions updates context', () => {
      expect(machine.getContext().permissionsGranted).toBe(false);
      machine.grantPermissions();
      expect(machine.getContext().permissionsGranted).toBe(true);
    });
  });

  describe('Full Recording Flow', () => {
    it('completes happy path: idle → countdown → recording → reviewing', () => {
      const states: string[] = [];
      machine.subscribe((state) => states.push(state));

      // Grant permissions and start
      machine.grantPermissions();
      machine.send({ type: 'REQUEST_RECORD' });
      expect(machine.getState()).toBe('countdown');

      // Countdown
      machine.send({ type: 'COUNTDOWN_TICK', remaining: 2 });
      machine.send({ type: 'COUNTDOWN_TICK', remaining: 1 });
      machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
      expect(machine.getState()).toBe('recording');

      // Record for 30s
      machine.send({ type: 'RECORD_TICK', elapsedMs: 30000 });
      expect(machine.getContext().elapsedMs).toBe(30000);

      // Stop recording
      machine.send({ type: 'RECORD_STOP' });
      expect(machine.getState()).toBe('reviewing');

      // Verify state transitions (only actual state changes are emitted, not no-ops)
      expect(states).toEqual(['countdown', 'recording', 'reviewing']);
    });

    it('handles timeout at 120s', () => {
      machine.grantPermissions();
      machine.send({ type: 'REQUEST_RECORD' });
      machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });

      // Simulate recording up to timeout
      machine.send({ type: 'RECORD_TICK', elapsedMs: 120000 });
      machine.send({ type: 'RECORD_TIMEOUT' });

      expect(machine.getState()).toBe('reviewing');
      expect(machine.getContext().elapsedMs).toBe(120000);
    });

    it('handles pause/resume flow', () => {
      machine.grantPermissions();
      machine.send({ type: 'REQUEST_RECORD' });
      machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });

      // Record for 10s
      machine.send({ type: 'RECORD_TICK', elapsedMs: 10000 });

      // Pause
      machine.send({ type: 'RECORD_PAUSE' });
      expect(machine.getState()).toBe('paused');

      // Resume
      machine.send({ type: 'RECORD_RESUME' });
      expect(machine.getState()).toBe('recording');

      // Continue recording
      machine.send({ type: 'RECORD_TICK', elapsedMs: 20000 });
      machine.send({ type: 'RECORD_STOP' });

      expect(machine.getState()).toBe('reviewing');
    });

    it('handles retake flow', () => {
      machine.grantPermissions();
      machine.send({ type: 'REQUEST_RECORD' });
      machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });
      machine.send({ type: 'RECORD_STOP' });

      expect(machine.getState()).toBe('reviewing');

      // Retake
      machine.send({ type: 'REVIEW_RETAKE' });
      expect(machine.getState()).toBe('idle');

      // Context should be reset
      const context = machine.getContext();
      expect(context.elapsedMs).toBe(0);
      expect(context.countdownRemaining).toBe(3);
    });

    it('handles error recovery', () => {
      machine.grantPermissions();
      machine.send({ type: 'REQUEST_RECORD' });
      machine.send({ type: 'COUNTDOWN_TICK', remaining: 0 });

      // Error occurs
      machine.send({ type: 'RECORD_ERROR', error: 'Camera disconnected' });
      expect(machine.getState()).toBe('error');
      expect(machine.getContext().error).toBe('Camera disconnected');

      // Reset
      machine.send({ type: 'RESET' });
      expect(machine.getState()).toBe('idle');
      expect(machine.getContext().error).toBeNull();
    });
  });
});
