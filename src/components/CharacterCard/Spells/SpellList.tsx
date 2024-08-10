import { getSpell, getSpellsForClass } from '@api/ressources';
import { AreaIcon, BladeIcon, HealIcon, RangeIcon, TimeIcon } from '@assets';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Dialog,
  Typography
} from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { uniqWith } from 'lodash';
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { getSlotMinMax } from '../utils';
import { SpellCard } from './SpellCard';

export function SpellList({
  classIndex,
  subclassIndex,
  moreSpells,
  slotLevel,
  setSelectedSpells,
  selectedSpells = [],
  disabledLevels = [],
  charLevel = 1
}: {
  classIndex?: string;
  subclassIndex?: string;
  moreSpells?: DefaultRepresentation[];
  slotLevel?: number;
  setSelectedSpells?: Dispatch<SetStateAction<Spell[]>>;
  selectedSpells?: Spell[];
  disabledLevels?: number[];
  charLevel?: number;
}) {
  const [allSpells, setAllSpells] = useState<Array<Spell>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSpell, setCurrentSpell] = useState<Spell>();

  const { data: spells, isFetching: spellsFetching } = useQuery({
    queryKey: ['fetchSpells', classIndex, subclassIndex, charLevel],
    queryFn: async () =>
      classIndex ? (await getSpellsForClass(classIndex, subclassIndex, charLevel)).results : null,
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
        uniqWith(
          [...(spells || []), ...additionnalSpells],
          (a, b) => a.index === b.index && a.level === b.level
        )
      );
  }, [spellsFetching, additionnalSpellsFetching]);

  // TODO: Fix colors and alignment
  return (
    <Box
      display="grid"
      sx={{
        gridGap: '25px',
        gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`
      }}
    >
      {allSpells
        .sort(({ level: levelA }, { level: levelB }) => levelA - levelB)
        .filter(
          ({ level, index }) =>
            selectedSpells.find(({ index: selectedIndex }) => selectedIndex === index) ||
            (level === 0
              ? !disabledLevels.some((levelDisabled) => levelDisabled === 0)
              : !disabledLevels.some((levelDisabled) => levelDisabled === 1))
        )
        .map((spell) => (
          <Card
            key={`spell-${spell.index}-${spell.level}`}
            sx={
              setSelectedSpells &&
              selectedSpells.find(({ index }) => index === spell.index) && {
                border: '2px solid green'
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
              <CardContent>
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
                      {getSlotMinMax(spell.damage.damage_at_character_level || {}, charLevel) ||
                        getSlotMinMax(spell.damage.damage_at_slot_level || {}, slotLevel)}
                      {spell.damage.damage_type?.name ? ` - ${spell.damage.damage_type?.name}` : ''}
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
              <Box>
                <Typography variant="subtitle2" color="secondary">
                  {spell.casting_time}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        ))}

      {!setSelectedSpells && (
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth>
          {currentSpell && <SpellCard spell={currentSpell} charLevel={charLevel} />}
        </Dialog>
      )}
    </Box>
  );
}
