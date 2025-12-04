import { CoinsIcon } from '@assets';
import { Box, Button, Dialog, FormControl, Typography } from '@mui/material';
import { NumberInput } from '@shared/NumberInput';
import { addMoney, removeMoney } from '@utils/character';
import { getCoinColor } from '@utils/ui';
import { MoneyUnits, type MoneyUnitType } from '@representations/campaign/equipment.representation';
import { MoneyDisplay } from './MoneyDisplay';

interface MoneyManagerProps {
  currentAmount?: Record<MoneyUnitType, number>;
  isMoneyDialogOpen: boolean;
  closeMoneyDialog: () => void;
}

// TODO: Check current money display
// TODO: Add 'edit' button?
//  TODO: Add test ids?
export function MoneyManager({
  currentAmount,
  isMoneyDialogOpen,
  closeMoneyDialog
}: MoneyManagerProps) {
  const getFormMoneyData = (formData: HTMLFormElement) =>
    formData
      ? MoneyUnits.reduce(
          (total, currentUnit) => {
            const inputElement = formData.querySelector(
              `#money-units-${currentUnit}`
            ) as HTMLInputElement;

            return { ...total, [currentUnit]: Number(inputElement?.value || 0) };
          },
          {} as Record<MoneyUnitType, number>
        )
      : undefined;

  return (
    <Dialog open={isMoneyDialogOpen} onClose={closeMoneyDialog} fullWidth>
      <Box display="flex" flexDirection="column" p={3} gap={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Manage Money</Typography>

          <MoneyDisplay
            display="inline-flex"
            gap="5px"
            justifyContent="center"
            sx={{ float: 'right' }}
            purse={currentAmount}
          />
        </Box>

        <Box alignSelf="center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const money = getFormMoneyData(e.currentTarget as HTMLFormElement);
              const button = (e.nativeEvent as SubmitEvent).submitter?.id;

              // TODO: Should it just be update instead with allowing < 0?
              // TODO: Update character money state
              if (button && money)
                console.log(
                  button,
                  button.includes('Add')
                    ? addMoney(currentAmount, money)
                    : removeMoney(currentAmount, money)
                );
            }}
          >
            <FormControl fullWidth sx={{ display: 'flex', flexDirection: 'column' }}>
              {MoneyUnits.map((unit) => (
                <Box key={`money-units-${unit}`} display="flex" alignItems="center" gap={1}>
                  <NumberInput
                    id={`money-units-${unit}`}
                    min={0}
                    defaultValue={0}
                    onClick={(e) => e.preventDefault()}
                  />
                  <CoinsIcon height="20px" width="20px" fill={getCoinColor(unit)} />
                </Box>
              ))}

              <Box display="flex" gap={2} marginTop={1}>
                {['Add', 'Remove'].map((type) => (
                  <Button
                    key={type}
                    id={type}
                    variant="contained"
                    color={type === 'Add' ? 'primary' : 'secondary'}
                    type="submit"
                  >
                    {type}
                  </Button>
                ))}
              </Box>
            </FormControl>
          </form>
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <Button onClick={closeMoneyDialog}>Close</Button>
        </Box>
      </Box>
    </Dialog>
  );
}
