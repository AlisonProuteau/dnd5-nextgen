import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { omit } from 'lodash';
import { formatDateType } from '@utils/date.utils';
import type { ActionRecord } from '@representations/user.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { useFirebaseCrud } from './useFirebaseCrud';

/**
 * Provides a `logAction` helper that appends an ActionRecord to the
 * character's `actionRecords` sub-collection and invalidates the query.
 */
export const useActionRecord = (characterId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const firebaseCrud = useFirebaseCrud<ActionRecord>({
    collectionPath: `users/{userId}/characters/${characterId}/actionRecords`
  });

  const queryKey = useMemo(
    () => ['fetchActionRecords', user?.uid, characterId],
    [user?.uid, characterId]
  );

  const optimiticUpdateRecord = useCallback(
    (updater: (old: ActionRecord[]) => ActionRecord[]) => {
      if (user?.uid && characterId)
        queryClient.setQueryData(queryKey, (old: ActionRecord[] | null | undefined) =>
          updater(old ?? [])
        );
    },
    [user?.uid, characterId, queryClient, queryKey]
  );
  const invalidateRecords = () => queryClient.invalidateQueries({ queryKey: queryKey });
  const refetchRecords = () => queryClient.refetchQueries({ queryKey: queryKey });

  const formatActionRecord = (
    record: Omit<ActionRecord, 'id' | 'createdAt'> & { createdAt?: Date }
  ): Omit<ActionRecord, 'id'> => {
    const createdAt: Date = formatDateType(record.createdAt ?? new Date()) ?? new Date();

    return { ...record, createdAt };
  };

  const logAction = useCallback(
    async (record: Omit<ActionRecord, 'id' | 'createdAt'>) => {
      const formatted = formatActionRecord(record);
      const id = await firebaseCrud.create(formatted, false);
      if (id) optimiticUpdateRecord((old) => [{ ...formatted, id } as ActionRecord, ...old]);

      return id;
    },
    [firebaseCrud, optimiticUpdateRecord]
  );

  const updateAction = useCallback(
    async (id: string, data: Partial<ActionRecord>) => {
      const success = await firebaseCrud.update(id, omit(data, 'id'), false);
      if (success)
        optimiticUpdateRecord((old) => old.map((r) => (r.id === id ? { ...r, ...data } : r)));
      return success;
    },
    [firebaseCrud, optimiticUpdateRecord]
  );

  const removeAction = useCallback(
    async (id: string) => {
      const success = await firebaseCrud.remove(id, false);
      if (success) optimiticUpdateRecord((old) => old.filter((r) => r.id !== id));
      return success;
    },
    [firebaseCrud, optimiticUpdateRecord]
  );

  return {
    logAction,
    removeAction,
    updateAction,
    isLoading: firebaseCrud.isLoading,
    invalidateRecords,
    refetchRecords
  };
};
