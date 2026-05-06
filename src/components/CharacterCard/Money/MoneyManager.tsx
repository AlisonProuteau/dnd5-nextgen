import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CoinsIcon } from '@assets';
import { Box, Button, Dialog, Typography } from '@mui/material';
import { isEqual } from 'lodash';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { Loader } from '@shared/Loader';
import { NumberInput } from '@shared/NumberInput';
import { formatActionRecord, formatMoneyRecord } from '@utils/actions.utils';
import { remainingMoneyInCopper, updatePurse } from '@utils/character/character.utils';
import { getCoinColor } from '@utils/ui/ui.utils';
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
  const { handleSubmit, watch, control, reset } = useForm<MoneyObjectType>({
    mode: 'onChange',
    defaultValues: { gp: 0, sp: 0, cp: 0 }
  });
  const money = watch();

  const { logAction } = useActionRecord(characterId);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', characterId],
    successMessages: {
      update: 'Money Updated'
    }
  });

  const onSubmit = async (changes: MoneyObjectType) => {
    const updatedPurse = updatePurse(currentAmount, changes, additionalCurrencies);
    const success = await firebaseCrud.update(characterId, { money: updatedPurse });

    const actionRecordData = formatMoneyRecord(changes, currentAmount, updatedPurse);
    if (success && actionRecordData) await logAction(formatActionRecord('money', actionRecordData));

    closeMoneyDialog();
  };

  useEffect(() => {
    if (!isMoneyDialogOpen) reset();
  }, [isMoneyDialogOpen, reset]);

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
                    <Controller
                      name={unit}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          id={`money-units-${unit}`}
                          value={field.value || 0}
                          onClick={(e) => e.preventDefault()}
                          onChange={(_, v) => field.onChange(v ?? 0)}
                        />
                      )}
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
            purse={updatePurse(currentAmount, money, additionalCurrencies)}
          />
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <Button
            key="update-money"
            id="update-money"
            disabled={
              remainingMoneyInCopper(currentAmount, money) < 0 ||
              isEqual(currentAmount, updatePurse(currentAmount, money, additionalCurrencies)) ||
              firebaseCrud.isLoading
            }
            onClick={handleSubmit(onSubmit)}
          >
            {firebaseCrud.isLoading ? <Loader data-testid="loading" /> : 'Save'}
          </Button>
          <Button onClick={closeMoneyDialog}>Cancel</Button>
        </Box>
      </Box>
    </Dialog>
  );
}
