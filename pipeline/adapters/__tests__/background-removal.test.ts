import { BackgroundRemovalStub } from '../background-removal';

describe('BackgroundRemovalStub', () => {
  it('throws when disabled', async () => {
    const adapter = new BackgroundRemovalStub({ enabled: false });

    await expect(adapter.removeBackground('http://example.com/video.mp4')).rejects.toThrow(
      'disabled via feature flag'
    );
  });

  it('returns original URL when enabled (stub)', async () => {
    const adapter = new BackgroundRemovalStub({ enabled: true });

    const result = await adapter.removeBackground('http://example.com/video.mp4');

    expect(result.processedUrl).toBe('http://example.com/video.mp4');
  });

  it('reports enabled status', () => {
    const enabled = new BackgroundRemovalStub({ enabled: true });
    const disabled = new BackgroundRemovalStub({ enabled: false });

    expect(enabled.isEnabled()).toBe(true);
    expect(disabled.isEnabled()).toBe(false);
  });
});
