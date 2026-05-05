import { Fragment, useEffect, useMemo, useState } from 'react';
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
  Radio,
  RadioGroup,
  Typography
} from '@mui/material';
import { NumberInput } from '@shared/NumberInput';
import { Feature } from '@representations/abilities/feature.representation';
import { Loader } from 'src/components/shared/Loader';
import { MagicItem } from 'src/representations/abilities/magic.representation';
import { Equipment } from 'src/representations/campaign/equipment.representation';
import { Character } from 'src/representations/user.representation';

const RECOVERY_FEATURES = ['arcane-recovery', 'natural-recovery'];

interface SpellPartialRecoveryDialogProps {
  character: Character;
  recovered: Record<string, number>;
  setRecovered: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleRestore: (itemEnabled?: boolean, featureEnabled?: boolean) => Promise<void>;
  canRecoverWithFeature: boolean;
  canRecoverWithItem: boolean;
  recoveryFeature?: Feature;
  recoveryItem?: MagicItem | Equipment;
  recoveryOpen: boolean;
  closeRecovery: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SpellPartialRecoveryDialog({
  character,
  recovered,
  setRecovered,
  handleRestore,
  canRecoverWithFeature,
  canRecoverWithItem,
  recoveryFeature,
  recoveryItem,
  recoveryOpen,
  closeRecovery,
  disabled = false,
  isLoading = false
}: SpellPartialRecoveryDialogProps) {
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [itemEnabled, setItemEnabled] = useState(false);

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

  useEffect(() => {
    if (!recoveryOpen) {
      setRecovered({});
      setFeatureEnabled(false);
      setItemEnabled(false);
    }
  }, [recoveryOpen]);

  return (
    <Dialog
      open={recoveryOpen}
      onClose={closeRecovery}
      fullWidth
      maxWidth="xs"
      sx={{ height: '500px' }}
    >
      <DialogTitle>Recover Spell Slots</DialogTitle>

      {isLoading ? (
        <Loader />
      ) : (
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
                {canRecoverWithFeature && recoveryFeature && (
                  <FormControlLabel
                    value="feature"
                    control={<Radio />}
                    label={recoveryFeature.name}
                  />
                )}
                {canRecoverWithItem && recoveryItem && (
                  <FormControlLabel value="item" control={<Radio />} label={recoveryItem.name} />
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
                    disabled={isLoading || disabled}
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
      )}

      <DialogActions>
        <Button onClick={closeRecovery} disabled={isLoading || disabled}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => handleRestore(itemEnabled, featureEnabled)}
          disabled={
            !Object.values(recovered).some((v) => v > 0) ||
            (maximums.combinedLevels && totalLevelAmount > maximums.combinedLevels) ||
            (maximums.slotAmount && totalSlots > maximums.slotAmount) ||
            isLoading ||
            disabled
          }
        >
          Recover
        </Button>
      </DialogActions>
    </Dialog>
  );
}
