import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { CoinPurse } from '@assets';
import {
  Delete,
  EditRounded,
  EventNote,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  MobileStepper,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getClassInfo } from '@api/ressources';
import { getCharacter } from '@api/users';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { Loader } from '@shared/Loader';
import { button, fab, linkButton } from '@utils/ui';
import type { Classes } from '@representations/character/class.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { Characteristics } from './Characteristics/CharacteristicsStep';
import { CharacterNotes } from './CharacterNotes/CharacterNotes';
import { Description } from './Description/DescriptionStep';
import { Equipments } from './Equipment/EquipmentsStep';
import { MoneyManager } from './Equipment/MoneyManager';
import { SpellStep } from './Spells/SpellsStep';
import { Stats } from './Stats/StatsStep';

export function CharacterContainer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [id, setId] = useState<string>();
  const [steps, setSteps] = useState(3);
  const [activeStep, setActiveStep] = useState(0);
  const { isOn: isNoteOpen, turnOn: openNote, turnOff: closeNote } = useToggle(false);
  const { isOn: isDeleteOpen, turnOn: openDelete, turnOff: closeDelete } = useToggle(false);
  const {
    isOn: isMoneyDialogOpen,
    turnOn: openMoneyDialog,
    turnOff: closeMoneyDialog
  } = useToggle(false);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacters'],
    successMessages: { delete: 'Character deleted successfully' },
    redirect: { delete: { path: '/' } }
  });

  const { data: character, isFetching: isCharacterLoading } = useQuery({
    queryKey: ['fetchCharacter', user?.uid, id],
    queryFn: async () => (user?.uid && id ? await getCharacter(user.uid, id) : null),
    enabled: !!user?.uid && !!id
  });

  const { data: classInfo } = useQuery({
    queryKey: ['fetchClassInfo', character?.version, character?.class.index],
    queryFn: async () =>
      character
        ? ((await getClassInfo(character.version, character.class.index)) as Classes | null)
        : null,
    enabled: !!character
  });

  useEffect(() => setId(location.state?.characterId), [location.state?.characterId]);

  useEffect(() => {
    if (id && !isCharacterLoading && character && !character.abilityScores)
      navigate('points', { replace: true, state: { characterId: id } });
    else if (id && !isCharacterLoading && !character)
      navigate('/', { state: { characterId: undefined } });
  }, [isCharacterLoading, id]);

  const canCastSpells = useMemo(
    () =>
      (character && classInfo?.spellcasting && classInfo.spellcasting.level <= character.level) ||
      (character?.traits?.filter(({ spells }) => spells).length || 0) > 0,
    [
      classInfo?.spellcasting?.level,
      character?.level,
      character?.traits?.filter(({ spells }) => spells).length
    ]
  );

  useEffect(() => {
    setSteps(canCastSpells ? 5 : 4);
  }, [canCastSpells]);

  const handleNext = () =>
    setActiveStep((prevActiveStep) => (prevActiveStep < steps - 1 ? prevActiveStep + 1 : 0));
  const handleBack = () =>
    setActiveStep((prevActiveStep) => (prevActiveStep > 0 ? prevActiveStep - 1 : steps - 1));

  const pageTitle = useMemo(() => {
    switch (activeStep) {
      case 0:
        return 'Characteristics & Abilities';
      case 1:
        return 'Traits & Features';
      case 2:
        return 'Equipments & Inventory';
      case 3:
        return 'Character Description';
      case 4:
        return 'Spells';
    }
  }, [activeStep]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handleBack
  });

  return (
    <Container sx={{ paddingBottom: '56px' }} data-testid="character-container">
      {character?.abilityScores ? (
        <Fragment>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="baseline"
            data-testid="character-card"
          >
            <Box flex={1}>
              <Typography variant="subtitle1" color="text.secondary">
                {character.class.name}
                {character.subclass && ` - ${character.subclass.name}`}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {character.race.name}
                {character.subrace && ` - ${character.subrace.name}`}
              </Typography>
            </Box>
            <Typography variant="h5">{character.name}</Typography>
            <Box textAlign="end" flex={1}>
              <Typography variant="subtitle1" color="text.secondary">
                Level: {character.level}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                XP: 0
              </Typography>
            </Box>
          </Box>

          <Divider component="div" role="presentation" variant="middle">
            <Typography variant="subtitle2">{pageTitle}</Typography>
          </Divider>

          <MobileStepper
            variant="dots"
            steps={steps}
            position="static"
            activeStep={activeStep}
            sx={{ paddingTop: 0 }}
            nextButton={
              <Button size="small" onClick={handleNext} data-testid="next-step">
                <KeyboardArrowRight />
              </Button>
            }
            backButton={
              <Button size="small" onClick={handleBack} data-testid="previous-step">
                <KeyboardArrowLeft />
              </Button>
            }
          />

          <Box {...swipeHandlers}>
            {activeStep === 0 && <Stats character={character} />}
            {activeStep === 1 && <Characteristics character={character} />}
            {activeStep === 2 && <Equipments character={character} />}
            {activeStep === 3 && <Description character={character} />}
            {canCastSpells && activeStep === 4 && <SpellStep character={character} />}
          </Box>
        </Fragment>
      ) : null}

      {character && (
        <>
          <Fab
            size="small"
            sx={{ ...button, ...fab }}
            onClick={openNote}
            data-testid={`notes-${character.id}`}
          >
            <EventNote />
          </Fab>
          <CharacterNotes isNoteOpen={isNoteOpen} closeNote={closeNote} character={character} />

          <Fab
            size="small"
            sx={{ ...button, ...fab, padding: 0.6, marginRight: 6 }}
            onClick={openMoneyDialog}
            data-testid={`coin-purse-${character.id}`}
          >
            <CoinPurse fill="currentColor" width="100%" height="100%" />
          </Fab>

          <MoneyManager
            characterId={character.id}
            isMoneyDialogOpen={isMoneyDialogOpen}
            closeMoneyDialog={closeMoneyDialog}
            currentAmount={character.money}
          />

          {activeStep === 0 && (
            <Fragment>
              <Fab
                size="small"
                sx={{ ...button, ...fab, marginRight: 12 }}
                data-testid={`edit-points-${character.id}`}
              >
                <Link to="points" state={{ characterId: id }} css={linkButton}>
                  <EditRounded />
                </Link>
              </Fab>

              <Fab
                size="small"
                sx={{ ...button, ...fab, padding: 0.6, marginRight: 18 }}
                onClick={openDelete}
                data-testid={`delete-${character.id}`}
              >
                <Delete />
              </Fab>
            </Fragment>
          )}

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
        </>
      )}

      <Loader open={!character?.abilityScores} />
    </Container>
  );
}
