import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from './StorageService';
import { getData, saveItems, deleteData, MENTOR_STORE } from '@/shared/utils/indexedDb';

// Mock indexedDb utility
vi.mock('@/shared/utils/indexedDb', () => ({
  getData: vi.fn(),
  saveData: vi.fn(),
  saveItems: vi.fn(),
  deleteData: vi.fn(),
  MENTOR_STORE: {
    USER_CACHE: 'user_cache',
  },
}));

describe('StorageService Caching', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    vi.clearAllMocks();
  });

  describe('getCached', () => {
    it('should return data if exists', async () => {
      const mockData = { foo: 'bar' };
      vi.mocked(getData).mockResolvedValue([{ key: 'testKey', data: mockData, timestamp: Date.now() }]);

      const result = await storageService.getCached('testKey');
      expect(result).toEqual(mockData);
      expect(getData).toHaveBeenCalledWith(MENTOR_STORE.USER_CACHE, ['testKey']);
    });

    it('should return null if not found', async () => {
      vi.mocked(getData).mockResolvedValue([]);

      const result = await storageService.getCached('missingKey');
      expect(result).toBeNull();
    });
  });

  describe('setCached', () => {
    it('should save data with timestamp', async () => {
      const mockData = { foo: 'bar' };
      await storageService.setCached('testKey', mockData);

      expect(saveItems).toHaveBeenCalledWith(
        MENTOR_STORE.USER_CACHE,
        [expect.objectContaining({
          key: 'testKey',
          data: mockData,
          timestamp: expect.any(Number),
        })]
      );
    });
  });

  describe('clearExpiredCache', () => {
    it('should delete expired entries', async () => {
      const now = Date.now();
      const ttl = 1000;
      const expiredEntry = { key: 'expired', timestamp: now - 2000 };
      const validEntry = { key: 'valid', timestamp: now };

      vi.mocked(getData).mockResolvedValue([expiredEntry, validEntry]);

      await storageService.clearExpiredCache(ttl);

      expect(deleteData).toHaveBeenCalledWith(MENTOR_STORE.USER_CACHE, ['expired']);
    });

    it('should do nothing if no expired entries', async () => {
      const now = Date.now();
      const ttl = 1000;
      const validEntry = { key: 'valid', timestamp: now };

      vi.mocked(getData).mockResolvedValue([validEntry]);

      await storageService.clearExpiredCache(ttl);

      expect(deleteData).not.toHaveBeenCalled();
    });
  });
});
