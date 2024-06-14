import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  MobileStepper,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getAllAbilities,
  getClassInfo,
  getRaceInfo,
  getSubclassInfo,
  getSubraceInfo
} from '../../api/ressources';
import { getCharacter } from '../../api/users';
import { useAuth } from '../../providers/AuthProvider';
import type { Level } from '../../representations/campaign/level.representation';
import type { Classes, Subclass } from '../../representations/character/class.representation';
import type { DefaultRepresentation } from '../../representations/common.representation';
import type { CharacterFormData } from '../CharacterCreation/CharacterCreation';
import { AbilityComponent } from './AbilityComponent';

export type Character = CharacterFormData & {
  id: string;
  hit_die: number;
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

const stepsNumber = 4;
export function CharacterContainer() {
  const user = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [id, setId] = useState<string>();
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

  const { data: abilities } = useQuery({
    queryKey: ['fetchAbilities'],
    queryFn: async () => (await getAllAbilities()).results
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
      console.log(character);
      console.log(abilities);
    }
  }, [classInfo, subClassInfo, levelInfo, raceInfo, subraceInfo]);

  useEffect(() => setId(location.state?.characterId), [location.state?.characterId]);

  useEffect(() => {
    if (id && !isCharacterLoading && !character?.abilityScores)
      navigate('points', { replace: true, state: { characterId: id } });
  }, [isCharacterLoading, id]);

  const handleNext = () =>
    setActiveStep((prevActiveStep) => (prevActiveStep < stepsNumber - 1 ? prevActiveStep + 1 : 0));
  const handleBack = () =>
    setActiveStep((prevActiveStep) => (prevActiveStep > 0 ? prevActiveStep - 1 : stepsNumber - 1));

  const getPageTitle = () => {
    switch (activeStep) {
      case 0:
        return 'Characteristics & Abilities';
      case 1:
        return 'Equipments & Inventory';
      case 2:
        return 'Spells';
      case 3:
        return 'Character Description';
    }
  };

  return (
    <Container>
      {character?.id ? (
        <Fragment>
          <Divider component="div" role="presentation" variant="middle">
            <Typography variant="subtitle2">{getPageTitle()}</Typography>
          </Divider>

          <MobileStepper
            variant="dots"
            steps={stepsNumber}
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

          {activeStep === 0 && (
            <Box display="flex" gap="15px" flexWrap="wrap">
              <Box flexBasis="45%">
                <Typography>Name: {character.name}</Typography>
                <Typography>
                  {'Race: '}
                  {character.race.name +
                    (character.subrace?.name ? ' - ' + character.subrace?.name : '')}
                </Typography>
                <Typography>
                  {'Class: '}
                  {character.class.name +
                    (character.subclass?.name ? ' - ' + character.subclass?.name : '')}
                </Typography>
                <Typography>Level: 1</Typography>
                <Typography>XP: 0</Typography>
              </Box>

              <Box flexBasis="45%">
                <Typography>Hit Points: {character.hit_die}</Typography>
                <Typography>Armor: {character.armorClass}</Typography>
                <Typography>Speed: {character.speed}</Typography>
              </Box>

              <Box>
                <Typography>Proficiency Bonus: {character.proficiencyBonus} </Typography>
                <Typography>
                  Saving Throws: {character.saving_throws?.map((ability) => ability.name + ' ')}
                </Typography>
                {abilities?.map((ability) => (
                  <AbilityComponent
                    ability={ability}
                    skills={character.skills}
                    score={character.abilityScores[ability.index].score}
                    modifier={character.abilityScores[ability.index].modifier}
                  />
                ))}
              </Box>
            </Box>
          )}
          {activeStep === 1 && <Box>Equipment</Box>}
          {activeStep === 2 && <Box>Spells if spellcaster</Box>}
          {activeStep === 3 && <Box>Character Description</Box>}
        </Fragment>
      ) : (
        <CircularProgress size={24} />
      )}
    </Container>
  );
}
