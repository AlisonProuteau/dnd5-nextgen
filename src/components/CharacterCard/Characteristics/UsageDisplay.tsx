import { Box, Button, Typography } from '@mui/material';
import { BoxProps } from '@mui/system';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { formatActionRecord } from '@utils/actions.utils';
import { formatUsageLabel, getUsageTimes, getUsageType } from '@utils/index';
import type { Feature } from '@representations/abilities/feature.representation';
import { Trait } from '@representations/abilities/trait.representation';
import type { Character } from '@representations/user.representation';

interface UsageDisplayProps {
  type: 'feature' | 'trait';
  character: Partial<Character>;
  resource: Feature | Trait;
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

  const updateResourceUsage = (current: number) =>
    resource.usage
      ? {
          [`resourceUsages.${resource.index}`]: {
            type,
            usage: getUsageType(resource.usage, fullFeatureList),
            current
          }
        }
      : {};

  const useResource = async () => {
    if (!character.id || !resource.usage) return;

    const current = character.resourceUsages?.[resource.index]?.current ?? 0;
    if (current < getUsageTimes(resource.usage, character)) {
      const success = await firebaseCrud.update(
        character.id,
        updateResourceUsage(current + 1),
        false
      );
      if (success) await logAction(formatActionRecord(type, resource));
    }
  };

  //   TODO-blocked: For testing until rest is implemented
  //   const resetResourceUsage = async () => {
  //     if (character.id && resource.usage)
  //       await firebaseCrud.update(character.id, formatResourceUsageForCharacter(0), false);
  //   };

  return (
    resource.usage && (
      <Box {...props}>
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
        {/* <Button
          size="small"
          sx={{ padding: 0, margin: 0, minWidth: 0 }}
          onClick={resetResourceUsage}
          disabled={
            firebaseCrud.isLoading ||
            (character.resourceUsages?.[resource.index]?.current ?? 0) === 0
          }
        >
          Reset
        </Button> */}
      </Box>
    )
  );
}
