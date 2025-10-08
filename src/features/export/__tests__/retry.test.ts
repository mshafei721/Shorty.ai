import { retryWithBackoff, RetryError, createIdempotencyKey } from '../utils/retry';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const promise = retryWithBackoff(operation);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(operation, { maxAttempts: 5 });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should throw RetryError after max attempts', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Always fail'));

    const promise = retryWithBackoff(operation, { maxAttempts: 3 });
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(RetryError);
    await expect(promise).rejects.toThrow('Operation failed after 3 attempts');
  });

  it('should apply exponential backoff', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');

    const config = {
      maxAttempts: 5,
      baseDelayMs: 100,
      maxDelayMs: 10000,
      jitterFactor: 0,
    };

    const promise = retryWithBackoff(operation, config);

    await jest.advanceTimersByTimeAsync(100);
    expect(operation).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(200);
    expect(operation).toHaveBeenCalledTimes(3);

    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
  });

  it('should respect maxDelayMs cap', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');

    const config = {
      maxAttempts: 5,
      baseDelayMs: 1000,
      maxDelayMs: 1500,
      jitterFactor: 0,
    };

    const promise = retryWithBackoff(operation, config);

    await jest.advanceTimersByTimeAsync(1000);
    expect(operation).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1500);
    expect(operation).toHaveBeenCalledTimes(3);

    await jest.runAllTimersAsync();
    await promise;
  });
});

describe('createIdempotencyKey', () => {
  it('should create unique key with timestamp', () => {
    const key1 = createIdempotencyKey('share', 'asset-123');
    const key2 = createIdempotencyKey('share', 'asset-123');

    expect(key1).toMatch(/^share_asset-123_\d+$/);
    expect(key2).toMatch(/^share_asset-123_\d+$/);
    expect(key1).not.toBe(key2);
  });

  it('should include action type and identifier', () => {
    const key = createIdempotencyKey('upload', 'video-456');
    expect(key).toContain('upload_video-456_');
  });
});
