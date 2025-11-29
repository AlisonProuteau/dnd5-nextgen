import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { EditRounded, EventNote, KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Fab,
  MobileStepper,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getClassInfo } from '@api/ressources';
import { getCharacter } from '@api/users';
import { useToggle } from '@hooks/useToggle';
import { button, fab, linkButton } from '@utils/ui';
import type { Classes } from '@representations/character/class.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { Characteristics } from './Characteristics/CharacteristicsStep';
import { CharacterNotes } from './CharacterNotes/CharacterNotes';
import { Description } from './Description/DescriptionStep';
import { Equipments } from './Equipment/EquipmentsStep';
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
    if (id && !isCharacterLoading && character && !character?.abilityScores)
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
    <Container sx={{ paddingBottom: '30px' }} data-testid="character-container">
      {character?.id && character.abilityScores ? (
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
              <Button size="small" onClick={handleNext}>
                <KeyboardArrowRight />
              </Button>
            }
            backButton={
              <Button size="small" onClick={handleBack}>
                <KeyboardArrowLeft />
              </Button>
            }
          />

          <Box display="flex" gap="15px" flexDirection="column" {...swipeHandlers}>
            {activeStep === 0 && <Stats character={character} />}
            {activeStep === 1 && <Characteristics character={character} />}
            {activeStep === 2 && <Equipments character={character} />}
            {activeStep === 3 && <Description character={character} />}
            {canCastSpells && activeStep === 4 && <SpellStep character={character} />}
          </Box>
        </Fragment>
      ) : (
        <CircularProgress size={24} data-testid="loading" />
      )}

      <Fab size="small" sx={{ ...button, ...fab }} disabled={true}>
        <Link to="points" state={{ characterId: id }} css={linkButton}>
          <EditRounded />
        </Link>
      </Fab>

      <Fab
        size="small"
        sx={{ ...button, ...fab, marginRight: 6 }}
        onClick={openNote}
        disabled={!character?.id}
        data-testid={`notes-${character?.id}`}
      >
        <EventNote />
      </Fab>
      {character && (
        <CharacterNotes isNoteOpen={isNoteOpen} closeNote={closeNote} character={character} />
      )}
    </Container>
  );
}
