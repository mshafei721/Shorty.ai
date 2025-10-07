/**
 * Recording State Machine (B4)
 *
 * Finite state machine for video recording flow:
 * Idle → Countdown → Recording → Reviewing
 *
 * @module features/recording/fsm/recordingMachine
 */

export type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'reviewing' | 'error';

export type RecordingEvent =
  | { type: 'REQUEST_RECORD' }
  | { type: 'PERMISSIONS_GRANTED' }
  | { type: 'COUNTDOWN_TICK'; remaining: number }
  | { type: 'COUNTDOWN_ABORT' }
  | { type: 'RECORD_START' }
  | { type: 'RECORD_TICK'; elapsedMs: number }
  | { type: 'RECORD_PAUSE' }
  | { type: 'RECORD_RESUME' }
  | { type: 'RECORD_STOP' }
  | { type: 'RECORD_TIMEOUT' }
  | { type: 'RECORD_ERROR'; error: string }
  | { type: 'REVIEW_ACCEPT' }
  | { type: 'REVIEW_RETAKE' }
  | { type: 'RESET' };

export interface RecordingContext {
  permissionsGranted: boolean;
  countdownRemaining: number;
  elapsedMs: number;
  maxDurationMs: number;
  filePath: string | null;
  error: string | null;
  projectId: string;
  scriptId: string | null;
}

export interface RecordingMachineConfig {
  maxDurationMs: number;
  countdownSeconds: number;
}

export type StateTransition = {
  from: RecordingState;
  to: RecordingState;
  event: RecordingEvent['type'];
  guard?: (context: RecordingContext) => boolean;
};

const DEFAULT_CONFIG: RecordingMachineConfig = {
  maxDurationMs: 120000, // 120 seconds
  countdownSeconds: 3,
};

/**
 * Guards - Preconditions for state transitions
 */
export const guards = {
  hasPermissions: (context: RecordingContext): boolean => context.permissionsGranted,
  withinDurationLimit: (context: RecordingContext): boolean =>
    context.elapsedMs < context.maxDurationMs,
  countdownComplete: (context: RecordingContext): boolean =>
    context.countdownRemaining <= 0,
};

/**
 * State Transitions Table
 */
export const transitions: StateTransition[] = [
  // Idle → Countdown (when permissions granted)
  {
    from: 'idle',
    to: 'countdown',
    event: 'REQUEST_RECORD',
    guard: guards.hasPermissions,
  },

  // Countdown → Recording (countdown complete)
  {
    from: 'countdown',
    to: 'recording',
    event: 'COUNTDOWN_TICK',
    guard: guards.countdownComplete,
  },

  // Countdown → Idle (user aborts)
  {
    from: 'countdown',
    to: 'idle',
    event: 'COUNTDOWN_ABORT',
  },

  // Recording → Paused
  {
    from: 'recording',
    to: 'paused',
    event: 'RECORD_PAUSE',
  },

  // Paused → Recording
  {
    from: 'paused',
    to: 'recording',
    event: 'RECORD_RESUME',
  },

  // Recording → Reviewing (manual stop)
  {
    from: 'recording',
    to: 'reviewing',
    event: 'RECORD_STOP',
  },

  // Recording → Reviewing (timeout at 120s)
  {
    from: 'recording',
    to: 'reviewing',
    event: 'RECORD_TIMEOUT',
  },

  // Paused → Reviewing
  {
    from: 'paused',
    to: 'reviewing',
    event: 'RECORD_STOP',
  },

  // Recording/Paused → Error
  {
    from: 'recording',
    to: 'error',
    event: 'RECORD_ERROR',
  },
  {
    from: 'paused',
    to: 'error',
    event: 'RECORD_ERROR',
  },

  // Reviewing → Idle (retake)
  {
    from: 'reviewing',
    to: 'idle',
    event: 'REVIEW_RETAKE',
  },

  // Error → Idle (reset)
  {
    from: 'error',
    to: 'idle',
    event: 'RESET',
  },
];

/**
 * Recording State Machine
 */
export class RecordingMachine {
  private state: RecordingState = 'idle';
  private context: RecordingContext;
  private config: RecordingMachineConfig;
  private listeners: Array<(state: RecordingState, context: RecordingContext) => void> = [];

  constructor(
    projectId: string,
    scriptId: string | null,
    config: Partial<RecordingMachineConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.context = {
      permissionsGranted: false,
      countdownRemaining: this.config.countdownSeconds,
      elapsedMs: 0,
      maxDurationMs: this.config.maxDurationMs,
      filePath: null,
      error: null,
      projectId,
      scriptId,
    };
  }

  /**
   * Get current state
   */
  getState(): RecordingState {
    return this.state;
  }

  /**
   * Get current context
   */
  getContext(): RecordingContext {
    return { ...this.context };
  }

  /**
   * Send event to state machine
   */
  send(event: RecordingEvent): void {
    // Update context based on event FIRST (before checking guards)
    this.updateContext(event);

    // Find matching transition with updated context
    const transition = transitions.find(
      (t) =>
        t.from === this.state &&
        t.event === event.type &&
        (!t.guard || t.guard(this.context))
    );

    if (!transition) {
      // Silent no-op for invalid transitions (e.g., countdown ticks while not at 0)
      return;
    }

    // Transition to new state
    const oldState = this.state;
    this.state = transition.to;

    // Execute side effects
    this.executeSideEffects(oldState, this.state, event);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Update context based on event
   */
  private updateContext(event: RecordingEvent): void {
    switch (event.type) {
      case 'PERMISSIONS_GRANTED':
        this.context.permissionsGranted = true;
        break;

      case 'COUNTDOWN_TICK':
        this.context.countdownRemaining = event.remaining;
        break;

      case 'RECORD_TICK':
        this.context.elapsedMs = event.elapsedMs;
        break;

      case 'RECORD_ERROR':
        this.context.error = event.error;
        break;

      case 'REVIEW_RETAKE':
      case 'RESET':
        // Reset context for new recording
        this.context.elapsedMs = 0;
        this.context.countdownRemaining = this.config.countdownSeconds;
        this.context.filePath = null;
        this.context.error = null;
        break;
    }
  }

  /**
   * Execute side effects on state transitions
   */
  private executeSideEffects(
    from: RecordingState,
    to: RecordingState,
    event: RecordingEvent
  ): void {
    // Entry effects
    if (to === 'countdown') {
      // Side effect: start countdown timer (handled by React hook)
    }

    if (to === 'recording' && from === 'countdown') {
      // Side effect: start camera recording (handled by React hook)
    }

    if (to === 'reviewing') {
      // Side effect: stop recording, persist file, write metadata (handled by React hook)
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: RecordingState, context: RecordingContext) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state, this.context));
  }

  /**
   * Set file path after recording completes
   */
  setFilePath(path: string): void {
    this.context.filePath = path;
  }

  /**
   * Grant permissions (called externally)
   */
  grantPermissions(): void {
    this.context.permissionsGranted = true;
  }
}
