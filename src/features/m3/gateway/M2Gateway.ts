/**
 * M2 Gateway Client
 *
 * Provider-agnostic interface to M2 processing pipeline.
 * Handles job status, transcripts, filler detection, and draft rendering.
 *
 * @module features/m3/gateway/M2Gateway
 */

import type {
  M2Gateway,
  M2JobStatus,
  NormalizedTranscript,
  FillerSpan,
  DraftRenderRequest,
  DraftRenderStatus,
} from '../types';

export class M2GatewayClient implements M2Gateway {
  constructor(private baseUrl: string) {}

  async getLatestJob(projectId: string, assetId: string): Promise<M2JobStatus> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/assets/${assetId}/status`);

    if (!response.ok) {
      throw new Error(`Failed to fetch job status: ${response.status}`);
    }

    return response.json();
  }

  async getTranscript(projectId: string, assetId: string): Promise<NormalizedTranscript> {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/assets/${assetId}/transcript`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.status}`);
    }

    return response.json();
  }

  async getFillerSpans(projectId: string, assetId: string): Promise<FillerSpan[]> {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/assets/${assetId}/fillers`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch filler spans: ${response.status}`);
    }

    const data = await response.json();
    return data.fillers || [];
  }

  async requestDraft(req: DraftRenderRequest): Promise<{ renderId: string }> {
    const response = await fetch(`${this.baseUrl}/projects/${req.projectId}/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: req.assetId,
        config: req.preset,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to request draft: ${response.status}`);
    }

    return response.json();
  }

  async pollDraft(renderId: string): Promise<DraftRenderStatus> {
    const response = await fetch(`${this.baseUrl}/drafts/${renderId}/status`);

    if (!response.ok) {
      throw new Error(`Failed to poll draft: ${response.status}`);
    }

    return response.json();
  }
}
