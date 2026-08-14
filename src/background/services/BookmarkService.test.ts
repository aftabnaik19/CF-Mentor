import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookmarkService } from './BookmarkService';
import { storageService } from './StorageService';
import { BookmarkedProblem } from '@/shared/types/bookmark';

// Mock StorageService
vi.mock('./StorageService', () => ({
  storageService: {
    getUserBookmarks: vi.fn(),
    saveUserBookmarks: vi.fn(),
  },
}));

describe('BookmarkService', () => {
  let bookmarkService: BookmarkService;
  const mockHandle = 'testUser';
  const mockContestId = '1234';
  const mockProblemIdx = 'A';
  const mockProblemKey = '1234A';

  beforeEach(() => {
    bookmarkService = new BookmarkService();
    vi.clearAllMocks();
  });

  describe('isBookmarked', () => {
    it('should return true if problem is bookmarked', async () => {
      vi.mocked(storageService.getUserBookmarks).mockResolvedValue({
        bookmarkedProblems: {
          [mockProblemKey]: { bookmarkedAt: 100 } as BookmarkedProblem,
        },
      });

      const result = await bookmarkService.isBookmarked(mockHandle, mockContestId, mockProblemIdx);
      expect(result).toBe(true);
    });

    it('should return false if problem is not bookmarked', async () => {
      vi.mocked(storageService.getUserBookmarks).mockResolvedValue({
        bookmarkedProblems: {},
      });

      const result = await bookmarkService.isBookmarked(mockHandle, mockContestId, mockProblemIdx);
      expect(result).toBe(false);
    });
  });

  describe('addOrUpdateBookmark', () => {
    it('should add a new bookmark', async () => {
      vi.mocked(storageService.getUserBookmarks).mockResolvedValue({
        bookmarkedProblems: {},
      });

      const newBookmark: BookmarkedProblem = {
        contestId: mockContestId,
        problemIdx: mockProblemIdx,
        bookmarkedAt: 0, // Should be overwritten
        lastUpdated: 0, // Should be overwritten
        difficultyRating: 800,
        notes: '',
        timeRequiredSeconds: 0,
        problemRating: null,
        problemTags: [],
      };

      await bookmarkService.addOrUpdateBookmark(mockHandle, newBookmark);

      expect(storageService.saveUserBookmarks).toHaveBeenCalledWith(
        mockHandle,
        expect.objectContaining({
          bookmarkedProblems: expect.objectContaining({
            [mockProblemKey]: expect.objectContaining({
              contestId: mockContestId,
              problemIdx: mockProblemIdx,
            }),
          }),
        })
      );
    });
  });

  describe('removeBookmark', () => {
    it('should remove an existing bookmark', async () => {
      vi.mocked(storageService.getUserBookmarks).mockResolvedValue({
        bookmarkedProblems: {
          [mockProblemKey]: { bookmarkedAt: 100 } as BookmarkedProblem,
        },
      });

      await bookmarkService.removeBookmark(mockHandle, mockContestId, mockProblemIdx);

      expect(storageService.saveUserBookmarks).toHaveBeenCalledWith(
        mockHandle,
        expect.objectContaining({
          bookmarkedProblems: {}, // Should be empty now
        })
      );
    });
  });
});
