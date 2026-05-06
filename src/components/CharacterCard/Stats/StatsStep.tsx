import { Fragment } from 'react';
import { ArmorIcon, HitPointsIcon, ProficiencyIcon, SicklePlusIcon, SpeedIcon } from '@assets';
import { Delete, EditAttributes } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material';
import { Box } from '@mui/system';
import { useQuery } from '@tanstack/react-query';
import { getAllAbilities } from '@api/ressources';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { IconText } from '@shared/IconText';
import { Loader } from '@shared/Loader';
import type { AbilityScore } from '@representations/campaign/adventure.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { DefaultProps } from 'src/pages/Header';
import { useAuth } from 'src/providers/AuthProvider';
import { CharacterPoints } from '../CharacterPoints';
import { ActiveCondition } from '../Conditions/ActiveCondition';
import { ConditionsManager } from '../Conditions/ConditionsManager';
import { AbilityComponent } from './AbilityComponent';

export function Stats({ character }: DefaultProps) {
  const { isOn: isPointsOpen, turnOn: openPoints, turnOff: closePoints } = useToggle(false);
  const { isOn: isDeleteOpen, turnOn: openDelete, turnOff: closeDelete } = useToggle(false);
  const {
    isOn: isConditionsOpen,
    turnOn: openConditions,
    turnOff: closeConditions
  } = useToggle(false);
  const { version } = useAuth();

  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacters'],
    successMessages: { delete: 'Character deleted successfully' },
    redirect: { delete: { path: '/' } }
  });

  const { data: abilities } = useQuery({
    queryKey: ['fetchAbilities', version],
    queryFn: async () => (version ? (await getAllAbilities(version)).results : null),
    enabled: !!version
  });

  const abilitySorter = (
    a: AbilityScore,
    b: AbilityScore,
    abilityScores: Record<string, { score: number }>,
    savingThrows?: DefaultRepresentation[]
  ) => {
    return (
      (b.index === 'con' ? -1 : 0) ||
      (a.index === 'con' ? 1 : 0) ||
      abilityScores[b.index].score - abilityScores[a.index].score ||
      (savingThrows?.find(({ index }) => index === b.index) ? 1 : 0) -
        (savingThrows?.find(({ index }) => index === a.index) ? 1 : 0) ||
      b.skills.length - a.skills.length
    );
  };

  return (
    <Box data-testid="stats-section" display="flex" gap="15px" flexDirection="column">
      <Box
        data-testid="stats-section-header"
        display="grid"
        gridTemplateColumns="1fr 1fr 1fr 1fr"
        paddingTop="15px"
      >
        <IconText
          label="Armor"
          value={character.armorClass}
          Icon={ArmorIcon}
          color="grey"
          testid="armor-class"
        />
        <IconText
          label="Hit Points"
          value={
            (character.health?.current ?? character.hit_points ?? 0) +
            (character.health?.temporary ?? 0)
          }
          Icon={HitPointsIcon}
          color="grey"
          testid="hit-points"
        />
        <IconText
          label="Speed"
          value={character.speed}
          Icon={SpeedIcon}
          color="grey"
          testid="speed"
        />
        <IconText
          label="Proficiency Bonus"
          value={character.proficiencyBonus}
          Icon={ProficiencyIcon}
          color="grey"
          testid="proficiency-bonus"
        />
      </Box>

      <Box display="flex" justifyContent="center" alignItems="center" gap={1} flexWrap="wrap">
        {character.conditions?.map((condition) => (
          <ActiveCondition key={`condition-chip-${condition.index}`} condition={condition} />
        ))}
        <IconButton
          data-testid={`conditions-${character.id}`}
          size="small"
          onClick={openConditions}
          color="info"
        >
          <SicklePlusIcon height="23px" width="23px" fill="currentColor" />
        </IconButton>
      </Box>
      <ConditionsManager
        character={character}
        isOpen={isConditionsOpen}
        onClose={closeConditions}
      />

      {abilities?.length ? (
        <Box display="grid" rowGap="10px" justifyContent="center">
          {abilities
            .sort((a, b) => abilitySorter(a, b, character.abilityScores, character.saving_throws))
            .map((ability) => (
              <AbilityComponent
                key={ability.index}
                ability={ability}
                skills={character.skills}
                score={character.abilityScores[ability.index].score}
                modifier={character.abilityScores[ability.index].modifier}
                savingThrows={character.saving_throws?.map(({ name, index }) => {
                  const fullName = abilities.find((ability) => ability.index === index)?.full_name;
                  return { index, name: fullName || name };
                })}
              />
            ))}
        </Box>
      ) : (
        <Loader sx={{ minHeight: '50vh', alignContent: 'center' }} />
      )}

      <Fragment>
        <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
          <Button
            data-testid={`edit-points-${character.id}`}
            onClick={openPoints}
            sx={{ display: 'flex', flexDirection: 'column' }}
            color="primary"
          >
            <EditAttributes />
            <Typography variant="button" color="text.secondary">
              Edit Points
            </Typography>
          </Button>
          <Button
            data-testid={`delete-${character.id}`}
            onClick={openDelete}
            color="secondary"
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            <Delete />
            <Typography variant="button" color="text.secondary">
              Delete Character
            </Typography>
          </Button>
        </Box>

        <Dialog maxWidth="sm" fullWidth open={isPointsOpen} onClose={closePoints}>
          <Box display="flex" flexDirection="column" gap={3} p={3}>
            <Typography variant="h6">Edit Character Points</Typography>
            <CharacterPoints characterId={character.id} redirect={false} onSave={closePoints} />
          </Box>
        </Dialog>

        <Dialog maxWidth="xs" open={isDeleteOpen} onClose={closeDelete}>
          <DialogTitle>Delete {character.name}</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this character?
            <br />
            This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button autoFocus disabled={firebaseCrud.isLoading} onClick={closeDelete}>
              Cancel
            </Button>
            <Button
              disabled={firebaseCrud.isLoading}
              onClick={async () => {
                await firebaseCrud.remove(character.id);
                closeDelete();
              }}
            >
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      </Fragment>
    </Box>
  );
}
