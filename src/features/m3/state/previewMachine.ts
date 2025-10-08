/**
 * Preview State Machine
 *
 * Manages the preview screen lifecycle: data loading, draft generation, and playback.
 * States: idle → loading_data → ready → generating_draft → draft_ready | error
 *
 * @module features/m3/state/previewMachine
 */

import type { PreviewState, PreviewContext, M3Preset } from '../types';
import { getM2Gateway } from '../gateway';

export type PreviewEvent =
  | { type: 'LOAD_DATA'; projectId: string; assetId: string; rawVideoUri: string }
  | { type: 'DATA_OK' }
  | { type: 'DATA_ERR'; error: string }
  | { type: 'GENERATE_DRAFT'; preset: M3Preset }
  | { type: 'DRAFT_OK'; artifactUrl: string }
  | { type: 'DRAFT_ERR'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

export interface PreviewMachineState {
  state: PreviewState;
  context: PreviewContext;
}

export function createInitialContext(): PreviewContext {
  return {
    projectId: '',
    assetId: '',
    rawVideoUri: '',
    transcript: null,
    fillerSpans: [],
    draftArtifactUrl: null,
    renderId: null,
    error: null,
    progressPct: 0,
  };
}

export async function transition(
  current: PreviewMachineState,
  event: PreviewEvent
): Promise<PreviewMachineState> {
  switch (current.state) {
    case 'idle':
      if (event.type === 'LOAD_DATA') {
        return {
          state: 'loading_data',
          context: {
            ...current.context,
            projectId: event.projectId,
            assetId: event.assetId,
            rawVideoUri: event.rawVideoUri,
            error: null,
          },
        };
      }
      break;

    case 'loading_data':
      if (event.type === 'DATA_OK') {
        return {
          state: 'ready',
          context: current.context,
        };
      }
      if (event.type === 'DATA_ERR') {
        return {
          state: 'error',
          context: {
            ...current.context,
            error: event.error,
          },
        };
      }
      break;

    case 'ready':
      if (event.type === 'GENERATE_DRAFT') {
        return {
          state: 'generating_draft',
          context: {
            ...current.context,
            progressPct: 0,
          },
        };
      }
      break;

    case 'generating_draft':
      if (event.type === 'DRAFT_OK') {
        return {
          state: 'draft_ready',
          context: {
            ...current.context,
            draftArtifactUrl: event.artifactUrl,
            progressPct: 100,
          },
        };
      }
      if (event.type === 'DRAFT_ERR') {
        return {
          state: 'error',
          context: {
            ...current.context,
            error: event.error,
          },
        };
      }
      break;

    case 'error':
      if (event.type === 'RETRY') {
        return {
          state: 'idle',
          context: createInitialContext(),
        };
      }
      break;

    case 'draft_ready':
      if (event.type === 'RESET') {
        return {
          state: 'ready',
          context: {
            ...current.context,
            draftArtifactUrl: null,
            renderId: null,
            progressPct: 0,
          },
        };
      }
      break;
  }

  return current;
}

export async function loadPreviewData(
  projectId: string,
  assetId: string
): Promise<Pick<PreviewContext, 'transcript' | 'fillerSpans'>> {
  const gateway = getM2Gateway();

  const [transcript, fillerSpans] = await Promise.all([
    gateway.getTranscript(projectId, assetId),
    gateway.getFillerSpans(projectId, assetId),
  ]);

  return { transcript, fillerSpans };
}

export async function generateDraft(
  projectId: string,
  assetId: string,
  preset: M3Preset,
  onProgress?: (pct: number) => void
): Promise<string> {
  const gateway = getM2Gateway();

  const { renderId } = await gateway.requestDraft({ projectId, assetId, preset });

  const maxPollAttempts = 60;
  const pollIntervalMs = 2000;

  for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const status = await gateway.pollDraft(renderId);

    if (onProgress && status.progressPct !== undefined) {
      onProgress(status.progressPct);
    }

    if (status.status === 'done') {
      if (!status.artifactUrl) {
        throw new Error('Draft completed but no artifact URL provided');
      }
      return status.artifactUrl;
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Draft rendering failed');
    }
  }

  throw new Error('Draft rendering timed out after 2 minutes');
}
