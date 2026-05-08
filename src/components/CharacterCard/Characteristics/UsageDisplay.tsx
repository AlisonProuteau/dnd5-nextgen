import { useCallback, useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { BoxProps } from '@mui/system';
import { deleteField } from 'firebase/firestore';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { formatActionRecord, formatCustomRecord } from '@utils/actions.utils';
import {
  formatResourceUsageIncrement,
  formatUsageLabel,
  getUsageTimes,
  getUsageType
} from '@utils/character/resourceUsage.utils';
import type { Feature } from '@representations/abilities/feature.representation';
import { MagicItem } from '@representations/abilities/magic.representation';
import { Trait } from '@representations/abilities/trait.representation';
import { Equipment } from '@representations/campaign/equipment.representation';
import type { Character } from '@representations/user.representation';

// TODO: 'rod-of-absorption'?
export const USAGE_EXCLUSION = ['pearl-of-power', 'arcane-recovery', 'natural-recovery'];

interface UsageDisplayProps {
  type: 'feature' | 'trait' | 'equipment';
  character: Partial<Character>;
  resource: Feature | Trait | Equipment | MagicItem;
  fullFeatureList?: Feature[];
  count?: number;
}

export function UsageDisplay({
  type,
  character,
  resource,
  fullFeatureList = [],
  count,
  ...props
}: UsageDisplayProps & Omit<BoxProps, 'resource' | 'children'>) {
  const { logAction } = useActionRecord(character?.id || '');
  const firebaseCrud = useFirebaseCrud<Character>({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', character?.id || '']
  });

  const mappedUsage = useMemo(() => {
    const usageType = resource.usage ? getUsageType(resource.usage, fullFeatureList) : undefined;
    const itemMaxUsage = resource.usage ? getUsageTimes(resource.usage, character) : 0;
    const reusable = resource.usage
      ? usageType !== 'once' && !(Array.isArray(usageType) && usageType.includes('once'))
      : true;

    return {
      itemMaxUsage,
      currentUsageAmount: character.resourceUsages?.[resource.index]?.current ?? 0,
      usageType,
      reusable,
      singleUse: resource.usage ? !reusable && itemMaxUsage === 1 : false
    };
  }, [resource.usage, fullFeatureList, character]);

  const useResource = async () => {
    if (!character.id || !resource.usage) return;

    const finalUse =
      !mappedUsage.reusable && mappedUsage.currentUsageAmount + 1 === mappedUsage.itemMaxUsage;

    if (mappedUsage.currentUsageAmount < mappedUsage.itemMaxUsage) {
      const record = formatActionRecord(
        type === 'equipment' ? 'custom' : type,
        formatCustomRecord(
          resource,
          type,
          character.equipments,
          mappedUsage.itemMaxUsage,
          finalUse
        ),
        false
      );
      await logAction(record);

      if (resource.usage && !finalUse)
        await firebaseCrud.update(
          character.id,
          formatResourceUsageIncrement({
            index: resource.index,
            usage: getUsageType(resource.usage, fullFeatureList),
            type: type === 'equipment' ? 'other' : type
          }),
          false
        );
    }

    if (finalUse) {
      let updatedEquipments = undefined;
      if (type === 'equipment') {
        const currentItem = character.equipments?.find((eq) => eq.index === resource.index);

        if (currentItem)
          updatedEquipments =
            (currentItem?.count ?? 1) === 1
              ? character.equipments?.filter((eq) => eq.index !== resource.index)
              : (character.equipments?.map((eq) =>
                  eq.index === resource.index ? { ...eq, count: (currentItem?.count ?? 1) - 1 } : eq
                ) ?? []);
      }

      const baseUpdate = { [`resourceUsages.${resource.index}`]: deleteField() };
      await firebaseCrud.update(
        character.id,
        updatedEquipments ? { ...baseUpdate, equipments: updatedEquipments } : baseUpdate,
        false
      );
    }
  };

  const UseCountLabel = useCallback(
    () =>
      resource.usage ? (
        <Typography variant="caption" color="text.secondary">
          {formatUsageLabel(
            resource.index,
            resource.usage,
            character,
            fullFeatureList,
            !mappedUsage.reusable && !mappedUsage.singleUse ? 1 : count
          )}
        </Typography>
      ) : null,
    [resource, character, fullFeatureList, mappedUsage, count]
  );

  return (
    resource.usage && (
      <Box {...props}>
        {USAGE_EXCLUSION.includes(resource.index) ? (
          <UseCountLabel />
        ) : (
          <Button
            size="small"
            onClick={useResource}
            disabled={
              firebaseCrud.isLoading ||
              mappedUsage.currentUsageAmount >=
                mappedUsage.itemMaxUsage *
                  (!mappedUsage.reusable && !mappedUsage.singleUse ? 1 : (count ?? 1))
            }
            data-testid="equipment-usage-button"
            sx={{
              padding: 0,
              display: 'flex',
              alignItems: 'baseline',
              gap: 1,
              textTransform: 'none'
            }}
          >
            USE
            <UseCountLabel />
          </Button>
        )}
      </Box>
    )
  );
}
