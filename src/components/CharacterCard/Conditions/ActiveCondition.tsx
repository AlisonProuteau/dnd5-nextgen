import { Fragment } from 'react';
import { Remove, Undo } from '@mui/icons-material';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getCondition } from '@api/ressources';
import { NumberInput } from 'src/components/shared/NumberInput';
import { TooltipButton } from 'src/components/shared/TooltipButton';
import { useAuth } from 'src/providers/AuthProvider';
import { DefaultRepresentation } from 'src/representations/common.representation';

interface ActiveConditionProps {
  condition: DefaultRepresentation & { level?: number };
  maxLevel?: number;
  onRemove?: (data: DefaultRepresentation) => void;
  isPendingRemoval?: boolean;
  onLevelChange?: (data: DefaultRepresentation, v: number) => void;
  block?: boolean;
}

export function ActiveCondition({
  condition,
  maxLevel,
  onRemove,
  isPendingRemoval = false,
  onLevelChange,
  block = false
}: ActiveConditionProps) {
  const { version } = useAuth();

  const { data: conditionDesc } = useQuery({
    queryKey: ['fetchCondition', version, condition.index],
    queryFn: async () => await getCondition(version || 'Legacy', condition.index),
    select: (res) => res?.desc
  });

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={0}>
        <TooltipButton
          title={conditionDesc?.map((d, i) => (
            <Typography key={`${condition.index}-desc-${i}`} variant="subtitle2">
              {d}
            </Typography>
          ))}
          slotProps={{
            tooltip: { sx: { maxWidth: 'min(100vw, 700px)', mx: 2, backgroundColor: 'black' } }
          }}
          enterTouchDelay={0}
          block={block}
          arrow
        >
          <Chip
            label={
              <Fragment>
                <Typography
                  variant="caption"
                  sx={isPendingRemoval ? { textDecoration: 'line-through' } : undefined}
                >
                  {condition.name}
                  {!onLevelChange && condition.level && (
                    <Typography display="inline" fontSize={10}>
                      {' '}
                      ({condition.level})
                    </Typography>
                  )}
                </Typography>
              </Fragment>
            }
            size="small"
            color="secondary"
            variant={onRemove || onLevelChange ? 'outlined' : 'filled'}
            sx={{ opacity: isPendingRemoval ? 0.45 : 1 }}
          />
        </TooltipButton>

        {maxLevel && onLevelChange && (
          <NumberInput
            id={`exhaustion-level-${condition.index}`}
            min={1}
            max={maxLevel}
            value={condition.level ?? 1}
            onChange={(_, v) => v && onLevelChange(condition, v)}
            disabled={isPendingRemoval}
            disablebackground
            compact
          />
        )}
      </Box>

      {onRemove && (
        <IconButton
          size="small"
          data-testid={`condition-remove-${condition.index}`}
          onClick={() => onRemove(condition)}
        >
          {isPendingRemoval ? <Undo fontSize="small" /> : <Remove fontSize="small" />}
        </IconButton>
      )}
    </Box>
  );
}
