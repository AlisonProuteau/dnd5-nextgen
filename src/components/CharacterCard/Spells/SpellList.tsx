import { getSpell, getSpellsForClass } from '@api/ressources';
import { AreaIcon, BladeIcon, HealIcon, RangeIcon, TimeIcon } from '@assets';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Dialog,
  Divider,
  Typography
} from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { groupBy, uniqWith } from 'lodash';
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { getSlotMinMax } from '../utils';
import { SpellCard } from './SpellCard';

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
  setSelectedSpells?: Dispatch<SetStateAction<Spell[]>>;
  selectedSpells?: Spell[];
  disabledLevels?: number[];
}) {
  const [allSpells, setAllSpells] = useState<Record<string, Array<Spell>>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSpell, setCurrentSpell] = useState<Spell>();

  // Am I missing subclass info spells ?
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

  useEffect(() => {
    if (
      !spellsFetching &&
      !additionnalSpellsFetching &&
      (spells?.length || additionnalSpells.length)
    )
      setAllSpells(
        groupBy(
          uniqWith(
            [...(spells || []), ...additionnalSpells],
            (a, b) => a.index === b.index && a.level === b.level
          ),
          'level'
        )
      );
  }, [spellsFetching, additionnalSpellsFetching]);

  return Object.keys(allSpells)
    .filter(
      (level) =>
        !(
          disabledLevels.includes(level === '0' ? 0 : 1) &&
          (!selectedSpells.length ||
            !selectedSpells.find(({ level: selectedLevel }) => selectedLevel === parseInt(level)))
        )
    )
    .map((currentLevel) => (
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
              .filter(({ level, index }) =>
                setSelectedSpells
                  ? !disabledLevels.includes(level === 0 ? 0 : 1) ||
                    !selectedSpells.length ||
                    selectedSpells.find(({ index: selectedIndex }) => selectedIndex === index)
                  : true
              )
              .map((spell) => (
                <Card
                  key={`spell-${spell.index}-${spell.level}`}
                  sx={
                    setSelectedSpells &&
                    selectedSpells.find(({ index }) => index === spell.index) && {
                      border: '2px inset peru'
                    }
                  }
                >
                  <CardActionArea
                    onClick={() => {
                      if (setSelectedSpells) {
                        setSelectedSpells(
                          selectedSpells.find(({ index }) => index === spell.index)
                            ? selectedSpells.filter(({ index }) => index !== spell.index)
                            : [...selectedSpells, spell]
                        );
                        console.log(disabledLevels);
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
                    <CardHeader
                      title={
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="baseline"
                          gap="5px"
                        >
                          <Typography>{spell.name}</Typography>
                          <Typography variant="subtitle2" color="primary">
                            lvl{spell.level}
                          </Typography>
                        </Box>
                      }
                      subheader={
                        <Typography display="inline" variant="subtitle2" color="darkgrey">
                          {spell.components}
                          {spell.concentration ? ' - Con' : ''}
                          {spell.ritual ? ' - Ritual' : ''}
                        </Typography>
                      }
                      sx={{ paddingBottom: 0 }}
                    />
                    <CardContent sx={{ flex: 1 }}>
                      {spell.duration !== 'Instantaneous' && (
                        <Box display="flex" gap="5px">
                          <TimeIcon height="20px" width="20px" fill="white" />
                          <Typography>{spell.duration}</Typography>
                        </Box>
                      )}
                      {spell.damage && (
                        <Box display="flex" gap="5px">
                          <BladeIcon height="20px" width="20px" fill="white" />
                          <Typography>
                            {getSlotMinMax(
                              spell.damage.damage_at_character_level || {},
                              charLevel
                            ) || getSlotMinMax(spell.damage.damage_at_slot_level || {}, slotLevel)}
                            {spell.damage.damage_type?.name
                              ? ` - ${spell.damage.damage_type?.name}`
                              : ''}
                          </Typography>
                        </Box>
                      )}
                      {spell.heal_at_slot_level && (
                        <Box display="flex" gap="5px">
                          <HealIcon height="20px" width="20px" fill="white" />
                          <Typography>
                            {getSlotMinMax(spell.heal_at_slot_level || {}, slotLevel)}
                          </Typography>
                        </Box>
                      )}
                      {spell.area_of_effect && (
                        <Box display="flex" gap="5px">
                          <AreaIcon height="20px" width="20px" fill="white" />
                          <Typography>
                            {spell.area_of_effect.size}ft - {spell.area_of_effect.type}
                          </Typography>
                        </Box>
                      )}
                      {spell.range !== 'Self' && (
                        <Box display="flex" gap="5px">
                          <RangeIcon height="20px" width="20px" fill="white" />
                          <Typography>{spell.range}</Typography>
                        </Box>
                      )}
                    </CardContent>
                    <Box paddingLeft="16px" paddingBottom="16px">
                      <Typography variant="subtitle2" color="secondary">
                        {spell.casting_time}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              ))}

            {!setSelectedSpells && (
              <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth>
                {currentSpell && (
                  <SpellCard
                    spell={currentSpell}
                    charLevel={charLevel || 1}
                    slotLevel={slotLevel}
                  />
                )}
              </Dialog>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    ));
}
