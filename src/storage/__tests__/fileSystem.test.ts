import * as FileSystem from 'expo-file-system/legacy';
import {
  getRawVideoDir,
  getProcessedVideoDir,
  getTempVideoDir,
  getRawVideoPath,
  getProcessedVideoPath,
  getTempVideoPath,
  ensureDirectoryExists,
  saveRawVideo,
  saveProcessedVideo,
  deleteVideo,
  deleteProjectVideos,
  getAvailableStorage,
  getDirectorySize,
  cleanupTempVideos,
} from '../fileSystem';

jest.mock('expo-file-system/legacy');

const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;

describe('fileSystem', () => {
  const validProjectId = '550e8400-e29b-41d4-a716-446655440000';
  const validVideoId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const invalidId = 'not-a-uuid';
  const mockDocDir = 'file:///mock/';
  const mockTimestamp = 1234567890000;

  beforeAll(() => {
    (FileSystem as any).documentDirectory = mockDocDir;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Path builders', () => {
    describe('getRawVideoDir', () => {
      it('returns correct path for valid projectId', () => {
        const path = getRawVideoDir(validProjectId);
        expect(path).toBe(`${mockDocDir}videos/raw/${validProjectId}/`);
      });

      it('throws error for invalid projectId', () => {
        expect(() => getRawVideoDir(invalidId)).toThrow('Invalid projectId UUID');
      });
    });
  });
});
