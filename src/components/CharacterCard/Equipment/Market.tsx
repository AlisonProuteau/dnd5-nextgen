import { useState } from 'react';
import {
  Box,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { buyItem, getSellingPrice, remainingMoneyInCopper, sellItem } from '@utils/character';
import type { MagicItem } from '@representations/abilities/magic.representation';
import type {
  Equipment,
  MoneyObjectType
} from '@representations/campaign/equipment.representation';
import type { Character } from '@representations/user.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { EquipmentListItem } from './EquipmentListItem';
import { EquipmentSearch } from './EquipmentSearch';
import { MoneyDisplay } from './MoneyDisplay';

interface MarketProps {
  character: Character;
  purse: MoneyObjectType;
  ownedEquipment: ((Equipment | MagicItem) & { count?: number })[];
}

export function Market({ character, purse, ownedEquipment }: MarketProps) {
  const { additionalCurrencies = [] } = useAuth();
  const [mode, setMode] = useState<'sell' | 'buy'>('sell');
  const { isOn: isfreeMode, toggle: toggleFreeMode } = useToggle(false);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter'],
    successMessages: {
      update: 'Transaction successful'
    }
  });

  const onSell = async (
    item: Equipment | MagicItem,
    quantity: number = 1,
    customPrice?: MoneyObjectType
  ) => {
    const totalCost =
      'cost' in item
        ? { [item.cost.unit]: item.cost.quantity * quantity }
        : { cp: remainingMoneyInCopper({}, customPrice ?? {}) * quantity };
    const updatedPurse = isfreeMode
      ? character.money || { cp: 0, sp: 0, gp: 0 }
      : sellItem(
          purse,
          totalCost,
          item.equipment_category.index as any,
          additionalCurrencies,
          Object.keys(customPrice ?? {}).length !== 0
        );

    const totalQuantity = 'quantity' in item ? quantity * (item.quantity || 1) : quantity;
    const updatedEquipments = character.equipments
      ?.map((eq) => {
        if (eq.index === item.index)
          return (eq.count || 1) - totalQuantity > 0
            ? { ...eq, count: (eq.count || 1) - totalQuantity }
            : null;

        return eq;
      })
      .filter((eq) => eq !== null && eq.count !== 0);

    await firebaseCrud.update(character.id, {
      equipments: updatedEquipments,
      money: updatedPurse
    });
  };

  const onBuy = async (
    item: Equipment | MagicItem,
    quantity: number = 1,
    customPrice?: MoneyObjectType
  ) => {
    const totalCost =
      'cost' in item
        ? { [item.cost.unit]: item.cost.quantity * quantity }
        : { cp: remainingMoneyInCopper({}, customPrice ?? {}) * quantity };
    const updatedPurse = isfreeMode
      ? character.money || { cp: 0, sp: 0, gp: 0 }
      : buyItem(purse, totalCost, additionalCurrencies);

    const totalQuantity = 'quantity' in item ? quantity * (item.quantity || 1) : quantity;
    const updatedEquipments = character.equipments.find((eq) => eq.index === item.index)
      ? character.equipments?.map((eq) => {
          if (eq.index === item.index) return { ...eq, count: (eq.count || 1) + totalQuantity };
          return eq;
        })
      : [...character.equipments, { index: item.index, name: item.name, count: totalQuantity }];

    await firebaseCrud.update(character.id, {
      equipments: updatedEquipments,
      money: updatedPurse
    });
  };

  const canBuy = (
    item: Equipment | MagicItem,
    quantity: number = 1,
    customPrice?: MoneyObjectType
  ) => {
    try {
      buyItem(
        purse,
        'cost' in item ? { [item.cost.unit]: item.cost.quantity * quantity } : (customPrice ?? {}),
        additionalCurrencies
      );

      return true;
    } catch (e) {
      if (e instanceof Error && e.message === 'Insufficient funds') return false;
      else throw e;
    }
  };

  return (
    <Box height="80vh" maxHeight="80vh" display="flex" flexDirection="column">
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Market</Typography>

          <Box display="flex" flexDirection="column" minHeight="50px" justifyContent="space-evenly">
            <MoneyDisplay display="flex" paddingTop={0.5} purse={purse} />
            <FormControlLabel
              control={<Switch checked={isfreeMode} onChange={toggleFreeMode} size="small" />}
              sx={{ m: '0px' }}
              label="Free Mode"
              labelPlacement="start"
              slotProps={{ typography: { variant: 'body2', color: 'text.secondary' } }}
            />
          </Box>
        </Box>

        <Tabs
          value={mode}
          onChange={(_, newValue) => setMode(newValue)}
          variant="fullWidth"
          sx={{ mt: 1 }}
        >
          <Tab label="Sell" value="sell" />
          <Tab label="Buy" value="buy" />
        </Tabs>
      </DialogTitle>

      <DialogContent sx={ownedEquipment.length === 0 ? { alignContent: 'center' } : null}>
        {mode === 'sell' ? (
          <Box overflow="auto">
            {ownedEquipment.length === 0 ? (
              <Typography color="text.secondary" textAlign="center">
                No items to sell
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                {ownedEquipment.map((item) => (
                  <EquipmentListItem
                    key={`sell-${item.index}`}
                    item={item}
                    mode="sell"
                    isFreeMode={isfreeMode}
                    priceDisplay={
                      'cost' in item
                        ? getSellingPrice(
                            { [item.cost.unit]: item.cost.quantity },
                            item.equipment_category.index as any,
                            additionalCurrencies
                          )
                        : undefined
                    }
                    onAction={onSell}
                    disableAction={firebaseCrud.isLoading}
                  />
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <EquipmentSearch
            isFreeMode={isfreeMode}
            canBuy={canBuy}
            onBuy={onBuy}
            disableAction={firebaseCrud.isLoading}
          />
        )}
      </DialogContent>
    </Box>
  );
}
