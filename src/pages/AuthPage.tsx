import { type SyntheticEvent, useEffect, useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, Container, IconButton, InputAdornment } from '@mui/material';
import { createUser, signIn } from '@api/users';
import { useForm, useToggle } from '@hooks/index';
import { ControledInput } from '@shared/ControledInput';
import { FullPageLoader } from '@shared/Loader';
import { getLoginValidationSchema } from '@utils/ui/auth.utils';

interface FormData {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  showPassword: boolean;
}

export function AuthPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { isOn: isLogin, toggle: toggleLogin } = useToggle(true);

  const form = useForm<FormData>({
    initialData: { showPassword: false },
    validationSchema: getLoginValidationSchema(true)
  });

  useEffect(() => {
    form.clearErrors();
    form.updateValidationSchema(getLoginValidationSchema(isLogin));
  }, [isLogin]);

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (isSaving || !form.isValid || !form.formData.email || !form.formData.password) return;

    setIsSaving(true);

    if (!isLogin) await createUser(form.formData.email, form.formData.password, form.formData.name);
    else await signIn(form.formData.email, form.formData.password);

    setIsSaving(false);
  };

  return (
    <Container maxWidth="xs">
      <form
        onSubmit={handleSubmit}
        onFocus={({ target }) => target.id && form.clearFieldError(target.id as keyof FormData)}
        onBlur={({ target }) => target.id && form.validateField(target.id as keyof FormData)}
        onReset={() => form.resetForm()}
      >
        {!isLogin && (
          <ControledInput
            fullWidth
            id="name"
            type="text"
            label="Display name"
            autoComplete="username"
            onInput={({ target }) =>
              form.setFormData({ name: (target as HTMLInputElement).value as string })
            }
            errorMessage={form.getFieldError('name')}
            hasError={!form.isFieldValid('name')}
          />
        )}

        <ControledInput
          fullWidth
          id="email"
          type="email"
          label="Email address"
          autoComplete="email"
          onInput={({ target }) =>
            form.setFormData({ email: (target as HTMLInputElement).value as string })
          }
          errorMessage={form.getFieldError('email')}
          hasError={!form.isFieldValid('email')}
        />

        <ControledInput
          fullWidth
          id="password"
          type={form.formData.showPassword ? 'text' : 'password'}
          label="Password"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          onInput={({ target }) =>
            form.setFormData({ password: (target as HTMLInputElement).value as string })
          }
          errorMessage={form.getFieldError('password')}
          hasError={!form.isFieldValid('password')}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                onClick={() => form.setFormData({ showPassword: !form.formData.showPassword })}
                data-testid="password-visibility"
              >
                {form.formData.showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
        />

        {!isLogin && (
          <ControledInput
            fullWidth
            id="passwordConfirm"
            type={form.formData.showPassword ? 'text' : 'password'}
            label="Confirm Password"
            autoComplete="off"
            onInput={({ target }) =>
              form.setFormData({ passwordConfirm: (target as HTMLInputElement).value as string })
            }
            errorMessage={form.getFieldError('passwordConfirm')}
            hasError={!form.isFieldValid('passwordConfirm')}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => form.setFormData({ showPassword: !form.formData.showPassword })}
                >
                  {form.formData.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
        )}

        <Button
          disabled={!form.isValid || isSaving}
          sx={{ marginTop: '1rem' }}
          fullWidth
          type="submit"
          variant="contained"
        >
          {isLogin ? 'Sign In' : 'Sign Up'}
        </Button>

        <Box display="flex" justifyContent="center" alignItems="center">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <Button type="reset" onClick={toggleLogin} disabled={isSaving}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </Button>
        </Box>
      </form>

      <FullPageLoader open={isSaving} />
    </Container>
  );
}
