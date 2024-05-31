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
import { useQuery } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAllAbilities, getClassInfo, getRaceInfo } from '../../api/ressources';
import { getCharacter } from '../../api/users';
import { useAuth } from '../../providers/AuthProvider';
import type { Level } from '../../representations/campaign/level.representation';
import type { Classes } from '../../representations/character/class.representation';
import { NumberInput } from '../shared/NumberInput';
import {
  getAbilityPoints,
  getAbilityScoreModifier,
  getArmorClass,
  randomInteger
} from './points_utils';

interface PointsRecord {
  hitPoints: number;
  proficiencyBonus: number;
  scores: Record<string, number>;
}

type AbilityScoreMethod = 'set' | 'random' | 'point_cost';

// TODO: Improve display
// TODO: Go through DB, rules and features (class + race)
export function CharacterPoints() {
  const [abilityScoreMethod, setAbilityScoreMethod] = useState<AbilityScoreMethod>();
  const [points, setPoints] = useState<PointsRecord>({
    hitPoints: 0,
    proficiencyBonus: 2,
    scores: {}
  });
  const user = useAuth();
  const { id } = useParams();

  const { data: character } = useQuery({
    queryKey: ['fetchCharacter', user?.uid, id],
    queryFn: async () => (user?.uid && id ? await getCharacter(user.uid, id) : null),
    enabled: !!user?.uid && !!id
  });

  const { data: classInfo, isLoading: isClassLoading } = useQuery({
    queryKey: ['fetchClassInfo', character?.class.index],
    queryFn: async () =>
      character ? ((await getClassInfo(character.class.index)) as Classes | null) : null,
    enabled: !!character
  });
  const { data: classInfoLevel } = useQuery({
    queryKey: ['fetchClassInfoLevel', character?.class.index, 1],
    queryFn: async () =>
      character ? ((await getClassInfo(character.class.index, 1)) as Level | null) : null,
    enabled: !!character
  });

  const { data: raceInfo, isLoading: isRaceLoading } = useQuery({
    queryKey: ['fetchRaceInfo', character?.race.index],
    queryFn: async () => (character ? await getRaceInfo(character.race.index) : null),
    enabled: !!character && !isClassLoading
  });

  const { data: abilities, isLoading: isAbilitiesLoading } = useQuery({
    queryKey: ['fetchAbilities'],
    queryFn: async () => (await getAllAbilities()).results
  });

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
      if (abilityScoreMethod === 'random') abilities?.forEach(({ index }) => setScore(index));
      else if (abilityScoreMethod === 'point_cost')
        abilities?.forEach(({ index }) => setScore(index, 8));
      else setPoints((current) => ({ ...current, scores: {} }));
    }
  }, [isAbilitiesLoading, abilityScoreMethod]);

  useEffect(() => {
    const missing = {
      size: raceInfo?.size,
      size_description: raceInfo?.size_description
    };

    if (!isClassLoading && !isRaceLoading) console.warn('Missing data: ', missing, classInfoLevel);
  }, [isClassLoading, isRaceLoading]);

  const isValid =
    points.hitPoints &&
    points.proficiencyBonus &&
    abilities?.every((ability) => points.scores[ability.index]) &&
    (abilityScoreMethod !== 'point_cost' || getAbilityPoints(points.scores) <= 27);

  // TODO: Add to DB and test
  const onSubmit = () => {
    let formattedAbilities: Record<
      string,
      {
        index: string;
        name: string;
        full_name: string;
        score: number;
        modifier: number;
      }
    > = {};
    abilities?.forEach((ability) => {
      const raceModifier = character?.abilities.find(
        (bonusAbility) => bonusAbility.ability_score.index === ability.index
      );
      const finalScore = raceModifier
        ? points.scores[ability.index] + raceModifier.bonus
        : points.scores[ability.index];

      formattedAbilities = {
        ...formattedAbilities,
        [ability.index]: {
          index: ability.index,
          name: ability.name,
          full_name: ability.full_name,
          score: finalScore,
          modifier: getAbilityScoreModifier(finalScore)
        }
      };
    });

    const formattedPoints = {
      hit_die: classInfo?.hit_die,
      saving_throws: classInfo?.saving_throws,
      hitPoints: points.hitPoints + formattedAbilities['con'].modifier,
      armorClass: getArmorClass(
        formattedAbilities['dex'].modifier,
        character?.equipments,
        classInfoLevel?.features,
        character?.class.index === 'monk'
          ? formattedAbilities['wis'].modifier
          : formattedAbilities['con'].modifier
      ),
      proficiencyBonus: points.proficiencyBonus,
      abilities: formattedAbilities
    };

    if (isValid) console.log(formattedPoints);
  };

  return (
    character && (
      <Container sx={{ overflowX: 'clip' }}>
        <Box>Hello {character.name}</Box>

        {abilities && (
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
                          {abilities.map((ability) => (
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
                      {abilities.map((ability) => (
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
                    abilities.map((ability) => (
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

              <Box marginTop="15px">
                <Typography paddingLeft="5px">Race Modifiers</Typography>
                {character.abilities.map((ability, i) => (
                  <Typography
                    key={`modifier-${ability.ability_score.index}`}
                    display="inline"
                    paddingLeft="5px"
                  >
                    {`${i > 0 ? '; ' : ''}${ability.ability_score.name}: +${ability.bonus}`}
                  </Typography>
                ))}
              </Box>
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

        <Button disabled={!isValid} onClick={onSubmit}>
          Save
        </Button>
      </Container>
    )
  );
}
