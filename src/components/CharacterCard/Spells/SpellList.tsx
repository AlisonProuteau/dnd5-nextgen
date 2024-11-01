import { getSpell, getSpellsForClass } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardHeader,
  Dialog,
  DialogContent,
  Divider,
  Typography
} from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupBy, max, maxBy, uniqWith } from 'lodash';
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react';
import { SpellCard } from './SpellCard';
import { SpellCardContent } from './SpellCardContent';

export function SpellList({
  characterInfo,
  additionalSpellList,
  slotLevels = [],
  spellListOnly = false,
  selectedSpells = [],
  setSelectedSpells,
  maxSelected = [0, 0]
}: {
  characterInfo: {
    classIndex?: string;
    subclassIndex?: string;
    charLevel?: number;
    slotLevel?: number;
  };
  additionalSpellList?: DefaultRepresentation[];
  slotLevels?: number[];
  spellListOnly?: boolean;
  selectedSpells?: (DefaultRepresentation & { level: number })[];
  setSelectedSpells?: Dispatch<SetStateAction<typeof selectedSpells>>;
  maxSelected?: [number, number];
}) {
  const [allSpells, setAllSpells] = useState<Record<string, Array<Spell>>>({});
  const [currentSpell, setCurrentSpell] = useState<Spell>();

  // TODO: Am I missing subclass info spells ?
  const { data: spells = [], isFetching: spellsFetching } = useQuery({
    queryKey: [
      'fetchCharacterSpells',
      characterInfo.classIndex,
      characterInfo.subclassIndex,
      max(slotLevels)
    ],
    queryFn: async () =>
      characterInfo.classIndex
        ? (
            await getSpellsForClass(
              characterInfo.classIndex,
              characterInfo.subclassIndex,
              max(slotLevels)
            )
          ).results
        : [],
    enabled: !!characterInfo.classIndex && !spellListOnly
  });

  const { data: additionnalSpells, isFetching: additionnalSpellsFetching } = useQueries({
    queries:
      additionalSpellList?.map(({ index }) => ({
        queryKey: ['fetchSpell', index],
        queryFn: async () => await getSpell(index),
        enabled: !!index
      })) || [],
    combine: useCallback((results: UseQueryResult<Spell | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as Spell[],
        isFetching: results.some((result) => result.isFetching),
        dataUpdatedAt: maxBy(results, 'dataUpdatedAt')
      };
    }, [])
  });

  useEffect(() => {
    if (
      !spellsFetching &&
      !additionnalSpellsFetching &&
      (spells.length || additionnalSpells.length)
    ) {
      const filteredSpells = uniqWith(
        [
          ...(spellListOnly ? [] : spells).filter(
            ({ level }) => !slotLevels.length || slotLevels.includes(level)
          ),
          ...additionnalSpells
        ],
        (a, b) => a.index === b.index && a.level === b.level
      );

      setAllSpells(groupBy(filteredSpells, 'level'));
    }
  }, [spellsFetching, additionnalSpellsFetching, spellListOnly]);

  return (
    <Fragment>
      <DialogContent>
        {setSelectedSpells && (
          <Fragment>
            {maxSelected[0] > 0 && (
              <Typography>
                {selectedSpells.filter(({ level }) => level === 0).length}/{maxSelected[0]} cantrips
                selected
              </Typography>
            )}
            {maxSelected[1] > 0 && (
              <Typography>
                {selectedSpells.filter(({ level }) => level > 0).length}/{maxSelected[1]} spells
                selected
              </Typography>
            )}
          </Fragment>
        )}
        {Object.keys(allSpells).map((currentLevel) => (
          <Accordion
            key={`spell-list-${currentLevel}-${allSpells[currentLevel].length}`}
            sx={{ '&:before': { display: 'none' } }}
            elevation={0}
            defaultExpanded
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                {currentLevel === '0' ? 'Cantrips' : `Spell Level ${currentLevel}`}
              </Divider>
            </AccordionSummary>

            <AccordionDetails>
              <Box
                display="grid"
                gap="25px"
                gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))"
              >
                {allSpells[currentLevel].map((spell) => (
                  <Card
                    key={`spell-${spell.index}-${spell.level}`}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow:
                        selectedSpells.find(({ index }) => index === spell.index) &&
                        'inset 0px 0px 5px 2px darkgrey'
                    }}
                  >
                    <CardActionArea
                      onClick={() => setCurrentSpell(spell)}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch'
                      }}
                    >
                      <CardHeader
                        title={
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="baseline"
                            gap="5px"
                          >
                            <Typography display="inline" variant="subtitle2" color="darkgrey">
                              {spell.components}
                              {spell.concentration ? ' - Con' : ''}
                              {spell.ritual ? ' - Ritual' : ''}
                            </Typography>
                            <Typography variant="subtitle2" color="primary">
                              lvl{spell.level}
                            </Typography>
                          </Box>
                        }
                        subheader={
                          <Typography
                            alignContent="center"
                            textAlign="center"
                            height={48}
                            overflow="hidden"
                            sx={{ overflowWrap: 'break-word' }}
                          >
                            {spell.name}
                          </Typography>
                        }
                        sx={{ paddingBottom: 0, height: 72, display: 'block' }}
                      />

                      <SpellCardContent spell={spell} />
                    </CardActionArea>

                    {setSelectedSpells && (
                      <CardActions sx={{ alignSelf: 'center' }}>
                        {selectedSpells.find(({ index }) => index === spell.index) ? (
                          <Button
                            onClick={() =>
                              setSelectedSpells(
                                selectedSpells.filter(({ index }) => index !== spell.index)
                              )
                            }
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            onClick={() =>
                              selectedSpells.filter(({ level }) =>
                                spell.level === 0 ? level === 0 : level > 0
                              ).length < maxSelected[spell.level === 0 ? 0 : 1] &&
                              setSelectedSpells([...selectedSpells, spell])
                            }
                            disabled={
                              selectedSpells.filter(({ level }) =>
                                spell.level === 0 ? level === 0 : level > 0
                              ).length >= maxSelected[spell.level === 0 ? 0 : 1]
                            }
                          >
                            Add
                          </Button>
                        )}
                      </CardActions>
                    )}
                  </Card>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>

      <Dialog open={!!currentSpell} onClose={() => setCurrentSpell(undefined)} fullWidth>
        {currentSpell && (
          <SpellCard
            spell={currentSpell}
            charLevel={characterInfo.charLevel || 1}
            slotLevel={characterInfo.slotLevel}
          />
        )}
      </Dialog>
    </Fragment>
  );
}
