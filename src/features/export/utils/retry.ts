import { RetryConfig, DEFAULT_RETRY_CONFIG } from '../types';

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

function calculateBackoff(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = Math.min(
    config.baseDelayMs * Math.pow(2, attempt - 1),
    config.maxDelayMs
  );

  const jitter = exponentialDelay * config.jitterFactor * (Math.random() - 0.5);

  return Math.max(0, exponentialDelay + jitter);
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  let lastError: Error = new Error('No attempts made');

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === finalConfig.maxAttempts) {
        throw new RetryError(
          `Operation failed after ${attempt} attempts`,
          attempt,
          lastError
        );
      }

      const delayMs = calculateBackoff(attempt, finalConfig);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new RetryError(
    `Operation failed after ${finalConfig.maxAttempts} attempts`,
    finalConfig.maxAttempts,
    lastError
  );
}

export function createIdempotencyKey(
  actionType: string,
  identifier: string
): string {
  return `${actionType}_${identifier}_${Date.now()}`;
}
