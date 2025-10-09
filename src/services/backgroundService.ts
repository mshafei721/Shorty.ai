/**
 * Background Service (Search & Replacement)
 *
 * - Search for topic-matched background images from Pexels API
 * - Download and cache background images
 * - Apply green screen removal and composite background
 *
 * @module services/backgroundService
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface BackgroundImage {
  id: string;
  url: string;
  photographer: string;
  photographerUrl: string;
  avgColor: string;
  width: number;
  height: number;
  source: 'pexels';
}

export interface BackgroundSearchOptions {
  query: string;
  orientation?: 'portrait' | 'landscape' | 'square';
  perPage?: number;
  page?: number;
}

export interface BackgroundCompositeOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (outputPath: string) => void;
  onError?: (error: Error) => void;
}

const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY';
const CACHE_DIR = `${FileSystem.documentDirectory}backgrounds/`;

export class BackgroundService {
  private static instance: BackgroundService;
  private cache: Map<string, string> = new Map();

  private constructor() {
    this.ensureCacheDirectory();
  }

  static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Search for background images on Pexels
   */
  async searchBackgrounds(options: BackgroundSearchOptions): Promise<BackgroundImage[]> {
    try {
      const { query, orientation = 'portrait', perPage = 10, page = 1 } = options;

      const url = new URL('https://api.pexels.com/v1/search');
      url.searchParams.append('query', query);
      url.searchParams.append('orientation', orientation);
      url.searchParams.append('per_page', perPage.toString());
      url.searchParams.append('page', page.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json();

      return data.photos.map((photo: any) => ({
        id: photo.id.toString(),
        url: photo.src.large2x || photo.src.large,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        avgColor: photo.avg_color,
        width: photo.width,
        height: photo.height,
        source: 'pexels' as const,
      }));
    } catch (error) {
      console.error('Background search failed:', error);
      throw error;
    }
  }

  /**
   * Download and cache background image
   */
  async downloadBackground(backgroundImage: BackgroundImage): Promise<string> {
    try {
      if (this.cache.has(backgroundImage.id)) {
        const cachedPath = this.cache.get(backgroundImage.id)!;
        const fileInfo = await FileSystem.getInfoAsync(cachedPath);
        if (fileInfo.exists) {
          return cachedPath;
        }
      }

      const fileName = `bg_${backgroundImage.id}.jpg`;
      const localPath = `${CACHE_DIR}${fileName}`;

      console.log(`Downloading background image: ${backgroundImage.id}`);

      const downloadResult = await FileSystem.downloadAsync(backgroundImage.url, localPath);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      this.cache.set(backgroundImage.id, localPath);

      return localPath;
    } catch (error) {
      console.error('Background download failed:', error);
      throw error;
    }
  }

  /**
   * Apply green screen removal and composite background using FFmpeg
   */
  async applyBackground(
    videoUri: string,
    backgroundImagePath: string,
    options: BackgroundCompositeOptions = {}
  ): Promise<string> {
    try {
      const { FFmpegKit, FFmpegKitConfig, ReturnCode } = await import('ffmpeg-kit-react-native');

      const timestamp = Date.now();
      const outputPath = `${FileSystem.documentDirectory}processing/bg_output_${timestamp}.mp4`;

      const processingDir = `${FileSystem.documentDirectory}processing/`;
      const dirInfo = await FileSystem.getInfoAsync(processingDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(processingDir, { intermediates: true });
      }

      const command = `-i "${videoUri}" -loop 1 -i "${backgroundImagePath}" -filter_complex "[0:v]colorkey=0x00FF00:0.3:0.2[ckout];[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg];[bg][ckout]overlay[out]" -map "[out]" -map 0:a? -c:v libx264 -preset medium -crf 23 -c:a copy -shortest "${outputPath}"`;

      console.log('Applying background with green screen removal...');

      if (options.onProgress) {
        FFmpegKitConfig.enableStatisticsCallback((statistics) => {
          const time = statistics.getTime() / 1000;
          options.onProgress?.(Math.min(time * 5, 95));
        });
      }

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      FFmpegKitConfig.enableStatisticsCallback(() => {});

      if (ReturnCode.isSuccess(returnCode)) {
        options.onComplete?.(outputPath);
        return outputPath;
      } else {
        const failStackTrace = await session.getFailStackTrace();
        throw new Error(`Background compositing failed: ${failStackTrace}`);
      }
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Apply solid color background (alternative to image)
   */
  async applySolidBackground(
    videoUri: string,
    color: string,
    options: BackgroundCompositeOptions = {}
  ): Promise<string> {
    try {
      const { FFmpegKit, ReturnCode } = await import('ffmpeg-kit-react-native');

      const timestamp = Date.now();
      const outputPath = `${FileSystem.documentDirectory}processing/bg_solid_${timestamp}.mp4`;

      const command = `-i "${videoUri}" -f lavfi -i "color=c=${color}:s=1080x1920:d=60" -filter_complex "[1:v][0:v]scale2ref[bg][vid];[bg][vid]overlay=(W-w)/2:(H-h)/2" -c:v libx264 -preset medium -crf 23 -c:a copy -shortest "${outputPath}"`;

      console.log(`Applying solid ${color} background...`);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        options.onComplete?.(outputPath);
        return outputPath;
      } else {
        const failStackTrace = await session.getFailStackTrace();
        throw new Error(`Solid background failed: ${failStackTrace}`);
      }
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Get suggested search query based on niche/topic
   */
  getSuggestedQuery(niche: string, subNiche?: string): string {
    const query = subNiche ? `${niche} ${subNiche}` : niche;
    return `${query} background abstract`;
  }

  /**
   * Clear background cache
   */
  async clearCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
        for (const file of files) {
          await FileSystem.deleteAsync(`${CACHE_DIR}${file}`, { idempotent: true });
        }
      }
      this.cache.clear();
      console.log('Background cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache size in bytes
   */
  async getCacheSize(): Promise<number> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        return 0;
      }

      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      let totalSize = 0;

      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }
}

export const backgroundService = BackgroundService.getInstance();
