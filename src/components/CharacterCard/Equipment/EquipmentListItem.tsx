import { BladeIcon, ShieldIcon } from '@assets';
import { CheckCircle, CircleOutlined, InfoOutlined, Warning } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { TooltipButton } from '@shared/TooltipButton';
import { Feature } from '@representations/abilities/feature.representation';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type { Equipment } from '@representations/campaign/equipment.representation';
import { UsageTypes } from '@representations/common.representation';
import { UsageDisplay } from '../Characteristics/UsageDisplay';

interface EquipmentListItemProps {
  equipment: (Equipment | MagicItem) & { count?: number; equipped: boolean };
  onClick?: (equipment: Equipment | MagicItem) => void;
  onToggleEquip?: (equipment: Equipment | MagicItem) => void;
  usage?: {
    type: 'feature' | 'trait' | 'spell' | 'other';
    usage: UsageTypes | UsageTypes[];
    current: number;
  };
  canEquip?: boolean;
  moreInfo?: boolean;
  hasRequiredStrength?: (equipment: Equipment | MagicItem) => boolean;
  features?: Feature[];
}

export function EquipmentListItem({
  equipment,
  onClick,
  onToggleEquip,
  usage,
  canEquip = true,
  moreInfo = true,
  hasRequiredStrength = () => true,
  features = []
}: EquipmentListItemProps) {
  const getCount = (count?: number, quantity?: number): string => {
    if (count && count > 1) return count.toString();
    if (quantity && quantity > 1) return quantity.toString();

    return '';
  };

  return (
    <Box
      key={equipment.index}
      data-testid={`equipment-item-${equipment.index}`}
      display="grid"
      gridTemplateColumns="1fr auto"
      alignItems="center"
    >
      <Box display="flex" flexDirection="column">
        <Box display="flex" alignItems="center" gap={1}>
          {onClick && (
            <IconButton
              onClick={() => onClick(equipment)}
              data-testid={`equipment-item-${equipment.index}-info`}
              sx={{ paddingX: 0 }}
            >
              <InfoOutlined color="info" fontSize="small" />
            </IconButton>
          )}
          <Typography>
            {`${getCount(equipment.count, 'quantity' in equipment ? equipment.quantity : 0)} ${equipment.name}`}
          </Typography>
          {!hasRequiredStrength(equipment) && (
            <TooltipButton title="Minimum strength requirement not met">
              <Warning
                color="warning"
                fontSize="small"
                data-testid="strength-requirement-warning"
              />
            </TooltipButton>
          )}
          <UsageDisplay
            type="equipment"
            character={usage ? { resourceUsages: { [equipment.index]: usage } } : {}}
            resource={equipment}
            fullFeatureList={features}
          />
        </Box>

        {moreInfo && 'damage' in equipment && (equipment.damage || equipment.two_handed_damage) && (
          <Box
            display="flex"
            paddingLeft={onClick ? 'min(25px, 10%)' : ''}
            gap="5px"
            alignItems="center"
            data-testid="damage-info"
          >
            <BladeIcon height="20px" width="20px" fill="white" />
            <Typography width="100%" variant="body2">
              {equipment.damage?.damage_dice} {equipment.damage?.damage_type.name}
            </Typography>
          </Box>
        )}

        {moreInfo && 'armor_class' in equipment && equipment.armor_class && (
          <Box
            display="flex"
            paddingLeft={onClick ? 'min(25px, 10%)' : ''}
            gap="5px"
            data-testid="armor-class-info"
          >
            <ShieldIcon height="20px" width="20px" fill="white" />
            <Typography variant="body2">
              {equipment.armor_class.base} AC
              {equipment.armor_class.dex_bonus ? ' - Dexterity bonus' : ''}
              {equipment.armor_class.max_bonus ? ` (Max: ${equipment.armor_class.max_bonus})` : ''}
            </Typography>
          </Box>
        )}
      </Box>

      {equipment.equipment_category.index === 'armor' && onToggleEquip && (
        <IconButton
          onClick={() => onToggleEquip(equipment)}
          data-testid={`equipment-item-${equipment.index}-equip`}
          disabled={!canEquip}
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          color="secondary"
        >
          {equipment.equipped ? (
            <CheckCircle fontSize="small" />
          ) : (
            <CircleOutlined fontSize="small" sx={{ opacity: 0.5 }} />
          )}
          <Typography variant="body2" color="textSecondary">
            {equipment.equipped ? 'Equipped' : 'Unequipped'}
          </Typography>
        </IconButton>
      )}
    </Box>
  );
}
