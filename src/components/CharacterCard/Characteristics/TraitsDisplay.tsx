import { Fragment, useCallback, useState } from 'react';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, Box, ButtonBase, Typography } from '@mui/material';
import { useQueries } from '@tanstack/react-query';
import { uniq, uniqBy } from 'lodash';
import { getFeature, getTrait } from '@api/ressources';
import { blackList } from '@utils/character/characteristics.utils';
import { getRelatedFeatures } from '@utils/index';
import { createQueryCombiner } from '@utils/query.utils';
import { Feature } from '@representations/abilities/feature.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { ActionInfo } from './ActionInfo';
import { UsageDisplay } from './UsageDisplay';

interface TraitsDisplayProps {
  character: Partial<Character>;
  expanded?: boolean;
  useblackList?: boolean;
}

export function TraitsDisplay({
  character,
  expanded = false,
  useblackList = true
}: TraitsDisplayProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const { data: traits } = useQueries({
    queries:
      uniqBy(character.traits, 'index')
        ?.filter(({ index }) => (useblackList ? !blackList.includes(index) : true))
        ?.map(({ index }) => ({
          queryKey: ['fetchTrait', character.version, index],
          queryFn: async () => await getTrait(character.version || 'Legacy', index),
          enabled: !!index
        })) || [],
    combine: useCallback(createQueryCombiner<Trait>(), [])
  });

  const { data: subtraits } = useQueries({
    queries:
      uniqBy(
        character.traits
          ?.filter(({ subtraits }) => subtraits)
          ?.flatMap(({ subtraits }) => subtraits as DefaultRepresentation[]),
        'index'
      )?.map(({ index }) => ({
        queryKey: ['fetchTrait', character.version, index],
        queryFn: async () => await getTrait(character.version || 'Legacy', index),
        enabled: !!index
      })) || [],
    combine: useCallback(createQueryCombiner<Trait>(), [])
  });

  const { data: features } = useQueries({
    queries:
      uniq(getRelatedFeatures(traits))
        ?.filter((index) => (useblackList ? !blackList.includes(index) : true))
        ?.map((index) => ({
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
    traits && (
      <Box paddingTop="15px" data-testid="traits-section-content">
        {traits.map((trait) => (
          <Accordion
            key={trait.index}
            expanded={isExpanded(trait.index)}
            data-testid={`trait-${trait.index}`}
          >
            <Box
              data-testid={`trait-name-${trait.index}`}
              display="flex"
              flexDirection="column"
              paddingTop="12px"
              paddingX="16px"
              sx={{ '&:has(.Mui-focusVisible)': { backgroundColor: 'action.focus' } }}
            >
              <UsageDisplay
                type="trait"
                character={character}
                resource={trait}
                fullFeatureList={features}
              />
              <ButtonBase
                disableRipple
                onClick={() => toggleExpanded(trait.index)}
                aria-expanded={isExpanded(trait.index)}
                aria-controls={`trait-details-${trait.index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  minHeight: '36px',
                  paddingBottom: '12px'
                }}
              >
                <Typography variant="inherit">{trait.name}</Typography>
                <ExpandMore
                  sx={{
                    transform: isExpanded(trait.index) ? 'rotate(180deg)' : 'none',
                    transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </ButtonBase>
            </Box>
            <AccordionDetails
              id={`trait-details-${trait.index}`}
              sx={{ textAlign: 'justify' }}
              data-testid={`trait-details-${trait.index}`}
            >
              {subtraits
                .filter(({ trait_specific }) => trait_specific?.action?.index === trait.index)
                .map(
                  ({ trait_specific }) =>
                    trait_specific?.action && (
                      <ActionInfo
                        key={trait_specific?.action.index}
                        action={trait_specific?.action}
                        charLevel={character.level || 1}
                        data-testid={`trait-action-${trait_specific?.action.index}`}
                      />
                    )
                )}
              {character.traits
                ?.find(({ index }) => index === trait.index)
                ?.spells?.map((s) => (
                  <Typography key={s.index} data-testid={`trait-spell-${s.index}`}>
                    {s.name}
                  </Typography>
                ))}
              {subtraits.filter(({ parent }) => parent?.index === trait.index).length
                ? subtraits
                    .filter(({ parent }) => parent?.index === trait.index)
                    ?.map((subtrait) => (
                      <Box key={subtrait.index} data-testid={`trait-subtrait-${subtrait.index}`}>
                        <Typography data-testid={`trait-subtrait-name-${subtrait.index}`}>
                          {subtrait.name}
                          {subtrait.trait_specific?.damage_type?.name
                            ? ` - ${subtrait.trait_specific?.damage_type?.name}`
                            : ''}
                        </Typography>
                        {subtrait.trait_specific?.action &&
                        (subtrait.trait_specific.action.index === trait.index ||
                          !traits.find(
                            ({ index }) => index === subtrait.trait_specific?.action?.index
                          )) ? (
                          <Fragment>
                            <ActionInfo
                              action={subtrait.trait_specific.action}
                              charLevel={character.level || 1}
                              data-testid={`trait-subtrait-action-${subtrait.trait_specific.action.index}`}
                            />
                            <Typography
                              data-testid={`trait-subtrait-action-desc-${subtrait.trait_specific.action.index}`}
                            >
                              {subtrait.trait_specific.action.desc}
                            </Typography>
                          </Fragment>
                        ) : (
                          subtrait.desc.map((d, i) => (
                            <Typography
                              key={i}
                              data-testid={`trait-subtrait-desc-${subtrait.index}-${i}`}
                            >
                              {d}
                            </Typography>
                          ))
                        )}
                      </Box>
                    ))
                : trait.desc.map((s, i) => (
                    <Typography key={`desc-${i}`} data-testid={`trait-desc-${trait.index}-${i}`}>
                      {s}
                    </Typography>
                  ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    )
  );
}
