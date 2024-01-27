import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, Container, IconButton, InputAdornment, TextField } from '@mui/material';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, signIn } from '../api/users';

export function AuthPage() {
  const [hasAccount, setHasAccount] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState({ password: false, email: false });
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    const email = data.get('email') as string | null;
    const password = data.get('password') as string | null;

    if (email && password) {
      if (!hasAccount) {
        await createUser(email, password);
      }

      await signIn(email, password);
      navigate('/');
    }
  };

  const onFormError = (event: FormEvent<HTMLInputElement>) => {
    event.preventDefault();
    setFormError({ ...formError, [(event.target as HTMLInputElement).name]: true });
  };

  const onInputUpdate = (event: FormEvent<HTMLFormElement>) => {
    if (event.type === 'focus')
      setFormError({ ...formError, [(event.target as HTMLInputElement).name]: false });
    if (event.type === 'blur') event.currentTarget.checkValidity();
  };

  return (
    <Container maxWidth="xs">
      <Box
        component="form"
        flexWrap="wrap"
        flexDirection="column"
        alignItems="center"
        display="flex"
        onBlur={onInputUpdate}
        onFocus={onInputUpdate}
        onSubmit={handleSubmit}
      >
        <TextField
          fullWidth
          required
          autoFocus
          id="email"
          name="email"
          placeholder="Email address"
          type="email"
          autoComplete="email"
          error={formError.email}
          helperText={formError.email ? 'Invalid email' : ''}
          onInvalidCapture={onFormError}
        />

        <TextField
          required
          fullWidth
          id="password"
          name="password"
          placeholder="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={formError.password}
          helperText={formError.password ? 'Password required' : ''}
          onInvalidCapture={onFormError}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Button sx={{ marginTop: '1rem' }} fullWidth type="submit" variant="contained">
          {hasAccount ? 'Sign In' : 'Sign Up'}
        </Button>

        {hasAccount ? (
          <Box>
            Don&apos;t have an account?
            <Button onClick={() => setHasAccount(false)}>Sign Up</Button>
          </Box>
        ) : (
          <Box>
            Already have an account?
            <Button onClick={() => setHasAccount(true)}>Sign In</Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}
