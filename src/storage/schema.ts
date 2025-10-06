import { Project, Script, VideoAsset, UserProfile, AnalyticsData } from '../types';

export const APP_STATE_VERSION = 1;

export interface StorageSchema {
  appStateVersion: number;
  projects: Project[];
  scripts: Script[];
  videos: VideoAsset[];
  analytics: AnalyticsData;
  userProfile: UserProfile | null;
}

export const STORAGE_KEYS = {
  APP_STATE_VERSION: 'appStateVersion',
  PROJECTS: 'projects',
  SCRIPTS: 'scripts',
  VIDEOS: 'videos',
  ANALYTICS: 'analytics',
  USER_PROFILE: 'userProfile',
} as const;

export const DEFAULT_STORAGE_STATE: StorageSchema = {
  appStateVersion: APP_STATE_VERSION,
  projects: [],
  scripts: [],
  videos: [],
  analytics: {},
  userProfile: null,
};
