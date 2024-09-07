import { AreaIcon, BladeIcon, HealIcon, RangeIcon, TimeIcon } from '@assets';
import { Box, CardContent, CardHeader, Typography } from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import { Fragment } from 'react';
import { getSlotMinMax } from '../utils';

export function SpellCardContent({
  spell,
  charLevel,
  slotLevel
}: {
  spell: Spell;
  charLevel?: number;
  slotLevel?: number;
}) {
  return (
    <Fragment>
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
              {getSlotMinMax(spell.damage.damage_at_character_level || {}, charLevel) ||
                getSlotMinMax(spell.damage.damage_at_slot_level || {}, slotLevel)}
              {spell.damage.damage_type?.name ? ` - ${spell.damage.damage_type?.name}` : ''}
            </Typography>
          </Box>
        )}
        {spell.heal_at_slot_level && (
          <Box display="flex" gap="5px">
            <HealIcon height="20px" width="20px" fill="white" />
            <Typography>{getSlotMinMax(spell.heal_at_slot_level || {}, slotLevel)}</Typography>
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
    </Fragment>
  );
}
