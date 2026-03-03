import { useCallback } from 'react';
import { omit } from 'lodash';
import type { ActionRecord } from '@representations/user.representation';
import { useFirebaseCrud } from './useFirebaseCrud';

/**
 * Provides a `logAction` helper that appends an ActionRecord to the
 * character's `actionRecords` sub-collection and invalidates the query.
 */
export const useActionRecord = (characterId: string) => {
  const firebaseCrud = useFirebaseCrud<ActionRecord>({
    collectionPath: `users/{userId}/characters/${characterId}/actionRecords`,
    invalidateQueryKey: ['fetchActionRecords', '{userId}', characterId]
  });

  const formatActionRecord = (
    record: Omit<ActionRecord, 'id' | 'createdAt'> & { createdAt?: Date }
  ): Omit<ActionRecord, 'id'> => {
    const setDate: Date | string = record.createdAt ? record.createdAt : new Date();

    return {
      ...record,
      createdAt: setDate instanceof Date ? setDate : new Date(setDate)
    };
  };

  const logAction = useCallback(
    (record: Omit<ActionRecord, 'id' | 'createdAt'>) =>
      firebaseCrud.create(formatActionRecord(record), false),
    [firebaseCrud]
  );

  const updateAction = useCallback(
    (id: string, data: Partial<ActionRecord>) => firebaseCrud.update(id, omit(data, 'id'), false),
    [firebaseCrud]
  );

  const removeAction = useCallback((id: string) => firebaseCrud.remove(id, false), [firebaseCrud]);

  return { logAction, removeAction, updateAction, isLoading: firebaseCrud.isLoading };
};
