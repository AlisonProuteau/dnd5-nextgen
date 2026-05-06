import { Circle } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { Character } from '@representations/user.representation';
import { SpellSlotRecovery } from './SpellSlotRecovery';

interface SpellSlotsProps {
  character: Character;
  slots: Record<string, number>;
  disabled?: boolean;
}

export function SpellSlots({ character, slots, disabled = false }: SpellSlotsProps) {
  return (
    <Box data-testid="spell-slots" display="flex" flexDirection="column" gap={0.5}>
      <Typography display="block" variant="subtitle1" fontWeight="bold" textAlign="center">
        Spell Slots
      </Typography>

      <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
        {Object.entries(slots)
          .filter(([_, total]) => total > 0)
          .map(([level, total]) => {
            const used = character.usedSpellSlots?.[level] || 0;
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

      {Object.values(character.usedSpellSlots || {}).some((used) => used > 0) && (
        <SpellSlotRecovery character={character} disabled={disabled} />
      )}
    </Box>
  );
}
