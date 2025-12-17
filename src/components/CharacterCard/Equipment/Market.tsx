import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useToggle } from '@hooks/useToggle';
import { getSellingPrice, sellItem } from '@utils/character';
import type {
  AdditionalMoneyUnitType,
  Equipment,
  MoneyObjectType
} from '@representations/campaign/equipment.representation';
import type { Character } from '@representations/user.representation';
import { MoneyDisplay } from './MoneyDisplay';

interface MarketProps {
  character: Character;
  purse: MoneyObjectType;
  ownedEquipment: (Equipment & { count?: number })[];
  additionalCurrencies?: AdditionalMoneyUnitType[];
}

// TODO: Buy/Sell equipment
export function Market({
  character,
  purse,
  ownedEquipment,
  additionalCurrencies = []
}: MarketProps) {
  const [mode, setMode] = useState<'sell' | 'buy'>('sell');
  const { isOn: isfreeMode, toggle: toggleFreeMode } = useToggle(false);
  // const firebaseCrud = useFirebaseCrud({
  //   collectionPath: 'users/{userId}/characters',
  //   invalidateQueryKey: ['fetchCharacter'],
  //   successMessages: {
  //     update: 'Money Updated'
  //   }
  // });

  const onSell = async (equipment: Equipment) => {
    const updatedPurse = isfreeMode
      ? character.money || { cp: 0, sp: 0, gp: 0 }
      : sellItem(
          purse,
          { [equipment.cost.unit]: equipment.cost.quantity },
          equipment.equipment_category.index as any,
          additionalCurrencies
        );
    const updatedEquipments = character.equipments
      ?.map((eq) => {
        if (eq.index === equipment.index) {
          const newCount = (eq.count || 1) - 1;
          return newCount > 0 ? { ...eq, count: newCount } : null;
        }
        return eq;
      })
      .filter((eq) => eq !== null && eq.count !== 0);

    // TODO: Test after adding buy functionality
    // await firebaseCrud.update(character.id, { equipments: updatedEquipments, money: updatedPurse });
    console.log({ updatedEquipments, updatedPurse });
  };

  return (
    <Box height="80vh" maxHeight="80vh" display="flex" flexDirection="column">
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Market</Typography>

          <Box display="flex" flexDirection="column" minHeight="50px" justifyContent="space-evenly">
            <MoneyDisplay
              display="flex"
              paddingTop={0.5}
              purse={purse}
              additionalCurrencies={additionalCurrencies}
            />
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
                  <Card key={`sell-${item.index}`} variant="outlined">
                    <CardContent sx={{ display: 'flex' }}>
                      <Box flex={1}>
                        <Typography variant="body1" fontWeight={500}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quantity: {item.count || 1}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        {!isfreeMode && (
                          <Box textAlign="right">
                            <Typography variant="caption" color="text.secondary" display="block">
                              Sell for
                            </Typography>
                            <MoneyDisplay
                              purse={getSellingPrice(
                                { [item.cost.unit]: item.cost.quantity },
                                item.equipment_category.index as any,
                                additionalCurrencies
                              )}
                              showZero={false}
                              display="inline-flex"
                              gap={0.5}
                              flexWrap="wrap"
                              justifyContent="flex-end"
                              additionalCurrencies={additionalCurrencies}
                            />
                          </Box>
                        )}
                        <Button variant="outlined" size="small" onClick={() => onSell(item)}>
                          {isfreeMode ? 'Remove' : 'Sell'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Coming soon: Browse and buy equipment
          </Typography>
        )}
      </DialogContent>
    </Box>
  );
}
