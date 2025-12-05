import { Fragment, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import type { Equipment, MoneyUnitType } from '@representations/campaign/equipment.representation';
import { EquipmentList } from './EquipmentList';
import { MoneyDisplay } from './MoneyDisplay';

interface MarketProps {
  purse: Record<MoneyUnitType, number>;
  ownedEquipment: (Equipment & { count?: number })[];
}

// TODO: Buy/Sell equipment
export function Market({ purse, ownedEquipment }: MarketProps) {
  const [mode, setMode] = useState<'sell' | 'buy'>('sell');

  return (
    <Fragment>
      <DialogTitle display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="baseline" gap="5px">
          Market
        </Box>
        <MoneyDisplay display="flex" justifySelf="center" purse={purse} />
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <ButtonGroup
          variant="text"
          disableElevation
          onClick={({ target }) => {
            const selected = (target as HTMLButtonElement).id;
            if (selected == 'buy' || selected === 'sell') setMode(selected as 'buy' | 'sell');
          }}
          sx={{ alignSelf: 'center' }}
        >
          <Button id="buy" disabled={mode === 'buy'}>
            Buy
          </Button>
          <Button id="sell" disabled={mode === 'sell'}>
            Sell
          </Button>
        </ButtonGroup>
        <DialogContentText textAlign="justify">
          {mode === 'sell' ? <EquipmentList equipmentList={ownedEquipment} /> : 'Buy'}
        </DialogContentText>
      </DialogContent>
    </Fragment>
  );
}
