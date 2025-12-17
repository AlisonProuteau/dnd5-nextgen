import { CoinsIcon } from '@assets';
import { Box, type BoxProps, Typography } from '@mui/material';
import { getCoinColor } from '@utils/ui';
import {
  type AdditionalMoneyUnitType,
  type MoneyObjectType,
  MoneyUnits,
  type MoneyUnitType,
  StandardMoneyUnits
} from '@representations/campaign/equipment.representation';

interface MonayDisplayProps {
  purse?: MoneyObjectType;
  showZero?: boolean;
  additionalCurrencies?: AdditionalMoneyUnitType[];
}

export function MoneyDisplay({
  purse,
  showZero = true,
  additionalCurrencies = [],
  ...props
}: MonayDisplayProps & BoxProps) {
  const shouldShowCoin = (coin: MoneyUnitType) => {
    const hasValue = (purse?.[coin] ?? 0) > 0;

    return StandardMoneyUnits.includes(coin as any) ||
      additionalCurrencies.includes(coin as AdditionalMoneyUnitType)
      ? showZero || hasValue
      : false;
  };

  return (
    <Box {...props} sx={{ ...props.sx, '& > *': { my: '-5px' } }} data-testid="inventory-money">
      {MoneyUnits.map(
        (coin) =>
          shouldShowCoin(coin) && (
            <Box key={coin} display="flex" columnGap="5px" alignItems="center" data-testid={coin}>
              <Typography>{purse?.[coin] || 0}</Typography>
              <CoinsIcon height="20px" width="20px" fill={getCoinColor(coin)} />
            </Box>
          )
      )}
    </Box>
  );
}
