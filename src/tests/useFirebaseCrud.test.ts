import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDoc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useAuth } from '../providers/AuthProvider';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('firebase/firestore', () => ({
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn((...args: any[]) => {
    // Handle doc(collection(...)) case
    const lastArg = args[args.length - 1];
    if (lastArg && typeof lastArg === 'object' && 'path' in lastArg && 'id' in lastArg) {
      return { path: `${lastArg.path}/generated-id`, id: 'generated-id' };
    }
    // Handle doc(db, path, id) case
    return { path: args.join('/'), id: args[args.length - 1] };
  }),
  collection: vi.fn((db: any, path: string) => ({ path, id: 'generated-id' }))
}));

vi.mock('../firebase', () => ({
  database: { type: 'firestore' }
}));

vi.mock('../providers/AuthProvider', () => ({
  useAuth: vi.fn()
}));

/**
 * Unit tests for useFirebaseCrud hook
 *
 * These tests verify error handling logic that cannot be reliably tested in E2E
 * due to Firebase SDK's built-in retry mechanism.
 */
describe('useFirebaseCrud', () => {
  const mockNavigate = vi.fn();
  const mockUser = { uid: 'test-user-123', email: 'test@example.com' };

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    return ({ children }: { children: ReactNode }) => {
      return QueryClientProvider({ client: queryClient, children });
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as Mock).mockReturnValue(mockNavigate);
    (useAuth as Mock).mockReturnValue({ user: mockUser });
  });

  describe('update', () => {
    it('should handle update errors and show error toast', async () => {
      const error = new Error('Permission denied: insufficient permissions');
      (updateDoc as Mock).mockRejectedValue(error);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'users',
            successMessages: { update: 'Settings updated' }
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.update('user-123', { name: 'New Name' });
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Error updating: Permission denied: insufficient permissions'
        );
        expect(toast.success).not.toHaveBeenCalled();
      });
    });

    it('should successfully update a document and show success toast', async () => {
      (updateDoc as Mock).mockResolvedValue(undefined);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'users',
            successMessages: { update: 'Settings updated' }
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.update('user-123', { name: 'New Name' });
      });

      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Settings updated');
        expect(toast.error).not.toHaveBeenCalled();
      });
    });

    it('should navigate after successful update when redirect is configured', async () => {
      (updateDoc as Mock).mockResolvedValue(undefined);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'users',
            redirect: { update: { path: '/' } }
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.update('user-123', { name: 'New Name' });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', undefined);
      });
    });

    it('should show error when user is not authenticated', async () => {
      (useAuth as Mock).mockReturnValue({ user: null });

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'users'
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.update('user-123', { name: 'New Name' });
      });

      expect(toast.error).toHaveBeenCalledWith('User not authenticated');
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should handle create errors and show error toast', async () => {
      const error = new Error('Network error');
      (setDoc as Mock).mockRejectedValue(error);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'tickets',
            successMessages: { create: 'Ticket created' }
          }),
        { wrapper: createWrapper() }
      );

      let newId: string | null = null;
      await act(async () => {
        newId = await result.current.create({ message: 'Test ticket' });
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error creating: Network error');
        expect(newId).toBeNull();
      });
    });

    it('should successfully create a document', async () => {
      (setDoc as Mock).mockResolvedValue(undefined);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'tickets',
            successMessages: { create: 'Ticket created' }
          }),
        { wrapper: createWrapper() }
      );

      let newId: string | null = null;
      await act(async () => {
        newId = await result.current.create({ message: 'Test ticket' });
      });

      await waitFor(() => {
        expect(setDoc).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Ticket created');
        expect(newId).toBeTruthy();
      });
    });

    it('should navigate with state replacement after create', async () => {
      (setDoc as Mock).mockResolvedValue(undefined);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters',
            redirect: {
              create: { path: '/character', state: { characterId: '{id}' } }
            }
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.create({ name: 'New Character' });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/character', {
          state: { characterId: 'generated-id' }
        });
      });
    });
  });

  describe('remove', () => {
    it('should handle delete errors and show error toast', async () => {
      const error = new Error('Document not found');
      (deleteDoc as Mock).mockRejectedValue(error);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters',
            successMessages: { delete: 'Character deleted' }
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.remove('char-123');
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error deleting: Document not found');
      });
    });

    it('should successfully delete a document', async () => {
      (deleteDoc as Mock).mockResolvedValue(undefined);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters',
            successMessages: { delete: 'Character deleted' }
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.remove('char-123');
      });

      await waitFor(() => {
        expect(deleteDoc).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Character deleted');
      });
    });

    it('should delete with query invalidation and redirect', async () => {
      (deleteDoc as Mock).mockResolvedValue(undefined);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters',
            invalidateQueryKey: ['fetchCharacters'],
            successMessages: { delete: 'Character deleted' },
            redirect: { delete: { path: '/' } }
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.remove('char-123');
      });

      await waitFor(() => {
        expect(deleteDoc).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/', { state: undefined });
        expect(toast.success).toHaveBeenCalledWith('Character deleted');
      });
    });
  });

  describe('getById', () => {
    it('should successfully retrieve a document', async () => {
      const mockData = { id: 'char-123', name: 'Test Character' };
      (getDoc as Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockData
      });

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters'
          }),
        { wrapper: createWrapper() }
      );

      let data: any = null;
      await act(async () => {
        data = await result.current.getById('char-123');
      });

      expect(data).toEqual(mockData);
    });

    it('should return null for non-existent document', async () => {
      (getDoc as Mock).mockResolvedValue({
        exists: () => false
      });

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters'
          }),
        { wrapper: createWrapper() }
      );

      let data: any = null;
      await act(async () => {
        data = await result.current.getById('char-123');
      });

      expect(data).toBeNull();
    });

    it('should return null when user is not authenticated', async () => {
      (useAuth as Mock).mockReturnValue({ user: null });

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters'
          }),
        { wrapper: createWrapper() }
      );

      let data: any = null;
      await act(async () => {
        data = await result.current.getById('char-123');
      });

      expect(data).toBeNull();
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should handle getById errors and show error toast', async () => {
      const error = new Error('Permission denied');
      (getDoc as Mock).mockRejectedValue(error);

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters'
          }),
        { wrapper: createWrapper() }
      );

      let data: any = null;
      await act(async () => {
        data = await result.current.getById('char-123');
      });

      expect(data).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Error fetching document: Permission denied');
    });
  });
});
