import * as crypto from 'crypto';
import * as fs from 'fs';
import { Readable } from 'stream';

export interface UploadMeta {
  projectId: string;
  assetId: string;
  bytes: number;
  md5: string;
}

export interface UploadSession {
  sessionId: string;
  file: string | Readable;
  meta: UploadMeta;
  chunks: Buffer[];
  uploadedBytes: number;
  status: 'pending' | 'uploading' | 'complete' | 'aborted' | 'failed';
  createdAt: Date;
}

export interface UploadResult {
  objectUrl: string;
  etag: string;
  md5: string;
}

type ProgressCallback = (pct: number, sentBytes: number) => void;

export class UploadAdapter {
  private sessions = new Map<string, UploadSession>();
  private progressListeners = new Map<string, ProgressCallback[]>();
  private readonly chunkSize = 5 * 1024 * 1024;
  private readonly maxParallel = 4;
  private readonly baseUrl: string;

  constructor(config: { baseUrl: string }) {
    this.baseUrl = config.baseUrl;
  }

  async startUpload(
    file: Readable | string,
    meta: UploadMeta
  ): Promise<{ sessionId: string }> {
    const sessionId = crypto.randomUUID();
    const session: UploadSession = {
      sessionId,
      file,
      meta,
      chunks: [],
      uploadedBytes: 0,
      status: 'pending',
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return { sessionId };
  }

  async appendChunk(sessionId: string, chunk: Buffer, idx: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (session.status === 'aborted') throw new Error('Upload aborted');

    session.chunks[idx] = chunk;
    session.uploadedBytes += chunk.length;
    session.status = 'uploading';

    this.emitProgress(sessionId, session.uploadedBytes, session.meta.bytes);

    await this.uploadChunkWithRetry(sessionId, chunk, idx);
  }

  async completeUpload(sessionId: string): Promise<UploadResult> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const finalMd5 = this.calculateMd5(session.chunks);
    if (finalMd5 !== session.meta.md5) {
      throw new Error(`Checksum mismatch: expected ${session.meta.md5}, got ${finalMd5}`);
    }

    const objectUrl = `${this.baseUrl}/uploads/${session.meta.projectId}/${session.meta.assetId}`;
    session.status = 'complete';

    this.emitProgress(sessionId, session.meta.bytes, session.meta.bytes);

    return {
      objectUrl,
      etag: crypto.randomBytes(16).toString('hex'),
      md5: finalMd5,
    };
  }

  onProgress(sessionId: string, callback: ProgressCallback): void {
    const listeners = this.progressListeners.get(sessionId) || [];
    listeners.push(callback);
    this.progressListeners.set(sessionId, listeners);
  }

  async abort(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'aborted';
    }
  }

  private emitProgress(sessionId: string, sentBytes: number, totalBytes: number): void {
    const pct = Math.min(100, Math.floor((sentBytes / totalBytes) * 100));
    const listeners = this.progressListeners.get(sessionId) || [];
    listeners.forEach(cb => cb(pct, sentBytes));
  }

  private calculateMd5(chunks: Buffer[]): string {
    const hash = crypto.createHash('md5');
    chunks.forEach(chunk => hash.update(chunk));
    return hash.digest('hex');
  }

  private async uploadChunkWithRetry(
    sessionId: string,
    chunk: Buffer,
    idx: number,
    attempt = 0
  ): Promise<void> {
    const maxRetries = 3;
    const baseDelay = 1000;

    try {
      await this.uploadChunkHttp(sessionId, chunk, idx);
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.uploadChunkWithRetry(sessionId, chunk, idx, attempt + 1);
      }
      throw err;
    }
  }

  private async uploadChunkHttp(
    sessionId: string,
    chunk: Buffer,
    idx: number
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const url = `${this.baseUrl}/upload-chunk`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Session-Id': sessionId,
        'X-Chunk-Index': idx.toString(),
      },
      body: chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.length) as ArrayBuffer,
    });

    if (!response.ok) {
      throw new Error(`Upload chunk failed: ${response.status} ${response.statusText}`);
    }
  }

  async uploadFile(filePath: string, meta: UploadMeta): Promise<UploadResult> {
    const { sessionId } = await this.startUpload(filePath, meta);
    const fileBuffer = fs.readFileSync(filePath);
    const totalChunks = Math.ceil(fileBuffer.length / this.chunkSize);

    const chunkPromises: Promise<void>[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, fileBuffer.length);
      const chunk = fileBuffer.slice(start, end);

      if (chunkPromises.length >= this.maxParallel) {
        await Promise.race(chunkPromises);
      }

      const promise = this.appendChunk(sessionId, chunk, i).then(() => {
        chunkPromises.splice(chunkPromises.indexOf(promise), 1);
      });
      chunkPromises.push(promise);
    }

    await Promise.all(chunkPromises);
    return this.completeUpload(sessionId);
  }
}
