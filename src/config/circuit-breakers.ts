/**
 * Circuit Breaker Configuration for Provider Switchover
 *
 * Defines thresholds, timeouts, and metrics for automatic failover between
 * primary and fallback API providers.
 *
 * @module config/circuit-breakers
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Circuit breaker state enum
 */
export enum CircuitState {
  /** Normal operation (using primary provider) */
  CLOSED = 'closed',
  /** Failed state (using fallback provider) */
  OPEN = 'open',
  /** Testing primary provider recovery */
  HALF_OPEN = 'half_open',
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before testing recovery (OPEN → HALF_OPEN) */
  timeoutMs: number;
  /** Number of consecutive successes to close circuit (HALF_OPEN → CLOSED) */
  successThreshold: number;
  /** Whether circuit breaker is enabled (disable for testing) */
  enabled: boolean;
}

/**
 * SLA monitoring thresholds
 */
export interface SLAThresholds {
  /** Maximum acceptable p95 latency in milliseconds */
  maxLatencyP95Ms: number;
  /** Minimum acceptable uptime percentage (0-100) */
  minUptimePercent: number;
  /** Maximum acceptable error rate percentage (0-100) */
  maxErrorRatePercent: number;
  /** Maximum cost per clip in USD */
  maxCostPerClip: number;
}

/**
 * Provider-specific metrics
 */
export interface ProviderMetrics {
  /** Provider name */
  provider: string;
  /** Total requests made */
  totalRequests: number;
  /** Total failures */
  totalFailures: number;
  /** Current error rate (0-100) */
  errorRate: number;
  /** p95 latency in milliseconds */
  latencyP95Ms: number;
  /** Total cost in USD */
  totalCost: number;
  /** Last successful request timestamp */
  lastSuccessAt: number | null;
  /** Last failure timestamp */
  lastFailureAt: number | null;
  /** Current circuit state */
  circuitState: CircuitState;
}

// ============================================================================
// Circuit Breaker Configurations by Service
// ============================================================================

/**
 * Transcription service circuit breaker config
 *
 * Primary: AssemblyAI Universal-2
 * Fallback: Deepgram Nova-3
 *
 * Switchover Triggers:
 * - 5 consecutive failures
 * - p95 latency > 5s
 * - Error rate > 2%
 * - SLA breach (uptime < 99.9%)
 */
export const TRANSCRIPTION_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  timeoutMs: 60_000,      // 60s before testing recovery
  successThreshold: 3,
  enabled: true,
};

export const TRANSCRIPTION_SLA: SLAThresholds = {
  maxLatencyP95Ms: 5_000,   // 5s for 90s clip
  minUptimePercent: 99.9,
  maxErrorRatePercent: 2.0,
  maxCostPerClip: 0.015,    // $0.015/min (AssemblyAI)
};

/**
 * Composition service circuit breaker config
 *
 * Primary: Shotstack Edit API
 * Fallback: Cloudinary Video API
 *
 * Switchover Triggers:
 * - 5 consecutive failures
 * - p95 latency > 60s (for 60s clip)
 * - Error rate > 3%
 * - SLA breach
 */
export const COMPOSITION_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  timeoutMs: 120_000,     // 120s before testing recovery (longer due to render time)
  successThreshold: 3,
  enabled: true,
};

export const COMPOSITION_SLA: SLAThresholds = {
  maxLatencyP95Ms: 60_000,  // 60s for 60s clip (1:1 ratio)
  minUptimePercent: 99.5,
  maxErrorRatePercent: 3.0,
  maxCostPerClip: 0.30,     // $0.30/clip (Shotstack)
};

/**
 * Encoding service circuit breaker config
 *
 * Primary: Mux Video
 * Fallback: Coconut
 *
 * Switchover Triggers:
 * - 5 consecutive failures
 * - Cost > $0.10/min
 * - Latency > 2× source duration
 * - Quality degradation
 */
export const ENCODING_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  timeoutMs: 90_000,      // 90s before testing recovery
  successThreshold: 3,
  enabled: true,
};

export const ENCODING_SLA: SLAThresholds = {
  maxLatencyP95Ms: 120_000, // 120s for 60s clip (2:1 ratio max)
  minUptimePercent: 99.0,
  maxErrorRatePercent: 3.0,
  maxCostPerClip: 0.10,     // $0.10/min max
};

/**
 * Background removal service circuit breaker config
 *
 * Primary: Cutout.Pro API
 * Fallback: Unscreen API
 *
 * NOTE: Background removal deferred to Phase 2 due to cost ($19/min = $28.5k/mo at 1k clips)
 * Config provided for future implementation once volume pricing negotiated.
 *
 * Switchover Triggers:
 * - Segmentation quality IoU < 0.85
 * - p95 latency > 90s
 * - Error rate > 5%
 * - Cost exceeds negotiated rate
 */
export const BACKGROUND_REMOVAL_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  timeoutMs: 180_000,     // 180s before testing recovery (matting is slow)
  successThreshold: 3,
  enabled: false,         // Disabled until Phase 2
};

export const BACKGROUND_REMOVAL_SLA: SLAThresholds = {
  maxLatencyP95Ms: 90_000,  // 90s p95
  minUptimePercent: 99.0,
  maxErrorRatePercent: 5.0,
  maxCostPerClip: 0.50,     // Target: $5-10/min negotiated rate
};

/**
 * AI script generation circuit breaker config
 *
 * Primary: OpenAI GPT-4o
 * Fallback: Anthropic Claude 3.7 Sonnet
 *
 * Switchover Triggers:
 * - 5 consecutive failures
 * - p95 latency > 5s
 * - Error rate > 3%
 * - Content quality degradation (user complaints > 5%)
 */
export const AI_SCRIPT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  timeoutMs: 30_000,      // 30s before testing recovery (fast API)
  successThreshold: 3,
  enabled: true,
};

export const AI_SCRIPT_SLA: SLAThresholds = {
  maxLatencyP95Ms: 5_000,   // 5s p95
  minUptimePercent: 99.5,
  maxErrorRatePercent: 3.0,
  maxCostPerClip: 0.01,     // $0.0043 per 250-word script (GPT-4o)
};

/**
 * Content moderation circuit breaker config
 *
 * Primary: Moderation API
 * Fallback: Azure Content Moderator
 *
 * Switchover Triggers:
 * - False positive rate > 10%
 * - Latency > 2s
 * - Service unavailable
 */
export const MODERATION_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  timeoutMs: 30_000,      // 30s before testing recovery
  successThreshold: 3,
  enabled: true,
};

export const MODERATION_SLA: SLAThresholds = {
  maxLatencyP95Ms: 2_000,   // 2s p95
  minUptimePercent: 99.5,
  maxErrorRatePercent: 5.0,
  maxCostPerClip: 0.01,     // ~$0.005/check
};

// ============================================================================
// Global Configuration
// ============================================================================

/**
 * All circuit breaker configurations indexed by service name
 */
export const CIRCUIT_BREAKER_CONFIGS: Record<string, CircuitBreakerConfig> = {
  transcription: TRANSCRIPTION_CIRCUIT_CONFIG,
  composition: COMPOSITION_CIRCUIT_CONFIG,
  encoding: ENCODING_CIRCUIT_CONFIG,
  backgroundRemoval: BACKGROUND_REMOVAL_CIRCUIT_CONFIG,
  aiScript: AI_SCRIPT_CIRCUIT_CONFIG,
  moderation: MODERATION_CIRCUIT_CONFIG,
};

/**
 * All SLA thresholds indexed by service name
 */
export const SLA_THRESHOLDS: Record<string, SLAThresholds> = {
  transcription: TRANSCRIPTION_SLA,
  composition: COMPOSITION_SLA,
  encoding: ENCODING_SLA,
  backgroundRemoval: BACKGROUND_REMOVAL_SLA,
  aiScript: AI_SCRIPT_SLA,
  moderation: MODERATION_SLA,
};

/**
 * Provider names for each service (primary/fallback)
 */
export const SERVICE_PROVIDERS = {
  transcription: {
    primary: 'AssemblyAI',
    fallback: 'Deepgram',
  },
  composition: {
    primary: 'Shotstack',
    fallback: 'Cloudinary',
  },
  encoding: {
    primary: 'Mux',
    fallback: 'Coconut',
  },
  backgroundRemoval: {
    primary: 'Cutout.Pro',
    fallback: 'Unscreen',
  },
  aiScript: {
    primary: 'OpenAI GPT-4o',
    fallback: 'Anthropic Claude 3.7',
  },
  moderation: {
    primary: 'Moderation API',
    fallback: 'Azure Content Moderator',
  },
} as const;

// ============================================================================
// Monitoring Configuration
// ============================================================================

/**
 * Metrics collection intervals
 */
export const METRICS_CONFIG = {
  /** How often to calculate p95 latency (ms) */
  latencyCalculationIntervalMs: 60_000,  // 1 min
  /** How often to calculate error rate (ms) */
  errorRateCalculationIntervalMs: 60_000, // 1 min
  /** How long to retain raw metric data (ms) */
  metricsRetentionMs: 86_400_000,         // 24 hours
  /** How often to log circuit breaker state (ms) */
  stateLogIntervalMs: 300_000,            // 5 min
} as const;

/**
 * Alert thresholds for cost monitoring
 */
export const COST_ALERTS = {
  /** Alert when monthly cost exceeds this amount (USD) */
  monthlyBudgetUsd: 500,
  /** Alert when per-clip cost exceeds this amount (USD) */
  perClipThresholdUsd: 0.50,
  /** Alert when daily cost projection exceeds monthly budget */
  enableDailyProjection: true,
} as const;

/**
 * Webhook delivery monitoring
 */
export const WEBHOOK_CONFIG = {
  /** Minimum acceptable delivery rate (0-100) */
  minDeliveryRatePercent: 99.0,
  /** Maximum webhook processing time (ms) */
  maxProcessingTimeMs: 5_000,
  /** Enable webhook retry tracking */
  trackRetries: true,
} as const;

// ============================================================================
// Development & Testing Overrides
// ============================================================================

/**
 * Override configurations for development/testing environments
 * Set via environment variables to disable circuit breakers or adjust thresholds
 */
export function getCircuitBreakerConfig(
  service: keyof typeof CIRCUIT_BREAKER_CONFIGS,
  env: string = process.env.NODE_ENV || 'production'
): CircuitBreakerConfig {
  const config = CIRCUIT_BREAKER_CONFIGS[service];

  // Disable circuit breakers in test environment
  if (env === 'test') {
    return { ...config, enabled: false };
  }

  // Allow environment variable overrides
  const envOverride = process.env[`CIRCUIT_${service.toUpperCase()}_ENABLED`];
  if (envOverride !== undefined) {
    return { ...config, enabled: envOverride === 'true' };
  }

  return config;
}

/**
 * Override SLA thresholds for development/staging
 */
export function getSLAThresholds(
  service: keyof typeof SLA_THRESHOLDS,
  env: string = process.env.NODE_ENV || 'production'
): SLAThresholds {
  const thresholds = SLA_THRESHOLDS[service];

  // Relax thresholds in development
  if (env === 'development') {
    return {
      ...thresholds,
      maxLatencyP95Ms: thresholds.maxLatencyP95Ms * 2,      // 2× latency tolerance
      maxErrorRatePercent: thresholds.maxErrorRatePercent * 2, // 2× error tolerance
    };
  }

  return thresholds;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if SLA breach detected
 */
export function isSLABreach(
  metrics: ProviderMetrics,
  thresholds: SLAThresholds
): boolean {
  return (
    metrics.errorRate > thresholds.maxErrorRatePercent ||
    metrics.latencyP95Ms > thresholds.maxLatencyP95Ms
  );
}

/**
 * Calculate uptime percentage from metrics
 */
export function calculateUptime(
  totalRequests: number,
  totalFailures: number
): number {
  if (totalRequests === 0) return 100;
  return ((totalRequests - totalFailures) / totalRequests) * 100;
}

/**
 * Format circuit state for logging
 */
export function formatCircuitState(
  service: string,
  state: CircuitState,
  provider: string
): string {
  return `[Circuit ${service.toUpperCase()}] ${state.toUpperCase()} (using ${provider})`;
}

/**
 * Export all configurations as JSON for monitoring dashboards
 */
export function exportConfigJSON(): string {
  return JSON.stringify(
    {
      circuitBreakers: CIRCUIT_BREAKER_CONFIGS,
      slaThresholds: SLA_THRESHOLDS,
      providers: SERVICE_PROVIDERS,
      metrics: METRICS_CONFIG,
      cost: COST_ALERTS,
      webhooks: WEBHOOK_CONFIG,
    },
    null,
    2
  );
}
