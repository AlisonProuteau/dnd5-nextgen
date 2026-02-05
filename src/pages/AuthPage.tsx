import { type FormEvent, Fragment, useEffect, useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, Container, IconButton, InputAdornment } from '@mui/material';
import { createUser, signIn } from '@api/users';
import { useForm, useToggle } from '@hooks/index';
import { ControledInput } from '@shared/ControledInput';
import { Loader } from '@shared/Loader';
import { getLoginValidationSchema } from '@utils/ui/auth.utils';

interface FormData {
  name?: string;
  email?: string;
  password?: string;
  passwordConfrim?: string;
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    if (form.formData.email && form.formData.password && form.isValid) {
      if (!isLogin)
        await createUser(form.formData.email, form.formData.password, form.formData.name);
      else await signIn(form.formData.email, form.formData.password);
    }
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
        {!isSaving ? (
          <Fragment>
            {!isLogin && (
              <ControledInput
                fullWidth
                id="name"
                type="text"
                label="Display name"
                onChange={(value) => form.setFormData({ name: value as string })}
                errorMessage={form.getFieldError('name')}
                hasError={!form.isFieldValid('name')}
              />
            )}

            <ControledInput
              fullWidth
              id="email"
              type="email"
              label="Email address"
              onChange={(value) => form.setFormData({ email: value as string })}
              errorMessage={form.getFieldError('email')}
              hasError={!form.isFieldValid('email')}
            />

            <ControledInput
              fullWidth
              id="password"
              type={form.formData.showPassword ? 'text' : 'password'}
              label="Password"
              onChange={(value) => form.setFormData({ password: value as string })}
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
                id="passwordConfrim"
                type={form.formData.showPassword ? 'text' : 'password'}
                label="Confirm Password"
                onChange={(value) => form.setFormData({ passwordConfrim: value as string })}
                errorMessage={form.getFieldError('passwordConfrim')}
                hasError={!form.isFieldValid('passwordConfrim')}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        form.setFormData({ showPassword: !form.formData.showPassword })
                      }
                    >
                      {form.formData.showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            )}
          </Fragment>
        ) : null}

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

      <Loader open={isSaving} />
    </Container>
  );
}
