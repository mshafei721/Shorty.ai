export interface ExportArtifact {
  assetId: string;
  projectId: string;
  url: string | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  createdAt: string;
  readyAt: string | null;
  expiresAt: string | null;
  sizeBytes: number | null;
  durationSec: number | null;
  error: ExportError | null;
}

export interface ExportError {
  code: ExportErrorCode;
  message: string;
  userMessage: string;
  recoveryActions: RecoveryAction[];
}

export type ExportErrorCode =
  | 'NETWORK_OFFLINE'
  | 'ASSET_NOT_READY'
  | 'ASSET_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'STORAGE_FULL'
  | 'SHARE_CANCELLED'
  | 'UNKNOWN_ERROR';

export interface RecoveryAction {
  type: 'retry' | 'open_settings' | 'clear_cache' | 'report_issue' | 'dismiss';
  label: string;
  handler?: () => void | Promise<void>;
}

export interface ShareOptions {
  type: 'native' | 'save_to_photos' | 'copy_link';
  artifactUrl: string;
  projectName?: string;
  assetId: string;
}

export interface ShareResult {
  success: boolean;
  action?: 'shared' | 'saved' | 'copied' | 'cancelled';
  error?: ExportError;
}

export interface OfflineAction {
  id: string;
  type: 'share' | 'save' | 'upload';
  payload: unknown;
  createdAt: string;
  idempotencyKey: string;
  retries: number;
  lastAttemptAt: string | null;
  error: ExportError | null;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.2,
};

export interface ExportGateway {
  getLatestArtifact(projectId: string, assetId: string): Promise<ExportArtifact>;
  ensureShareableUrl(projectId: string, assetId: string): Promise<string>;
}
