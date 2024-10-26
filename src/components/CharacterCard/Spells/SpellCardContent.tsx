import { AreaIcon, BladeIcon, HealIcon, RangeIcon, TimeIcon } from '@assets';
import { Box, CardContent, Typography } from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
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
    <CardContent sx={{ flex: 1 }}>
      <Box flex={1} alignContent="center">
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
      </Box>

      <Typography variant="subtitle2" color="secondary" textAlign="right" paddingTop="5px">
        {spell.casting_time}
      </Typography>
    </CardContent>
  );
}
