import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { database } from 'src/firebase';
import { useAuth } from 'src/providers/AuthProvider';

export interface UseFirebaseCrudOptions {
  collectionPath: string;
  invalidateQueryKey?: string[];
  successMessages?: {
    create?: string;
    update?: string;
    delete?: string;
  };
  redirectPaths?: {
    create?: string;
    update?: string;
    delete?: string;
  };
}

export interface UseFirebaseCrudReturn<T> {
  isLoading: boolean;
  create: (data: Partial<T>, customPath?: string) => Promise<string | null>;
  update: (id: string, data: Partial<T>, customPath?: string) => Promise<void>;
  remove: (id: string, customPath?: string) => Promise<void>;
  getById: (id: string, customPath?: string) => Promise<T | null>;
}

export const useFirebaseCrud = <T extends Record<string, any>>(
  options: UseFirebaseCrudOptions
): UseFirebaseCrudReturn<T> => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, version } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { collectionPath, invalidateQueryKey, successMessages = {}, redirectPaths = {} } = options;

  const buildPath = (customPath?: string): string => {
    const path = customPath || collectionPath;
    return path.replace('{userId}', user?.uid || '');
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
        id: newDocRef.id,
        version: version,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as T;

      await setDoc(newDocRef, documentData);

      if (invalidateQueryKey)
        queryClient.invalidateQueries({ queryKey: [...invalidateQueryKey, user.uid] });
      if (redirectPaths.create) navigate(redirectPaths.create.replace('{id}', newDocRef.id));

      toast.success(successMessages.create || 'Created successfully');
      return newDocRef.id;
    } catch (error) {
      toast.error(`Error creating: ${(error as Error).message}`);
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

      const updateData = {
        ...data,
        updatedAt: new Date(),
        version: version
      };
      await updateDoc(docRef, updateData);

      if (invalidateQueryKey)
        queryClient.invalidateQueries({ queryKey: [...invalidateQueryKey, user.uid] });
      if (redirectPaths.update) navigate(redirectPaths.update.replace('{id}', id));

      toast.success(successMessages.update || 'Updated successfully');
    } catch (error) {
      toast.error(`Error updating: ${(error as Error).message}`);
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

      await deleteDoc(docRef);

      if (invalidateQueryKey)
        queryClient.invalidateQueries({ queryKey: [...invalidateQueryKey, user.uid] });
      if (redirectPaths.delete) navigate(redirectPaths.delete);

      toast.success(successMessages.delete || 'Deleted successfully');
    } catch (error) {
      toast.error(`Error deleting: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getById = async (id: string, customPath?: string): Promise<T | null> => {
    if (!user?.uid) return null;

    try {
      const path = buildPath(customPath);
      const docRef = doc(database, path, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) return docSnap.data() as T;
    } catch (error) {
      toast.error(`Error fetching document: ${(error as Error).message}`);
    }

    return null;
  };

  return {
    isLoading,
    create,
    update,
    remove,
    getById
  };
};
