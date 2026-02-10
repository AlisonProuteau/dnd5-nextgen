import { useEffect, useState } from 'react';
import { RestartAlt } from '@mui/icons-material';
import { Box, Button, Dialog, IconButton, Typography } from '@mui/material';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { Loader } from '@shared/Loader';
import { NumberInput } from '@shared/NumberInput';
import type { Character } from '@representations/user.representation';

interface HealthManagerProps {
  character: Character;
  isHealthDialogOpen: boolean;
  closeHealthDialog: () => void;
}

//TODO-blocked: Add rest functionality and hit dice management
//TODO: More features to add? - check rules
//TODO: E2E
export function HealthManager({
  character,
  isHealthDialogOpen,
  closeHealthDialog
}: HealthManagerProps) {
  const [health, setHealth] = useState({
    current: character.health?.current ?? character.hit_points ?? 0,
    temporary: character.health?.temporary || 0,
    deathSaves: {
      successes: character.health?.deathSaves?.successes || 0,
      failures: character.health?.deathSaves?.failures || 0
    }
  });
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id],
    successMessages: { update: 'Health Updated' }
  });

  useEffect(() => {
    if (!isHealthDialogOpen)
      setHealth({
        current: character.health?.current ?? character.hit_points ?? 0,
        temporary: character.health?.temporary || 0,
        deathSaves: {
          successes: character.health?.deathSaves?.successes || 0,
          failures: character.health?.deathSaves?.failures || 0
        }
      });
  }, [isHealthDialogOpen]);

  const onSave = async () => {
    await firebaseCrud.update(character.id, { health });
    closeHealthDialog();
  };

  return (
    <Dialog open={isHealthDialogOpen} onClose={closeHealthDialog} fullWidth>
      <Box display="flex" flexDirection="column" p={3} gap={2}>
        <Typography variant="h6">Manage Health</Typography>

        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <Typography variant="caption" color="textSecondary">
            Temporary health grants a protective buffer above your hit points that absorbs damage
            first. It fades after a long rest. New temporary health replaces any existing amount
            rather than stacking.
          </Typography>
          <NumberInput
            id="temporaryHealth"
            label="Temporary Health"
            min={0}
            max={character.hit_points}
            value={health.temporary}
            onChange={(_, value) => setHealth((prev) => ({ ...prev, temporary: value ?? 0 }))}
          />
          <NumberInput
            id="currentHealth"
            label="Current Hit Points"
            min={health.temporary ? health.current : 0}
            max={character.hit_points}
            value={health.current}
            onChange={(_, value) =>
              setHealth((prev) => ({
                ...prev,
                current: value ?? 0,
                deathSaves: (value ?? 0) > 0 ? { successes: 0, failures: 0 } : prev.deathSaves
              }))
            }
          />

          {health.current <= 0 && health.deathSaves.successes !== 3 && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <Typography variant="caption" color="textSecondary">
                Your character is unconscious. Manage death saves below.
              </Typography>
              <Box display="flex" gap={2}>
                <NumberInput
                  id="deathSaveSuccesses"
                  label="Successes"
                  min={0}
                  max={3}
                  value={health.deathSaves.successes}
                  onChange={(_, value) =>
                    setHealth((prev) => ({
                      ...prev,
                      deathSaves: { ...prev.deathSaves, successes: value ?? 0 }
                    }))
                  }
                />
                <NumberInput
                  id="deathSaveFailures"
                  label="Failures"
                  min={0}
                  max={3}
                  value={health.deathSaves.failures}
                  onChange={(_, value) =>
                    setHealth((prev) => ({
                      ...prev,
                      deathSaves: { ...prev.deathSaves, failures: value ?? 0 }
                    }))
                  }
                />
              </Box>
            </Box>
          )}

          {health.deathSaves.successes === 3 && health.current <= 0 && (
            <Typography variant="caption" color="textSecondary">
              Your character has stabilized but remains unconscious at death's door.
            </Typography>
          )}
          {health.deathSaves.failures === 3 && (
            <Typography variant="caption" color="textSecondary">
              Your character has fallen.
            </Typography>
          )}
        </Box>

        <Box display="flex" flexDirection="column" alignItems="center">
          <IconButton
            data-testid="reset-health-button"
            onClick={() =>
              setHealth({
                current: character.hit_points ?? 0,
                temporary: 0,
                deathSaves: { successes: 0, failures: 0 }
              })
            }
            sx={{ paddingBottom: 0, width: 'fit-content' }}
          >
            <RestartAlt />
          </IconButton>
          <Typography variant="caption" color="textSecondary">
            Reset to default ({character.hit_points})
          </Typography>
          <Typography variant="caption" color="textSecondary">
            (Including temporary health and death saves)
          </Typography>
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <Button
            key="update-health"
            id="update-health"
            disabled={firebaseCrud.isLoading}
            onClick={onSave}
          >
            {firebaseCrud.isLoading ? <Loader data-testid="loading" /> : 'Save'}
          </Button>
          <Button onClick={closeHealthDialog}>Cancel</Button>
        </Box>
      </Box>
    </Dialog>
  );
}
