import { Fragment, useEffect, useMemo, useState } from 'react';
import { AutorenewOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Tooltip,
  Typography
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { getFeature, getMagicItem } from '@api/ressources';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { NumberInput } from '@shared/NumberInput';
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

const RECOVERY_FEATURES = ['arcane-recovery', 'natural-recovery'];

interface SpellSlotRecoveryProps {
  character: Character;
  disabled?: boolean;
}

export function SpellSlotRecovery({ character, disabled = false }: SpellSlotRecoveryProps) {
  const { isOn: recoveryOpen, turnOn: openRecovery, turnOff: closeRecovery } = useToggle(false);
  const [recovered, setRecovered] = useState<Record<string, number>>({});
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [itemEnabled, setItemEnabled] = useState(false);

  const { logAction } = useActionRecord(character.id);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    successMessages: {
      update: 'Spells slots updated'
    },
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id]
  });

  const charRecoveryItem = useMemo(
    () => character.equipments?.find(({ index }) => index === 'pearl-of-power'),
    [character.equipments]
  );
  const { data: recoveryItem } = useQuery({
    queryKey: ['fetchEquipment', character.version, 'pearl-of-power'],
    queryFn: async () => await getMagicItem(character.version, 'pearl-of-power'),
    enabled: !!charRecoveryItem
  });

  const canRecoverWithItem = useMemo(
    () => canUseResource(recoveryItem, character),
    [recoveryItem, character.resourceUsages]
  );

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

  const canRecoverWithFeature = useMemo(
    () => canUseResource(recoveryFeature, character),
    [recoveryFeature, character.resourceUsages]
  );

  const hasRelatedFeatures = getRelatedFeatures([recoveryFeature, recoveryItem]).length > 0;
  const combineFn = useMemo(() => createQueryCombiner<Feature>(), []);
  const { data: fullFeatureList } = useQueries({
    queries:
      uniqBy(character.features, 'index')?.map(({ index }) => ({
        queryKey: ['fetchFeature', character.version, index],
        queryFn: async () => await getFeature(character.version || 'Legacy', index),
        enabled: !!index && hasRelatedFeatures
      })) || [],
    combine: combineFn
  });

  const maximums = useMemo(() => {
    const slotAmount = canRecoverWithItem && itemEnabled ? 1 : undefined;
    const combinedLevels =
      canRecoverWithFeature && featureEnabled ? Math.ceil(character.level / 2) : undefined;

    let level = 0;
    if (canRecoverWithItem && itemEnabled)
      level =
        Object.entries(character.usedSpellSlots || {}).reduce((max, [level, used]) => {
          if (used < 1) return max;

          return Math.max(max, parseInt(level));
        }, 0) - 1 || 0;
    else if (
      canRecoverWithFeature &&
      featureEnabled &&
      recoveryFeature?.index === 'arcane-recovery'
    )
      level = 5;

    return { level, combinedLevels, slotAmount };
  }, [
    canRecoverWithItem,
    itemEnabled,
    canRecoverWithFeature,
    featureEnabled,
    character.level,
    character.usedSpellSlots,
    recoveryFeature?.index
  ]);

  const { totalLevelAmount, totalSlots } = useMemo(
    () =>
      Object.entries(recovered).reduce(
        (acc, [level, amount]) => ({
          totalLevelAmount: acc.totalLevelAmount + parseInt(level) * amount,
          totalSlots: acc.totalSlots + amount
        }),
        { totalLevelAmount: 0, totalSlots: 0 }
      ),
    [recovered]
  );

  const recoverableLevels = useMemo(
    () =>
      Object.entries(character.usedSpellSlots || {})
        .filter(
          ([level, used]) => used > 0 && (!maximums.level || parseInt(level) <= maximums.level)
        )
        .map(([level, used]) => ({ level: parseInt(level), used }))
        .sort((a, b) => a.level - b.level),
    [character.usedSpellSlots, maximums.level]
  );

  useEffect(() => {
    if (!recoveryOpen) return;

    if (!canRecoverWithFeature && featureEnabled) setFeatureEnabled(false);
    if (!canRecoverWithItem && itemEnabled) setItemEnabled(false);

    if (!featureEnabled && !itemEnabled) {
      if (canRecoverWithItem) setItemEnabled(true);
      else if (canRecoverWithFeature) setFeatureEnabled(true);
    }
  }, [featureEnabled, itemEnabled, canRecoverWithFeature, canRecoverWithItem, recoveryOpen]);

  const handleClose = () => {
    closeRecovery();
    setRecovered({});
    setFeatureEnabled(false);
    setItemEnabled(false);
  };

  const handleRestore = async (fullRecovery: boolean = false) => {
    if (!character.id) return;

    const recovery = fullRecovery
      ? character.usedSpellSlots || {}
      : Object.fromEntries(Object.entries(recovered).filter(([, v]) => v > 0));

    const success = await firebaseCrud.update(
      character.id,
      buildSpellSlotUpdates(recovery, character.usedSpellSlots)
    );

    if (success) {
      const resource =
        !fullRecovery && canRecoverWithItem && itemEnabled && recoveryItem?.usage
          ? { equipment: recoveryItem, usage: getUsageType(recoveryItem.usage, fullFeatureList) }
          : undefined;

      await logAction(
        formatActionRecord('spell', {
          ...formatRestoreSpellSlotsRecord(recovery),
          equipment: resource?.equipment
        }),
        resource ? { usage: resource.usage } : undefined
      );

      if (!fullRecovery) {
        if (canRecoverWithFeature && featureEnabled && recoveryFeature?.usage)
          await logAction(
            formatActionRecord('feature', {
              ...recoveryFeature,
              sourceIndex: recoveryFeature.index
            }),
            { usage: getUsageType(recoveryFeature.usage, fullFeatureList) }
          );
      }

      handleClose();
    }
  };

  return (
    <Box display="flex" gap={0.25} flexWrap="wrap" justifyContent="center">
      {(canRecoverWithFeature || canRecoverWithItem) && recoverableLevels.length > 0 ? (
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

          <Dialog open={recoveryOpen} onClose={handleClose} fullWidth maxWidth="xs">
            <DialogTitle>Recover Spell Slots</DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection="column" gap={2} mb={2}>
                <FormControl>
                  <FormLabel>Recovery Method</FormLabel>
                  <RadioGroup
                    value={featureEnabled ? 'feature' : itemEnabled ? 'item' : ''}
                    onChange={(_, v) => {
                      setFeatureEnabled(v === 'feature');
                      setItemEnabled(v === 'item');
                    }}
                  >
                    {canRecoverWithFeature && charRecoveryFeature && (
                      <FormControlLabel
                        value="feature"
                        control={<Radio />}
                        label={charRecoveryFeature.name}
                      />
                    )}
                    {canRecoverWithItem && charRecoveryItem && (
                      <FormControlLabel
                        value="item"
                        control={<Radio />}
                        label={charRecoveryItem.name}
                      />
                    )}
                  </RadioGroup>
                </FormControl>
              </Box>
              {recoverableLevels.length === 0 || (!featureEnabled && !itemEnabled) ? (
                <Typography variant="body2" color="text.secondary" mt={2}>
                  No used spell slots eligible for recovery.
                </Typography>
              ) : (
                <Fragment>
                  <Box display="flex" flexDirection="column" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Select {maximums.slotAmount ? maximums.slotAmount + ' ' : ''}spell slot
                      {maximums.slotAmount === 1 ? '' : 's'} to recover
                      {maximums.combinedLevels
                        ? ` (total level must be ${maximums.combinedLevels} or less).`
                        : '.'}
                    </Typography>
                    {maximums.level ? (
                      <Typography variant="caption" color="text.secondary">
                        You can only recover spell slots up to level {maximums.level}.
                      </Typography>
                    ) : null}
                  </Box>

                  <Box display="flex" flexDirection="column" gap={1} mt={1}>
                    {recoverableLevels.map(({ level, used }) => (
                      <NumberInput
                        id={`recover-${level}`}
                        label={
                          <Fragment>
                            Level {level}{' '}
                            <Typography component="span" variant="caption" color="text.secondary">
                              ({used} used)
                            </Typography>
                          </Fragment>
                        }
                        min={0}
                        max={used}
                        value={recovered[level] ?? 0}
                        onChange={(_, value) =>
                          value !== null && setRecovered((prev) => ({ ...prev, [level]: value }))
                        }
                        disabled={firebaseCrud.isLoading || disabled}
                        addDisabled={
                          (!!maximums.combinedLevels &&
                            maximums.combinedLevels - (totalLevelAmount + level) < 0) ||
                          (!!maximums.slotAmount && totalSlots >= maximums.slotAmount)
                        }
                      />
                    ))}
                  </Box>
                </Fragment>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={handleClose} disabled={firebaseCrud.isLoading || disabled}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => handleRestore(false)}
                disabled={
                  !Object.values(recovered).some((v) => v > 0) ||
                  (maximums.combinedLevels && totalLevelAmount > maximums.combinedLevels) ||
                  (maximums.slotAmount && totalSlots > maximums.slotAmount) ||
                  firebaseCrud.isLoading ||
                  disabled
                }
              >
                Recover
              </Button>
            </DialogActions>
          </Dialog>
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
