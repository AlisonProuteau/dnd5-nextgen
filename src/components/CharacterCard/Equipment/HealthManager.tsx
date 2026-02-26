import { Fragment, useEffect, useMemo, useState } from 'react';
import { RestartAlt } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControlLabel,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { isEqual, omit } from 'lodash';
import { getTrait } from '@api/ressources';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { Loader } from '@shared/Loader';
import { NumberInput } from '@shared/NumberInput';
import { getUsageTimes } from '@utils/index';
import type { Character } from '@representations/user.representation';

interface HealthManagerProps {
  character: Character;
  isHealthDialogOpen: boolean;
  closeHealthDialog: () => void;
}

//TODO-blocked: Add rest functionality and hit dice management
export function HealthManager({
  character,
  isHealthDialogOpen,
  closeHealthDialog
}: HealthManagerProps) {
  const [overrideHitPoints, setOverrideHitPoints] = useState(false);
  const {
    isOn: isConfirmDialogOpen,
    turnOn: openConfirmDialog,
    turnOff: closeConfirmDialog
  } = useToggle(false);
  const [health, setHealth] = useState({
    current: character.health?.current ?? character.hit_points ?? 0,
    temporary: character.health?.temporary || 0,
    deathSaves: {
      successes: character.health?.deathSaves?.successes || 0,
      failures: character.health?.deathSaves?.failures || 0,
      usedSaves: (character.resourceUsages?.['relentless-endurance']?.current || 0) > 0
    }
  });

  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id],
    successMessages: { update: 'Health Updated' }
  });

  const canAutoSave = useMemo(
    () => character.traits?.some(({ index }) => index === 'relentless-endurance'),
    [character.traits]
  );

  const { data: relentlessTraitUsageMax } = useQuery({
    queryKey: ['fetchTrait', character.version, 'relentless-endurance'],
    queryFn: async () => await getTrait(character.version || 'Legacy', 'relentless-endurance'),
    enabled: canAutoSave,
    select: (trait) => (trait?.usage ? getUsageTimes(trait?.usage, character) : 1)
  });

  const initialHealth = useMemo(
    () => ({
      current: character.health?.current ?? character.hit_points ?? 0,
      temporary: character.health?.temporary || 0,
      deathSaves: {
        successes: character.health?.deathSaves?.successes || 0,
        failures: character.health?.deathSaves?.failures || 0,
        usedSaves:
          (character.resourceUsages?.['relentless-endurance']?.current || 0) >=
          (relentlessTraitUsageMax ?? 1)
      }
    }),
    [
      character.health,
      character.hit_points,
      character.resourceUsages?.['relentless-endurance']?.current,
      relentlessTraitUsageMax
    ]
  );

  useEffect(() => {
    if (isHealthDialogOpen) {
      setHealth(initialHealth);
      setOverrideHitPoints(false);
    }
  }, [isHealthDialogOpen, initialHealth]);

  useEffect(() => {
    if (health.current === 0 && canAutoSave && !health.deathSaves.usedSaves && !overrideHitPoints) {
      setHealth((prev) => ({
        ...prev,
        current: 1,
        deathSaves: { ...prev.deathSaves, usedSaves: true }
      }));
    }
  }, [health.current, canAutoSave, health.deathSaves.usedSaves, overrideHitPoints]);

  useEffect(() => {
    if (!overrideHitPoints && health.current > character.hit_points)
      setHealth((prev) => ({ ...prev, current: character.hit_points ?? 0 }));
  }, [overrideHitPoints, health.current, character.hit_points]);

  const onSave = async () => {
    const newHealth: Character['health'] = { ...character.health, ...health };
    newHealth.deathSaves = omit(newHealth.deathSaves, 'usedSaves');

    if (overrideHitPoints && character.health !== undefined) {
      const newHealthCurrent =
        character.health.current + (health.current - (character.hit_points ?? 0));

      newHealth.current =
        character.health.current === 0 ? 0 : newHealthCurrent > 0 ? newHealthCurrent : 1;
    }

    await firebaseCrud.update(
      character.id,
      overrideHitPoints
        ? { health: newHealth, hit_points: health.current || 1 }
        : {
            health: newHealth,
            resourceUsages: {
              ...character.resourceUsages,
              'relentless-endurance': {
                type: 'trait',
                usage: 'long_rest',
                current: health.deathSaves.usedSaves ? 1 : 0
              }
            }
          }
    );
    closeHealthDialog();
  };

  return (
    <Fragment>
      <Dialog
        open={isHealthDialogOpen}
        onClose={(_, reason) =>
          reason && !isEqual(initialHealth, health) ? openConfirmDialog() : closeHealthDialog()
        }
        fullWidth
      >
        <Box display="flex" flexDirection="column" p={3} gap={2}>
          <Box display="flex" gap={1} justifyContent="space-between" flexWrap="wrap">
            <Typography variant="h6">Manage Health</Typography>

            <Tooltip title="Permanently modify your character's hit points instead of current health. This changes the base stat and cannot be undone.">
              <FormControlLabel
                label={<Typography variant="caption">Override Hit Points</Typography>}
                sx={{ width: 'fit-content', margin: 0 }}
                control={
                  <Checkbox
                    sx={{ padding: 0, paddingRight: 0.25 }}
                    checked={overrideHitPoints}
                    onChange={(_, checked) => setOverrideHitPoints(checked)}
                  />
                }
              />
            </Tooltip>
          </Box>

          <Box display="flex" flexDirection="column" gap={1} align-items="center">
            <Tooltip
              title="Grants a protective buffer above your hit points that absorbs
                damage first. It fades after a long rest. New temporary health replaces any existing
                amount rather than stacking."
              placement="top"
            >
              <NumberInput
                id="temporaryHealth"
                label="Temporary Health"
                min={0}
                max={character.hit_points}
                value={health.temporary}
                onChange={(_, value) => setHealth((prev) => ({ ...prev, temporary: value ?? 0 }))}
                disabled={overrideHitPoints}
              />
            </Tooltip>

            <NumberInput
              id="currentHealth"
              label="Current Hit Points"
              min={health.temporary ? health.current : 0}
              max={overrideHitPoints ? 99 : character.hit_points}
              value={health.current}
              disabled={!overrideHitPoints && health.temporary > 0}
              onChange={(_, value) =>
                value !== null &&
                setHealth((prev) => ({
                  ...prev,
                  current: value,
                  deathSaves:
                    value > 0
                      ? { successes: 0, failures: 0, usedSaves: prev.deathSaves.usedSaves }
                      : prev.deathSaves
                }))
              }
            />

            {health.deathSaves.usedSaves && health.current > 0 && (
              <Typography variant="caption" color="textSecondary">
                Your character's racial ability has been used and won't trigger again until you
                finish a long rest.
              </Typography>
            )}

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
                    disabled={overrideHitPoints}
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
                    disabled={overrideHitPoints}
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
                  deathSaves: { successes: 0, failures: 0, usedSaves: false }
                })
              }
              sx={{ paddingBottom: 0, width: 'fit-content' }}
              disabled={overrideHitPoints}
            >
              <RestartAlt />
            </IconButton>
            <Typography variant="caption" color="textSecondary">
              Reset to default ({character.hit_points})
            </Typography>
            <Typography variant="caption" color="textSecondary">
              (Including temporary health, death saves, and racial abilities)
            </Typography>
          </Box>

          <Box display="flex" justifyContent="flex-end">
            <Button
              key="update-health"
              id="update-health"
              disabled={firebaseCrud.isLoading || (overrideHitPoints && health.current === 0)}
              onClick={onSave}
            >
              {firebaseCrud.isLoading ? <Loader data-testid="loading" /> : 'Save'}
            </Button>
            <Button onClick={closeHealthDialog}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onClose={closeConfirmDialog}>
        <Box display="flex" flexDirection="column" p={3} gap={2}>
          <Typography variant="h6">Leave without saving your changes?</Typography>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              onClick={() => {
                closeConfirmDialog();
                closeHealthDialog();
              }}
            >
              Yes
            </Button>
            <Button onClick={closeConfirmDialog}>No</Button>
          </Box>
        </Box>
      </Dialog>
    </Fragment>
  );
}
