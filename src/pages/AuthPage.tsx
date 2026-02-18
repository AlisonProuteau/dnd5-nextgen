import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, Container, IconButton, InputAdornment } from '@mui/material';
import { createUser, signIn } from '@api/users';
import { useToggle } from '@hooks/index';
import { ControledInput } from '@shared/ControledInput';
import { FullPageLoader } from '@shared/Loader';
import { getAllValidationErrors } from '@utils/form.utils';
import {
  getEmailValidation,
  getNameValidation,
  getPasswordConfirmValidation,
  getPasswordValidation
} from '@utils/ui/auth.utils';

interface FormData {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  showPassword: boolean;
}

export function AuthPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { isOn: showPassword, setIsOn: setShowPassword } = useToggle(false);
  const { isOn: isLogin, toggle: toggleLogin } = useToggle(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    getValues,
    clearErrors
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {},
    criteriaMode: 'all',
    delayError: 500
  });

  useEffect(() => {
    clearErrors();
  }, [isLogin, clearErrors]);

  const onSubmit = async (data: FormData) => {
    if (isSaving || !isValid || !data.email || !data.password) return;

    setIsSaving(true);

    if (!isLogin) await createUser(data.email, data.password, data.name);
    else await signIn(data.email, data.password);

    setIsSaving(false);
  };

  const handleReset = () => {
    setShowPassword(false);
    reset();
    toggleLogin();
  };

  return (
    <Container maxWidth="xs">
      <form onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>
        {!isLogin && (
          <ControledInput
            fullWidth
            id="name"
            type="text"
            label="Display name"
            autoComplete="username"
            {...register('name', getNameValidation(isLogin) as any)}
            errorMessage={getAllValidationErrors(errors.name)}
            hasError={!!errors.name}
          />
        )}

        <ControledInput
          fullWidth
          id="email"
          type="email"
          label="Email address"
          autoComplete="email"
          {...register('email', getEmailValidation() as any)}
          errorMessage={getAllValidationErrors(errors.email)}
          hasError={!!errors.email}
        />

        <ControledInput
          fullWidth
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          {...register('password', getPasswordValidation(isLogin) as any)}
          errorMessage={getAllValidationErrors(errors.password)}
          hasError={!!errors.password}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                data-testid="password-visibility"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
        />

        {!isLogin && (
          <ControledInput
            fullWidth
            id="passwordConfirm"
            type={showPassword ? 'text' : 'password'}
            label="Confirm Password"
            autoComplete="off"
            {...register(
              'passwordConfirm',
              getPasswordConfirmValidation(isLogin, getValues('password') ?? '') as any
            )}
            errorMessage={getAllValidationErrors(errors.passwordConfirm)}
            hasError={!!errors.passwordConfirm}
            endAdornment={
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
        )}

        <Button
          disabled={!isValid || isSaving}
          sx={{ marginTop: '1rem' }}
          fullWidth
          type="submit"
          variant="contained"
        >
          {isLogin ? 'Sign In' : 'Sign Up'}
        </Button>

        <Box display="flex" justifyContent="center" alignItems="center">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <Button type="reset" disabled={isSaving}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </Button>
        </Box>
      </form>

      <FullPageLoader open={isSaving} />
    </Container>
  );
}
