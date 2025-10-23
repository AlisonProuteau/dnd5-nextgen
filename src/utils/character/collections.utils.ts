import type { DefaultRepresentation } from '@representations/common.representation';
import { uniqBy } from 'lodash';

/**
 * Filter proficiencies by type (skills, saving throws, etc.)
 */
export const filterProficienciesByType = (
  proficiencies: DefaultRepresentation[] = [],
  type: 'skill' | 'saving-throw' | 'other'
): DefaultRepresentation[] => {
  const startsWith = type === 'other' ? '' : `${type}-`;

  if (type === 'other') {
    return proficiencies.filter(
      (p) => !p.index.startsWith('saving-throw-') && !p.index.startsWith('skill-')
    );
  }

  return proficiencies.filter((p) => p.index.startsWith(startsWith));
};

/**
 * Consolidate equipment by merging duplicates and adding counts
 */
export const consolidateEquipment = <T extends DefaultRepresentation & { count?: number }>(
  equipment: T[] = []
): T[] => {
  return equipment.reduce((acc: T[], curr) => {
    const existingIndex = acc.findIndex(({ index }) => index === curr.index);

    if (existingIndex >= 0) {
      return acc.with(existingIndex, {
        ...curr,
        count: (acc[existingIndex].count || 1) + (curr.count || 1)
      });
    }

    return [...acc, curr];
  }, []);
};

/**
 * Remove duplicates from arrays by index property
 */
export const uniqueByIndex = <T extends DefaultRepresentation>(items: T[] = []): T[] => {
  return uniqBy(items, 'index');
};
