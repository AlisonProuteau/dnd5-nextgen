import { useEffect } from 'react';
import { CoinsIcon } from '@assets';
import { Box, Button, CircularProgress, Dialog, Typography } from '@mui/material';
import { isEqual } from 'lodash';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useForm } from '@hooks/useForm';
import { NumberInput } from '@shared/NumberInput';
import { remainingMoneyInCopper, updatePurse } from '@utils/character';
import { getCoinColor } from '@utils/ui';
import { MoneyUnits, type MoneyUnitType } from '@representations/campaign/equipment.representation';
import { MoneyDisplay } from './MoneyDisplay';

interface MoneyManagerProps {
  characterId: string;
  isMoneyDialogOpen: boolean;
  closeMoneyDialog: () => void;
  currentAmount?: Record<MoneyUnitType, number>;
}

export function MoneyManager({
  characterId,
  isMoneyDialogOpen,
  closeMoneyDialog,
  currentAmount = { gp: 0, sp: 0, cp: 0 }
}: MoneyManagerProps) {
  const form = useForm({ initialData: { gp: 0, sp: 0, cp: 0 } });
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter'],
    successMessages: {
      update: 'Money Updated'
    }
  });

  const onSave = async () => {
    if (form.isValid === false) return;

    const updatedPurse = updatePurse(currentAmount, form.formData);
    await firebaseCrud.update(characterId, { money: updatedPurse });

    closeMoneyDialog();
  };

  useEffect(() => {
    if (!isMoneyDialogOpen) form.resetForm();
  }, [isMoneyDialogOpen]);

  return (
    <Dialog open={isMoneyDialogOpen} onClose={closeMoneyDialog} fullWidth>
      <Box display="flex" flexDirection="column" p={3} gap={2}>
        <Typography variant="h6">Manage Money</Typography>

        <Box display="flex" flexDirection="column" alignSelf="center" gap={3}>
          <Box display="flex" flexDirection="column" gap={1}>
            {MoneyUnits.map((unit) => (
              <Box
                key={`money-units-${unit}`}
                display="flex"
                alignItems="center"
                flexDirection="column"
              >
                <CoinsIcon height="20px" width="20px" fill={getCoinColor(unit)} />
                <NumberInput
                  id={`money-units-${unit}`}
                  value={form.formData[unit] || 0}
                  onClick={(e) => e.preventDefault()}
                  onChange={(_, v) => {
                    form.setFormData({ [unit]: v });
                  }}
                />
              </Box>
            ))}
          </Box>

          <MoneyDisplay
            display="inline-flex"
            gap="5px"
            justifyContent="center"
            sx={{ float: 'right' }}
            purse={updatePurse(currentAmount, form.formData)}
          />
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <Button
            key="update-money"
            id="update-money"
            disabled={
              remainingMoneyInCopper(currentAmount, form.formData) < 0 ||
              isEqual(currentAmount, updatePurse(currentAmount, form.formData)) ||
              firebaseCrud.isLoading
            }
            onClick={onSave}
          >
            {firebaseCrud.isLoading ? <CircularProgress data-testid="loading" /> : 'Save'}
          </Button>
          <Button onClick={closeMoneyDialog}>Cancel</Button>
        </Box>
      </Box>
    </Dialog>
  );
}
