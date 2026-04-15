import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { doc, increment, runTransaction, updateDoc } from 'firebase/firestore';
import { omit } from 'lodash';
import { formatDateType } from '@utils/date.utils';
import type { UsageTypes } from '@representations/common.representation';
import type { ActionRecord } from '@representations/user.representation';
import { database } from 'src/firebase';
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

  const characterQueryKey = useMemo(
    () => ['fetchCharacter', user?.uid, characterId],
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
    async (
      record: Omit<ActionRecord, 'id' | 'createdAt'>,
      resourceUsageMeta?: { usage: UsageTypes | UsageTypes[] }
    ) => {
      const formatted = formatActionRecord(record);
      const id = await firebaseCrud.create(formatted, false);
      if (id) {
        optimiticUpdateRecord((old) => [{ ...formatted, id } as ActionRecord, ...old]);
        if (
          (record.type === 'feature' || record.type === 'trait') &&
          record.sourceIndex &&
          user?.uid &&
          resourceUsageMeta
        ) {
          try {
            await updateDoc(doc(database, `users/${user.uid}/characters`, characterId), {
              [`resourceUsages.${record.sourceIndex}.type`]: record.type,
              [`resourceUsages.${record.sourceIndex}.usage`]: resourceUsageMeta.usage,
              [`resourceUsages.${record.sourceIndex}.current`]: increment(1)
            });
            await queryClient.invalidateQueries({ queryKey: characterQueryKey });
          } catch (error) {
            toast.error(`Update failed: 
              ${(error as Error).message}`);
          }
        }
      }
      return id;
    },
    [firebaseCrud, user?.uid, characterId, queryClient, characterQueryKey, optimiticUpdateRecord]
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
      const record = queryClient.getQueryData<ActionRecord[]>(queryKey)?.find((r) => r.id === id);
      const success = await firebaseCrud.remove(id, false);
      if (success) {
        optimiticUpdateRecord((old) => old.filter((r) => r.id !== id));
        if (record?.sourceIndex && user?.uid) {
          try {
            const charDocRef = doc(database, `users/${user.uid}/characters`, characterId);
            await runTransaction(database, async (transaction) => {
              const snap = await transaction.get(charDocRef);
              if (!snap.exists()) return;

              if (record?.type === 'feature' || record?.type === 'trait') {
                const current: number =
                  snap.data()?.resourceUsages?.[record.sourceIndex!]?.current ?? 0;
                if (current <= 0) return;

                transaction.update(charDocRef, {
                  [`resourceUsages.${record.sourceIndex}.current`]: current - 1
                });
              } else if (record?.type === 'spell' && typeof record.value === 'number') {
                const current: number = snap.data()?.usedSpellSlots?.[record.value] ?? 0;
                if (current <= 0) return;

                transaction.update(charDocRef, {
                  [`usedSpellSlots.${record.value}`]: current - 1
                });
              }
            });

            await queryClient.invalidateQueries({ queryKey: characterQueryKey });
          } catch (error) {
            toast.error(`Update failed: 
            ${(error as Error).message}`);
          }
        }
      }
      return success;
    },
    [
      firebaseCrud,
      user?.uid,
      characterId,
      queryClient,
      queryKey,
      characterQueryKey,
      optimiticUpdateRecord
    ]
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
