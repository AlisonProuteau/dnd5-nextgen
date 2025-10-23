import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc } from 'firebase/firestore';
import { omit } from 'lodash';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { database } from 'src/firebase';
import { useAuth } from 'src/providers/AuthProvider';
import { Fragment, useEffect, useState } from 'react';
import { CasinoOutlined, SaveAltRounded } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Container,
  Divider,
  Fab,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { getAllAbilities, getClassInfo } from '@api/ressources';
import { getCharacter } from '@api/users';
import { NumberInput } from '@shared/NumberInput';
import { SplitButton } from '@shared/SplitButton';
import { randomInteger } from '@utils/calculations';
import { getAbilityPoints, getAbilityScoreModifier, getArmorClass } from '@utils/character';
import { button, fab, linkButton } from '@utils/ui';
import type { Classes } from '@representations/character/class.representation';

type AbilityScoreMethod = 'set' | 'random' | 'point_cost';

export function CharacterPoints() {
  const [abilityScoreMethod, setAbilityScoreMethod] = useState<AbilityScoreMethod>('random');
  const [points, setPoints] = useState<Record<string, number>>({});
  const [id, setId] = useState<string>();
  const { user, version } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: character } = useQuery({
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

  const { data: abilities, isLoading: isAbilitiesLoading } = useQuery({
    queryKey: ['fetchAbilities', version],
    queryFn: async () => (version ? (await getAllAbilities(version)).results : null),
    enabled: !!version
  });

  useEffect(() => setId(location.state?.characterId), [location.state?.characterId]);

  const setScore = (index: string, val?: number) => {
    let res = val;

    if (!res) {
      let values: number[] = [];

      for (let i = 0; i < 4; i++) {
        values = [...values, randomInteger(1, 6)];
      }

      values.sort().shift();
      res = values.reduce((total, current) => total + current, 0);
    }

    if (res !== points[index] || val !== undefined) {
      setPoints((current) => ({
        ...current,
        [index]: res || 0
      }));
    } else setScore(index);

    return;
  };

  useEffect(() => {
    if (!isAbilitiesLoading && !character?.abilityScores) {
      if (abilityScoreMethod === 'random') abilities?.forEach(({ index }) => setScore(index));
      else if (abilityScoreMethod === 'point_cost')
        abilities?.forEach(({ index }) => setScore(index, 8));
      else setPoints(() => ({}));
    }
  }, [isAbilitiesLoading, abilityScoreMethod]);

  const isValid =
    abilities?.every((ability) => points[ability.index]) &&
    (abilityScoreMethod !== 'point_cost' || getAbilityPoints(points) <= 27);

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
    > = character?.abilityScores || {};
    if (!character?.abilityScores)
      abilities?.forEach((ability) => {
        const raceModifier = character?.abilities.find(
          (bonusAbility) => bonusAbility.ability_score.index === ability.index
        );
        const finalScore = raceModifier
          ? points[ability.index] + raceModifier.bonus
          : points[ability.index];

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

    const hitPoints =
      (classInfo?.hit_die || 6) +
      formattedAbilities['con'].modifier +
      (character?.features?.some(({ index }) => index === 'draconic-resilience') ? 1 : 0);

    const formattedPoints = {
      hit_die: classInfo?.hit_die,
      hit_points: hitPoints,
      saving_throws: classInfo?.saving_throws,
      armorClass: getArmorClass(
        formattedAbilities['dex'].modifier,
        character?.equipments,
        character?.features,
        character?.class.index === 'monk'
          ? formattedAbilities['wis'].modifier
          : formattedAbilities['con'].modifier
      ),
      abilityScores: formattedAbilities
    };

    if (isValid && id && user?.uid) {
      const path = `users/${user.uid}/characters`;
      const document = doc(database, path, id);
      updateDoc(document, formattedPoints)
        .then(async () => {
          await queryClient.invalidateQueries({
            queryKey: ['fetchCharacter', user.uid, id]
          });
          navigate(`/character`, { state: { characterId: id } });
          toast.success('Character Points Updated');
        })
        .catch((error) =>
          toast.error(`Something went wrong
          ${(error as Error).message || 'Error'}`)
        );
    }
  };

  return character ? (
    <Container sx={{ overflowX: 'clip', paddingTop: '15px' }}>
      <Divider component="div" role="presentation" sx={{ paddingBottom: '30px' }} variant="middle">
        <Typography>Ability Scores</Typography>
      </Divider>

      <Box display="flex" flexDirection="column" gap="15px" alignItems="center">
        <Box display="flex" gap="5px">
          <Typography variant="subtitle2">Race Modifiers: </Typography>
          {character.abilities?.map((ability, i) => (
            <Typography key={`modifier-${ability.ability_score.index}`} variant="subtitle2">
              {`${i > 0 ? '; ' : ''}${ability.ability_score.name}: +${ability.bonus}`}
            </Typography>
          ))}
        </Box>

        {!character.abilityScores ? (
          <Fragment>
            <SplitButton
              variant="outlined"
              defaultValue="random"
              options={[
                { value: 'set', text: 'Simple' },
                { value: 'point_cost', text: 'Point Buy' },
                { value: 'random', text: 'Custom' }
              ]}
              onClick={(value) => setAbilityScoreMethod(value as AbilityScoreMethod)}
            />
            {abilities?.length ? (
              <Fragment>
                {abilityScoreMethod === 'set' &&
                  [15, 14, 13, 12, 10, 8].map((score) => (
                    <Box display="flex" key={`score-${score}`} alignItems="center">
                      <NumberInput id={`ability-${score}`} value={score} readOnly />
                      <FormControl sx={{ display: 'flex', width: 135 }}>
                        <Select
                          id={`ability-${score}`}
                          onChange={(e) => {
                            const previousAbility: string | undefined = Object.entries(points).find(
                              (value) => value[1] === score
                            )?.[0];
                            if (previousAbility)
                              setPoints((current) => omit(current, previousAbility));
                            setScore(e.target.value as string, score);
                          }}
                          sx={{ height: '42px' }}
                        >
                          {abilities.map((ability) => (
                            <MenuItem
                              key={`points-${ability.index}`}
                              value={ability.index}
                              disabled={!!points[ability.index]}
                            >
                              {ability.full_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
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
                          addDisabled={getAbilityPoints(points) >= 27}
                          value={points[ability.index] || 8}
                          onChange={(_, value) => setScore(ability.index, value ?? undefined)}
                        />
                      </Box>
                    ))}

                    <Box display="flex">
                      <Typography>Remaining Points:</Typography>
                      <Typography
                        color={getAbilityPoints(points) > 27 ? 'red' : undefined}
                        display="inline"
                        paddingLeft="5px"
                      >
                        {27 - getAbilityPoints(points)}
                      </Typography>
                    </Box>
                  </Fragment>
                )}
                {abilityScoreMethod === 'random' &&
                  abilities.map((ability) => (
                    <Box
                      key={`ability-${ability.index}`}
                      display="flex"
                      justifyContent="center"
                      marginRight="-50px"
                    >
                      <NumberInput
                        id={`ability-${ability.index}`}
                        label={ability.full_name}
                        value={points[ability.index] || 0}
                        onChange={(_, value) => setScore(ability.index, value ?? undefined)}
                      />
                      <IconButton
                        data-testid={`randomize-${ability.index}`}
                        sx={{ paddingTop: '29px' }}
                        onClick={() => setScore(ability.index)}
                      >
                        <CasinoOutlined fontSize="large" />
                      </IconButton>
                    </Box>
                  ))}
              </Fragment>
            ) : (
              <CircularProgress size={24} />
            )}
          </Fragment>
        ) : (
          <Typography>Points already calculated</Typography>
        )}

        <Fab size="small" sx={{ ...button, ...fab }} disabled={!isValid} onClick={onSubmit}>
          <SaveAltRounded sx={linkButton} />
        </Fab>
      </Box>
    </Container>
  ) : (
    <CircularProgress size={24} />
  );
}
