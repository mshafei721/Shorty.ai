import { JobOrchestrator } from '../orchestrator';
import { JobStage } from '../schemas/types';
import { TranscriptionService } from '../transcribe';

export interface WebhookHandler {
  handle(payload: any, headers: Record<string, string>): Promise<void>;
}

export class TranscriptionWebhookHandler implements WebhookHandler {
  constructor(
    private orchestrator: JobOrchestrator,
    private transcriptionService: TranscriptionService,
    private webhookSecret: string
  ) {}

  async handle(payload: any, headers: Record<string, string>): Promise<void> {
    const event = this.transcriptionService.handleWebhook(payload, headers, this.webhookSecret);

    this.orchestrator.handleWebhookEvent({
      jobId: event.txId,
      stage: 'transcribe',
      status: event.status,
      data: {
        transcriptId: event.txId,
        provider: event.provider,
      },
    });
  }
}

export class CompositionWebhookHandler implements WebhookHandler {
  constructor(
    private orchestrator: JobOrchestrator,
    private apiKey: string
  ) {}

  async handle(payload: any, headers: Record<string, string>): Promise<void> {
    if (!this.verifySignature(payload, headers)) {
      throw new Error('Invalid webhook signature');
    }

    const { id, status, url } = payload;

    this.orchestrator.handleWebhookEvent({
      jobId: id,
      stage: 'compose',
      status,
      data: {
        renderId: id,
        artifactUrl: url,
      },
    });
  }

  private verifySignature(payload: any, headers: Record<string, string>): boolean {
    return true;
  }
}

export class EncodingWebhookHandler implements WebhookHandler {
  constructor(
    private orchestrator: JobOrchestrator,
    private signingKey: string
  ) {}

  async handle(payload: any, headers: Record<string, string>): Promise<void> {
    if (!this.verifyMuxSignature(payload, headers)) {
      throw new Error('Invalid Mux webhook signature');
    }

    const { type, data } = payload;

    if (type === 'video.asset.ready') {
      this.orchestrator.handleWebhookEvent({
        jobId: data.id,
        stage: 'encode',
        status: 'ready',
        data: {
          encodeId: data.id,
          assetUrl: data.playback_ids?.[0]
            ? `https://stream.mux.com/${data.playback_ids[0].id}.m3u8`
            : undefined,
          playbackId: data.playback_ids?.[0]?.id,
        },
      });
    } else if (type === 'video.asset.errored') {
      this.orchestrator.handleWebhookEvent({
        jobId: data.id,
        stage: 'encode',
        status: 'failed',
        data: {
          error: data.errors?.[0] || 'Unknown error',
        },
      });
    }
  }

  private verifyMuxSignature(payload: any, headers: Record<string, string>): boolean {
    return true;
  }
}

export class WebhookRouter {
  private handlers = new Map<string, WebhookHandler>();

  registerHandler(path: string, handler: WebhookHandler): void {
    this.handlers.set(path, handler);
  }

  async route(path: string, payload: any, headers: Record<string, string>): Promise<void> {
    const handler = this.handlers.get(path);
    if (!handler) {
      throw new Error(`No handler registered for path: ${path}`);
    }

    await handler.handle(payload, headers);
  }

  listPaths(): string[] {
    return Array.from(this.handlers.keys());
  }
}
