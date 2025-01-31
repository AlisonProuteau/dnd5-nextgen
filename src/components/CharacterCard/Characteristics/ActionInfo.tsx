import { AreaIcon, BladeIcon, DodgeIcon, TimeIcon } from '@assets';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Action } from '@representations/abilities/trait.representation';
import { getSlotMinMax } from '../utils';

interface ActionInfoProps {
  action: Action;
  charLevel: number;
  slotLevel?: number;
}

export function ActionInfo({ action, charLevel, slotLevel }: ActionInfoProps) {
  return (
    <Box paddingBottom="15px" paddingLeft="15px">
      <Box display="flex" gap="5px">
        <TimeIcon height="20px" width="20px" fill="white" />
        <Typography>
          {action.usage.times}
          {action.usage.type}
        </Typography>
      </Box>

      {action.area_of_effect && (
        <Box display="flex" gap="5px">
          <AreaIcon height="20px" width="20px" fill="white" />
          <Typography>
            {action.area_of_effect.size}ft - {action.area_of_effect.type}
          </Typography>
        </Box>
      )}

      {action.damage &&
        (Array.isArray(action.damage) ? action.damage : [action.damage]).map((dam, i) => (
          <Box display="flex" gap="5px" key={`${dam.damage_type?.index}-${i}`}>
            <BladeIcon height="20px" width="20px" fill="white" />
            <Typography>
              {getSlotMinMax(dam.damage_at_slot_level || {}, slotLevel ? [slotLevel] : undefined) ||
                getSlotMinMax(dam.damage_at_character_level || {}, [charLevel])}
              {dam.damage_type?.name ? ` - ${dam.damage_type?.name}` : ''}
            </Typography>
          </Box>
        ))}

      <Box display="flex" gap="5px">
        <DodgeIcon height="20px" width="20px" fill="white" />
        <Typography>
          {`DC - ${action.dc.dc_type.name}`}
          {action.dc.dc_value ? `${action.dc.dc_value} - ` : ' '}({action.dc.success_type})
        </Typography>
      </Box>
    </Box>
  );
}
