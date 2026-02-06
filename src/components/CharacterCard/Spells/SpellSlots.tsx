import { AutorenewOutlined, Circle } from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';

interface SpellSlotsProps {
  slots: Record<string, number>;
  usedSlots: Record<string, number>;
  onRestoreAll: () => void;
  disabled?: boolean;
}

export function SpellSlots({ slots, usedSlots, onRestoreAll, disabled = false }: SpellSlotsProps) {
  const hasUsedSlots = Object.values(usedSlots).some((used) => used > 0);

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Box sx={{ display: 'flex', justifyContent: 'center', height: 30 }}>
        <Typography variant="subtitle1" fontWeight="bold" position="absolute">
          Spell Slots
        </Typography>

        {/* TODO: Rest does a lot more */}
        {hasUsedSlots && (
          <Tooltip title="Long Rest - Restore All Slots">
            <Box marginLeft="auto">
              <IconButton size="small" color="primary" onClick={onRestoreAll} disabled={disabled}>
                <AutorenewOutlined fontSize="small" />
                <Typography variant="caption">Rest</Typography>
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Box>

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
                  {available} of {total}
                </Typography>
              </Box>
            );
          })}
      </Box>
    </Box>
  );
}
