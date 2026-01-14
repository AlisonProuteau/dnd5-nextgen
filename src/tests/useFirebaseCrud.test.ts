import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  doc: vi.fn(() => ({ id: 'generated-id' })),
  collection: vi.fn((_: any, path: string) => ({ path, id: 'generated-id' }))
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

    vi.mocked(useNavigate).mockReturnValue(mockNavigate as NavigateFunction);
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-user-123', email: 'test@example.com' } as unknown as User,
      isLoading: false
    });
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(deleteDoc).mockResolvedValue(undefined);
  });

  describe('update', () => {
    it('should handle update errors and show error toast', async () => {
      vi.mocked(updateDoc).mockRejectedValue(
        new Error('Permission denied: insufficient permissions')
      );

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'users',
            successMessages: { update: 'Settings updated' }
          }),
        { wrapper: createWrapper() }
      );
      await act(async () => await result.current.update('user-123', { name: 'New Name' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Error updating: Permission denied: insufficient permissions'
        )
      );
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should show success toast after successful update', async () => {
      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'users',
            successMessages: { update: 'Settings updated' }
          }),
        { wrapper: createWrapper() }
      );
      await act(async () => await result.current.update('user-123', { name: 'New Name' }));

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Settings updated'));
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should navigate after successful update when redirect is configured', async () => {
      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'users',
            redirect: { update: { path: '/' } }
          }),
        { wrapper: createWrapper() }
      );
      await act(async () => await result.current.update('user-123', { name: 'New Name' }));

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', undefined));
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Updated successfully');
    });
  });

  describe('create', () => {
    it('should handle create errors and show error toast', async () => {
      vi.mocked(setDoc).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'tickets',
            successMessages: { create: 'Ticket created' }
          }),
        { wrapper: createWrapper() }
      );
      await act(async () => await result.current.create({ message: 'Test ticket' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Error creating: Network error')
      );
    });

    it('should show success toast after successful create', async () => {
      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'tickets',
            successMessages: { create: 'Ticket created' }
          }),
        { wrapper: createWrapper() }
      );
      await act(async () => await result.current.create({ message: 'Test ticket' }));

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Ticket created'));
    });

    it('should navigate with state replacement after create', async () => {
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
      await act(async () => await result.current.create({ name: 'New Character' }));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/character', {
          state: { characterId: 'generated-id' }
        })
      );
    });
  });

  describe('remove', () => {
    it('should handle delete errors and show error toast', async () => {
      vi.mocked(deleteDoc).mockRejectedValue(new Error('Document not found'));

      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters',
            successMessages: { delete: 'Character deleted' }
          }),
        { wrapper: createWrapper() }
      );
      await act(async () => await result.current.remove('char-123'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Error deleting: Document not found')
      );
    });

    it('should show success toast after successful delete', async () => {
      const { result } = renderHook(
        () =>
          useFirebaseCrud({
            collectionPath: 'characters',
            successMessages: { delete: 'Character deleted' }
          }),
        { wrapper: createWrapper() }
      );
      await act(async () => await result.current.remove('char-123'));

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Character deleted'));
    });

    it('should delete with query invalidation and redirect', async () => {
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
      await act(async () => await result.current.remove('char-123'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { state: undefined });
        expect(toast.success).toHaveBeenCalledWith('Character deleted');
      });
    });
  });
});
