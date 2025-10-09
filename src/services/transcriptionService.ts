/**
 * Transcription Service (On-Device with Whisper)
 *
 * Uses React Native ExecuTorch with Whisper for on-device speech-to-text
 * - Transcribe audio/video to text
 * - Generate subtitles with timestamps
 * - Detect filler words
 *
 * @module services/transcriptionService
 */

import { ExecuTorchModule } from 'react-native-executorch';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import type { SubtitleEntry } from './videoProcessing';

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  words: TranscriptionWord[];
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

export interface FillerWordSegment {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionOptions {
  language?: string;
  detectFillers?: boolean;
  onProgress?: (progress: number) => void;
  onSegment?: (segment: TranscriptionSegment) => void;
}

const FILLER_WORDS = [
  'um',
  'uh',
  'uhm',
  'like',
  'you know',
  'i mean',
  'so',
  'basically',
  'actually',
  'literally',
  'right',
  'okay',
  'well',
  'yeah',
  'kind of',
  'sort of',
];

export class TranscriptionService {
  private static instance: TranscriptionService;
  private modelLoaded = false;
  private modelPath: string | null = null;

  private constructor() {}

  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  /**
   * Load Whisper model from Hugging Face or local assets
   * Model: software-mansion/react-native-executorch-whisper-tiny.en
   */
  async loadModel(): Promise<void> {
    if (this.modelLoaded) {
      return;
    }

    try {
      const modelFileName = 'whisper_tiny_en.pte';
      const modelDir = `${FileSystem.documentDirectory}models/`;
      this.modelPath = `${modelDir}${modelFileName}`;

      const dirInfo = await FileSystem.getInfoAsync(modelDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
      }

      const fileInfo = await FileSystem.getInfoAsync(this.modelPath);
      if (!fileInfo.exists) {
        const modelUrl =
          'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/main/whisper_tiny_en.pte';

        console.log('Downloading Whisper model (~40MB)...');
        const downloadResult = await FileSystem.downloadAsync(modelUrl, this.modelPath);

        if (downloadResult.status !== 200) {
          throw new Error(`Failed to download model: ${downloadResult.status}`);
        }

        console.log('Whisper model downloaded successfully');
      }

      await ExecuTorchModule.loadModule(this.modelPath, 'whisper');
      this.modelLoaded = true;
      console.log('Whisper model loaded successfully');
    } catch (error) {
      console.error('Failed to load Whisper model:', error);
      throw new Error(`Model loading failed: ${error}`);
    }
  }

  /**
   * Extract audio from video file using FFmpeg
   */
  private async extractAudio(videoUri: string): Promise<string> {
    const { FFmpegKit } = await import('ffmpeg-kit-react-native');

    const timestamp = Date.now();
    const audioPath = `${FileSystem.documentDirectory}temp/audio_${timestamp}.wav`;

    const tempDir = `${FileSystem.documentDirectory}temp/`;
    const dirInfo = await FileSystem.getInfoAsync(tempDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    }

    const command = `-i "${videoUri}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`;

    console.log('Extracting audio from video...');
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (!(await import('ffmpeg-kit-react-native')).ReturnCode.isSuccess(returnCode)) {
      const failStackTrace = await session.getFailStackTrace();
      throw new Error(`Audio extraction failed: ${failStackTrace}`);
    }

    return audioPath;
  }

  /**
   * Transcribe video to text with timestamps
   */
  async transcribe(
    videoUri: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    try {
      if (!this.modelLoaded) {
        await this.loadModel();
      }

      const audioPath = await this.extractAudio(videoUri);

      console.log('Starting transcription with Whisper...');
      options.onProgress?.(10);

      const result = await ExecuTorchModule.forward({
        audioPath,
        language: options.language || 'en',
        streaming: true,
      });

      options.onProgress?.(90);

      await FileSystem.deleteAsync(audioPath, { idempotent: true });

      const transcription = this.parseWhisperOutput(result);

      if (options.onSegment) {
        transcription.segments.forEach((segment) => {
          options.onSegment!(segment);
        });
      }

      options.onProgress?.(100);

      return transcription;
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Parse Whisper output into structured format
   */
  private parseWhisperOutput(result: any): TranscriptionResult {
    const segments: TranscriptionSegment[] = [];
    let fullText = '';

    if (result.segments && Array.isArray(result.segments)) {
      result.segments.forEach((seg: any, index: number) => {
        const words: TranscriptionWord[] = [];

        if (seg.words && Array.isArray(seg.words)) {
          seg.words.forEach((w: any) => {
            words.push({
              word: w.word || w.text || '',
              start: w.start || 0,
              end: w.end || 0,
              confidence: w.confidence || 0.9,
            });
          });
        }

        const segment: TranscriptionSegment = {
          id: index + 1,
          text: seg.text || '',
          start: seg.start || 0,
          end: seg.end || 0,
          words,
        };

        segments.push(segment);
        fullText += segment.text + ' ';
      });
    }

    return {
      text: fullText.trim(),
      segments,
      language: result.language || 'en',
      duration: result.duration || 0,
    };
  }

  /**
   * Convert transcription to subtitle format
   */
  convertToSubtitles(transcription: TranscriptionResult): SubtitleEntry[] {
    return transcription.segments.map((segment) => ({
      index: segment.id,
      startTime: segment.start,
      endTime: segment.end,
      text: segment.text,
    }));
  }

  /**
   * Detect filler words in transcription
   */
  detectFillerWords(transcription: TranscriptionResult): FillerWordSegment[] {
    const fillers: FillerWordSegment[] = [];

    transcription.segments.forEach((segment) => {
      segment.words.forEach((word) => {
        const cleanWord = word.word.toLowerCase().trim();

        if (FILLER_WORDS.includes(cleanWord)) {
          fillers.push({
            word: cleanWord,
            start: word.start,
            end: word.end,
          });
        }
      });
    });

    return fillers;
  }

  /**
   * Get segments to remove based on filler word detection
   */
  getFillerSegmentsForRemoval(transcription: TranscriptionResult): Array<{ start: number; end: number }> {
    const fillers = this.detectFillerWords(transcription);

    return fillers.map((filler) => ({
      start: Math.max(0, filler.start - 0.1),
      end: filler.end + 0.1,
    }));
  }

  /**
   * Unload model to free memory
   */
  async unloadModel(): Promise<void> {
    if (this.modelLoaded) {
      try {
        await ExecuTorchModule.unloadModule('whisper');
        this.modelLoaded = false;
        console.log('Whisper model unloaded');
      } catch (error) {
        console.error('Failed to unload model:', error);
      }
    }
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    return this.modelLoaded;
  }

  /**
   * Get estimated model size
   */
  getModelSize(): number {
    return 40 * 1024 * 1024;
  }
}

export const transcriptionService = TranscriptionService.getInstance();
