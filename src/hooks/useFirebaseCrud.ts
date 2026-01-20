import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { database } from 'src/firebase';
import { useAuth } from 'src/providers/AuthProvider';

const { FIRESTORE_EMULATOR_HOST, MODE } = import.meta.env;
const DEV_MODE = MODE !== 'production' || FIRESTORE_EMULATOR_HOST;

const TIMEOUT = 2000;

export interface UseFirebaseCrudOptions {
  collectionPath: string;
  invalidateQueryKey?: string[];
  successMessages?: {
    create?: string;
    update?: string;
    delete?: string;
  };
  redirect?: Partial<
    Record<'create' | 'update' | 'delete', { path: string; state?: Record<string, any> }>
  >;
}

export interface UseFirebaseCrudReturn<T> {
  isLoading: boolean;
  create: (data: Partial<T> & any, customPath?: string) => Promise<string | null>;
  update: (id: string, data: Partial<T>, customPath?: string) => Promise<void>;
  remove: (id: string, customPath?: string) => Promise<void>;
}

export const useFirebaseCrud = <T extends Record<string, any>>(
  options: UseFirebaseCrudOptions
): UseFirebaseCrudReturn<T> => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { collectionPath, invalidateQueryKey, successMessages = {}, redirect = {} } = options;

  const buildPath = (customPath?: string): string => {
    const path = customPath || collectionPath;
    return path.replace('{userId}', user?.uid || '');
  };

  const stateWithId = (
    id: string,
    state?: Record<string, any>
  ): Record<string, any> | undefined => {
    if (!state) return;

    const newState = { ...state };
    Object.entries(state).forEach(([keyBy, value]) => {
      if (value === '{id}') newState[keyBy] = id;
    });
    return { state: newState };
  };

  const asyncCallWithTimeout = (asyncPromise: Promise<any>, timeLimit: number) => {
    // Create a promise that rejects if the time limit is reached
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutHandle = setTimeout(
        () => reject(new Error('Async call timeout limit reached')),
        timeLimit
      );
      asyncPromise.finally(() => clearTimeout(timeoutHandle));
    });

    return DEV_MODE ? Promise.race([asyncPromise, timeoutPromise]) : asyncPromise;
  };

  const create = async (data: Partial<T>, customPath?: string): Promise<string | null> => {
    if (!user?.uid) {
      toast.error('User not authenticated');
      return null;
    }

    setIsLoading(true);
    try {
      const path = buildPath(customPath);
      const newDocRef = doc(collection(database, path));

      const documentData = {
        ...data,
        id: newDocRef.id
      } as unknown as T;
      await asyncCallWithTimeout(setDoc(newDocRef, documentData), TIMEOUT);

      if (invalidateQueryKey)
        await queryClient.invalidateQueries({ queryKey: [...invalidateQueryKey, user.uid] });
      if (redirect.create)
        navigate(
          redirect.create.path.replace('{id}', newDocRef.id),
          stateWithId(newDocRef.id, redirect.create.state)
        );

      toast.success(successMessages.create || 'Created successfully');
      return newDocRef.id;
    } catch (error) {
      toast.error(`Create failed:
        ${(error as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (id: string, data: Partial<T>, customPath?: string): Promise<void> => {
    if (!user?.uid) {
      toast.error('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const path = buildPath(customPath);
      const docRef = doc(database, path, id);

      await asyncCallWithTimeout(updateDoc(docRef, data as unknown as T), TIMEOUT);

      if (invalidateQueryKey)
        await queryClient.invalidateQueries({ queryKey: [...invalidateQueryKey, user.uid] });
      if (redirect.update)
        navigate(redirect.update.path.replace('{id}', id), stateWithId(id, redirect.update.state));

      toast.success(successMessages.update || 'Updated successfully');
    } catch (error) {
      toast.error(`Update failed: 
        ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id: string, customPath?: string): Promise<void> => {
    if (!user?.uid) {
      toast.error('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const path = buildPath(customPath);
      const docRef = doc(database, path, id);

      await asyncCallWithTimeout(deleteDoc(docRef), TIMEOUT);

      if (invalidateQueryKey)
        await queryClient.invalidateQueries({ queryKey: [...invalidateQueryKey, user.uid] });
      if (redirect.delete) navigate(redirect.delete.path, { state: redirect.delete.state });

      toast.success(successMessages.delete || 'Deleted successfully');
    } catch (error) {
      toast.error(`Delete failed:
        ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    create,
    update,
    remove
  };
};
