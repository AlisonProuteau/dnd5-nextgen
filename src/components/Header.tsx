import { signOut } from '@api/users';
import { Home, Settings } from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box, Button, Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { ControledInput } from '@shared/ControledInput';
import { StyledModal } from '@shared/StyledModal';
import { button, linkButton } from '@utils/style.utils';
import { updateProfile } from 'firebase/auth';
import { Fragment, useState, type FormEvent } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export function Header() {
  const [openUsername, setOpenUsername] = useState(true);
  const [username, setUsername] = useState<string>();
  const [user] = useAuth();

  const handleSubmitUsername = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpenUsername(false);

    if (user) await updateProfile(user, { displayName: username });
  };

  return (
    <Fragment>
      <Box sx={{ flexGrow: 1, marginBottom: '1rem' }}>
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: 'space-between', flexDirection: 'row-reverse' }}>
            {user ? (
              <Fragment>
                <Box display="flex" alignItems="center">
                  <Typography>{user.displayName || user.email}</Typography>
                  <IconButton size="large" edge="end" onClick={() => user && signOut()}>
                    <LogoutIcon />
                  </IconButton>
                </Box>

                <Box display="flex" alignItems="center">
                  <Box sx={button}>
                    <Link to="/" aria-label="home" css={linkButton}>
                      <Home />
                    </Link>
                  </Box>

                  <Box sx={button}>
                    <Link to="/version" aria-label="version selection" css={linkButton}>
                      <Settings />
                    </Link>
                  </Box>
                </Box>
              </Fragment>
            ) : (
              <Box sx={button}>
                <Link to="/auth" css={linkButton}>
                  <AccountCircle />
                </Link>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      </Box>

      <Outlet />

      {user && !user.displayName && (
        <StyledModal
          open={openUsername}
          onClose={() => setOpenUsername(false)}
          title="Update your display name"
        >
          <form onSubmit={handleSubmitUsername}>
            <ControledInput
              fullWidth
              required
              id="name"
              type="name"
              label="Display name"
              onChange={(name) => setUsername(name?.toString())}
            />
            <Button sx={{ marginTop: '1rem' }} fullWidth type="submit" variant="contained">
              Submit
            </Button>
          </form>
        </StyledModal>
      )}
    </Fragment>
  );
}
