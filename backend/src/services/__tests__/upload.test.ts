import { processUploadedFile, deleteUploadedFile, getFileSize, fileExists } from '../upload';
import fs from 'fs/promises';

jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Upload Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processUploadedFile', () => {
    it('should process uploaded file and return video metadata', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'video',
        originalname: 'test-video.mp4',
        encoding: '7bit',
        mimetype: 'video/mp4',
        size: 1024000,
        destination: '/uploads',
        filename: 'abc-123.mp4',
        path: '/uploads/abc-123.mp4',
        buffer: Buffer.from(''),
        stream: null as any,
      };

      const video = await processUploadedFile(mockFile);

      expect(video).toMatchObject({
        originalName: 'test-video.mp4',
        storedPath: '/uploads/abc-123.mp4',
        sizeBytes: 1024000,
        mimeType: 'video/mp4',
      });
      expect(video.id).toBeDefined();
      expect(video.uploadedAt).toBeDefined();
    });
  });

  describe('deleteUploadedFile', () => {
    it('should delete file successfully', async () => {
      mockFs.unlink.mockResolvedValueOnce(undefined);

      await deleteUploadedFile('/uploads/test.mp4');

      expect(mockFs.unlink).toHaveBeenCalledWith('/uploads/test.mp4');
    });

    it('should handle deletion errors gracefully', async () => {
      mockFs.unlink.mockRejectedValueOnce(new Error('File not found'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await deleteUploadedFile('/uploads/test.mp4');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getFileSize', () => {
    it('should return file size', async () => {
      mockFs.stat.mockResolvedValueOnce({ size: 2048000 } as any);

      const size = await getFileSize('/uploads/test.mp4');

      expect(size).toBe(2048000);
      expect(mockFs.stat).toHaveBeenCalledWith('/uploads/test.mp4');
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);

      const exists = await fileExists('/uploads/test.mp4');

      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));

      const exists = await fileExists('/uploads/test.mp4');

      expect(exists).toBe(false);
    });
  });
});
