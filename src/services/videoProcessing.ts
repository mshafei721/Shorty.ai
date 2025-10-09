/**
 * Video Processing Service (On-Device)
 *
 * Uses FFmpegKit to perform video operations on-device:
 * - Subtitle burning
 * - Video trimming/cutting
 * - Basic video operations
 *
 * @module services/videoProcessing
 */

import { FFmpegKit, FFmpegKitConfig, ReturnCode, Statistics } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface SubtitleEntry {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface ProcessingProgress {
  percentage: number;
  time: number;
  bitrate: number;
  speed: number;
}

export interface ProcessingOptions {
  onProgress?: (progress: ProcessingProgress) => void;
  onComplete?: (outputPath: string) => void;
  onError?: (error: Error) => void;
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
}

export class VideoProcessingService {
  private static instance: VideoProcessingService;
  private processingDir: string;

  private constructor() {
    this.processingDir = `${FileSystem.documentDirectory}processing/`;
    this.ensureProcessingDirectory();
  }

  static getInstance(): VideoProcessingService {
    if (!VideoProcessingService.instance) {
      VideoProcessingService.instance = new VideoProcessingService();
    }
    return VideoProcessingService.instance;
  }

  private async ensureProcessingDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.processingDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.processingDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to create processing directory:', error);
    }
  }

  /**
   * Get video information using FFprobe
   */
  async getVideoInfo(videoUri: string): Promise<VideoInfo> {
    const command = `-i "${videoUri}" -v quiet -print_format json -show_format -show_streams`;

    try {
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();
      const output = await session.getOutput();

      if (ReturnCode.isSuccess(returnCode) && output) {
        const info = JSON.parse(output);
        const videoStream = info.streams?.find((s: any) => s.codec_type === 'video');

        return {
          duration: parseFloat(info.format?.duration || '0'),
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          codec: videoStream?.codec_name || 'unknown',
          bitrate: parseInt(info.format?.bit_rate || '0', 10),
        };
      }

      throw new Error('Failed to get video info');
    } catch (error) {
      throw new Error(`Video info extraction failed: ${error}`);
    }
  }

  /**
   * Generate SRT subtitle file from subtitle entries
   */
  private generateSRTContent(subtitles: SubtitleEntry[]): string {
    return subtitles
      .map((sub) => {
        const startTime = this.formatSRTTime(sub.startTime);
        const endTime = this.formatSRTTime(sub.endTime);
        return `${sub.index}\n${startTime} --> ${endTime}\n${sub.text}\n`;
      })
      .join('\n');
  }

  /**
   * Format time in SRT format (HH:MM:SS,mmm)
   */
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Burn subtitles into video
   */
  async burnSubtitles(
    videoUri: string,
    subtitles: SubtitleEntry[],
    options: ProcessingOptions = {}
  ): Promise<string> {
    try {
      await this.ensureProcessingDirectory();

      const timestamp = Date.now();
      const srtPath = `${this.processingDir}subtitles_${timestamp}.srt`;
      const outputPath = `${this.processingDir}output_${timestamp}.mp4`;

      const srtContent = this.generateSRTContent(subtitles);
      await FileSystem.writeAsStringAsync(srtPath, srtContent);

      const command = `-i "${videoUri}" -vf "subtitles=${srtPath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=1,Alignment=2,MarginV=20'" -c:v libx264 -preset medium -crf 23 -c:a copy "${outputPath}"`;

      console.log('FFmpeg subtitle burn command:', command);

      let videoDuration = 0;
      try {
        const info = await this.getVideoInfo(videoUri);
        videoDuration = info.duration;
      } catch (error) {
        console.warn('Could not get video duration for progress tracking');
      }

      FFmpegKitConfig.enableStatisticsCallback((statistics: Statistics) => {
        if (options.onProgress && videoDuration > 0) {
          const time = statistics.getTime() / 1000;
          const percentage = Math.min((time / videoDuration) * 100, 100);

          options.onProgress({
            percentage: Math.round(percentage),
            time,
            bitrate: statistics.getBitrate(),
            speed: statistics.getSpeed(),
          });
        }
      });

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      await FileSystem.deleteAsync(srtPath, { idempotent: true });

      if (ReturnCode.isSuccess(returnCode)) {
        options.onComplete?.(outputPath);
        return outputPath;
      } else {
        const failStackTrace = await session.getFailStackTrace();
        throw new Error(`Subtitle burning failed: ${failStackTrace}`);
      }
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    } finally {
      FFmpegKitConfig.enableStatisticsCallback(() => {});
    }
  }

  /**
   * Trim video to specific time range
   */
  async trimVideo(
    videoUri: string,
    startTime: number,
    endTime: number,
    options: ProcessingOptions = {}
  ): Promise<string> {
    try {
      await this.ensureProcessingDirectory();

      const timestamp = Date.now();
      const outputPath = `${this.processingDir}trimmed_${timestamp}.mp4`;

      const duration = endTime - startTime;
      const command = `-i "${videoUri}" -ss ${startTime} -t ${duration} -c copy "${outputPath}"`;

      console.log('FFmpeg trim command:', command);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        options.onComplete?.(outputPath);
        return outputPath;
      } else {
        const failStackTrace = await session.getFailStackTrace();
        throw new Error(`Video trimming failed: ${failStackTrace}`);
      }
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Concatenate multiple video segments (useful for filler word removal)
   */
  async concatenateVideos(
    videoSegments: string[],
    options: ProcessingOptions = {}
  ): Promise<string> {
    try {
      await this.ensureProcessingDirectory();

      const timestamp = Date.now();
      const listPath = `${this.processingDir}concat_${timestamp}.txt`;
      const outputPath = `${this.processingDir}concatenated_${timestamp}.mp4`;

      const listContent = videoSegments.map((seg) => `file '${seg}'`).join('\n');
      await FileSystem.writeAsStringAsync(listPath, listContent);

      const command = `-f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;

      console.log('FFmpeg concatenate command:', command);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      await FileSystem.deleteAsync(listPath, { idempotent: true });

      if (ReturnCode.isSuccess(returnCode)) {
        options.onComplete?.(outputPath);
        return outputPath;
      } else {
        const failStackTrace = await session.getFailStackTrace();
        throw new Error(`Video concatenation failed: ${failStackTrace}`);
      }
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Remove filler words from video by cutting out segments
   */
  async removeFillerWords(
    videoUri: string,
    fillerSegments: Array<{ start: number; end: number }>,
    options: ProcessingOptions = {}
  ): Promise<string> {
    try {
      const videoInfo = await this.getVideoInfo(videoUri);
      const duration = videoInfo.duration;

      const keepSegments: Array<{ start: number; end: number }> = [];
      let currentTime = 0;

      for (const filler of fillerSegments.sort((a, b) => a.start - b.start)) {
        if (currentTime < filler.start) {
          keepSegments.push({ start: currentTime, end: filler.start });
        }
        currentTime = filler.end;
      }

      if (currentTime < duration) {
        keepSegments.push({ start: currentTime, end: duration });
      }

      if (keepSegments.length === 1 && keepSegments[0].start === 0 && keepSegments[0].end === duration) {
        return videoUri;
      }

      const segmentPaths: string[] = [];
      for (let i = 0; i < keepSegments.length; i++) {
        const segment = keepSegments[i];
        const segmentPath = await this.trimVideo(videoUri, segment.start, segment.end);
        segmentPaths.push(segmentPath);
      }

      const finalPath = await this.concatenateVideos(segmentPaths, options);

      for (const segmentPath of segmentPaths) {
        await FileSystem.deleteAsync(segmentPath, { idempotent: true });
      }

      return finalPath;
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Clean up processing directory
   */
  async cleanupProcessingFiles(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.processingDir);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(this.processingDir);
        for (const file of files) {
          await FileSystem.deleteAsync(`${this.processingDir}${file}`, { idempotent: true });
        }
      }
    } catch (error) {
      console.error('Failed to cleanup processing files:', error);
    }
  }

  /**
   * Cancel ongoing FFmpeg session
   */
  async cancelProcessing(): Promise<void> {
    try {
      await FFmpegKit.cancel();
    } catch (error) {
      console.error('Failed to cancel FFmpeg session:', error);
    }
  }
}

export const videoProcessingService = VideoProcessingService.getInstance();
