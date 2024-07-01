import { getClassInfo, getRaceInfo, getSubclassInfo, getSubraceInfo } from '@api/ressources';
import { getCharacter } from '@api/users';
import { EditRounded, KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
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
import type { Level } from '@representations/campaign/level.representation';
import type { Classes, Subclass } from '@representations/character/class.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { useQuery } from '@tanstack/react-query';
import { button, fab, linkButton } from '@utils/style.utils';
import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { useAuth } from '../../providers/AuthProvider';
import type { CharacterFormData } from '../CharacterCreation/CharacterCreation';
import { Characteristics } from './Characteristics/CharacteristicsStep';
import { Description } from './Description/DescriptionStep';
import { Equipments } from './Equipment/EquipmentsStep';
import { Spells } from './Spells/SpellsStep';
import { Stats } from './Stats/StatsStep';

export type Character = CharacterFormData & {
  id: string;
  hit_die: number;
  hit_points: number;
  saving_throws?: DefaultRepresentation[];
  armorClass: number;
  abilityScores: Record<
    string,
    {
      index: string;
      name: string;
      full_name: string;
      score: number;
      modifier: number;
    }
  >;
};

export function CharacterContainer() {
  const user = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [id, setId] = useState<string>();
  const [steps, setSteps] = useState(3);
  const [activeStep, setActiveStep] = useState(0);

  const { data: character, isFetching: isCharacterLoading } = useQuery<Character | undefined>({
    queryKey: ['fetchCharacter', user?.uid, id],
    queryFn: async () => {
      if (user?.uid && id) return await getCharacter(user.uid, id);
    },
    enabled: !!user?.uid && !!id
  });

  const { data: classInfo } = useQuery({
    queryKey: ['fetchClassInfo', character?.class.index],
    queryFn: async () =>
      character ? ((await getClassInfo(character.class.index)) as Classes | null) : null,
    enabled: !!character
  });

  const { data: subClassInfo } = useQuery({
    queryKey: ['fetchSubclassInfo', character?.class.index, character?.subclass?.index],
    queryFn: async () =>
      character?.class?.index && character?.subclass?.index
        ? ((await getSubclassInfo(
            character.class.index,
            character.subclass.index
          )) as Subclass | null)
        : null,
    enabled: !!character?.class.index && !!character.subclass?.index
  });

  const { data: levelInfo } = useQuery({
    queryKey: ['fetchClassInfoLevel', character?.class?.index, character?.subclass?.index, 1],
    queryFn: async () => {
      if (!character?.class?.index) return null;
      let levelRes: Partial<Level> = {};

      const classRes = (await getClassInfo(character.class.index, 1)) as Level | null;
      if (classRes) levelRes = { ...classRes };

      if (character.subclass?.index) {
        const subclassRes = (await getSubclassInfo(
          character.class.index,
          character.subclass.index,
          1
        )) as Level | null;

        if (subclassRes) levelRes = { ...levelRes, ...subclassRes };
      }

      return Object.keys(levelRes).length ? (levelRes as Level) : null;
    },
    enabled: !!character?.class.index
  });

  const { data: raceInfo } = useQuery({
    queryKey: ['fetchRaceInfo', character?.race?.index],
    queryFn: async () => (character?.race?.index ? await getRaceInfo(character?.race.index) : null),
    enabled: !!character?.race?.index
  });

  const { data: subraceInfo } = useQuery({
    queryKey: ['fetchSubraceInfo', character?.race?.index, character?.subrace?.index],
    queryFn: async () =>
      character?.race?.index && character?.subrace?.index
        ? await getSubraceInfo(character?.race.index, character?.subrace.index)
        : null,
    enabled: !!character?.race?.index
  });

  // TODO: Remove after removing unused fetch
  useEffect(() => {
    if (
      classInfo &&
      raceInfo &&
      levelInfo &&
      (!character?.subclass || subClassInfo) &&
      (!character?.subrace || subraceInfo)
    ) {
      // console.log('Class: ', classInfo, 'SubClass: ', subClassInfo);
      // console.log('Race: ', raceInfo, 'SubRace: ', subraceInfo);
      // console.log('Level Info: ', levelInfo);
      // console.log(character);
    }
  }, [classInfo, subClassInfo, levelInfo, raceInfo, subraceInfo]);

  useEffect(() => setId(location.state?.characterId), [location.state?.characterId]);

  useEffect(() => {
    if (id && !isCharacterLoading && !character?.abilityScores)
      navigate('points', { replace: true, state: { characterId: id } });
  }, [isCharacterLoading, id]);

  useEffect(() => {
    setSteps(classInfo?.spellcasting ? 5 : 4);
    setActiveStep(0);
  }, [!!classInfo?.spellcasting]);

  const handleNext = () =>
    setActiveStep((prevActiveStep) => (prevActiveStep < steps - 1 ? prevActiveStep + 1 : 0));
  const handleBack = () =>
    setActiveStep((prevActiveStep) => (prevActiveStep > 0 ? prevActiveStep - 1 : steps - 1));

  const getPageTitle = () => {
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
  };

  const swipeHandlers = useSwipeable({
    onSwiped: (eventData) => console.log('User Swiped!', eventData),
    onSwipedLeft: handleNext,
    onSwipedRight: handleBack
    // TODO: add more configs
  });

  return (
    <Container sx={{ paddingBottom: '30px' }}>
      {character?.id && character.abilityScores ? (
        <Fragment>
          <Box display="flex" justifyContent="space-between" alignItems="baseline">
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
                Level: 1
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                XP: 0
              </Typography>
            </Box>
          </Box>

          <Divider component="div" role="presentation" variant="middle">
            <Typography variant="subtitle2">{getPageTitle()}</Typography>
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
            {(classInfo?.spellcasting || subClassInfo?.spells || levelInfo?.spellcasting) &&
              activeStep === 4 && <Spells character={character} />}
          </Box>
        </Fragment>
      ) : (
        <CircularProgress size={24} />
      )}

      <Fab size="small" sx={{ ...button, ...fab }} disabled={true}>
        <Link to="points" state={{ characterId: id }} css={linkButton}>
          <EditRounded />
        </Link>
      </Fab>
    </Container>
  );
}
