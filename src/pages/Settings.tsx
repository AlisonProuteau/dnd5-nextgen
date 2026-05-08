import { Fragment, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { InfoOutlined } from '@mui/icons-material';
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { Box, Container } from '@mui/system';
import { useFirebaseCrud } from '@hooks/index';
import { FullPageLoader } from '@shared/Loader';
import { type Version, VERSIONS } from '@utils/constants/versions.constants';
import { CurrencyLabels } from '@utils/ui/ui.utils';
import {
  AdditionalMoneyUnits,
  type AdditionalMoneyUnitType
} from '@representations/campaign/equipment.representation';
import { useAuth } from 'src/providers/AuthProvider';

interface SettingsFormData {
  version: Version;
  additionalCurrencies: AdditionalMoneyUnitType[];
}

export function Settings() {
  const {
    user,
    version: currentUserVersion,
    additionalCurrencies: currentAdditionalCurrencies
  } = useAuth();

  const { control, handleSubmit, watch, reset } = useForm<SettingsFormData>({
    mode: 'onChange',
    defaultValues: {
      version: currentUserVersion || 'Legacy',
      additionalCurrencies: currentAdditionalCurrencies || []
    }
  });

  const version = watch('version');

  const firebaseCrud = useFirebaseCrud<SettingsFormData>({
    collectionPath: 'users',
    invalidateQueryKey: ['fetchUserData'],
    successMessages: { update: 'Settings updated' },
    redirect: { update: { path: '/' } }
  });

  const onSubmit = async (data: SettingsFormData) => {
    if (!user?.uid) return;

    await firebaseCrud.update(user.uid, {
      version: data.version,
      additionalCurrencies: data.additionalCurrencies
    });
  };

  useEffect(() => {
    reset({
      version: currentUserVersion || 'Legacy',
      additionalCurrencies: currentAdditionalCurrencies || []
    });
  }, [currentUserVersion, currentAdditionalCurrencies, reset]);

  return (
    <Container>
      <Box data-testid="user-info" marginBottom={2}>
        <Typography>User: {user?.displayName}</Typography>
        <Typography>Email: {user?.email}</Typography>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)} data-testid="version-form">
        <FormControl fullWidth disabled={!user || firebaseCrud.isLoading}>
          <FormGroup data-testid="version-select">
            <InputLabel htmlFor="version-select">Version</InputLabel>
            <Controller
              name="version"
              control={control}
              render={({ field }) => (
                <Select id="version-select" label="Version" {...field}>
                  {VERSIONS?.map((current) => (
                    <MenuItem
                      key={`version-${current}`}
                      value={current}
                      data-testid="version-option"
                    >
                      {current}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormGroup>

          <FormGroup data-testid="additional-currencies" sx={{ marginTop: 1 }}>
            <FormLabel component="legend">Additional Currencies</FormLabel>
            <Controller
              name="additionalCurrencies"
              control={control}
              render={({ field }) => (
                <Fragment>
                  {AdditionalMoneyUnits.map((currency) => (
                    <FormControlLabel
                      key={currency}
                      control={
                        <Checkbox
                          checked={(field.value || []).includes(currency)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            const updated = isChecked
                              ? [...(field.value || []), currency]
                              : (field.value || []).filter((c) => c !== currency);
                            field.onChange(updated);
                          }}
                          data-testid={`currency-${currency}`}
                          sx={{ paddingY: 0.5 }}
                        />
                      }
                      label={`${CurrencyLabels[currency]} (${currency})`}
                    />
                  ))}
                </Fragment>
              )}
            />
          </FormGroup>

          <Button
            sx={{ marginTop: 2 }}
            type="submit"
            variant="contained"
            disabled={version !== 'Legacy'}
          >
            Submit
          </Button>

          {version !== 'Legacy' && (
            <Typography
              color="warning"
              variant="overline"
              textTransform="none"
              align="center"
              data-testid="helper-text"
            >
              <InfoOutlined
                fontSize="small"
                sx={{ verticalAlign: 'middle', paddingRight: '3px' }}
              />
              Version not yet available
            </Typography>
          )}
        </FormControl>
      </form>

      <FullPageLoader open={firebaseCrud.isLoading} />
    </Container>
  );
}
