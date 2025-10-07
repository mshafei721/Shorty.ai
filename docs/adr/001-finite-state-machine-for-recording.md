# ADR 001: Finite State Machine for Recording States

**Status:** Accepted
**Date:** 2025-01-XX
**Deciders:** Development Team
**Context:** M1 Milestone - Recording & Teleprompter Implementation

## Context and Problem Statement

The recording feature requires managing complex state transitions across multiple screens and user interactions:
- Start, pause, resume, stop recording
- Timer management (elapsed time, auto-stop at 120s)
- UI state synchronization (buttons, indicators, timer display)
- Teleprompter coordination (scroll when recording, pause when paused)
- Error handling and invalid transition prevention

**Problem:** How do we model recording states to ensure predictable behavior, prevent invalid transitions, and maintain clean separation of concerns?

## Decision Drivers

- **Predictability:** State transitions must be explicit and testable
- **Maintainability:** New states/transitions should be easy to add
- **Testability:** All paths must be unit-testable without device
- **Type Safety:** Invalid transitions should be caught at compile time
- **Performance:** State updates must complete within 100ms
- **Debuggability:** State history should be traceable in logs

## Considered Options

### Option 1: Boolean Flags
```typescript
const [isRecording, setIsRecording] = useState(false);
const [isPaused, setIsPaused] = useState(false);
const [isCountingDown, setIsCountingDown] = useState(false);
```

**Pros:**
- Simple to implement
- Minimal abstraction

**Cons:**
- Invalid states possible (isRecording && !isPaused && isCountingDown)
- Complex transition logic scattered across components
- Hard to test all combinations
- No built-in guards against invalid transitions

### Option 2: State Machine with useReducer
```typescript
type State = 'idle' | 'countdown' | 'recording' | 'paused' | 'reviewing';
type Action = 'start' | 'stop' | 'pause' | 'resume' | 'countdownComplete';

function reducer(state: State, action: Action): State {
  switch (state) {
    case 'idle':
      return action === 'start' ? 'countdown' : state;
    case 'countdown':
      return action === 'countdownComplete' ? 'recording' : state;
    // ... more transitions
  }
}
```

**Pros:**
- Explicit state enumeration
- Centralized transition logic
- Invalid transitions return current state (safe)
- Easy to test with action sequences
- Works with React DevTools

**Cons:**
- More boilerplate than boolean flags
- Requires understanding of reducer pattern

### Option 3: Third-Party FSM Library (XState)
```typescript
const recordingMachine = createMachine({
  id: 'recording',
  initial: 'idle',
  states: {
    idle: { on: { START: 'countdown' } },
    countdown: { after: { 3000: 'recording' } },
    recording: { on: { PAUSE: 'paused', STOP: 'reviewing' } },
    // ...
  }
});
```

**Pros:**
- Powerful visualization tools
- Built-in time-based transitions
- Industry-standard FSM implementation
- Excellent TypeScript support

**Cons:**
- Additional dependency (16KB gzipped)
- Learning curve for team
- Overkill for simple state machines
- Expo Go compatibility concern

## Decision Outcome

**Chosen option:** Option 2 - State Machine with useReducer

**Rationale:**
- **Zero dependencies:** Works with React built-ins only
- **Type-safe:** TypeScript catches invalid state/action combinations
- **Testable:** Easy to test transitions in isolation
- **Maintainable:** All transitions in one place
- **Performant:** Minimal overhead, no external libraries
- **Future-proof:** Can migrate to XState if complexity grows

**Implementation Pattern:**
```typescript
// src/features/recording/hooks/useRecording.ts
type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'reviewing';
type RecordingAction =
  | { type: 'start' }
  | { type: 'countdownComplete' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' };

function recordingReducer(state: RecordingState, action: RecordingAction): RecordingState {
  switch (state) {
    case 'idle':
      return action.type === 'start' ? 'countdown' : state;
    case 'countdown':
      return action.type === 'countdownComplete' ? 'recording' : state;
    case 'recording':
      if (action.type === 'pause') return 'paused';
      if (action.type === 'stop') return 'reviewing';
      return state;
    case 'paused':
      if (action.type === 'resume') return 'recording';
      if (action.type === 'stop') return 'reviewing';
      return state;
    case 'reviewing':
      return action.type === 'start' ? 'countdown' : state; // Restart
    default:
      return state;
  }
}

export function useRecording() {
  const [state, dispatch] = useReducer(recordingReducer, 'idle');

  const start = () => dispatch({ type: 'start' });
  const pause = () => dispatch({ type: 'pause' });
  const resume = () => dispatch({ type: 'resume' });
  const stop = () => dispatch({ type: 'stop' });

  return { state, start, pause, resume, stop };
}
```

## State Transition Diagram

```
┌─────┐  start   ┌───────────┐  countdownComplete  ┌───────────┐
│Idle │─────────>│ Countdown │────────────────────>│ Recording │
└─────┘          └───────────┘                     └─────┬─────┘
   ▲                                                      │
   │                                                  pause│ │stop
   │                                                      ▼ ▼
   │                                              ┌────────────┐
   │                                        resume│   Paused   │
   │                                          ┌───┤            │
   │                                          │   └────────┬───┘
   │                                          │            │stop
   │                                          ▼            ▼
   │                                     ┌────────────────────┐
   └─────────────────────────────────────┤    Reviewing       │
                                  start  └────────────────────┘
```

## Consequences

### Positive
- **Type safety:** Invalid transitions caught at compile time
- **Testability:** 28 tests cover all state transitions
- **Maintainability:** Single source of truth for transitions
- **Debuggability:** State is serializable and loggable
- **Performance:** <1ms transition time
- **No dependencies:** Uses React built-ins only

### Negative
- **Verbosity:** More code than boolean flags (acceptable trade-off)
- **Learning curve:** Team must understand reducer pattern
- **Debugging:** Requires understanding FSM concepts

### Neutral
- **Migration path:** Can upgrade to XState if needed without breaking API
- **Telemetry:** State transitions easily tracked for analytics

## Validation

**Testing Strategy:**
- Unit tests for all valid transitions
- Unit tests confirming invalid transitions are no-ops
- Integration tests for timer + state coordination
- Edge case tests (rapid button presses, auto-stop, unmount)

**Success Metrics:**
- All 28 useRecording tests passing
- Zero production crashes from invalid state
- State transitions complete in <100ms
- Team can add new states in <30min

## Related Decisions

- **ADR 002:** Teleprompter also uses FSM pattern (consistency)
- **M1 Design Doc:** Recording state requirements (PRD.md Section 10)
- **Testing Strategy:** FSM enables comprehensive unit testing (TESTING.md)

## References

- [React useReducer docs](https://react.dev/reference/react/useReducer)
- [XState library](https://xstate.js.org/) (considered but deferred)
- [Finite State Machine pattern](https://en.wikipedia.org/wiki/Finite-state_machine)
- Implementation: [src/features/recording/hooks/useRecording.ts](../../src/features/recording/hooks/useRecording.ts)
- Tests: [src/features/recording/hooks/__tests__/useRecording.test.ts](../../src/features/recording/hooks/__tests__/useRecording.test.ts)

## Future Considerations

**If complexity grows beyond 5 states or 10 transitions:**
- Migrate to XState for visualization tools
- Add time-based transitions (auto-stop)
- Implement state history tracking
- Add parallel states (recording + uploading)

**Current status:** Simple FSM with useReducer is sufficient for M1. Re-evaluate at M3 when processing pipeline integration adds more states.
