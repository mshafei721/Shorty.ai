# Telemetry Event Tracking

Local-only event tracking for M1 recording flow. All events stored in AsyncStorage with 30-day automatic rotation. Telemetry default OFF (respects user privacy).

## Event Schema

### Recording Events

**`record_started`**
- Fired when user taps Record button (Countdown state)
- Fields:
  - `projectId`: string - Project UUID
  - `scriptId`: string - Script UUID
  - `timestamp`: string - ISO8601 timestamp

**`record_completed`**
- Fired when recording finishes successfully (Reviewing state)
- Fields:
  - `projectId`: string - Project UUID
  - `videoId`: string - Video UUID
  - `durationSec`: number - Recording duration in seconds
  - `timestamp`: string - ISO8601 timestamp

**`record_cancelled`**
- Fired when user cancels or error occurs
- Fields:
  - `projectId`: string - Project UUID
  - `reason`: 'user' | 'error' - Cancellation reason
  - `timestamp`: string - ISO8601 timestamp

**`record_paused`**
- Fired when user pauses recording
- Fields:
  - `projectId`: string - Project UUID
  - `videoId`: string - Video UUID
  - `timestamp`: string - ISO8601 timestamp

**`record_resumed`**
- Fired when user resumes paused recording
- Fields:
  - `projectId`: string - Project UUID
  - `videoId`: string - Video UUID
  - `timestamp`: string - ISO8601 timestamp

### Teleprompter Events

**`teleprompter_started`**
- Fired when teleprompter starts scrolling
- Fields:
  - `scriptId`: string - Script UUID
  - `wpm`: number - Words per minute (80-200)
  - `timestamp`: string - ISO8601 timestamp

**`teleprompter_paused`**
- Fired when user pauses teleprompter
- Fields:
  - `scriptId`: string - Script UUID
  - `timestamp`: string - ISO8601 timestamp

**`teleprompter_completed`**
- Fired when teleprompter reaches end
- Fields:
  - `scriptId`: string - Script UUID
  - `timestamp`: string - ISO8601 timestamp

## Storage Format

Events stored in `AsyncStorage.getItem('analytics')`:

```typescript
{
  events: TelemetryEvent[],
  lastRotation: string (ISO8601)
}
```

## Configuration

- **Max Events**: 10,000 (oldest deleted if exceeded)
- **Retention**: 30 days (automatic rotation on app init)
- **Default State**: OFF (user must opt-in via Settings)
- **Storage Key**: `'analytics'`
- **Toggle Key**: `'telemetryEnabled'`

## API

### `trackEvent(event: TelemetryEvent): Promise<void>`
Track telemetry event. No-op if telemetry disabled.

```typescript
await trackEvent({
  type: 'record_started',
  projectId: project.id,
  scriptId: script.id,
  timestamp: new Date().toISOString()
});
```

### `getTelemetryEvents(limit?: number): Promise<TelemetryEvent[]>`
Get events (most recent first). Optional limit.

```typescript
const recent = await getTelemetryEvents(10);
```

### `clearTelemetryEvents(): Promise<void>`
Clear all events immediately.

```typescript
await clearTelemetryEvents();
```

### `rotateTelemetryEvents(): Promise<{ deleted: number }>`
Delete events older than 30 days. Called on app init.

```typescript
const { deleted } = await rotateTelemetryEvents();
console.log(`Removed ${deleted} old events`);
```

### `setTelemetryEnabled(enabled: boolean): Promise<void>`
Enable/disable telemetry tracking.

```typescript
await setTelemetryEnabled(true);
```

## Integration Points

### RecordScreen State Machine
```typescript
import { trackEvent } from '@/analytics/telemetry';

// Countdown state (user tapped Record)
await trackEvent({
  type: 'record_started',
  projectId: project.id,
  scriptId: script.id,
  timestamp: new Date().toISOString()
});

// Reviewing state (recording finished)
await trackEvent({
  type: 'record_completed',
  projectId: project.id,
  videoId: video.id,
  durationSec: video.durationSec,
  timestamp: new Date().toISOString()
});

// User cancelled or error
await trackEvent({
  type: 'record_cancelled',
  projectId: project.id,
  reason: 'user',
  timestamp: new Date().toISOString()
});

// User paused
await trackEvent({
  type: 'record_paused',
  projectId: project.id,
  videoId: video.id,
  timestamp: new Date().toISOString()
});

// User resumed
await trackEvent({
  type: 'record_resumed',
  projectId: project.id,
  videoId: video.id,
  timestamp: new Date().toISOString()
});
```

### Teleprompter Component
```typescript
import { trackEvent } from '@/analytics/telemetry';

// Teleprompter starts scrolling
await trackEvent({
  type: 'teleprompter_started',
  scriptId: script.id,
  wpm: wpm,
  timestamp: new Date().toISOString()
});

// User pauses
await trackEvent({
  type: 'teleprompter_paused',
  scriptId: script.id,
  timestamp: new Date().toISOString()
});

// Reaches end
await trackEvent({
  type: 'teleprompter_completed',
  scriptId: script.id,
  timestamp: new Date().toISOString()
});
```

## Privacy & Security

- **Default OFF**: Telemetry disabled by default
- **Local-only**: No backend transmission in M1
- **User control**: Toggle in Settings screen
- **30-day rotation**: Automatic cleanup
- **No PII**: Only UUIDs, durations, WPM (no user content)

## Future (M2+)

- Backend transmission (opt-in only)
- Aggregate analytics dashboard
- Error tracking integration
- Performance metrics
