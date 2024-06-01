import { Home } from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { Fragment } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { signOut } from '../../api/users';
import { useAuth } from '../../providers/AuthProvider';

export function Header() {
  const navigate = useNavigate();
  const user = useAuth();

  return (
    <Fragment>
      <Box sx={{ flexGrow: 1, marginBottom: '1rem' }}>
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: 'space-between', flexDirection: 'row-reverse' }}>
            <IconButton
              size="large"
              edge="end"
              onClick={() => {
                if (user) signOut();
                navigate('/auth');
              }}
            >
              {user ? <LogoutIcon /> : <AccountCircle />}
            </IconButton>
            {user && (
              <IconButton aria-label="home" size="large" edge="start" onClick={() => navigate('/')}>
                <Home />
              </IconButton>
            )}
          </Toolbar>
        </AppBar>
      </Box>

      <Outlet />
    </Fragment>
  );
}
