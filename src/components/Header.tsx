import { signOut } from '@api/users';
import { Home } from '@mui/icons-material';
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
  const [open, setOpen] = useState(true);
  const [username, setUsername] = useState<string>();
  const user = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(false);

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

                <Box sx={button}>
                  <Link to="/" aria-label="home" css={linkButton}>
                    <Home />
                  </Link>
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
        <StyledModal open={open} onClose={() => setOpen(false)} title="Update your display name">
          <form onSubmit={handleSubmit}>
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
