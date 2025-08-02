import { getFeature } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { Feature } from '@representations/abilities/feature.representation';
import { DefaultRepresentation } from '@representations/common.representation';
import { Character } from '@representations/user.representation';
import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { useCallback } from 'react';
import { blackList } from './utils';

export function FeaturesDisplay({ character }: { character: Partial<Character> }) {
  const { data: features } = useQueries({
    queries:
      character.features
        ?.filter(({ index }) => !blackList.includes(index))
        ?.map(({ index }) => ({
          queryKey: ['fetchFeature', character.version, index],
          queryFn: async () => await getFeature(character.version || 'Legacy', index),
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
          queryKey: ['fetchFeature', character.version, index],
          queryFn: async () => await getFeature(character.version || 'Legacy', index),
          enabled: !!index
        })) || [],
    combine: useCallback((results: UseQueryResult<Feature | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as Feature[],
        isFetching: results.some((result) => result.isFetching)
      };
    }, [])
  });
  return (
    features && (
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
    )
  );
}
