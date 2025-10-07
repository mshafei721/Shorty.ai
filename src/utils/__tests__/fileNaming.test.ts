import {
  generateRawVideoFilename,
  generateProcessedVideoFilename,
  parseVideoFilename,
  validateUUID,
} from '../fileNaming';

describe('fileNaming', () => {
  const validProjectId = '550e8400-e29b-41d4-a716-446655440000';
  const validVideoId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const invalidId = 'not-a-uuid';

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1234567890000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateUUID', () => {
    it('validates correct UUIDs', () => {
      expect(validateUUID(validProjectId)).toBe(true);
      expect(validateUUID(validVideoId)).toBe(true);
      expect(validateUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
      expect(validateUUID('')).toBe(false);
      expect(validateUUID('not-a-uuid')).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
    });

    it('is case insensitive', () => {
      expect(validateUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(validateUUID('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
    });
  });

  describe('generateRawVideoFilename', () => {
    it('generates correct filename format', () => {
      const filename = generateRawVideoFilename(validProjectId);
      expect(filename).toBe(`raw_${validProjectId}_1234567890000.mp4`);
    });

    it('throws error for invalid projectId', () => {
      expect(() => generateRawVideoFilename(invalidId)).toThrow('Invalid projectId UUID');
    });

    it('uses current timestamp', () => {
      jest.spyOn(Date, 'now').mockReturnValue(9876543210000);
      const filename = generateRawVideoFilename(validProjectId);
      expect(filename).toBe(`raw_${validProjectId}_9876543210000.mp4`);
    });
  });

  describe('generateProcessedVideoFilename', () => {
    it('generates correct filename format', () => {
      const filename = generateProcessedVideoFilename(validVideoId);
      expect(filename).toBe(`processed_${validVideoId}_1234567890000.mp4`);
    });

    it('throws error for invalid videoId', () => {
      expect(() => generateProcessedVideoFilename(invalidId)).toThrow('Invalid videoId UUID');
    });

    it('uses current timestamp', () => {
      jest.spyOn(Date, 'now').mockReturnValue(9876543210000);
      const filename = generateProcessedVideoFilename(validVideoId);
      expect(filename).toBe(`processed_${validVideoId}_9876543210000.mp4`);
    });
  });

  describe('parseVideoFilename', () => {
    it('parses raw video filenames', () => {
      const filename = `raw_${validProjectId}_1234567890000.mp4`;
      const result = parseVideoFilename(filename);
      expect(result).toEqual({
        type: 'raw',
        id: validProjectId,
        timestamp: 1234567890000,
      });
    });

    it('parses processed video filenames', () => {
      const filename = `processed_${validVideoId}_9876543210000.mp4`;
      const result = parseVideoFilename(filename);
      expect(result).toEqual({
        type: 'processed',
        id: validVideoId,
        timestamp: 9876543210000,
      });
    });

    it('returns null for invalid filenames', () => {
      expect(parseVideoFilename('invalid.mp4')).toBeNull();
      expect(parseVideoFilename('raw_not-uuid_1234567890000.mp4')).toBeNull();
      expect(parseVideoFilename('processed_not-uuid_1234567890000.mp4')).toBeNull();
      expect(parseVideoFilename('')).toBeNull();
    });

    it('is case insensitive for UUIDs', () => {
      const filenameUpper = `raw_${validProjectId.toUpperCase()}_1234567890000.mp4`;
      const result = parseVideoFilename(filenameUpper);
      expect(result).toEqual({
        type: 'raw',
        id: validProjectId.toUpperCase(),
        timestamp: 1234567890000,
      });
    });

    it('handles edge case timestamps', () => {
      const filenameZero = `raw_${validProjectId}_0.mp4`;
      expect(parseVideoFilename(filenameZero)).toEqual({
        type: 'raw',
        id: validProjectId,
        timestamp: 0,
      });

      const filenameLarge = `processed_${validVideoId}_9999999999999.mp4`;
      expect(parseVideoFilename(filenameLarge)).toEqual({
        type: 'processed',
        id: validVideoId,
        timestamp: 9999999999999,
      });
    });
  });
});
