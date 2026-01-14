import { BladeIcon, ShieldIcon } from '@assets';
import { InfoOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type { Equipment } from '@representations/campaign/equipment.representation';

interface EquipmentListProps {
  equipmentList: ((Equipment | MagicItem) & { count?: number })[];
  onClick?: (equipment: Equipment | MagicItem) => void;
}

export function EquipmentList({ equipmentList, onClick }: EquipmentListProps) {
  const getCount = (count?: number, quantity?: number): string => {
    if (count && count > 1) return count.toString();
    if (quantity && quantity > 1) return quantity.toString();

    return '';
  };

  return equipmentList.map((equipment) => (
    <Box key={equipment.index} data-testid={`equipment-item-${equipment.index}`}>
      {onClick && (
        <IconButton
          sx={{ verticalAlign: 'center' }}
          onClick={() => onClick(equipment)}
          data-testid={`equipment-item-${equipment.index}-info`}
        >
          <InfoOutlined color="info" fontSize="small" />
        </IconButton>
      )}
      <Typography display="contents">
        {`${getCount(equipment.count, 'quantity' in equipment ? equipment.quantity : 0)} ${equipment.name}`}
      </Typography>
      {'damage' in equipment && (equipment.damage || equipment.two_handed_damage) && (
        <Box
          display="flex"
          paddingLeft="min(50px, 15%)"
          gap="5px"
          alignItems="center"
          data-testid="damage-info"
        >
          <BladeIcon height="20px" width="20px" fill="white" />
          <Typography width="100%">
            {equipment.damage?.damage_dice} {equipment.damage?.damage_type.name}
          </Typography>
        </Box>
      )}
      {'armor_class' in equipment && equipment.armor_class && (
        <Box display="flex" paddingLeft="50px" gap="5px" data-testid="armor-class-info">
          <ShieldIcon height="20px" width="20px" fill="white" />
          <Typography>
            {equipment.armor_class.base} AC
            {equipment.armor_class.dex_bonus ? ' - Dexterity bonus' : ''}
            {equipment.armor_class.max_bonus ? ` (Max: ${equipment.armor_class.max_bonus})` : ''}
          </Typography>
        </Box>
      )}
    </Box>
  ));
}
