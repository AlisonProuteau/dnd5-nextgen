import { useCallback, useState } from 'react';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, Box, ButtonBase, Typography } from '@mui/material';
import { useQueries } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { getFeature } from '@api/ressources';
import { blackList } from '@utils/character/characteristics.utils';
import { createQueryCombiner } from '@utils/query.utils';
import type { Feature } from '@representations/abilities/feature.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { UsageDisplay } from './UsageDisplay';

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
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const { data: features } = useQueries({
    queries:
      uniqBy(character.features, 'index')
        ?.filter(({ index }) => (useblackList ? !blackList.includes(index) : true))
        ?.map(({ index }) => ({
          queryKey: ['fetchFeature', character.version, index],
          queryFn: async () => await getFeature(character.version || 'Legacy', index),
          enabled: !!index
        })) || [],
    combine: useCallback(createQueryCombiner<Feature>(), [])
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
    combine: useCallback(createQueryCombiner<Feature>(), [])
  });

  const isExpanded = useCallback(
    (index: string) => expandedMap[index] ?? expanded,
    [expandedMap, expanded]
  );

  const toggleExpanded = (index: string) =>
    setExpandedMap((prev) => ({ ...prev, [index]: !isExpanded(index) }));

  return (
    features && (
      <Box paddingTop="15px" data-testid="features-section-content">
        {features.map((feature) => (
          <Accordion
            key={feature.index}
            expanded={isExpanded(feature.index)}
            data-testid={`feature-${feature.index}`}
          >
            <Box
              data-testid={`feature-name-${feature.index}`}
              display="flex"
              flexDirection="column"
              paddingTop="12px"
              paddingX="16px"
              sx={{ '&:has(.Mui-focusVisible)': { backgroundColor: 'action.focus' } }}
            >
              <UsageDisplay
                type="feature"
                character={character}
                resource={feature}
                fullFeatureList={features}
              />

              <ButtonBase
                disableRipple
                onClick={() => toggleExpanded(feature.index)}
                aria-expanded={isExpanded(feature.index)}
                aria-controls={`feature-details-${feature.index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  minHeight: '36px',
                  paddingBottom: '12px'
                }}
              >
                <Typography variant="inherit">{feature.name}</Typography>
                <ExpandMore
                  sx={{
                    transform: isExpanded(feature.index) ? 'rotate(180deg)' : 'none',
                    transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </ButtonBase>
            </Box>

            <AccordionDetails
              id={`feature-details-${feature.index}`}
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
