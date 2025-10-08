import {
  TranscriptionWebhookHandler,
  CompositionWebhookHandler,
  EncodingWebhookHandler,
  WebhookRouter,
} from '../index';
import { JobOrchestrator } from '../../orchestrator';
import { TranscriptionService, AssemblyAIAdapter, DeepgramAdapter } from '../../transcribe';
import * as crypto from 'crypto';

describe('TranscriptionWebhookHandler', () => {
  let handler: TranscriptionWebhookHandler;
  let orchestrator: JobOrchestrator;
  let transcriptionService: TranscriptionService;

  beforeEach(() => {
    orchestrator = new JobOrchestrator();
    const primary = new AssemblyAIAdapter({ apiKey: 'test-key' });
    const fallback = new DeepgramAdapter({ apiKey: 'test-key' });
    transcriptionService = new TranscriptionService(primary, fallback);
    handler = new TranscriptionWebhookHandler(orchestrator, transcriptionService, 'webhook-secret');

    jest.spyOn(orchestrator, 'handleWebhookEvent');
  });

  it('processes transcription webhook', async () => {
    const payload = { id: 'tx-123', status: 'completed' };
    const secret = 'webhook-secret';
    const rawPayload = JSON.stringify(payload);

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawPayload);
    const signature = hmac.digest('hex');

    await handler.handle(payload, { 'x-webhook-signature': signature });

    expect(orchestrator.handleWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'tx-123',
        stage: 'transcribe',
        status: 'completed',
      })
    );
  });
});

describe('CompositionWebhookHandler', () => {
  let handler: CompositionWebhookHandler;
  let orchestrator: JobOrchestrator;

  beforeEach(() => {
    orchestrator = new JobOrchestrator();
    handler = new CompositionWebhookHandler(orchestrator, 'api-key');

    jest.spyOn(orchestrator, 'handleWebhookEvent');
  });

  it('processes composition webhook', async () => {
    const payload = {
      id: 'render-456',
      status: 'done',
      url: 'http://example.com/rendered.mp4',
    };

    await handler.handle(payload, {});

    expect(orchestrator.handleWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'render-456',
        stage: 'compose',
        status: 'done',
        data: expect.objectContaining({
          artifactUrl: 'http://example.com/rendered.mp4',
        }),
      })
    );
  });
});

describe('EncodingWebhookHandler', () => {
  let handler: EncodingWebhookHandler;
  let orchestrator: JobOrchestrator;

  beforeEach(() => {
    orchestrator = new JobOrchestrator();
    handler = new EncodingWebhookHandler(orchestrator, 'signing-key');

    jest.spyOn(orchestrator, 'handleWebhookEvent');
  });

  it('processes asset.ready event', async () => {
    const payload = {
      type: 'video.asset.ready',
      data: {
        id: 'asset-789',
        playback_ids: [{ id: 'playback-abc' }],
      },
    };

    await handler.handle(payload, {});

    expect(orchestrator.handleWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'asset-789',
        stage: 'encode',
        status: 'ready',
        data: expect.objectContaining({
          playbackId: 'playback-abc',
        }),
      })
    );
  });

  it('processes asset.errored event', async () => {
    const payload = {
      type: 'video.asset.errored',
      data: {
        id: 'asset-789',
        errors: ['Encoding failed'],
      },
    };

    await handler.handle(payload, {});

    expect(orchestrator.handleWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'asset-789',
        stage: 'encode',
        status: 'failed',
      })
    );
  });
});

describe('WebhookRouter', () => {
  let router: WebhookRouter;
  let mockHandler: jest.Mocked<any>;

  beforeEach(() => {
    router = new WebhookRouter();
    mockHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('routes to registered handler', async () => {
    router.registerHandler('/webhooks/transcribe', mockHandler);

    await router.route('/webhooks/transcribe', { data: 'test' }, {});

    expect(mockHandler.handle).toHaveBeenCalledWith({ data: 'test' }, {});
  });

  it('throws for unregistered path', async () => {
    await expect(router.route('/unknown', {}, {})).rejects.toThrow('No handler registered');
  });

  it('lists registered paths', () => {
    router.registerHandler('/webhooks/transcribe', mockHandler);
    router.registerHandler('/webhooks/encode', mockHandler);

    const paths = router.listPaths();

    expect(paths).toContain('/webhooks/transcribe');
    expect(paths).toContain('/webhooks/encode');
  });
});
