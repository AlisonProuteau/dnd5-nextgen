import { useEffect, useState } from 'react';
import { CoinsIcon } from '@assets';
import { Box, Button, Dialog, Typography } from '@mui/material';
import { isEqual } from 'lodash';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useForm } from '@hooks/useForm';
import { Loader } from '@shared/Loader';
import { NumberInput } from '@shared/NumberInput';
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
import { MoneyDisplay } from './MoneyDisplay';

interface MoneyManagerProps {
  characterId: string;
  isMoneyDialogOpen: boolean;
  closeMoneyDialog: () => void;
  currentAmount?: MoneyObjectType;
}

export function MoneyManager({
  characterId,
  isMoneyDialogOpen,
  closeMoneyDialog,
  currentAmount = { gp: 0, sp: 0, cp: 0 }
}: MoneyManagerProps) {
  const { additionalCurrencies = [] } = useAuth();
  const form = useForm<MoneyObjectType>({ initialData: { gp: 0, sp: 0, cp: 0 } });
  const [isUpdating, setIsUpdating] = useState(false);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', characterId],
    successMessages: {
      update: 'Money Updated'
    }
  });

  const onSave = async () => {
    if (form.isValid === false) return;

    const updatedPurse = updatePurse(currentAmount, form.formData, additionalCurrencies);
    await firebaseCrud.update(characterId, { money: updatedPurse });

    closeMoneyDialog();
  };

  useEffect(() => {
    if (!isMoneyDialogOpen) form.resetForm();
  }, [isMoneyDialogOpen]);

  const shouldShowCoin = (coin: MoneyUnitType) =>
    StandardMoneyUnits.includes(coin as any) ||
    additionalCurrencies.includes(coin as AdditionalMoneyUnitType);

  return (
    <Dialog open={isMoneyDialogOpen} onClose={closeMoneyDialog} fullWidth>
      <Box display="flex" flexDirection="column" p={3} gap={2}>
        <Typography variant="h6">Manage Money</Typography>

        <Box display="flex" flexDirection="column" alignSelf="center" gap={3}>
          <Box display="flex" flexDirection="column" gap={1}>
            {MoneyUnits.map(
              (unit) =>
                shouldShowCoin(unit) && (
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
                      onInputChange={(e) => {
                        setIsUpdating(true);
                        const parsed = parseInt(e.target.value) || 0;
                        if (parsed && !isNaN(parsed)) form.setFormData({ [unit]: parsed });
                      }}
                      onChange={(_, v) => {
                        form.setFormData({ [unit]: v });
                        setIsUpdating(false);
                      }}
                      onBlur={() => setIsUpdating(false)}
                    />
                  </Box>
                )
            )}
          </Box>

          <MoneyDisplay
            display="inline-flex"
            gap="5px"
            justifyContent="center"
            sx={{ float: 'right' }}
            purse={updatePurse(currentAmount, form.formData, additionalCurrencies)}
          />
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <Button
            key="update-money"
            id="update-money"
            disabled={
              isUpdating ||
              remainingMoneyInCopper(currentAmount, form.formData) < 0 ||
              isEqual(
                currentAmount,
                updatePurse(currentAmount, form.formData, additionalCurrencies)
              ) ||
              firebaseCrud.isLoading
            }
            onClick={onSave}
          >
            {firebaseCrud.isLoading ? <Loader data-testid="loading" /> : 'Save'}
          </Button>
          <Button onClick={closeMoneyDialog}>Cancel</Button>
        </Box>
      </Box>
    </Dialog>
  );
}
