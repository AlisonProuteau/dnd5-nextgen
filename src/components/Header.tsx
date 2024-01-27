import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import { Fragment, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { signOut } from '../api/users';
import { useAuth } from '../providers/AuthProvider';

export function Header() {
  const [navigationMenuOpen, setNavigationMenuOpen] = useState(false);
  const menuButtonRef = useRef<Element>();
  const user = useAuth();

  const navigate = useNavigate();
  const navigationMenuClick = (location?: string) => {
    setNavigationMenuOpen(false);

    if (location) navigate(location);
  };

  return (
    <Fragment>
      <Box sx={{ flexGrow: 1, marginBottom: '1rem' }}>
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <IconButton
              aria-label="open drawer"
              size="large"
              edge="start"
              onClick={() => setNavigationMenuOpen(true)}
              ref={(current: HTMLButtonElement) => {
                menuButtonRef.current = current;
              }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              keepMounted
              id="navigation-menu"
              anchorEl={menuButtonRef.current}
              open={navigationMenuOpen}
              onClose={() => navigationMenuClick()}
            >
              <MenuItem onClick={() => navigationMenuClick('/')}>Home</MenuItem>
              <MenuItem onClick={() => navigationMenuClick('/infos')}>Infos</MenuItem>
            </Menu>
            <IconButton
              size="large"
              edge="end"
              onClick={() => (user ? signOut() : navigationMenuClick('/auth'))}
            >
              {user ? <LogoutIcon /> : <AccountCircle />}
            </IconButton>
          </Toolbar>
        </AppBar>
      </Box>

      <Outlet />
    </Fragment>
  );
}
