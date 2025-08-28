import { getTrait } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { Trait } from '@representations/abilities/trait.representation';
import { DefaultRepresentation } from '@representations/common.representation';
import { Character } from '@representations/user.representation';
import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { Fragment, useCallback } from 'react';
import { ActionInfo } from './ActionInfo';
import { blackList } from './utils';

export function TraitsDisplay({
  character,
  expanded = false,
  useblackList = true
}: {
  character: Partial<Character>;
  expanded?: boolean;
  useblackList?: boolean;
}) {
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
      <Box paddingTop="15px">
        {traits.map((trait) => (
          <Accordion key={trait.index} defaultExpanded={expanded}>
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
                        charLevel={character.level || 1}
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
                              charLevel={character.level || 1}
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
    )
  );
}
