import { and, getDoc, getDocs, or, orderBy, where } from 'firebase/firestore';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { get, getAll } from '@utils/api.utils';

vi.mock('../firebase', () => ({
  database: { type: 'firestore' }
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((ref) => ref),
  where: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
  or: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({}))
}));

/**
 * Unit tests for API utility functions
 *
 * These tests verify:
 * - Correct parameter passing to Firebase SDK functions
 * - Error handling for Firebase operations
 * - Data structure transformation (docs -> results/count format)
 *
 * Note: Query logic and filtering are handled by Firestore itself and
 * are tested via E2E tests. These unit tests only verify the wrapper logic and error handling.
 */
describe('api.utils', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAll', () => {
    it('should transform documents into results/count format', async () => {
      const mockDocs = [{ data: () => ({ id: '1' }) }, { data: () => ({ id: '2' }) }];
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      const result = await getAll('test items', 'test-collection');

      expect(and).not.toHaveBeenCalled();
      expect(or).not.toHaveBeenCalled();
      expect(orderBy).not.toHaveBeenCalled();

      expect(result.count).toBe(2);
      expect(result.results).toHaveLength(2);
    });

    it('should build query with single where clause', async () => {
      const mockDocs = [{ data: () => ({}) }];
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      await getAll('test items', 'test-collection', [
        { fieldPath: 'status', opStr: '==', value: 'active' }
      ]);

      expect(where).toHaveBeenCalledWith('status', '==', 'active');
      expect(and).not.toHaveBeenCalled();
      expect(orderBy).not.toHaveBeenCalled();
    });

    it('should use AND constraint for multiple query parameters when isOr is falsy', async () => {
      const mockDocs = [{ data: () => ({}) }];
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      await getAll('test items', 'test-collection', [
        { fieldPath: 'status', opStr: '==', value: 'active' },
        { fieldPath: 'type', opStr: '==', value: 'user' }
      ]);

      expect(and).toHaveBeenCalled();
      expect(orderBy).not.toHaveBeenCalled();
    });

    it('should use OR constraint for multiple query parameters when isOr is true', async () => {
      const mockDocs = [{ data: () => ({}) }];
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      await getAll(
        'test items',
        'test-collection',
        [
          { fieldPath: 'status', opStr: '==', value: 'active' },
          { fieldPath: 'status', opStr: '==', value: 'inactive' }
        ],
        true
      );

      expect(or).toHaveBeenCalled();
      expect(orderBy).not.toHaveBeenCalled();
    });

    it('should add orderBy constraint when orderByField is provided', async () => {
      const mockDocs = [{ data: () => ({}) }];
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      await getAll('test items', 'test-collection', undefined, false, 'name', 'asc');

      expect(orderBy).toHaveBeenCalledWith('name', 'asc');
    });

    it('should add orderBy constraint when orderByField is provided with multiple query parameters', async () => {
      const mockDocs = [{ data: () => ({}) }];
      (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

      await getAll(
        'test items',
        'test-collection',
        [
          { fieldPath: 'status', opStr: '==', value: 'active' },
          { fieldPath: 'status', opStr: '==', value: 'inactive' }
        ],
        false,
        'name',
        'asc'
      );

      expect(and).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalled();
    });

    it('should handle getDocs errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (getDocs as Mock).mockResolvedValue({ docs: [] });

      const result = await getAll('test items', 'test-collection');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should return document data when document exists', async () => {
      (getDoc as Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ id: 'test-123' })
      });

      const result = await get('test item', 'test-collection', 'test-123');

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should handle non-existent document', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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
      (getDoc as Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(get('test item', 'test-collection', 'test-123')).rejects.toThrow(
        'Permission denied'
      );
    });
  });
});
