import { AreaIcon, BladeIcon, HealIcon, RangeIcon, TimeIcon } from '@assets';
import { Box, CardContent, Typography } from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import { Fragment } from 'react';
import { getDamageMinMax, getSlotMinMax } from '../utils';

interface SpellCardContentProps {
  spell: Spell;
  charLevel?: number;
  slotLevels?: number[];
}

export function SpellCardContent({ spell, charLevel, slotLevels }: SpellCardContentProps) {
  return (
    <Fragment>
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
              {getDamageMinMax(spell.damage, charLevel, slotLevels) || ''}
              {spell.damage.damage_type?.name ? ` - ${spell.damage.damage_type?.name}` : ''}
            </Typography>
          </Box>
        )}
        {spell.heal_at_slot_level && (
          <Box display="flex" gap="5px">
            <HealIcon height="20px" width="20px" fill="white" />
            <Typography>{getSlotMinMax(spell.heal_at_slot_level, slotLevels)}</Typography>
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
      <Typography variant="subtitle2" color="secondary" textAlign="right">
        {spell.casting_time}
      </Typography>
    </Fragment>
  );
}
