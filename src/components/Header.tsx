import { signOut } from '@api/users';
import { Help, Home, Menu as MenuIcon, Settings, Star } from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { ControledInput } from '@shared/ControledInput';
import { StyledModal } from '@shared/StyledModal';
import { button, linkButton } from '@utils/style.utils';
import { updateProfile } from 'firebase/auth';
import { Fragment, useMemo, useState, type FormEvent } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export function Header() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openUsername, setOpenUsername] = useState(true);
  const [username, setUsername] = useState<string>();
  const { user } = useAuth();

  const handleSubmitUsername = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpenUsername(false);

    if (user) await updateProfile(user, { displayName: username });
  };

  const MenuItems = useMemo(
    () => [
      {
        icon: <Settings />,
        title: 'Settings',
        id: 'settings',
        link: '/settings'
      },
      {
        icon: <Help />,
        title: 'Contact',
        id: 'contact',
        link: '/contact'
      },
      {
        icon: <Star />,
        title: 'Character Generator',
        id: 'character-generator',
        link: '/character-generator',
        hidden: user?.uid !== '8lFf6wEj9ARVlilMOrOxYDZOkSS2'
      }
      // TODO: { icon:<Info /> , title: 'Info', id: 'info', link: '/' }
    ],
    [user?.uid]
  );

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

                  <IconButton
                    size="large"
                    edge="end"
                    onClick={({ currentTarget }) => setAnchorEl(currentTarget)}
                    aria-haspopup="true"
                  >
                    <MenuIcon />
                  </IconButton>

                  <Menu
                    keepMounted
                    open={!!anchorEl}
                    onClose={() => setAnchorEl(null)}
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right'
                    }}
                  >
                    {MenuItems.map(
                      (item) =>
                        !item.hidden && (
                          <MenuItem key={`menu-item-${item.id}`}>
                            <Link
                              to={item.link}
                              aria-label={item.id}
                              css={{ ...linkButton, textDecoration: 'unset', gap: '5px' }}
                            >
                              {item.icon}
                              <Typography> {item.title}</Typography>
                            </Link>
                          </MenuItem>
                        )
                    )}
                  </Menu>
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
