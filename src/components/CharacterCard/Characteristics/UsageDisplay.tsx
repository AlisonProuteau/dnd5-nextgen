import { Box, Button, Typography } from '@mui/material';
import { BoxProps } from '@mui/system';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { formatActionRecord } from '@utils/actions.utils';
import { formatUsageLabel, getUsageTimes, getUsageType } from '@utils/index';
import type { Feature } from '@representations/abilities/feature.representation';
import { MagicItem } from '@representations/abilities/magic.representation';
import { Trait } from '@representations/abilities/trait.representation';
import { Equipment } from '@representations/campaign/equipment.representation';
import type { Character } from '@representations/user.representation';

interface UsageDisplayProps {
  type: 'feature' | 'trait' | 'equipment';
  character: Partial<Character>;
  resource: Feature | Trait | Equipment | MagicItem;
  fullFeatureList?: Feature[];
}

export function UsageDisplay({
  type,
  character,
  resource,
  fullFeatureList = [],
  ...props
}: UsageDisplayProps & Omit<BoxProps, 'resource' | 'children'>) {
  const { logAction } = useActionRecord(character?.id || '');
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', character?.id || '']
  });

  const useResource = async () => {
    if (!character.id || !resource.usage || type === 'equipment') return;

    const current = character.resourceUsages?.[resource.index]?.current ?? 0;
    if (current < getUsageTimes(resource.usage, character)) {
      await logAction(formatActionRecord(type, { ...resource, sourceIndex: resource.index }), {
        usage: getUsageType(resource.usage, fullFeatureList)
      });
    }
  };

  const readOnly = type === 'equipment';

  return (
    resource.usage && (
      <Box {...props}>
        {!readOnly ? (
          <Button
            size="small"
            onClick={useResource}
            disabled={
              firebaseCrud.isLoading ||
              (character.resourceUsages?.[resource.index]?.current ?? 0) >=
                getUsageTimes(resource.usage, character)
            }
            sx={{
              padding: 0,
              display: 'flex',
              alignItems: 'baseline',
              gap: 1,
              textTransform: 'none'
            }}
          >
            USE
            <Typography variant="caption" color="text.secondary">
              {formatUsageLabel(resource.index, resource.usage, character, fullFeatureList)}
            </Typography>
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            {formatUsageLabel(resource.index, resource.usage, character, fullFeatureList)}
          </Typography>
        )}
      </Box>
    )
  );
}
