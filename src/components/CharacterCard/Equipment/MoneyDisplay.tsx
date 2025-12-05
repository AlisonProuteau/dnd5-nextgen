import { CoinsIcon } from '@assets';
import { Box, type BoxProps, Typography } from '@mui/material';
import { getCoinColor } from '@utils/ui';
import { MoneyUnits, type MoneyUnitType } from '@representations/campaign/equipment.representation';

export function MoneyDisplay({
  purse,
  ...props
}: { purse?: Record<MoneyUnitType, number> } & BoxProps) {
  return (
    <Box {...props} sx={{ ...props.sx, '& > *': { my: '-5px' } }} data-testid="inventory-money">
      {MoneyUnits.map((coin) => (
        <Box key={coin} display="flex" columnGap="5px" alignItems="center" data-testid={coin}>
          <Typography>{purse?.[coin] || 0}</Typography>
          <CoinsIcon height="20px" width="20px" fill={getCoinColor(coin)} />
        </Box>
      ))}
    </Box>
  );
}
