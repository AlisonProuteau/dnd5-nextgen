import { Fragment, useCallback } from 'react';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { getTrait } from '@api/ressources';
import { blackList } from '@utils/character/characteristics.utils';
import type { Trait } from '@representations/abilities/trait.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { ActionInfo } from './ActionInfo';

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
  const { data: traits } = useQueries({
    queries:
      uniqBy(character.traits, 'index')
        ?.filter(({ index }) => (useblackList ? !blackList.includes(index) : true))
        ?.map(({ index }) => ({
          queryKey: ['fetchTrait', character.version, index],
          queryFn: async () => await getTrait(character.version || 'Legacy', index),
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
    combine: useCallback((results: UseQueryResult<Trait | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as Trait[],
        isFetching: results.some((result) => result.isFetching)
      };
    }, [])
  });
  return (
    traits && (
      <Box paddingTop="15px" data-testid="traits-section-content">
        {traits.map((trait) => (
          <Accordion
            key={trait.index}
            defaultExpanded={expanded}
            data-testid={`trait-${trait.index}`}
          >
            <AccordionSummary expandIcon={<ExpandMore />} data-testid={`trait-name-${trait.index}`}>
              {trait.name}
            </AccordionSummary>
            <AccordionDetails
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
                        (subtrait.trait_specific?.action?.index === trait.index ||
                          !traits.find(
                            ({ index }) => index === subtrait.trait_specific?.action?.index
                          )) ? (
                          <Fragment>
                            <ActionInfo
                              action={subtrait.trait_specific?.action}
                              charLevel={character.level || 1}
                              data-testid={`trait-subtrait-action-${subtrait.trait_specific?.action.index}`}
                            />
                            <Typography
                              data-testid={`trait-subtrait-action-desc-${subtrait.trait_specific?.action.index}`}
                            >
                              {subtrait.trait_specific?.action.desc}
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
