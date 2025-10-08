# ADR-002: Orchestrator Design

**Status:** Accepted
**Date:** 2025-11-17
**Context:** M2 Processing Pipeline POC
**Deciders:** BEI, Orchestrator

---

## Context

M2 requires orchestrating video processing through 5+ stages (upload → transcribe → NLP → compose → encode), each with:
- External API dependencies (AssemblyAI, Shotstack, Mux)
- Asynchronous operations (webhooks, polling)
- Retry requirements (network failures, rate limits)
- State persistence needs
- Observability/debugging requirements

**Problem:** How do we coordinate multi-stage, async, retriable workflows with strong guarantees?

---

## Decision

Implement a **Finite State Machine (FSM) orchestrator** with:

1. **Explicit stage handlers** (dependency injection pattern)
2. **Idempotent, replay-safe execution** (deduplication via jobId + stage)
3. **Exponential backoff retries** with per-stage limits
4. **Event emission** for observability
5. **Webhook integration** for async completions
6. **In-memory job store** (POC scope; production → DB)

**Rationale:**
- **FSM simplicity:** Linear pipeline fits sequential state transitions
- **Handler abstraction:** Testable, swappable, provider-agnostic
- **Retry isolation:** Failures don't corrupt overall job state
- **Event-driven:** Enables reactive UI updates and telemetry
- **Webhook-friendly:** Async stages (transcription) can push updates

---

## Alternatives Considered

### 1. Workflow Engine (Temporal, Conductor)
**Pros:**
- Battle-tested orchestration
- Built-in retries, compensation, versioning
- Distributed execution

**Cons:**
- Massive dependency for POC
- Overkill for linear pipeline
- Deployment complexity (requires separate service)

**Rejected:** Too heavy for MVP scope.

---

### 2. Promise Chains / Async Middleware
**Pros:**
- Simple, native JavaScript
- Minimal abstraction

**Cons:**
- Hard to inspect state mid-execution
- Retry logic scattered across stages
- No replay capability
- Difficult to integrate webhooks

**Rejected:** Lacks observability and recovery.

---

### 3. Event Sourcing + Saga Pattern
**Pros:**
- Full audit trail
- Compensation logic for rollbacks
- Distributed-friendly

**Cons:**
- Complex for POC
- Requires event store infrastructure
- Overkill for linear, non-compensating workflows

**Rejected:** M2 has no rollback requirements (idempotent external APIs).

---

## Design Details

### State Machine

```
States: idle → upload → transcribe → nlp → compose → encode → done
                 ↓         ↓          ↓       ↓        ↓
              failed    failed    failed  failed   failed
```

**Transitions:**
- `executeStage(job, stage)` → attempts stage, retries on failure, emits events
- `handleWebhookEvent(event)` → updates artifacts, does NOT re-execute stage
- `retryStage(jobId, stage)` → resets stage state, re-executes

**Invariants:**
- Stages execute in order (no parallel execution in POC)
- Each stage idempotent (can retry safely)
- Job progresses monotonically (no backward transitions except manual retry)

---

### Handler Contract

```typescript
interface StageHandler {
  canExecute(job: Job): boolean;  // Precondition check
  execute(job: Job): Promise<void>;  // Side-effecting operation
}
```

**Example:**
```typescript
class TranscribeHandler implements StageHandler {
  canExecute(job: Job): boolean {
    return !!job.artifacts?.objectUrl;
  }

  async execute(job: Job): Promise<void> {
    const { txId } = await transcriptionService.requestTranscription(
      job.artifacts!.objectUrl!
    );
    job.artifacts!.transcriptId = txId;
  }
}
```

**Guarantees:**
- `canExecute` → pure, fast (no I/O)
- `execute` → idempotent (safe to retry)
- Mutations ONLY to `job.artifacts`

---

### Retry Policy

**Strategy:** Exponential backoff with jitter

**Parameters:**
- `maxRetries`: 3 (default)
- `retryDelayMs`: 1000 (base delay)
- `maxRetryDelayMs`: 30000 (cap)

**Formula:**
```typescript
delay = min(
  baseDelay * 2^attempt + random(0, 500),
  maxRetryDelayMs
);
```

**Failure Modes:**
- Transient (500, network timeout) → Retry
- Permanent (400, 403, moderation fail) → Fail immediately (future enhancement)
- Precondition fail (`canExecute` false) → Mark `blocked`, log, fail

---

### Event Model

**Types:**
- `job.created`
- `job.updated` (includes `progressPct`)
- `stage.started`
- `stage.progress` (future)
- `stage.succeeded`
- `stage.failed`
- `webhook.received`

**Consumers:**
- UI: Poll `job.updated` or subscribe to SSE/WebSocket
- Telemetry: Aggregate metrics per stage
- Debugging: Replay event log

---

### Webhook Integration

**Flow:**
1. Stage handler submits async job (e.g., transcription)
2. External service sends webhook on completion
3. `handleWebhookEvent(...)` updates `job.artifacts`
4. Orchestrator emits `webhook.received` event
5. Polling handler checks `job.artifacts` → proceeds if ready

**Idempotency:**
- Deduplicate via `(jobId, stage, providerId)` tuple
- Accept out-of-order delivery
- No state transitions on webhook (poll-based advancement)

---

## Consequences

### Positive
✅ **Simple mental model:** Linear FSM easy to reason about
✅ **Testable:** Mock handlers, inject dependencies
✅ **Observable:** Events enable real-time monitoring
✅ **Resilient:** Retries handle transient failures
✅ **Extensible:** Add stages without changing core logic

### Negative
⚠ **In-memory only:** Restarts lose job state (mitigated by M3 persistence)
⚠ **Sequential:** No parallel transcription lanes (deferred to future optimization)
⚠ **Manual retry:** Operator must call `retryStage` (no auto-recovery from `blocked`)

### Risks
🔴 **Long-lived jobs:** No job TTL or cleanup (future: add expiration)
🟡 **No distributed execution:** Single-node bottleneck (acceptable for POC scale)
🟡 **Webhook delivery:** No retry on webhook failure (rely on provider retries)

---

## Future Enhancements (Post-M2)

1. **Persistent job store:** AsyncStorage (mobile) or PostgreSQL (backend)
2. **Parallel transcription:** Multi-locale support with fan-out/fan-in
3. **Smart retries:** Classify errors (transient vs permanent), skip retries for 4xx
4. **Job TTL:** Auto-cleanup after 7 days
5. **Distributed orchestration:** Multi-node with Redis-backed job queue
6. **Compensation logic:** Rollback artifacts on cancel (delete uploaded files)

---

## References

- [M2 PlanBoard](../M2-PlanBoard.md)
- [Job Schema](../pipeline/schemas/job.schema.json)
- [Orchestrator Implementation](../pipeline/orchestrator/index.ts)
- [Integration Tests](../pipeline/__tests__/integration.test.ts)

---

**Author:** Claude Code (BEI persona)
**Approved By:** Orchestrator agent
**Implementation PR:** (pending)
