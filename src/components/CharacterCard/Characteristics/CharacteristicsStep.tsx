import { getFeature, getTrait } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Feature } from '@representations/abilities/feature.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { Fragment, useCallback } from 'react';
import { ActionInfo } from './ActionInfo';

export function Characteristics({ character }: { character: Character }) {
  const blackList: string[] = [
    'draconic-ancestry',
    'otherworldly-patron',
    'barbarian-unarmored-defense',
    'monk-unarmored-defense',
    'divine-domain',
    'bonus-proficiency',
    'dwarven-combat-training',
    'keen-senses',
    'elf-weapon-training',
    'extra-language',
    'menacing',
    'sorcerous-origin',
    'draconic-resilience',
    'otherworldly-patron',
    'tool-proficiency'
  ];

  const { data: features } = useQueries({
    queries:
      character.features
        ?.filter(({ index }) => !blackList.includes(index))
        ?.map(({ index }) => ({
          queryKey: ['fetchFeature', index],
          queryFn: async () => await getFeature(index),
          enabled: !!index
        })) || [],
    combine: useCallback((results: UseQueryResult<Feature | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as Feature[],
        isFetching: results.some((result) => result.isFetching)
      };
    }, [])
  });

  const { data: subfeatures } = useQueries({
    queries:
      character.features
        ?.filter(({ subfeatures }) => subfeatures)
        ?.flatMap(({ subfeatures }) => subfeatures as DefaultRepresentation[])
        ?.map(({ index }) => ({
          queryKey: ['fetchFeature', index],
          queryFn: async () => await getFeature(index),
          enabled: !!index
        })) || [],
    combine: useCallback((results: UseQueryResult<Feature | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as Feature[],
        isFetching: results.some((result) => result.isFetching)
      };
    }, [])
  });

  const { data: traits } = useQueries({
    queries:
      character.traits
        ?.filter(({ index }) => !blackList.includes(index))
        ?.map(({ index }) => ({
          queryKey: ['fetchTrait', index],
          queryFn: async () => await getTrait(index),
          enabled: !!index
        })) || [],
    combine: useCallback((results: UseQueryResult<Trait | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as Trait[],
        isFetching: results.some((result) => result.isFetching)
      };
    }, [])
  });

  const { data: subtraits } = useQueries({
    queries:
      character.traits
        ?.filter(({ subtraits }) => subtraits)
        ?.flatMap(({ subtraits }) => subtraits as DefaultRepresentation[])
        ?.map(({ index }) => ({
          queryKey: ['fetchTrait', index],
          queryFn: async () => await getTrait(index),
          enabled: !!index
        })) || [],
    combine: useCallback((results: UseQueryResult<Trait | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as Trait[],
        isFetching: results.some((result) => result.isFetching)
      };
    }, [])
  });

  return (
    <Fragment>
      <Box>
        <Typography variant="body2" color="lightgrey" display="inline" paddingRight="5px">
          Proficiencies:
        </Typography>
        <Typography display="inline">
          {character.proficiencies.map((p) => p.name).join(', ')}
        </Typography>
      </Box>
      <Box>
        <Typography variant="body2" color="lightgrey" display="inline" paddingRight="5px">
          Languages:{' '}
        </Typography>
        <Typography display="inline">
          {character.languages.map((language) => language.name).join(', ')}
        </Typography>
      </Box>

      {features && (
        <Box paddingTop="15px">
          {features.map((feature) => (
            <Accordion key={feature.index}>
              <AccordionSummary expandIcon={<ExpandMore />}>{feature.name}</AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                {character.features
                  ?.find(({ index }) => index === feature.index)
                  ?.expertises?.map((e) => (
                    <Typography textTransform="capitalize" key={e.index}>
                      {e.name}
                    </Typography>
                  ))}
                {subfeatures.filter(({ parent }) => parent?.index === feature.index).length
                  ? subfeatures
                      .filter(({ parent }) => parent?.index === feature.index)
                      ?.map((subfeature) => (
                        <Box key={subfeature.index}>
                          <Typography>{subfeature.name}</Typography>
                          {subfeature.feature_specific?.invocations?.map((invoc) => (
                            <Typography key={invoc.index}>{invoc.name}</Typography>
                          ))}
                          {subfeature.desc.map((d, i) => (
                            <Typography key={i}>{d}</Typography>
                          ))}
                        </Box>
                      ))
                  : feature.desc.map((s, i) => <Typography key={`desc-${i}`}>{s}</Typography>)}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      {traits && (
        <Box paddingTop="15px">
          {traits.map((trait) => (
            <Accordion key={trait.index}>
              <AccordionSummary expandIcon={<ExpandMore />}>{trait.name}</AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                {subtraits
                  .filter(({ trait_specific }) => trait_specific?.action?.index === trait.index)
                  .map(
                    ({ trait_specific }) =>
                      trait_specific?.action && (
                        <ActionInfo
                          key={trait_specific?.action.index}
                          action={trait_specific?.action}
                          charLevel={character.level}
                        />
                      )
                  )}
                {character.traits
                  ?.find(({ index }) => index === trait.index)
                  ?.spells?.map((s) => (
                    <Typography key={s.index}>{s.name}</Typography>
                  ))}
                {subtraits.filter(({ parent }) => parent?.index === trait.index).length
                  ? subtraits
                      .filter(({ parent }) => parent?.index === trait.index)
                      ?.map((subtrait) => (
                        <Box key={subtrait.index}>
                          <Typography>
                            {subtrait.name}
                            {subtrait.trait_specific?.damage_type?.name
                              ? ` - ${subtrait.trait_specific?.damage_type?.name}`
                              : ''}
                          </Typography>
                          {subtrait.trait_specific?.action &&
                          (subtrait.trait_specific?.action?.index === trait.index ||
                            !traits.find(
                              ({ index }) => index === subtrait.trait_specific?.action?.index
                            )) ? (
                            <Fragment>
                              <ActionInfo
                                action={subtrait.trait_specific?.action}
                                charLevel={character.level}
                              />
                              <Typography>{subtrait.trait_specific?.action.desc}</Typography>
                            </Fragment>
                          ) : (
                            subtrait.desc.map((d, i) => <Typography key={i}>{d}</Typography>)
                          )}
                        </Box>
                      ))
                  : trait.desc.map((s, i) => <Typography key={`desc-${i}`}>{s}</Typography>)}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Fragment>
  );
}
