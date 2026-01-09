import {
  and,
  collection,
  doc,
  getDoc,
  getDocs,
  or,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { get, getAll } from '@utils/api.utils';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  orderBy: vi.fn()
}));

vi.mock('../firebase', () => ({
  database: { type: 'firestore' }
}));

/**
 * Unit tests for API utility functions
 *
 * These tests verify error handling for Firebase operations that cannot be
 * reliably tested in E2E due to Firebase SDK's built-in retry mechanism.
 */
describe('api.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all documents successfully without query parameters', async () => {
      const mockDocs = [
        { data: () => ({ id: '1', name: 'Item 1' }) },
        { data: () => ({ id: '2', name: 'Item 2' }) }
      ];

      (collection as Mock).mockReturnValue({ path: 'test-collection' });
      (query as Mock).mockReturnValue({ type: 'query' });
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      const result = await getAll('test items', 'test-collection');

      expect(result.count).toBe(2);
      expect(result.results).toEqual([
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ]);
    });

    it('should fetch documents with single query parameter', async () => {
      const mockDocs = [{ data: () => ({ id: '1', status: 'active' }) }];

      (collection as Mock).mockReturnValue({ path: 'test-collection' });
      (where as Mock).mockReturnValue({ type: 'where' });
      (query as Mock).mockReturnValue({ type: 'query' });
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      const result = await getAll('test items', 'test-collection', [
        { fieldPath: 'status', opStr: '==', value: 'active' }
      ]);

      expect(where).toHaveBeenCalledWith('status', '==', 'active');
      expect(result.results).toEqual([{ id: '1', status: 'active' }]);
    });

    it('should fetch documents with multiple query parameters using AND', async () => {
      const mockDocs = [{ data: () => ({ id: '1', status: 'active', type: 'user' }) }];

      (collection as Mock).mockReturnValue({ path: 'test-collection' });
      (where as Mock).mockReturnValue({ type: 'where' });
      (and as Mock).mockReturnValue({ type: 'and' });
      (query as Mock).mockReturnValue({ type: 'query' });
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      const result = await getAll(
        'test items',
        'test-collection',
        [
          { fieldPath: 'status', opStr: '==', value: 'active' },
          { fieldPath: 'type', opStr: '==', value: 'user' }
        ],
        false
      );

      expect(and).toHaveBeenCalled();
      expect(result.results).toHaveLength(1);
    });

    it('should fetch documents with multiple query parameters using OR', async () => {
      const mockDocs = [
        { data: () => ({ id: '1', status: 'active' }) },
        { data: () => ({ id: '2', status: 'inactive' }) }
      ];

      (collection as Mock).mockReturnValue({ path: 'test-collection' });
      (where as Mock).mockReturnValue({ type: 'where' });
      (or as Mock).mockReturnValue({ type: 'or' });
      (query as Mock).mockReturnValue({ type: 'query' });
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      const result = await getAll(
        'test items',
        'test-collection',
        [
          { fieldPath: 'status', opStr: '==', value: 'active' },
          { fieldPath: 'status', opStr: '==', value: 'inactive' }
        ],
        true
      );

      expect(or).toHaveBeenCalled();
      expect(result.results).toHaveLength(2);
    });

    it('should fetch documents with orderBy', async () => {
      const mockDocs = [
        { data: () => ({ id: '1', name: 'A' }) },
        { data: () => ({ id: '2', name: 'B' }) }
      ];

      (collection as Mock).mockReturnValue({ path: 'test-collection' });
      (orderBy as Mock).mockReturnValue({ type: 'orderBy' });
      (query as Mock).mockReturnValue({ type: 'query' });
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      const result = await getAll('test items', 'test-collection', undefined, false, 'name', 'asc');

      expect(orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(result.results).toHaveLength(2);
    });

    it('should fetch documents with orderBy descending', async () => {
      const mockDocs = [
        { data: () => ({ id: '2', name: 'B' }) },
        { data: () => ({ id: '1', name: 'A' }) }
      ];

      (collection as Mock).mockReturnValue({ path: 'test-collection' });
      (orderBy as Mock).mockReturnValue({ type: 'orderBy' });
      (query as Mock).mockReturnValue({ type: 'query' });
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      const result = await getAll(
        'test items',
        'test-collection',
        undefined,
        false,
        'name',
        'desc'
      );

      expect(orderBy).toHaveBeenCalledWith('name', 'desc');
      expect(result.results).toHaveLength(2);
    });

    it('should fetch documents with query conditions and orderBy', async () => {
      const mockDocs = [{ data: () => ({ id: '1', status: 'active', name: 'Test' }) }];

      (collection as Mock).mockReturnValue({ path: 'test-collection' });
      (where as Mock).mockReturnValue({ type: 'where' });
      (orderBy as Mock).mockReturnValue({ type: 'orderBy' });
      (query as Mock).mockReturnValue({ type: 'query' });
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      const result = await getAll(
        'test items',
        'test-collection',
        [{ fieldPath: 'status', opStr: '==', value: 'active' }],
        false,
        'name',
        'asc'
      );

      expect(where).toHaveBeenCalledWith('status', '==', 'active');
      expect(orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(query).toHaveBeenCalled();
      expect(result.results).toHaveLength(1);
    });

    it('should handle getDocs errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (collection as Mock).mockReturnValue({ path: 'test-collection' });
      (query as Mock).mockReturnValue({ type: 'query' });
      (getDocs as Mock).mockRejectedValue(new Error('Network error'));

      const result = await getAll('test items', 'test-collection');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get docs for test items: ',
        expect.any(Error)
      );
      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty result set', async () => {
      (collection as Mock).mockReturnValue({ path: 'test-collection' });
      (query as Mock).mockReturnValue({ type: 'query' });
      (getDocs as Mock).mockResolvedValue({ docs: [] });

      const result = await getAll('test items', 'test-collection');

      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('get', () => {
    it('should fetch a single document successfully', async () => {
      const mockData = { id: 'test-123', name: 'Test Item' };

      (doc as Mock).mockReturnValue({ path: 'test-collection/test-123' });
      (getDoc as Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockData
      });

      const result = await get('test item', 'test-collection', 'test-123');

      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should handle non-existent document', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (doc as Mock).mockReturnValue({ path: 'test-collection/test-123' });
      (getDoc as Mock).mockResolvedValue({
        exists: () => false,
        data: () => undefined
      });

      const result = await get('test item', 'test-collection', 'test-123');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Not found Test item: test-123');
      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should handle getDoc errors', async () => {
      (doc as Mock).mockReturnValue({ path: 'test-collection/test-123' });
      (getDoc as Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(get('test item', 'test-collection', 'test-123')).rejects.toThrow(
        'Permission denied'
      );
    });

    it('should return null when document data is undefined', async () => {
      (doc as Mock).mockReturnValue({ path: 'test-collection/test-123' });
      (getDoc as Mock).mockResolvedValue({
        exists: () => true,
        data: () => undefined
      });

      const result = await get('test item', 'test-collection', 'test-123');

      expect(result).toBeNull();
    });
  });
});
