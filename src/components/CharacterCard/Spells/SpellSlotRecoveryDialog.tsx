import { Fragment, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';
import { NumberInput } from '@shared/NumberInput';

interface SpellSlotRecoveryDialogProps {
  open: boolean;
  onClose: () => void;
  usedSlots: Record<string, number>;
  maxSlots: Record<string, number>;
  onRestore: (recovered: Record<string, number>) => void;
  disabled?: boolean;
}

export function SpellSlotRecoveryDialog({
  open,
  onClose,
  usedSlots,
  maxSlots,
  onRestore,
  disabled = false
}: SpellSlotRecoveryDialogProps) {
  const [recovered, setRecovered] = useState<Record<string, number>>({});
  const recoverableLevels = useMemo(
    () =>
      Object.entries(usedSlots)
        .filter(([, used]) => used > 0)
        .map(([level, used]) => ({ level: parseInt(level), used }))
        .sort((a, b) => a.level - b.level),
    [usedSlots]
  );

  const handleClose = () => {
    setRecovered({});
    onClose();
  };

  const handleRestore = () => {
    const nonZero = Object.fromEntries(Object.entries(recovered).filter(([, v]) => v > 0));
    onRestore(nonZero);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Recover Spell Slots</DialogTitle>
      <DialogContent>
        {/* TODO: Add info on how this works + limitations (combined level up to character level, max 5th level slots, etc.) */}
        {/* <Typography variant="body2" color="text.secondary" mb={2}>
          Recover spell slots with a combined level of up to all. Slots of 6th level or higher
          cannot be recovered.
        </Typography> */}

        {recoverableLevels.length === 0 ? (
          <Typography variant="body2" color="text.secondary" mt={2}>
            No used spell slots eligible for recovered.
          </Typography>
        ) : (
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
                disabled={disabled}
              />
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={disabled}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleRestore}
          disabled={!Object.values(recovered).some((v) => v > 0) || disabled}
        >
          Recover
        </Button>
      </DialogActions>
    </Dialog>
  );
}
