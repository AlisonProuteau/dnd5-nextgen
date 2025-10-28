import { getFeature } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { Feature } from '@representations/abilities/feature.representation';
import { DefaultRepresentation } from '@representations/common.representation';
import { Character } from '@representations/user.representation';
import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { useCallback } from 'react';
import { blackList } from './utils';

interface FeaturesDisplayProps {
  character: Partial<Character>;
  expanded?: boolean;
  useblackList?: boolean;
}

export function FeaturesDisplay({
  character,
  expanded = false,
  useblackList = true
}: FeaturesDisplayProps) {
  const { data: features } = useQueries({
    queries:
      uniqBy(character.features, 'index')
        ?.filter(({ index }) => (useblackList ? !blackList.includes(index) : true))
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
      uniqBy(
        character.features
          ?.filter(({ subfeatures }) => subfeatures)
          ?.flatMap(({ subfeatures }) => subfeatures as DefaultRepresentation[]),
        'index'
      )?.map(({ index }) => ({
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
      <Box paddingTop="15px" data-testid="features-section">
        {features.map((feature) => (
          <Accordion
            key={feature.index}
            defaultExpanded={expanded}
            data-testid={`feature-${feature.index}`}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              data-testid={`feature-name-${feature.index}`}
            >
              {feature.name}
            </AccordionSummary>
            <AccordionDetails
              sx={{ textAlign: 'justify' }}
              data-testid={`feature-details-${feature.index}`}
            >
              {character.features
                ?.find(({ index }) => index === feature.index)
                ?.expertises?.map((e) => (
                  <Typography
                    textTransform="capitalize"
                    key={e.index}
                    data-testid={`feature-expertise-${e.index}`}
                  >
                    {e.name}
                  </Typography>
                ))}
              {subfeatures.filter(({ parent }) => parent?.index === feature.index).length
                ? subfeatures
                    .filter(({ parent }) => parent?.index === feature.index)
                    ?.map((subfeature) => (
                      <Box
                        key={subfeature.index}
                        data-testid={`feature-subfeature-${subfeature.index}`}
                      >
                        <Typography data-testid={`feature-subfeature-name-${subfeature.index}`}>
                          {subfeature.name}
                        </Typography>
                        {subfeature.feature_specific?.invocations?.map((invoc) => (
                          <Typography
                            key={invoc.index}
                            data-testid={`feature-invocation-${invoc.index}`}
                          >
                            {invoc.name}
                          </Typography>
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
