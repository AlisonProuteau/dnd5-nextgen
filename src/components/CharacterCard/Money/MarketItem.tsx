import { Fragment, useEffect, useMemo, useState } from 'react';
import { CoinsIcon } from '@assets';
import { Box, Button, Card, CardContent, Dialog, Typography } from '@mui/material';
import { useToggle } from '@hooks/useToggle';
import { NumberInput } from '@shared/NumberInput';
import { remainingMoneyInCopper } from '@utils/character/character.utils';
import { getCoinColor } from '@utils/ui/ui.utils';
import type { MagicItem } from '@representations/abilities/magic.representation';
import {
  type Equipment,
  type MoneyObjectType,
  StandardMoneyUnits
} from '@representations/campaign/equipment.representation';
import { EquipmentCard } from '../Equipment/EquipmentCard';
import { EquipmentListItem } from '../Equipment/EquipmentListItem';
import { MoneyDisplay } from './MoneyDisplay';

interface MarketItemProps {
  item: (Equipment | MagicItem) & { count?: number };
  mode: 'sell' | 'buy';
  isFreeMode: boolean;
  priceDisplay?: MoneyObjectType;
  canBuy?: (
    item: Equipment | MagicItem,
    quantity?: number,
    customPrice?: MoneyObjectType
  ) => boolean;
  onAction: (
    item: Equipment | MagicItem,
    quantity?: number,
    customPrice?: MoneyObjectType
  ) => Promise<void>;
  disableAction?: boolean;
  hasRequiredStrength?: (equipment: Equipment | MagicItem) => boolean;
}

export function MarketItem({
  item,
  mode,
  isFreeMode,
  priceDisplay,
  onAction,
  canBuy = () => false,
  disableAction = false,
  hasRequiredStrength = () => true
}: MarketItemProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<MoneyObjectType>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { isOn: isDialogOpen, turnOn: openDialog, turnOff: closeDialog } = useToggle(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | MagicItem>();

  const maxQuantity = useMemo(
    () =>
      mode === 'sell'
        ? item.count || 1
        : 'quantity' in item
          ? 999 - (999 % (item.quantity || 1))
          : 99,
    [item, mode]
  );
  const minQuantity = useMemo(() => ('quantity' in item ? item.quantity || 1 : 1), [item]);
  const isDisabled = useMemo(
    () =>
      isUpdating ||
      (mode === 'buy' &&
        !isFreeMode &&
        ((!priceDisplay && remainingMoneyInCopper({}, customPrice) === 0) ||
          !canBuy(item, quantity, customPrice))),
    [isUpdating, mode, isFreeMode, priceDisplay, customPrice, item, quantity, canBuy]
  );

  useEffect(() => {
    setQuantity(1);
    setCustomPrice({});
  }, [mode]);

  const getButtonLabel = () =>
    isFreeMode ? (mode === 'sell' ? 'Remove' : 'Add') : mode === 'sell' ? 'Sell' : 'Buy';

  const getTotalPrice = () => {
    if (!priceDisplay && remainingMoneyInCopper({}, customPrice) === 0) return null;

    const total: MoneyObjectType = {};
    Object.entries(priceDisplay || customPrice).forEach(([unit, amount]) => {
      if (amount) total[unit as keyof MoneyObjectType] = amount * quantity;
    });
    return total;
  };

  const onSubmit = async () => {
    setIsUpdating(true);

    const submitCustomPrice = customPrice;
    setCustomPrice({});
    try {
      await onAction(item, quantity, submitCustomPrice);
      setQuantity(1);
    } catch {
      setCustomPrice(submitCustomPrice);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Fragment>
      <Card
        key={`market-${mode}-${item.index}`}
        data-testid={`market-${mode}-${item.index}`}
        variant="outlined"
      >
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
          <Box flexGrow={1}>
            <EquipmentListItem
              equipment={{ ...item, equipped: false }}
              onClick={(equipment) => {
                setSelectedEquipment(equipment);
                openDialog();
              }}
              hasRequiredStrength={hasRequiredStrength}
              moreInfo={false}
            />

            {mode === 'sell' ? (
              <Typography variant="caption" color="text.secondary">
                Quantity: {item.count || 1}
              </Typography>
            ) : null}
          </Box>

          {maxQuantity > 1 && (
            <Box display="flex" sx={{ minWidth: '20%' }} marginX="auto">
              <NumberInput
                id={`quantity-${item.index}`}
                min={minQuantity}
                max={maxQuantity}
                value={quantity * minQuantity}
                step={minQuantity}
                onChange={(_, value) => setQuantity(value ? value / minQuantity : 1)}
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

            {!isFreeMode && !priceDisplay ? (
              <Box display="flex" alignItems="center">
                {StandardMoneyUnits.map((unit) => (
                  <Box
                    key={`money-units-${unit}`}
                    display="flex"
                    alignItems="center"
                    flexDirection="column"
                  >
                    <CoinsIcon height="20px" width="20px" fill={getCoinColor(unit)} />
                    <NumberInput
                      id={`money-units-${unit}`}
                      compact
                      buttonsHidden
                      min={0}
                      value={customPrice[unit] ?? null}
                      onChange={(_, value) =>
                        setCustomPrice((prev) => ({ ...prev, [unit]: value ?? null }))
                      }
                    />
                  </Box>
                ))}
              </Box>
            ) : null}

            <Button
              variant="outlined"
              size="small"
              disabled={isDisabled || disableAction}
              onClick={onSubmit}
            >
              {getButtonLabel()}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onClose={closeDialog} fullWidth>
        {selectedEquipment && <EquipmentCard selectedEquipment={selectedEquipment} />}
      </Dialog>
    </Fragment>
  );
}
