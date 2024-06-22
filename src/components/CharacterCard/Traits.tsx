import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { Fragment, useCallback, useEffect } from 'react';
import { getFeature, getTrait } from '../../api/ressources';
import type { Feature } from '../../representations/abilities/feature.representation';
import type { Trait } from '../../representations/abilities/trait.representation';
import type { Character } from './CharacterContainer';

// TODO: figure out what should be added to the character itself or queried or something
export function Traits({ character }: { character: Character }) {
  const { data: features } = useQueries({
    queries:
      character.features?.map(({ index }) => ({
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
      character.traits?.map(({ index }) => ({
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

  useEffect(() => {
    console.log('features', character.features);
    // console.log(features, traits);
  }, [features]);

  return (
    <Fragment>
      {features && (
        <Box paddingTop="15px">
          {features.map((feature) => (
            <Accordion key={feature.index}>
              {/* TODO: more feature data to display */}
              <AccordionSummary expandIcon={<ExpandMore />}>{feature.name}</AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>
                {/* TODO: fetch sub features/expertises ? */}
                {character.features
                  ?.find(({ index }) => index === feature.index)
                  ?.subfeatures?.map((s) => (
                    <Typography>{s.name}</Typography>
                  ))}
                {character.features
                  ?.find(({ index }) => index === feature.index)
                  ?.expertises?.map((e) => (
                    <Typography>{e.name}</Typography>
                  ))}
                {/* TODO: Improve display */}
                <Typography>{feature.desc}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      {traits && (
        <Box>
          {traits.map((trait) => (
            <Accordion key={trait.index}>
              <AccordionSummary expandIcon={<ExpandMore />}>{trait.name}</AccordionSummary>
              <AccordionDetails sx={{ textAlign: 'justify' }}>{trait.desc}</AccordionDetails>
              {/* TODO: more data to display */}
              {/* TODO: Should it be a race selection ? */}
            </Accordion>
          ))}
        </Box>
      )}
    </Fragment>
  );
}
