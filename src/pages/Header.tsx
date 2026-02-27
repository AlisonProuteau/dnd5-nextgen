import { Fragment, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Outlet } from 'react-router-dom';
import { Add, Help, Home, Menu as MenuIcon, Settings, Star } from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { updateProfile } from 'firebase/auth';
import { signOut } from '@api/users';
import { ControledInput } from '@shared/ControledInput';
import { StyledModal } from '@shared/StyledModal';
import { button, linkButton } from '@utils/ui/style.utils';
import type { Character } from '@representations/user.representation';
import { useToggle } from '../hooks';
import { useAuth } from '../providers/AuthProvider';

export interface DefaultProps {
  character: Character;
}

export function Header() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { isOn: openUsername, turnOff: closeUsername } = useToggle(true);
  const { user } = useAuth();
  const { register, handleSubmit } = useForm<{ displayName: string }>({
    mode: 'onChange',
    defaultValues: { displayName: '' }
  });

  const onSubmit = async (data: { displayName: string }) => {
    closeUsername();
    if (user && data.displayName) {
      await updateProfile(user, { displayName: data.displayName });
    }
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
        icon: <Add />,
        title: 'Database Editor',
        id: 'database',
        link: '/database',
        hidden: user?.uid !== import.meta.env.FIREBASE_ADMIN_UID
      },
      {
        icon: <Star />,
        title: 'Character Generator',
        id: 'character-generator',
        link: '/character-generator',
        hidden: user?.uid !== import.meta.env.FIREBASE_ADMIN_UID
      }
    ],
    [user?.uid]
  );

  return (
    <Fragment>
      <Box sx={{ flexGrow: 1, marginBottom: '1rem' }}>
        <AppBar sx={{ position: 'fixed', top: 0, zIndex: 1000 }}>
          <Toolbar
            variant="dense"
            sx={{ justifyContent: 'space-between', flexDirection: 'row-reverse' }}
          >
            {user ? (
              <Fragment>
                <Box display="flex" alignItems="center">
                  <Typography data-testid="user-display-name">
                    {user.displayName || user.email}
                  </Typography>
                  <IconButton
                    size="large"
                    edge="end"
                    onClick={() => user && signOut()}
                    data-testid="logout-button"
                  >
                    <LogoutIcon />
                  </IconButton>
                </Box>

                <Box display="flex" alignItems="center">
                  <Box sx={{ ...button, backgroundColor: 'transparent' }}>
                    <Link to="/" aria-label="home" data-testid="home-link" css={linkButton}>
                      <Home />
                    </Link>
                  </Box>

                  <IconButton
                    size="large"
                    edge="end"
                    onClick={({ currentTarget }) => setAnchorEl(currentTarget)}
                    aria-haspopup="true"
                    data-testid="menu-button"
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
                          <MenuItem
                            key={`menu-item-${item.id}`}
                            data-testid={`menu-item-${item.id}`}
                          >
                            <Link
                              to={item.link}
                              aria-label={item.id}
                              data-testid={`${item.id}-link`}
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
              <Box sx={{ ...button, backgroundColor: 'transparent' }}>
                <Link to="/auth" css={linkButton}>
                  <AccountCircle />
                </Link>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ height: '48px' }} />
      </Box>

      <Outlet />

      {user && !user.displayName && (
        <StyledModal open={openUsername} onClose={closeUsername} title="Update your display name">
          <form onSubmit={handleSubmit(onSubmit)}>
            <ControledInput
              fullWidth
              required
              id="name"
              type="name"
              label="Display name"
              {...register('displayName', { required: 'Required' })}
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
