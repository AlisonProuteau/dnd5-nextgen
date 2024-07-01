import { getFeature, getTrait } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Feature } from '@representations/abilities/feature.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { Character } from '@representations/user.representation';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { Fragment, useCallback } from 'react';

export function Characteristics({ character }: { character: Character }) {
  // TODO: finish blacklist for all races/classes
  // Fix: Handle missed use cases
  const blackList: string[] = [
    'barbarian-unarmored-defense',
    'monk-unarmored-defense',
    'draconic-ancestry',
    'divine-domain',
    'bonus-proficiency',
    'dwarven-combat-training',
    'keen-senses',
    'elf-weapon-training',
    'high-elf-cantrip',
    'extra-language',
    'menacing',
    'sorcerous-origin',
    'draconic-resilience',
    'otherworldly-patron'
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

  // TODO: Improve display
  return (
    <Fragment>
      {features && (
        <Box paddingTop="15px">
          <Typography>
            Proficiencies: {character.proficiencies.map((p) => p.name).join(', ')}
          </Typography>
          <Typography>
            Languages: {character.languages.map((language) => language.name).join(', ')}
          </Typography>
          {features.map((feature) => (
            <Accordion
              key={feature.index}
              onChange={(_, exp) => exp && console.log(feature.name, feature)}
            >
              {/* TODO: more feature data to display */}
              <AccordionSummary expandIcon={<ExpandMore />}>{feature.name}</AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                {/* TODO: fetch sub features/expertises ? */}
                {character.features
                  ?.find(({ index }) => index === feature.index)
                  ?.subfeatures?.map((s) => (
                    <Typography key={s.index}>{s.name}</Typography>
                  ))}
                {character.features
                  ?.find(({ index }) => index === feature.index)
                  ?.expertises?.map((e) => (
                    <Typography key={e.index}>{e.name}</Typography>
                  ))}
                {feature.desc.map((s, i) => (
                  <Typography key={`desc-${i}`}>{s}</Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      {traits && (
        <Box>
          {traits.map((trait) => (
            <Accordion
              key={trait.index}
              onChange={(_, exp) => exp && console.log(trait.name, trait)}
            >
              {/* TODO: more trait data to display */}
              <AccordionSummary expandIcon={<ExpandMore />}>{trait.name}</AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                {/* TODO: fetch sub traits ? */}
                {character.traits
                  ?.find(({ index }) => index === trait.index)
                  ?.subtraits?.map((s) => (
                    <Typography key={s.index}>{s.name}</Typography>
                  ))}
                {character.traits
                  ?.find(({ index }) => index === trait.index)
                  ?.spells?.map((s) => (
                    <Typography key={s.index}>{s.name}</Typography>
                  ))}
                {trait.desc.map((s, i) => (
                  <Typography key={`desc-${i}`}>{s}</Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Fragment>
  );
}
