import { type FormEvent, useEffect } from 'react';
import { InfoOutlined } from '@mui/icons-material';
import {
  Button,
  Checkbox,
  CircularProgress,
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
import { useFirebaseCrud, useForm } from '@hooks/index';
import { type Version, VERSIONS } from '@utils/constants';
import {
  AdditionalMoneyUnits,
  type AdditionalMoneyUnitType
} from '@representations/campaign/equipment.representation';
import { useAuth } from 'src/providers/AuthProvider';

interface SettingsFormData {
  version: Version;
  additionalCurrencies: AdditionalMoneyUnitType[];
}

enum CurrencyLabels {
  ep = 'Electrum Pieces (ep)',
  pp = 'Platinum Pieces (pp)'
}

export function Settings() {
  const {
    user,
    version: currentUserVersion,
    additionalCurrencies: currentAdditionalCurrencies
  } = useAuth();
  const form = useForm<SettingsFormData>({
    initialData: {
      version: currentUserVersion,
      additionalCurrencies: currentAdditionalCurrencies || []
    }
  });
  const firebaseCrud = useFirebaseCrud<SettingsFormData>({
    collectionPath: 'users',
    invalidateQueryKey: ['fetchUserData'],
    successMessages: { update: 'Settings updated' },
    redirect: { update: { path: '/' } }
  });

  const handleSubmitVersion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.uid) return;

    await firebaseCrud.update(user.uid, {
      version: form.formData.version,
      additionalCurrencies: form.formData.additionalCurrencies
    });
  };

  const handleCurrencyToggle = (currency: AdditionalMoneyUnitType) => {
    const current = form.formData.additionalCurrencies || [];
    const updated = current.includes(currency)
      ? current.filter((c) => c !== currency)
      : [...current, currency];
    form.setFormData({ ...form.formData, additionalCurrencies: updated });
  };

  useEffect(() => {
    const updates: Partial<SettingsFormData> = {};
    if (currentUserVersion && currentUserVersion !== form.formData.version) {
      updates.version = currentUserVersion;
    }
    if (
      JSON.stringify(currentAdditionalCurrencies) !==
      JSON.stringify(form.formData.additionalCurrencies)
    ) {
      updates.additionalCurrencies = currentAdditionalCurrencies || [];
    }

    if (Object.keys(updates).length > 0) form.setFormData({ ...updates });
  }, [currentUserVersion, currentAdditionalCurrencies]);

  return (
    <Container>
      <Box data-testid="user-info" marginBottom={2}>
        <Typography>User: {user?.displayName}</Typography>
        <Typography>Email: {user?.email}</Typography>
      </Box>
      <form onSubmit={handleSubmitVersion} data-testid="version-form">
        <FormControl fullWidth disabled={!user || firebaseCrud.isLoading}>
          <FormGroup data-testid="version-select">
            <InputLabel htmlFor="version-select">Version</InputLabel>
            <Select
              id="version-select"
              value={form.formData.version}
              label="Version"
              onChange={({ target }) =>
                form.setFormData({ version: (target.value as Version) || 'Legacy' })
              }
            >
              {VERSIONS?.map((current) => (
                <MenuItem key={`version-${current}`} value={current} data-testid="version-option">
                  {current}
                </MenuItem>
              ))}
            </Select>
          </FormGroup>

          <FormGroup data-testid="additional-currencies" sx={{ marginTop: 1 }}>
            <FormLabel component="legend">Additional Currencies</FormLabel>
            {AdditionalMoneyUnits.map((currency) => (
              <FormControlLabel
                key={currency}
                control={
                  <Checkbox
                    checked={(form.formData.additionalCurrencies || []).includes(currency)}
                    onChange={() => handleCurrencyToggle(currency)}
                    data-testid={`currency-${currency}`}
                    sx={{ paddingY: 0.5 }}
                  />
                }
                label={CurrencyLabels[currency]}
              />
            ))}
          </FormGroup>

          <Button
            sx={{ marginTop: 2 }}
            type="submit"
            variant="contained"
            disabled={form.formData.version !== 'Legacy'}
          >
            {firebaseCrud.isLoading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>

          {form.formData.version !== 'Legacy' && (
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
    </Container>
  );
}
