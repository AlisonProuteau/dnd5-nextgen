import { getSpell, getSpellsForClass } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardActionArea,
  Dialog,
  Divider
} from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupBy, uniqWith } from 'lodash';
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { SpellCard } from './SpellCard';
import { SpellCardContent } from './SpellCardContent';

export function SpellList({
  classIndex,
  subclassIndex,
  moreSpells,
  highestSpellLevel,
  charLevel,
  slotLevel,
  setSelectedSpells,
  selectedSpells = [],
  disabledLevels = []
}: {
  classIndex?: string;
  subclassIndex?: string;
  moreSpells?: DefaultRepresentation[];
  highestSpellLevel?: number;
  charLevel?: number;
  slotLevel?: number;
  setSelectedSpells?: Dispatch<SetStateAction<(DefaultRepresentation & { level: number })[]>>;
  selectedSpells?: (DefaultRepresentation & { level: number })[];
  disabledLevels?: number[];
}) {
  const [allSpells, setAllSpells] = useState<Record<string, Array<Spell>>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSpell, setCurrentSpell] = useState<Spell>();

  // TODO: Am I missing subclass info spells ?
  const { data: spells, isFetching: spellsFetching } = useQuery({
    queryKey: ['fetchSpells', classIndex, subclassIndex, highestSpellLevel],
    queryFn: async () =>
      classIndex && highestSpellLevel !== undefined
        ? (await getSpellsForClass(classIndex, subclassIndex, highestSpellLevel)).results
        : null,
    enabled: !!classIndex
  });

  const { data: additionnalSpells, isFetching: additionnalSpellsFetching } = useQueries({
    queries:
      moreSpells?.map(({ index }) => ({
        queryKey: ['fetchSpell', index],
        queryFn: async () => await getSpell(index),
        enabled: !!index
      })) || [],
    combine: useCallback((results: UseQueryResult<Spell | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as Spell[],
        isFetching: results.some((result) => result.isFetching)
      };
    }, [])
  });

  const selected = (index?: string, level?: number) => {
    let filtered = selectedSpells;

    if (level !== undefined)
      filtered = filtered.filter(({ level: currentLevel }) => currentLevel === level);
    if (index) filtered = filtered.filter(({ index: currentIndex }) => currentIndex === index);

    return filtered.length > 0;
  };

  useEffect(() => {
    if (
      !spellsFetching &&
      !additionnalSpellsFetching &&
      (spells?.length || additionnalSpells.length)
    ) {
      const uniqSpells = uniqWith(
        [...(spells || []), ...additionnalSpells],
        (a, b) => a.index === b.index && a.level === b.level
      ).filter(
        ({ level, index }) =>
          !(
            disabledLevels?.includes(level === 0 ? 0 : 1) &&
            (!selectedSpells.length || !selected(undefined, level))
          ) || moreSpells?.find(({ index: selectedIndex }) => selectedIndex === index)
      );

      setAllSpells(groupBy(uniqSpells, 'level'));
    }
  }, [
    spellsFetching,
    additionnalSpellsFetching,
    disabledLevels[0],
    disabledLevels[1],
    selectedSpells.map(({ level }) => level).join(', '),
    moreSpells?.map(({ index }) => index).join(', ')
  ]);

  return Object.keys(allSpells).map((currentLevel) => (
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
        <Box display="grid" gap="25px" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))">
          {allSpells[currentLevel]
            .filter(({ level, index }) => {
              if (
                disabledLevels.includes(level === 0 ? 0 : 1) &&
                !selected(index) &&
                !selected(undefined, level)
              )
                return moreSpells?.find(({ index: selectedIndex }) => selectedIndex === index);

              if (setSelectedSpells)
                return (
                  !disabledLevels.includes(level === 0 ? 0 : 1) ||
                  !selectedSpells.length ||
                  selected(index)
                );

              return selected(undefined, level)
                ? selected(index) ||
                    moreSpells?.find(({ index: selectedIndex }) => selectedIndex === index)
                : true;
            })
            .map((spell) => (
              <Card
                key={`spell-${spell.index}-${spell.level}`}
                sx={
                  setSelectedSpells && selected(spell.index)
                    ? {
                        border: '2px inset peru'
                      }
                    : null
                }
              >
                <CardActionArea
                  onClick={() => {
                    if (
                      setSelectedSpells &&
                      (!disabledLevels.includes(spell.level === 0 ? 0 : 1) || selected(spell.index))
                    ) {
                      const allSpells = selected(spell.index)
                        ? selectedSpells.filter(({ index }) => index !== spell.index)
                        : [...selectedSpells, spell];
                      setSelectedSpells(
                        allSpells.map(({ index, name, level }) => ({ index, name, level }))
                      );
                    } else {
                      setCurrentSpell(spell);
                      setIsDialogOpen(true);
                    }
                  }}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch'
                  }}
                >
                  <SpellCardContent spell={spell} />
                </CardActionArea>
              </Card>
            ))}

          {!setSelectedSpells && (
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth>
              {currentSpell && (
                <SpellCard spell={currentSpell} charLevel={charLevel || 1} slotLevel={slotLevel} />
              )}
            </Dialog>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  ));
}
