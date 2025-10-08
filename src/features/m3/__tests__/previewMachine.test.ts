/**
 * Preview State Machine Tests
 */

import {
  createInitialContext,
  transition,
  type PreviewMachineState,
} from '../state/previewMachine';

describe('previewMachine', () => {
  let initial: PreviewMachineState;

  beforeEach(() => {
    initial = {
      state: 'idle',
      context: createInitialContext(),
    };
  });

  describe('idle → loading_data', () => {
    it('transitions on LOAD_DATA event', async () => {
      const next = await transition(initial, {
        type: 'LOAD_DATA',
        projectId: 'proj_1',
        assetId: 'asset_1',
        rawVideoUri: 'file://video.mp4',
      });

      expect(next.state).toBe('loading_data');
      expect(next.context.projectId).toBe('proj_1');
      expect(next.context.assetId).toBe('asset_1');
      expect(next.context.rawVideoUri).toBe('file://video.mp4');
    });
  });

  describe('loading_data → ready', () => {
    it('transitions on DATA_OK event', async () => {
      const loading: PreviewMachineState = {
        state: 'loading_data',
        context: createInitialContext(),
      };

      const next = await transition(loading, { type: 'DATA_OK' });

      expect(next.state).toBe('ready');
    });

    it('transitions to error on DATA_ERR event', async () => {
      const loading: PreviewMachineState = {
        state: 'loading_data',
        context: createInitialContext(),
      };

      const next = await transition(loading, {
        type: 'DATA_ERR',
        error: 'Network failure',
      });

      expect(next.state).toBe('error');
      expect(next.context.error).toBe('Network failure');
    });
  });

  describe('ready → generating_draft', () => {
    it('transitions on GENERATE_DRAFT event', async () => {
      const ready: PreviewMachineState = {
        state: 'ready',
        context: createInitialContext(),
      };

      const next = await transition(ready, {
        type: 'GENERATE_DRAFT',
        preset: {
          fillerRemoval: true,
          jumpCuts: false,
          captions: { enabled: true, size: 18, style: 'boxed' },
          introOutro: false,
          frameMarginPx: 16,
          version: 1,
          updatedAt: new Date().toISOString(),
        },
      });

      expect(next.state).toBe('generating_draft');
      expect(next.context.progressPct).toBe(0);
    });
  });

  describe('generating_draft → draft_ready', () => {
    it('transitions on DRAFT_OK event', async () => {
      const generating: PreviewMachineState = {
        state: 'generating_draft',
        context: createInitialContext(),
      };

      const next = await transition(generating, {
        type: 'DRAFT_OK',
        artifactUrl: 'https://cdn.example.com/draft.mp4',
      });

      expect(next.state).toBe('draft_ready');
      expect(next.context.draftArtifactUrl).toBe('https://cdn.example.com/draft.mp4');
      expect(next.context.progressPct).toBe(100);
    });

    it('transitions to error on DRAFT_ERR event', async () => {
      const generating: PreviewMachineState = {
        state: 'generating_draft',
        context: createInitialContext(),
      };

      const next = await transition(generating, {
        type: 'DRAFT_ERR',
        error: 'Rendering failed',
      });

      expect(next.state).toBe('error');
      expect(next.context.error).toBe('Rendering failed');
    });
  });

  describe('error → idle', () => {
    it('transitions on RETRY event', async () => {
      const error: PreviewMachineState = {
        state: 'error',
        context: {
          ...createInitialContext(),
          error: 'Some error',
        },
      };

      const next = await transition(error, { type: 'RETRY' });

      expect(next.state).toBe('idle');
      expect(next.context.error).toBeNull();
    });
  });

  describe('draft_ready → ready', () => {
    it('transitions on RESET event', async () => {
      const draftReady: PreviewMachineState = {
        state: 'draft_ready',
        context: {
          ...createInitialContext(),
          draftArtifactUrl: 'https://cdn.example.com/draft.mp4',
          renderId: 'render_123',
        },
      };

      const next = await transition(draftReady, { type: 'RESET' });

      expect(next.state).toBe('ready');
      expect(next.context.draftArtifactUrl).toBeNull();
      expect(next.context.renderId).toBeNull();
      expect(next.context.progressPct).toBe(0);
    });
  });

  describe('invalid transitions', () => {
    it('stays in current state for invalid events', async () => {
      const ready: PreviewMachineState = {
        state: 'ready',
        context: createInitialContext(),
      };

      const next = await transition(ready, { type: 'DATA_OK' } as any);

      expect(next.state).toBe('ready');
      expect(next).toEqual(ready);
    });
  });
});
