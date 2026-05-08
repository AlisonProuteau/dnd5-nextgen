import { deleteField, DocumentData, increment } from 'firebase/firestore';
import type { Feature } from '@representations/abilities/feature.representation';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { Equipment } from '@representations/campaign/equipment.representation';
import { ABILITIES, type Usage, UsageTypes } from '@representations/common.representation';
import type { ActionRecord, Character } from '@representations/user.representation';

/**
 * Computes the Firestore update payload to increment resource usage based on the provided metadata.
 */
export const formatResourceUsageIncrement = (resourceUsageMeta: {
  index: string;
  usage: UsageTypes | UsageTypes[];
  type: 'feature' | 'trait' | 'other';
}): Record<string, unknown> => {
  return {
    [`resourceUsages.${resourceUsageMeta.index}.type`]: resourceUsageMeta.type,
    [`resourceUsages.${resourceUsageMeta.index}.usage`]: resourceUsageMeta.usage,
    [`resourceUsages.${resourceUsageMeta.index}.current`]: increment(1)
  };
};

/**
 * Computes the Firestore update payload to revert a logged action.
 * Handles spell slots, feature/trait resource usages, and equipment usages (including consumed items).
 */
export const formatRevertActionRecordUsage = (
  data: DocumentData,
  record: ActionRecord
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {};

  if (record.type === 'spell' && typeof record.value === 'number') {
    const current: number = data?.usedSpellSlots?.[record.value] ?? 0;
    if (current > 0)
      updates[`usedSpellSlots.${record.value}`] = current - 1 === 0 ? deleteField() : current - 1;
  } else if (record.type === 'feature' || record.type === 'trait') {
    const current: number = data?.resourceUsages?.[record.sourceIndex!]?.current ?? 0;
    if (current > 0)
      updates[`resourceUsages.${record.sourceIndex!}`] =
        current - 1 === 0
          ? deleteField()
          : { ...data?.resourceUsages?.[record.sourceIndex!], current: current - 1 };
  } else if (record.equipment?.index) {
    if (record.consumed && typeof record.value === 'number') {
      const timesPerItem = record.value;
      updates[`resourceUsages.${record.equipment.index}`] =
        timesPerItem - 1 === 0
          ? deleteField()
          : { ...data?.resourceUsages?.[record.equipment.index], current: timesPerItem - 1 };

      const existingItem = data?.equipments?.find(
        (eq: any) => eq.index === record.equipment!.index
      );
      if (existingItem) {
        updates['equipments'] = data?.equipments?.map((eq: any) =>
          eq.index === record.equipment!.index ? { ...eq, count: (eq.count ?? 1) + 1 } : eq
        );
      } else if (record.equipment.type) {
        updates['equipments'] = [
          ...(data?.equipments ?? []),
          {
            index: record.equipment.index,
            name: record.equipment.name,
            type: record.equipment.type,
            count: 1
          }
        ];
      }
    } else {
      const current: number = data?.resourceUsages?.[record.equipment.index]?.current ?? 0;
      if (current > 0)
        updates[`resourceUsages.${record.equipment.index}`] =
          current - 1 === 0
            ? deleteField()
            : { ...data?.resourceUsages?.[record.equipment.index], current: current - 1 };
    }
  }

  return updates;
};

/**
 * Calculate the number of times a resource can be used based on its usage definition and character stats.
 * Handles various usage types including fixed numbers, level dependant, level-based scaling, and ability score-based scaling.
 */
export const getUsageTimes = (
  usage: Usage,
  character: { abilityScores?: Character['abilityScores']; level?: number }
): number => {
  if (usage.times === 'unlimited') return Infinity;
  if (typeof usage.times === 'number') return usage.times;
  if (typeof usage.times === 'string') {
    const op = new RegExp(`^(${ABILITIES.join('|')}|level)([+\\-\\*/])(\\d+)$`).exec(usage.times);
    if (op) {
      const [, resource, operator, value] = op;
      const abilityValue =
        resource === 'level'
          ? (character.level ?? 1)
          : (character.abilityScores?.[resource].modifier ?? 1);
      let result = 0;
      switch (operator) {
        case '+':
          result = abilityValue + parseInt(value);
          break;
        case '-':
          result = abilityValue - parseInt(value);
          break;
        case '*':
          result = abilityValue * parseInt(value);
          break;
        case '/':
          result = Math.floor(abilityValue / (parseInt(value) || 1));
          break;
      }
      return result > 0 ? result : 1;
    }
    if ((ABILITIES as readonly string[]).includes(usage.times))
      return (character.abilityScores?.[usage.times].modifier ?? 0) > 0
        ? (character.abilityScores?.[usage.times].modifier ?? 1)
        : 1;
    if (usage.times.includes('level')) return character.level || 1;

    return 1;
  }

  if (typeof usage.times === 'object')
    return Object.entries(usage.times).reduce(
      (acc, [level, times]) => {
        if ((character.level ?? 1) >= parseInt(level) && parseInt(level) > acc.level)
          return { level: parseInt(level), times };
        else return acc;
      },
      { level: -Infinity, times: 0 } as unknown as { level: number; times: number }
    ).times;

  return 1;
};

export const canUseResource = (
  resource: Pick<Feature | Trait | Equipment | MagicItem, 'index' | 'usage'> | null | undefined,
  character: Character
): boolean => {
  if (!resource?.usage) return false;
  const max = resource.usage ? getUsageTimes(resource.usage, character) : 0;

  return (character.resourceUsages?.[resource.index]?.current ?? 0) < max;
};

export const getUsageType = (
  usage: Usage,
  features: Feature[],
  allRelatedFeatures: string[] = []
): UsageTypes | UsageTypes[] => {
  if (!usage.type || typeof usage.type !== 'object' || !('feature' in usage.type))
    return usage.type ?? 'long_rest';

  const relatedFeatureID = usage.type.feature;
  const relatedFeatureUsage = features.find(({ index }) => index === relatedFeatureID)?.usage;
  if (allRelatedFeatures.includes(relatedFeatureID) || !relatedFeatureUsage)
    return usage.type.default ?? 'long_rest';

  allRelatedFeatures.push(relatedFeatureID);
  return getUsageType(relatedFeatureUsage, features, allRelatedFeatures);
};

export const getRelatedFeatures = (
  resources: (Pick<Feature | Trait | Equipment | MagicItem, 'usage'> | undefined | null)[]
) => {
  const usages =
    resources
      ?.filter((resource): resource is Pick<Feature | Trait | Equipment | MagicItem, 'usage'> =>
        Boolean(resource?.usage)
      )
      .flatMap(({ usage }) => usage)
      .filter((usage): usage is Usage => !!usage) || [];
  const relatedFeatures = usages
    .map(({ type }) => (typeof type === 'object' && 'feature' in type ? type.feature : null))
    .filter((index): index is string => !!index);

  return relatedFeatures;
};

export const getUsageTypeLabel = (usageType: UsageTypes | UsageTypes[]): string | undefined => {
  switch (usageType) {
    case 'long_rest':
      return 'Long Rest';
    case 'short_rest':
      return 'Short Rest';
    case 'per_rest':
      return 'Short or Long Rest';
    case 'per_day':
      return 'Day';
    case 'per_month':
      return 'Month';
    case 'per_week':
      return 'Week';
    default:
      if (Array.isArray(usageType)) {
        const filteredLabels = usageType
          .map((type) => getUsageTypeLabel(type))
          .filter((label): label is string => !!label);
        return filteredLabels.length > 0 ? filteredLabels.join(' / ') : undefined;
      }
  }
};

export const formatUsageLabel = (
  index: string,
  active: Usage,
  character: {
    abilityScores?: Character['abilityScores'];
    level?: number;
    resourceUsages?: Character['resourceUsages'];
  },
  features: Feature[],
  count?: number
) => {
  const usageType = getUsageType(active, features);
  const used = character.resourceUsages?.[index]?.current ?? 0;
  const max = getUsageTimes(active, character) * (count ?? 1);

  return formatUsageLabelText(used, max, getUsageTypeLabel(usageType));
};

export const formatUsageLabelText = (used: number, max?: number, resetLabel?: string) =>
  max
    ? `${used}/${max}${resetLabel ? ` (${resetLabel})` : ''}`
    : `${used}${resetLabel ? ` (${resetLabel})` : ''}`;
