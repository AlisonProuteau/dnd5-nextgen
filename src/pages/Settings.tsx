import { type FormEvent, useEffect } from 'react';
import { InfoOutlined } from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { Container } from '@mui/system';
import { useFirebaseCrud, useForm } from '@hooks/index';
import { type Version, VERSIONS } from '@utils/constants';
import { useAuth } from 'src/providers/AuthProvider';

interface SettingsFormData {
  version: Version;
}

export function Settings() {
  const { user, version: currentUserVersion } = useAuth();
  const form = useForm<SettingsFormData>({
    initialData: { version: 'Legacy' }
  });
  const firebaseCrud = useFirebaseCrud<SettingsFormData>({
    collectionPath: 'users',
    invalidateQueryKey: ['fetchUserData'],
    successMessages: { update: 'Game version updated' },
    redirect: { update: { path: '/' } }
  });

  const handleSubmitVersion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.uid) return;

    await firebaseCrud.update(user.uid, { version: form.formData.version });
  };

  useEffect(() => {
    if (currentUserVersion && currentUserVersion !== form.formData.version)
      form.setFormData({ version: currentUserVersion });
  }, [currentUserVersion]);

  return (
    <Container>
      <div data-testid="user-info">
        <Typography>User: {user?.displayName}</Typography>
        <Typography>Email: {user?.email}</Typography>
      </div>
      <form onSubmit={handleSubmitVersion} data-testid="version-form">
        <FormControl fullWidth disabled={!user || firebaseCrud.isLoading}>
          <InputLabel htmlFor="version-select">Version</InputLabel>
          <Select
            id="version-select"
            value={form.formData.version}
            label="Version"
            onChange={({ target }) =>
              form.setFormData({ version: (target.value as Version) || 'Legacy' })
            }
            data-testid="version-select"
          >
            {VERSIONS?.map((current) => (
              <MenuItem key={`version-${current}`} value={current} data-testid="version-option">
                {current}
              </MenuItem>
            ))}
          </Select>

          <Button
            sx={{ marginTop: '1rem' }}
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
