import { useMemo } from 'react';
import { CoinsIcon } from '@assets';
import { Box, type BoxProps, Typography } from '@mui/material';
import { remainingMoneyInCopper, updatePurse } from '@utils/character';
import { getCoinColor } from '@utils/ui';
import {
  type AdditionalMoneyUnitType,
  type MoneyObjectType,
  MoneyUnits,
  type MoneyUnitType,
  StandardMoneyUnits
} from '@representations/campaign/equipment.representation';
import { useAuth } from 'src/providers/AuthProvider';

interface MonayDisplayProps {
  purse?: MoneyObjectType;
  showZero?: boolean;
}

export function MoneyDisplay({ purse, showZero = true, ...props }: MonayDisplayProps & BoxProps) {
  const { additionalCurrencies = [] } = useAuth();

  const consolidatedPurse: MoneyObjectType = useMemo(
    () => updatePurse(purse, {}, additionalCurrencies),
    [purse, additionalCurrencies]
  );

  const shouldShowCoin = (coin: MoneyUnitType) => {
    if (remainingMoneyInCopper(purse, {}) === 0 && coin === 'cp') return true;
    const hasValue = (consolidatedPurse?.[coin] ?? 0) > 0;

    return StandardMoneyUnits.includes(coin as any) ||
      additionalCurrencies.includes(coin as AdditionalMoneyUnitType)
      ? showZero || hasValue
      : false;
  };

  return (
    <Box {...props} sx={{ ...props.sx, '& > *': { my: '-5px' } }} data-testid="money-display">
      {MoneyUnits.map(
        (coin) =>
          shouldShowCoin(coin) && (
            <Box key={coin} display="flex" columnGap="5px" alignItems="center" data-testid={coin}>
              <Typography>{consolidatedPurse?.[coin] || 0}</Typography>
              <CoinsIcon height="20px" width="20px" fill={getCoinColor(coin)} />
            </Box>
          )
      )}
    </Box>
  );
}
