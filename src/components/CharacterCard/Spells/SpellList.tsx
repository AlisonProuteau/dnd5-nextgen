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
import { useCallback, useEffect, useState } from 'react';
import { getSlotMinMax } from '../utils';
import { SpellCard } from './SpellCard';

export function SpellList({
  classIndex,
  subclassIndex,
  moreSpells,
  slotLevel,
  charLevel = 1,
  selectable = false
}: {
  classIndex?: string;
  subclassIndex?: string;
  moreSpells?: DefaultRepresentation[];
  slotLevel?: number;
  charLevel?: number;
  selectable?: boolean;
}) {
  const [allSpells, setAllSpells] = useState<Array<Spell>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<Spell[]>([]);

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
      setAllSpells([...(spells || []), ...additionnalSpells]);
  }, [spellsFetching, additionnalSpellsFetching]);

  return (
    <Box
      display="grid"
      sx={{
        gridGap: '25px',
        gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`
      }}
    >
      {allSpells.map((spell) => (
        //  sx={{ border: '2px solid green' }}
        <Card key={`spell-${spell.index}-${spell.level}`}>
          <CardActionArea
            onClick={() => {
              setSelectedSpell(selectable ? [...selectedSpell, spell] : [spell]);
              !selectable && setIsDialogOpen(true);
            }}
          >
            <CardHeader
              title={
                <Box display="flex" justifyContent="space-between" alignItems="baseline" gap="5px">
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
            {/* Footer  */}
            <Box>
              <Typography variant="subtitle2" color="secondary">
                {spell.casting_time}
              </Typography>
            </Box>
          </CardActionArea>
        </Card>
      ))}

      {!selectable && (
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth>
          {selectedSpell[0] && <SpellCard spell={selectedSpell[0]} charLevel={charLevel} />}
        </Dialog>
      )}
    </Box>
  );
}
