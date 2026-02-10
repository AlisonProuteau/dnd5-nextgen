import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CasinoOutlined, SaveAltRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Divider,
  Fab,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { isEqual, omit, omitBy, uniqBy } from 'lodash';
import { getAllAbilities, getClassInfo, getEquipment, getMagicItem } from '@api/ressources';
import { getCharacter } from '@api/users';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { FullPageLoader, Loader } from '@shared/Loader';
import { NumberInput } from '@shared/NumberInput';
import { SplitButton } from '@shared/SplitButton';
import { randomInteger } from '@utils/calculations';
import { formatEquipmentForDisplay, formatPointsForDB, getAbilityPoints } from '@utils/character';
import { button, fab, linkButton } from '@utils/ui';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type { Equipment } from '@representations/campaign/equipment.representation';
import type { Classes } from '@representations/character/class.representation';
import type { AbilityScoreMethod } from '@representations/user.representation';
import { useAuth } from 'src/providers/AuthProvider';

export function CharacterPoints({
  characterId,
  onSave,
  redirect = true
}: {
  characterId?: string;
  onSave?: () => void;
  redirect?: boolean;
}) {
  const [abilityScoreMethod, setAbilityScoreMethod] = useState<AbilityScoreMethod>();
  const [points, setPoints] = useState<Record<string, number>>({});
  const [id, setId] = useState<string>();
  const { user, version } = useAuth();
  const location = useLocation();

  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', id ?? ''],
    successMessages: { update: 'Character Points Updated' },
    redirect: redirect ? { update: { path: '/character', state: { characterId: id } } } : undefined
  });

  const { data: character, isLoading: isCharacterLoading } = useQuery({
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

  const { data: equipmentList } = useQueries({
    queries:
      uniqBy(character?.equipments, 'index')?.map(({ index }) => ({
        queryKey: ['fetchEquipment', character?.version, index],
        queryFn: async () => {
          let item: Equipment | MagicItem | null = await getEquipment(
            character?.version || 'Legacy',
            index
          );
          if (!item) {
            item = await getMagicItem(character?.version || 'Legacy', index);
          }

          return item;
        },
        enabled: !!index && !!character
      })) || [],
    combine: useCallback(
      (results: UseQueryResult<Equipment | MagicItem | null, Error>[]) => ({
        data: formatEquipmentForDisplay(
          results.map(({ data }) => data).filter(Boolean) as (Equipment | MagicItem)[],
          character?.equipments || []
        ),
        isFetching: results.some((result) => result.isFetching)
      }),
      [character?.equipments]
    )
  });

  useEffect(
    () => setId(characterId ?? location.state?.characterId),
    [characterId, location.state?.characterId]
  );

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

  const characterMappedScores = useMemo(() => {
    if (!character?.abilityScores) return {};

    const updatedPoints: Record<string, number> = {};
    Object.values(character.abilityScores).forEach(({ index, score }) => {
      const raceModifier = character?.abilities.find(
        (bonusAbility) => bonusAbility.ability_score.index === index
      );
      const modifiedScore = raceModifier ? score - raceModifier.bonus : score;
      updatedPoints[index] =
        character?.abilityScoreMethod === 'point_cost'
          ? Math.max(8, Math.min(15, modifiedScore))
          : modifiedScore;
    });
    return updatedPoints;
  }, [character?.abilityScores, character?.abilities, character?.abilityScoreMethod]);

  useEffect(() => {
    if (character)
      setAbilityScoreMethod(
        Object.values(character.abilityScores || {}).length
          ? character?.abilityScoreMethod || 'random'
          : 'point_cost'
      );
  }, [character]);

  useLayoutEffect(() => {
    const isPointsDefined = Object.values(points).length > 0;
    const isCharacterPointsDefined = Object.values(characterMappedScores).length > 0;

    if (
      isAbilitiesLoading ||
      isCharacterLoading ||
      !abilityScoreMethod ||
      (Object.values(character?.abilityScores || {}).length && !isCharacterPointsDefined)
    )
      return;

    if (
      abilityScoreMethod === 'set' &&
      (character?.abilityScoreMethod !== 'set' ||
        (isPointsDefined && !isEqual(characterMappedScores, points)))
    ) {
      setPoints(() => ({}));
      return;
    }

    if (!isPointsDefined && abilityScoreMethod === (character?.abilityScoreMethod ?? 'random')) {
      setPoints((currentPoints) => {
        const updatedPoints: Record<string, number> = {};
        Object.entries(
          abilityScoreMethod !== 'set'
            ? currentPoints
            : omitBy(currentPoints, (value) => [15, 14, 13, 12, 10, 8].includes(value))
        ).forEach(([index, score]) => {
          updatedPoints[index] =
            abilityScoreMethod === 'point_cost' ? Math.max(8, Math.min(15, score)) : score;
        });
        return { ...characterMappedScores, ...updatedPoints };
      });
    } else if (!isPointsDefined || Object.values(points).every((score) => score === 8)) {
      if (abilityScoreMethod === 'random') abilities?.forEach(({ index }) => setScore(index));
      else if (abilityScoreMethod === 'point_cost')
        abilities?.forEach(({ index }) => setScore(index, 8));
    } else {
      setPoints((currentPoints) => {
        const updatedPoints: Record<string, number> = {};

        Object.entries(currentPoints).forEach(([index, score]) => {
          updatedPoints[index] =
            abilityScoreMethod === 'point_cost' ? Math.max(8, Math.min(15, score)) : score;
        });
        return updatedPoints;
      });
    }
  }, [
    isAbilitiesLoading,
    isCharacterLoading,
    abilityScoreMethod,
    character?.abilityScoreMethod,
    character?.abilityScores,
    characterMappedScores
  ]);

  const isValid =
    abilities?.every((ability) => points[ability.index]) &&
    (abilityScoreMethod !== 'point_cost' || getAbilityPoints(points) <= 27);

  const onSubmit = async () => {
    if (!character) return;

    if (isValid && id && user?.uid) {
      const formattedPoints = formatPointsForDB(
        character,
        points,
        abilities,
        classInfo,
        equipmentList || []
      );

      await firebaseCrud.update(id, { ...formattedPoints, abilityScoreMethod });
      onSave?.();
    }
  };

  return (
    <Container sx={{ overflowX: 'clip', paddingTop: '15px' }}>
      <Divider component="div" role="presentation" sx={{ paddingBottom: '30px' }} variant="middle">
        <Typography>Ability Scores</Typography>
      </Divider>

      <Box
        display="flex"
        flexDirection="column"
        gap="15px"
        alignItems="center"
        minHeight={redirect ? '80vh' : '100%'}
      >
        <Box display="flex" gap="5px">
          <Typography variant="subtitle2">Race Modifiers: </Typography>
          {character?.abilities?.map((ability, i) => (
            <Typography key={`modifier-${ability.ability_score.index}`} variant="subtitle2">
              {`${i > 0 ? '; ' : ''}${ability.ability_score.name}: +${ability.bonus}`}
            </Typography>
          ))}
        </Box>

        <SplitButton
          variant="outlined"
          defaultValue={abilityScoreMethod}
          options={[
            { value: 'set', text: 'Simple' },
            { value: 'point_cost', text: 'Point Buy' },
            { value: 'random', text: 'Custom' }
          ]}
          onClick={(value) => setAbilityScoreMethod(value as AbilityScoreMethod)}
        />
        {!isCharacterLoading && !isAbilitiesLoading && abilities?.length && abilityScoreMethod ? (
          <Fragment>
            {abilityScoreMethod === 'set' &&
              [15, 14, 13, 12, 10, 8].map((score) => (
                <Box display="flex" key={`score-${score}`} alignItems="center">
                  <NumberInput id={`ability-${score}`} value={score} readOnly />
                  <FormControl sx={{ display: 'flex', width: 135 }}>
                    <Select
                      id={`ability-${score}-value`}
                      onChange={(e) => {
                        const previousAbility: string | undefined = Object.entries(points).find(
                          (value) => value[1] === score
                        )?.[0];
                        if (previousAbility) setPoints((current) => omit(current, previousAbility));
                        setScore(e.target.value as string, score);
                      }}
                      value={Object.keys(points).find((key) => points[key] === score) ?? ''}
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
                    data-testid={`reroll-${ability.index}`}
                    sx={{ paddingTop: '29px' }}
                    onClick={() => setScore(ability.index)}
                  >
                    <CasinoOutlined fontSize="large" />
                  </IconButton>
                </Box>
              ))}
          </Fragment>
        ) : (
          <Loader />
        )}

        {redirect ? (
          <Fab
            size="small"
            sx={{ ...button, ...fab }}
            disabled={!isValid}
            onClick={onSubmit}
            data-testid="save-scores-fab"
          >
            <SaveAltRounded sx={linkButton} />
          </Fab>
        ) : (
          <Button
            id="save-scores"
            disabled={!isValid || firebaseCrud.isLoading}
            onClick={onSubmit}
            data-testid="save-scores"
            sx={{ alignSelf: 'flex-end' }}
          >
            Save
          </Button>
        )}
      </Box>

      <FullPageLoader open={!character || firebaseCrud.isLoading} />
    </Container>
  );
}
