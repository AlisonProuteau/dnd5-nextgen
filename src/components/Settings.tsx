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
import { useQueryClient } from '@tanstack/react-query';
import { VERSIONS, type Version } from '@utils/versions.constants';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { database } from 'src/firebase';
import { useAuth } from '../providers/AuthProvider';

export function Settings() {
  const { user, version: currentUserVersion } = useAuth();
  const [selectedVersion, setSelectedVersion] = useState<Version>('Legacy');
  const [isLoading, setIsLoading] = useState(false);
  const client = useQueryClient();
  const navigate = useNavigate();

  const handleSubmitVersion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (user) {
      updateDoc(doc(database, 'users', user.uid), { version: selectedVersion })
        .then(async () => {
          await client.invalidateQueries({ queryKey: ['fetchUserData', user.uid] });
          navigate(`/`);
          toast.success('Game version updated');
        })
        .catch((error) =>
          toast.error(`Something went wrong ${(error as Error).message || 'Error'}`)
        )
        .finally(() => setIsLoading(false));
    } else setIsLoading(false);
  };

  useEffect(() => {
    if (currentUserVersion && currentUserVersion !== selectedVersion)
      setSelectedVersion(currentUserVersion);
  }, [currentUserVersion]);

  return (
    <Container>
      <div data-testid="user-info">
        <Typography>User: {user?.displayName}</Typography>
        <Typography>Email: {user?.email}</Typography>
      </div>
      <form onSubmit={handleSubmitVersion} data-testid="version-form">
        <FormControl fullWidth disabled={!user || isLoading}>
          <InputLabel html-for="version-select">Version</InputLabel>
          <Select
            id="version-select"
            name="version"
            value={selectedVersion}
            label="Age"
            data-testid="version-select"
            onChange={({ target }) => setSelectedVersion((target.value as Version) || null)}
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
            disabled={selectedVersion !== 'Legacy'}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>

          {selectedVersion !== 'Legacy' && (
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
