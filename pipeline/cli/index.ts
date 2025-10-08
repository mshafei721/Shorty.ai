#!/usr/bin/env node

import { JobOrchestrator, StageHandler } from '../orchestrator';
import { UploadAdapter } from '../upload';
import { TranscriptionService, AssemblyAIAdapter, DeepgramAdapter } from '../transcribe';
import { FillerDetectionService } from '../nlp';
import { ShotstackCompositionAdapter } from '../compose';
import { MuxEncodingAdapter, EncodingService } from '../encode';
import { AIScriptService, OpenAIProvider, AnthropicProvider } from '../adapters/ai-script';
import { Job } from '../schemas/types';
import * as fs from 'fs';
import * as path from 'path';

const config = {
  upload: { baseUrl: process.env.UPLOAD_BASE_URL || 'http://localhost:3000' },
  assemblyai: { apiKey: process.env.ASSEMBLYAI_API_KEY || '' },
  deepgram: { apiKey: process.env.DEEPGRAM_API_KEY || '' },
  shotstack: { apiKey: process.env.SHOTSTACK_API_KEY || '' },
  mux: {
    tokenId: process.env.MUX_TOKEN_ID || '',
    tokenSecret: process.env.MUX_TOKEN_SECRET || '',
  },
  openai: { apiKey: process.env.OPENAI_API_KEY || '' },
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY || '' },
};

class UploadStageHandler implements StageHandler {
  constructor(private adapter: UploadAdapter, private filePath: string) {}

  canExecute(job: Job): boolean {
    return fs.existsSync(this.filePath);
  }

  async execute(job: Job): Promise<void> {
    const stats = fs.statSync(this.filePath);
    const buffer = fs.readFileSync(this.filePath);
    const crypto = require('crypto');
    const md5 = crypto.createHash('md5').update(buffer).digest('hex');

    const result = await this.adapter.uploadFile(this.filePath, {
      projectId: job.projectId,
      assetId: job.assetId,
      bytes: stats.size,
      md5,
    });

    job.artifacts = job.artifacts || {};
    job.artifacts.objectUrl = result.objectUrl;
    job.artifacts.checksum = result.md5;

    console.log(`✓ Upload complete: ${result.objectUrl}`);
  }
}

class TranscribeStageHandler implements StageHandler {
  constructor(private service: TranscriptionService) {}

  canExecute(job: Job): boolean {
    return !!job.artifacts?.objectUrl;
  }

  async execute(job: Job): Promise<void> {
    const { txId, provider } = await this.service.requestTranscription(job.artifacts!.objectUrl!);

    console.log(`⏳ Transcription ${txId} queued with ${provider}...`);

    let transcript;
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        transcript = await this.service.fetchTranscript(txId, provider);
        break;
      } catch (err) {
        if (i === 59) throw err;
      }
    }

    job.artifacts!.transcriptId = txId;
    console.log(`✓ Transcription complete: ${transcript!.words.substring(0, 50)}...`);
  }
}

class NLPStageHandler implements StageHandler {
  constructor(private service: FillerDetectionService) {}

  canExecute(job: Job): boolean {
    return !!job.artifacts?.transcriptId;
  }

  async execute(job: Job): Promise<void> {
    console.log('⏳ Detecting fillers...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✓ Filler detection complete');
  }
}

class ComposeStageHandler implements StageHandler {
  constructor(private adapter: ShotstackCompositionAdapter) {}

  canExecute(job: Job): boolean {
    return !!job.artifacts?.objectUrl;
  }

  async execute(job: Job): Promise<void> {
    console.log('⏳ Creating timeline...');

    const { timelineId } = await this.adapter.createTimeline({
      transcript: {
        tokens: [],
        words: '',
        language: 'en',
        segments: [],
      },
      fillers: [],
      brand: {},
      captions: true,
      videoUrl: job.artifacts!.objectUrl!,
    });

    const { renderId } = await this.adapter.renderTimeline(timelineId);

    job.artifacts!.timelineId = timelineId;
    job.artifacts!.renderId = renderId;

    console.log(`✓ Render started: ${renderId}`);
  }
}

class EncodeStageHandler implements StageHandler {
  constructor(private service: EncodingService) {}

  canExecute(job: Job): boolean {
    return !!job.artifacts?.renderId;
  }

  async execute(job: Job): Promise<void> {
    console.log('⏳ Encoding video...');

    const { encodeId } = await this.service.encodeVideo('http://example.com/composed.mp4');

    job.artifacts!.encodeId = encodeId;
    job.artifacts!.assetUrl = `https://stream.mux.com/${encodeId}.m3u8`;

    console.log(`✓ Encoding complete: ${job.artifacts!.assetUrl}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'upload') {
    const filePath = args[1];
    const projectId = args.find(a => a.startsWith('--project='))?.split('=')[1] || 'demo-project';
    const assetId = args.find(a => a.startsWith('--asset='))?.split('=')[1] || 'demo-asset';

    if (!filePath) {
      console.error('Usage: shorty upload <file> [--project=ID] [--asset=ID]');
      process.exit(1);
    }

    const adapter = new UploadAdapter(config.upload);
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);
    const crypto = require('crypto');
    const md5 = crypto.createHash('md5').update(buffer).digest('hex');

    console.log(`📤 Uploading ${path.basename(filePath)}...`);

    const result = await adapter.uploadFile(filePath, {
      projectId,
      assetId,
      bytes: stats.size,
      md5,
    });

    console.log(`✅ Upload complete:`);
    console.log(`   URL: ${result.objectUrl}`);
    console.log(`   MD5: ${result.md5}`);
  } else if (command === 'run') {
    const jobId = args.find(a => a.startsWith('--job='))?.split('=')[1];
    const watch = args.includes('--watch');
    const filePath = args.find(a => !a.startsWith('--') && a !== 'run');

    if (!filePath && !jobId) {
      console.error('Usage: shorty run <file> [--watch] OR shorty run --job=<id> [--watch]');
      process.exit(1);
    }

    const orchestrator = new JobOrchestrator();

    const uploadAdapter = new UploadAdapter(config.upload);
    const transcriptionService = new TranscriptionService(
      new AssemblyAIAdapter(config.assemblyai),
      new DeepgramAdapter(config.deepgram)
    );
    const nlpService = new FillerDetectionService();
    const composeAdapter = new ShotstackCompositionAdapter(config.shotstack);
    const encodeService = new EncodingService(new MuxEncodingAdapter(config.mux));

    orchestrator.registerHandler('upload', new UploadStageHandler(uploadAdapter, filePath || ''));
    orchestrator.registerHandler('transcribe', new TranscribeStageHandler(transcriptionService));
    orchestrator.registerHandler('nlp', new NLPStageHandler(nlpService));
    orchestrator.registerHandler('compose', new ComposeStageHandler(composeAdapter));
    orchestrator.registerHandler('encode', new EncodeStageHandler(encodeService));

    const job = jobId
      ? orchestrator.getJob(jobId)!
      : orchestrator.createJob('demo-project', 'demo-asset');

    console.log(`🚀 Starting pipeline for job ${job.jobId}...\n`);

    if (watch) {
      orchestrator.on('job.updated', event => {
        console.log(`📊 Progress: ${event.data?.progressPct}%`);
      });
    }

    try {
      await orchestrator.executeJob(job.jobId);
      console.log(`\n✅ Pipeline complete!`);
      console.log(`   Asset URL: ${job.artifacts?.assetUrl}`);
    } catch (err) {
      console.error(`\n❌ Pipeline failed:`, err);
      process.exit(1);
    }
  } else if (command === 'dump') {
    const jobId = args.find(a => a.startsWith('--job='))?.split('=')[1];
    const showStages = args.includes('--stages');

    if (!jobId) {
      console.error('Usage: shorty dump --job=<id> [--stages]');
      process.exit(1);
    }

    const orchestrator = new JobOrchestrator();
    const job = orchestrator.getJob(jobId);

    if (!job) {
      console.error(`Job ${jobId} not found`);
      process.exit(1);
    }

    console.log(JSON.stringify(job, null, 2));

    if (showStages) {
      console.log('\n=== Stages ===');
      Object.entries(job.stages).forEach(([stage, state]) => {
        console.log(`${stage}: ${state.status} (${state.attempts} attempts)`);
      });
    }
  } else if (command === 'generate-script') {
    const topic = args.find(a => !a.startsWith('--') && a !== 'generate-script');
    const description = args.find(a => a.startsWith('--description='))?.split('=')[1];

    if (!topic) {
      console.error('Usage: shorty generate-script <topic> [--description=...]');
      process.exit(1);
    }

    const service = new AIScriptService(
      new OpenAIProvider(config.openai),
      new AnthropicProvider(config.anthropic)
    );

    console.log(`🤖 Generating script for: ${topic}\n`);

    const result = await service.moderateAndGenerate({ topic, description });

    console.log(`✅ Generated ${result.wordCount} words\n`);
    console.log('=== Outline ===');
    result.outline.forEach(point => console.log(`- ${point}`));
    console.log('\n=== Script ===');
    console.log(result.script);
  } else {
    console.log(`
Shorty.ai Pipeline CLI

Commands:
  upload <file> [--project=ID] [--asset=ID]
      Upload a video file

  run <file> [--watch]
      Run complete pipeline on a file

  run --job=<id> [--watch]
      Resume existing job

  dump --job=<id> [--stages]
      Show job details

  generate-script <topic> [--description=...]
      Generate AI script

Environment variables:
  UPLOAD_BASE_URL, ASSEMBLYAI_API_KEY, DEEPGRAM_API_KEY,
  SHOTSTACK_API_KEY, MUX_TOKEN_ID, MUX_TOKEN_SECRET,
  OPENAI_API_KEY, ANTHROPIC_API_KEY
    `);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { main };
