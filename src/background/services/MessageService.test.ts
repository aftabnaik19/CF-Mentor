import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageService } from './MessageService';
import { bookmarkService } from './BookmarkService';
import { schedulerService } from './SchedulerService';
import { MESSAGE_TYPES } from '@/shared/constants/messages';

// Mock dependencies
vi.mock('./BookmarkService', () => ({
  bookmarkService: {
    isBookmarked: vi.fn(),
    getBookmark: vi.fn(),
    getAllBookmarks: vi.fn(),
    addOrUpdateBookmark: vi.fn(),
    removeBookmark: vi.fn(),
  },
}));

vi.mock('./SchedulerService', () => ({
  schedulerService: {
    fetchData: vi.fn(),
  },
}));

vi.mock('./StorageService', () => ({
  storageService: {
    getLocal: vi.fn(),
    setLocal: vi.fn(),
  },
}));

// Mock chrome runtime via setup file
// We can access mocks via global.chrome or just assume it works
// But we might want to spy on it.
const mockAddListener = global.chrome.runtime.onMessage.addListener;

describe('MessageService', () => {
  let messageHandler: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // We need to capture the listener callback
    new MessageService();
    const mock = mockAddListener as unknown as { mock: { calls: any[][] } };
    messageHandler = mock.mock.calls[0][0];
  });

  it('should register a message listener on instantiation', () => {
    expect(mockAddListener).toHaveBeenCalled();
  });

  it('should handle fetchData action', async () => {
    const sendResponse = vi.fn();
    await messageHandler({ action: 'fetchData' }, {}, sendResponse);
    expect(schedulerService.fetchData).toHaveBeenCalled();
  });

  it('should handle IS_PROBLEM_BOOKMARKED message', async () => {
    const sendResponse = vi.fn();
    const payload = {
      handle: 'testUser',
      problemInfo: { contestId: '123', problemIdx: 'A' },
    };
    
    vi.mocked(bookmarkService.isBookmarked).mockResolvedValue(true);

    await messageHandler(
      { type: MESSAGE_TYPES.IS_PROBLEM_BOOKMARKED, payload },
      {},
      sendResponse
    );

    expect(bookmarkService.isBookmarked).toHaveBeenCalledWith('testUser', '123', 'A');
    expect(sendResponse).toHaveBeenCalledWith(true);
  });

  it('should handle ADD_OR_UPDATE_BOOKMARK message', async () => {
    const sendResponse = vi.fn();
    const payload = {
      handle: 'testUser',
      problemInfo: { contestId: '123', problemIdx: 'A' },
      difficultyRating: 1000,
    };

    await messageHandler(
      { type: MESSAGE_TYPES.ADD_OR_UPDATE_BOOKMARK, payload },
      {},
      sendResponse
    );

    expect(bookmarkService.addOrUpdateBookmark).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('should return error if handle is missing for bookmark operations', async () => {
    const sendResponse = vi.fn();
    const payload = {
      problemInfo: { contestId: '123', problemIdx: 'A' },
    };

    await messageHandler(
      { type: MESSAGE_TYPES.IS_PROBLEM_BOOKMARKED, payload },
      {},
      sendResponse
    );

    expect(sendResponse).toHaveBeenCalledWith({ error: 'User handle is required.' });
  });
});
