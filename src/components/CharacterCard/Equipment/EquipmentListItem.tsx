import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { NumberInput } from '@shared/NumberInput';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type {
  Equipment,
  MoneyObjectType
} from '@representations/campaign/equipment.representation';
import { MoneyDisplay } from './MoneyDisplay';

interface EquipmentListItemProps {
  item: (Equipment | MagicItem) & { count?: number };
  mode: 'sell' | 'buy';
  isFreeMode: boolean;
  priceDisplay?: MoneyObjectType;
  canBuy?: (item: Equipment | MagicItem, quantity?: number) => boolean;
  onAction: (item: Equipment | MagicItem, quantity: number) => void;
}

export function EquipmentListItem({
  item,
  mode,
  isFreeMode,
  priceDisplay,
  onAction,
  canBuy = () => false
}: EquipmentListItemProps) {
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = useMemo(
    () =>
      mode === 'sell'
        ? item.count || 1
        : 'quantity' in item
          ? 999 - (999 % (item.quantity || 1))
          : 99,
    [item, mode]
  );

  const getButtonLabel = () =>
    isFreeMode ? (mode === 'sell' ? 'Remove' : 'Add') : mode === 'sell' ? 'Sell' : 'Buy';

  const getTotalPrice = () => {
    if (!priceDisplay) return null;
    const total: MoneyObjectType = {};
    Object.entries(priceDisplay).forEach(([unit, amount]) => {
      if (amount) total[unit as keyof MoneyObjectType] = amount * quantity;
    });
    return total;
  };

  useEffect(() => setQuantity(1), [mode]);

  return (
    <Card key={`${mode}-${item.index}`} variant="outlined">
      <CardContent
        style={{ padding: '16px' }}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Box flex={1}>
          <Typography variant="body1" fontWeight={500}>
            {item.name}
          </Typography>
          {mode === 'sell' ? (
            <Typography variant="caption" color="text.secondary">
              Quantity: {item.count || 1}
            </Typography>
          ) : null}
        </Box>

        {maxQuantity > 1 && (
          <Box display="flex" sx={{ minWidth: '20%' }}>
            <NumberInput
              id={`quantity-${item.index}`}
              min={1 * ('quantity' in item ? item.quantity || 1 : 1)}
              max={maxQuantity}
              value={quantity * ('quantity' in item ? item.quantity || 1 : 1)}
              step={'quantity' in item ? item.quantity || 1 : 1}
              onChange={(_, value) =>
                value && setQuantity(value / ('quantity' in item ? item.quantity || 1 : 1))
              }
              compact
            />
          </Box>
        )}

        <Box
          display="flex"
          alignItems="center"
          justifyItems="space-evenly"
          gap={0.5}
          flexDirection="column"
          marginX="auto"
        >
          {!isFreeMode && priceDisplay && (
            <MoneyDisplay
              purse={getTotalPrice() || {}}
              showZero={false}
              display="inline-flex"
              gap={0.5}
              flexWrap="wrap"
              justifyContent="flex-end"
              paddingTop={0.25}
            />
          )}
          <Button
            variant="outlined"
            size="small"
            disabled={mode === 'buy' && !isFreeMode && !canBuy(item, quantity)}
            onClick={() => {
              onAction(item, quantity);
              setQuantity(1);
            }}
          >
            {getButtonLabel()}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
