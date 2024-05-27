import { CasinoOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { getAllAbilities, getClassInfo, getRaceInfo } from '../../api/ressources';
import { getCharacter } from '../../api/users';
import { useAuth } from '../../providers/AuthProvider';
import type { CharacterFormData } from '../CharacterCreation/CharacterCreation';
import { getAbilityPoints, randomInteger } from '../CharacterCreation/points_utils';
import { NumberInput } from '../shared/NumberInput';

interface PointsRecord {
  hitPoints: number;
  proficiencyBonus: number;
  scores: Record<string, number>;
}

type AbilityScoreMethod = 'set' | 'random' | 'point_cost';

export function CharacterPoints() {
  const [abilityScoreMethod, setAbilityScoreMethod] = useState<AbilityScoreMethod>();
  const [points, setPoints] = useState<PointsRecord>({
    hitPoints: 0,
    proficiencyBonus: 2,
    scores: {}
  });
  const user = useAuth();
  const { id } = useParams();

  const { data: character } = useQuery<CharacterFormData | undefined>(
    ['fetchCharacter', user?.uid, id],
    async () => {
      if (user?.uid && id) return await getCharacter(user.uid, id);
    },
    { enabled: !!user?.uid && !!id }
  );

  const { data: classInfo, isLoading: isClassLoading } = useQuery(
    ['fetchClassInfo', character?.class.index],
    async () => (character ? await getClassInfo(character.class.index) : undefined),
    { enabled: !!character }
  );

  const { data: raceInfo, isLoading: isRaceLoading } = useQuery(
    ['fetchRaceInfo', character?.race.index],
    async () => (character ? await getRaceInfo(character.race.index) : undefined),
    { enabled: character && !isClassLoading }
  );

  const { data: abilities, isLoading: isAbilitiesLoading } = useQuery(
    ['fetchAbilities'],
    async () => await getAllAbilities()
  );

  const setHitPoints = () => {
    if (classInfo?.hit_die)
      setPoints((current) => ({ ...current, hitPoints: randomInteger(1, classInfo.hit_die) }));
  };

  const setScore = (index: string, val?: number) => {
    let res = val;

    if (!res) {
      let values: number[] = [];

      for (let index = 0; index < 4; index++) {
        values = [...values, randomInteger(1, 6)];
      }

      values.sort().shift();
      res = values.reduce((total, current) => total + current, 0);
    }

    setPoints((current) => ({
      ...current,
      scores: { ...current.scores, [index]: res || 0 }
    }));
  };

  useEffect(() => {
    if (!isClassLoading) setHitPoints();
  }, [isClassLoading]);

  useEffect(() => {
    if (!isAbilitiesLoading) {
      if (abilityScoreMethod === 'random')
        abilities?.results.forEach(({ index }) => setScore(index));
      else if (abilityScoreMethod === 'point_cost')
        abilities?.results.forEach(({ index }) => setScore(index, 8));
      else setPoints((current) => ({ ...current, scores: {} }));
    }
  }, [isAbilitiesLoading, abilityScoreMethod]);

  useEffect(() => {
    const missing = {
      hit_die: classInfo?.hit_die,
      saving_throws: classInfo?.saving_throws,
      size: raceInfo?.size,
      size_description: raceInfo?.size_description
    };

    if (!isClassLoading && !isRaceLoading) console.warn('Missing data: ', missing);
  }, [isClassLoading, isRaceLoading]);

  return (
    character && (
      <Container sx={{ overflowX: 'clip' }}>
        <Box>Hello {character.name}</Box>

        {abilities?.results && (
          <Box>
            <Divider
              component="div"
              role="presentation"
              sx={{ paddingTop: '15px' }}
              variant="middle"
            >
              <Typography>Ability Score</Typography>
            </Divider>

            <Box display="flex" flexDirection="column" gap="15px" alignItems="center">
              <ButtonGroup variant="contained">
                <Button onClick={() => setAbilityScoreMethod('set')}>Simple</Button>
                <Button onClick={() => setAbilityScoreMethod('point_cost')}>Point Buy</Button>
                <Button onClick={() => setAbilityScoreMethod('random')}>Custom</Button>
              </ButtonGroup>

              {abilityScoreMethod && (
                <Fragment>
                  {abilityScoreMethod === 'set' &&
                    [15, 14, 13, 12, 10, 8].map((score) => (
                      <FormControl key={`score-${score}`} sx={{ display: 'flex', width: 150 }}>
                        <InputLabel htmlFor="ability">Points: {score}</InputLabel>
                        <Select
                          id={`ability-${score}`}
                          label={`Points: ${score}`}
                          onChange={(e) => setScore(e.target.value as string, score)}
                        >
                          {abilities.results.map((ability) => (
                            <MenuItem
                              key={ability.index}
                              value={ability.index}
                              disabled={!!points.scores[ability.index]}
                            >
                              {ability.full_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ))}
                  {abilityScoreMethod === 'point_cost' && (
                    <Fragment>
                      {abilities.results.map((ability) => (
                        <Box key={`ability-${ability.index}`} textAlign="center">
                          <NumberInput
                            id={`ability-${ability.index}`}
                            label={ability.full_name}
                            min={8}
                            max={15}
                            addDisabled={getAbilityPoints(points.scores) >= 27}
                            value={points.scores[ability.index] || 8}
                            onChange={(_, value) => setScore(ability.index, value)}
                          />
                        </Box>
                      ))}
                      <Typography marginTop="15px">
                        Remaining Points:
                        <Typography
                          color={getAbilityPoints(points.scores) > 27 ? 'red' : undefined}
                          display="inline"
                          paddingLeft="5px"
                        >
                          {27 - getAbilityPoints(points.scores)}
                        </Typography>
                      </Typography>
                    </Fragment>
                  )}
                  {abilityScoreMethod === 'random' &&
                    abilities.results.map((ability) => (
                      <Box
                        key={`ability-${ability.index}`}
                        display="flex"
                        justifyContent="center"
                        paddingLeft="50px"
                      >
                        <NumberInput
                          id={`ability-${ability.index}`}
                          label={ability.full_name}
                          value={points.scores[ability.index] || 0}
                          onChange={(_, value) => setScore(ability.index, value)}
                        />
                        <IconButton
                          sx={{ paddingTop: '29px' }}
                          onClick={() => setScore(ability.index)}
                        >
                          <CasinoOutlined fontSize="large" />
                        </IconButton>
                      </Box>
                    ))}
                </Fragment>
              )}
            </Box>
          </Box>
        )}

        {classInfo?.hit_die && (
          <Box>
            <Divider
              component="div"
              role="presentation"
              sx={{ paddingTop: '15px' }}
              variant="middle"
            >
              <Typography>Hit Points</Typography>
            </Divider>

            <Box display="flex" justifyContent="center" paddingLeft="50px">
              <NumberInput
                id="hit-points"
                min={1}
                max={classInfo?.hit_die}
                value={points.hitPoints}
                onChange={(_, value) =>
                  setPoints((current) => ({ ...current, hitPoints: value || 1 }))
                }
              />
              <IconButton onClick={setHitPoints}>
                <CasinoOutlined fontSize="large" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* TODO: Add validation + errors (ex: 27 total point cost) */}
        {/* TODO: Armor Class: 10 + his or her Dexterity modifier */}
        {/* TODO: Ability scores: Add race/character modifiers */}
        {/* TODO: Hit Points: Add constitution modifier */}
        {/* TODO: If your character wears armor, carries a shield, or both, calculate your AC using the rules in the Equipment section. */}
        {/* TODO: Calculate ability score modifier (see utils) */}
        <Button onClick={() => console.log(points)}>Display</Button>
      </Container>
    )
  );
}
