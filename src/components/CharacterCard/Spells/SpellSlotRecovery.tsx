import { Fragment, useCallback, useMemo, useState } from 'react';
import { AutorenewOutlined } from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { getFeature, getMagicItem } from '@api/ressources';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { formatActionRecord, formatRestoreSpellSlotsRecord } from '@utils/actions.utils';
import {
  buildSpellSlotUpdates,
  canUseResource,
  createQueryCombiner,
  getRelatedFeatures,
  getUsageType
} from '@utils/index';
import { Feature } from '@representations/abilities/feature.representation';
import { Character } from '@representations/user.representation';
import { formatResourceUsageIncrement } from 'src/utils/resourceUsage.utils';
import { SpellPartialRecoveryDialog } from './SpellPartialRecoveryDialog';

const RECOVERY_FEATURES = ['arcane-recovery', 'natural-recovery'];

interface SpellSlotRecoveryProps {
  character: Character;
  disabled?: boolean;
}

export function SpellSlotRecovery({ character, disabled = false }: SpellSlotRecoveryProps) {
  const { isOn: recoveryOpen, turnOn: openRecovery, turnOff: closeRecovery } = useToggle(false);
  const [recovered, setRecovered] = useState<Record<string, number>>({});

  const { logAction } = useActionRecord(character.id);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    successMessages: {
      update: 'Spells slots updated'
    },
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id]
  });

  const { data: recoveryItem } = useQuery({
    queryKey: ['fetchEquipment', character.version, 'pearl-of-power'],
    queryFn: async () => await getMagicItem(character.version, 'pearl-of-power'),
    enabled: !!character.equipments?.find(({ index }) => index === 'pearl-of-power')
  });

  const charRecoveryFeature = useMemo(
    () => character.features?.find(({ index }) => RECOVERY_FEATURES.includes(index)),
    [character.features]
  );
  const { data: recoveryFeature } = useQuery({
    queryKey: ['fetchFeature', character.version, charRecoveryFeature?.index],
    queryFn: async () =>
      charRecoveryFeature?.index
        ? await getFeature(character.version || 'Legacy', charRecoveryFeature.index)
        : null,
    enabled: !!charRecoveryFeature
  });

  const { data: fullFeatureList } = useQueries({
    queries:
      uniqBy(character.features, 'index')?.map(({ index }) => ({
        queryKey: ['fetchFeature', character.version, index],
        queryFn: async () => await getFeature(character.version || 'Legacy', index),
        enabled:
          !!index &&
          !!(recoveryFeature || recoveryItem) &&
          getRelatedFeatures([recoveryFeature, recoveryItem]).length > 0
      })) || [],
    combine: useCallback(createQueryCombiner<Feature>(), [])
  });

  const handleRestore = async (
    fullRecovery: boolean = false,
    itemEnabled: boolean = false,
    featureEnabled: boolean = false
  ) => {
    if (!character.id) return;

    const recovery = fullRecovery ? character.usedSpellSlots || {} : recovered;
    const success = await firebaseCrud.update(
      character.id,
      buildSpellSlotUpdates(recovery, character.usedSpellSlots)
    );

    if (success) {
      const canUseFeature = canUseResource(recoveryFeature, character) && featureEnabled;
      const canUseItem = canUseResource(recoveryItem, character) && itemEnabled;

      const resource =
        !fullRecovery && canUseItem && itemEnabled && recoveryItem?.usage
          ? { equipment: recoveryItem, usage: getUsageType(recoveryItem.usage, fullFeatureList) }
          : undefined;

      const formattedRecovery = formatRestoreSpellSlotsRecord(recovery);
      await logAction(
        formatActionRecord('spell', { ...formattedRecovery, equipment: resource?.equipment })
      );

      if (!fullRecovery && canUseFeature && featureEnabled && recoveryFeature?.usage) {
        await logAction(
          formatActionRecord('feature', { ...recoveryFeature, sourceIndex: recoveryFeature.index })
        );

        const featureUsageUpdate = formatResourceUsageIncrement({
          index: recoveryFeature.index,
          usage: getUsageType(recoveryFeature.usage, fullFeatureList),
          type: 'feature'
        });
        await firebaseCrud.update(character.id, featureUsageUpdate, false);
      }

      if (resource) {
        const itemUsageUpdate = formatResourceUsageIncrement({
          index: resource.equipment.index,
          usage: resource.usage,
          type: 'other'
        });
        await firebaseCrud.update(character.id, itemUsageUpdate, false);
      }

      closeRecovery();
    }
  };

  return (
    <Box display="flex" gap={0.25} flexWrap="wrap" justifyContent="center">
      {canUseResource(recoveryFeature, character) || canUseResource(recoveryItem, character) ? (
        <Fragment>
          <IconButton
            size="small"
            color="secondary"
            onClick={openRecovery}
            disabled={firebaseCrud.isLoading || disabled}
            data-testid="short-rest-restore"
          >
            <AutorenewOutlined fontSize="small" />
            <Typography variant="caption">Partial Recover</Typography>
          </IconButton>

          <SpellPartialRecoveryDialog
            character={character}
            recovered={recovered}
            setRecovered={setRecovered}
            recoveryOpen={recoveryOpen}
            closeRecovery={closeRecovery}
            canRecoverWithFeature={canUseResource(recoveryFeature, character)}
            canRecoverWithItem={canUseResource(recoveryItem, character)}
            recoveryFeature={recoveryFeature ?? undefined}
            recoveryItem={recoveryItem ?? undefined}
            handleRestore={(itemEnabled, featureEnabled) =>
              handleRestore(false, itemEnabled, featureEnabled)
            }
            disabled={disabled}
            isLoading={firebaseCrud.isLoading}
          />
        </Fragment>
      ) : null}

      <Tooltip title="Recover all used spell slots">
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleRestore(true)}
          disabled={firebaseCrud.isLoading || disabled}
        >
          <AutorenewOutlined fontSize="small" />
          <Typography variant="caption">Full Recover</Typography>
        </IconButton>
      </Tooltip>
    </Box>
  );
}
