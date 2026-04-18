import { AutorenewOutlined, Circle } from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { formatActionRecord, formatRestoreSpellSlotsRecord } from '@utils/actions.utils';
import { SpellSlotRecoveryDialog } from './SpellSlotRecoveryDialog';

interface SpellSlotsProps {
  characterId: string;
  slots: Record<string, number>;
  usedSlots: Record<string, number>;
  disabled?: boolean;
}

export function SpellSlots({ characterId, slots, usedSlots, disabled = false }: SpellSlotsProps) {
  const hasUsedSlots = Object.values(usedSlots).some((used) => used > 0);
  const { isOn: recoveryOpen, turnOn: openRecovery, turnOff: closeRecovery } = useToggle(false);

  const { logAction } = useActionRecord(characterId);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    successMessages: {
      update: 'Spells slots updated'
    },
    invalidateQueryKey: ['fetchCharacter', '{userId}', characterId]
  });

  const restore = async (recovery: Record<string, number>) => {
    if (!characterId) return;

    const updates: Record<string, number | null> = {};
    Object.entries(recovery).forEach(([level, count]) => {
      const currentUsed = usedSlots?.[level] ?? 0;
      updates[`usedSpellSlots.${level}`] = Math.max(currentUsed - count, 0) || null;
    });

    const success = await firebaseCrud.update(characterId, updates, false);
    if (success)
      await logAction(formatActionRecord('spell', formatRestoreSpellSlotsRecord(recovery)));
  };

  return (
    <Box data-testid="spell-slots" display="flex" flexDirection="column" gap={0.5}>
      <Typography display="block" variant="subtitle1" fontWeight="bold" textAlign="center">
        Spell Slots
      </Typography>

      <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
        {Object.entries(slots)
          .filter(([_, total]) => total > 0)
          .map(([level, total]) => {
            const used = usedSlots[level] || 0;
            const available = total - used;

            return (
              <Box key={level} display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Level {level}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {Array.from({ length: total }, (_, i) => (
                    <Circle
                      key={i}
                      color={i < used ? 'disabled' : 'primary'}
                      sx={{ fontSize: 16 }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="secondary">
                  {available >= 0 ? available : 0} of {total}
                </Typography>
              </Box>
            );
          })}
      </Box>

      {hasUsedSlots && (
        <Box display="flex" gap={0.25} flexWrap="wrap" justifyContent="center">
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

          <SpellSlotRecoveryDialog
            open={recoveryOpen}
            onClose={closeRecovery}
            usedSlots={usedSlots}
            maxSlots={slots}
            onRestore={restore}
            disabled={firebaseCrud.isLoading || disabled}
          />

          <Tooltip title="Recover all used spell slots">
            <IconButton
              size="small"
              color="primary"
              onClick={() => restore(usedSlots)}
              disabled={disabled}
            >
              <AutorenewOutlined fontSize="small" />
              <Typography variant="caption">Full Recover</Typography>
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
