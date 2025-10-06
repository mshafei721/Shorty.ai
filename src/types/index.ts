export interface Project {
  id: string;
  name: string;
  niche: string;
  subNiche: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Script {
  id: string;
  projectId: string;
  text: string;
  wordsCount: number;
  wpmTarget: number;
  createdAt: string;
  source: 'ai' | 'manual';
}

export type VideoAssetType = 'raw' | 'processed';
export type VideoAssetStatus = 'ready' | 'processing' | 'failed' | 'cancelled';

export interface VideoAsset {
  id: string;
  projectId: string;
  type: VideoAssetType;
  scriptId: string | null;
  localUri: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: string;
  exportedAt: string | null;
  status: VideoAssetStatus;
}

export interface UserProfile {
  niche: string;
  subNiche: string;
  onboardedAt: string;
}

export interface AnalyticsData {
  [key: string]: number;
}
