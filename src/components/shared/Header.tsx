import { Home } from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { Button, Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { updateProfile } from 'firebase/auth';
import { Fragment, useState, type FormEvent } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { signOut } from '../../api/users';
import { useAuth } from '../../providers/AuthProvider';
import { ControledInput } from './ControledInput';
import { StyledModal } from './StyledModal';

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
                <Link to="/" aria-label="home" css={{ color: 'white' }}>
                  <Home />
                </Link>
              </Fragment>
            ) : (
              <Link to="/auth" css={{ color: 'white' }}>
                <AccountCircle />
              </Link>
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
