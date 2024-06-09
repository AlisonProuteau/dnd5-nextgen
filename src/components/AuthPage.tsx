import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, Container, IconButton, InputAdornment } from '@mui/material';
import { omit } from 'lodash';
import { useState, type FormEvent } from 'react';
import { createUser, signIn } from '../api/users';
import { ControledInput } from './shared/ControledInput';

interface FormData {
  name?: string;
  email?: string;
  password?: string;
  passwordConfrim?: string;
  showPassword: boolean;
}

export function AuthPage() {
  const [formData, setFormDataState] = useState<FormData>({ showPassword: false });
  const [formError, setFormErrorState] = useState<{
    name?: boolean;
    email?: boolean;
    password?: string[];
    passwordConfrim?: boolean;
  }>({});
  const [hasAccount, setHasAccount] = useState(true);

  const setFormData = (values: Partial<FormData>) => {
    const formatedObject = { ...formData, ...values };

    Object.keys(formatedObject).forEach((key) => {
      if (values[key as keyof FormData] === undefined || values[key as keyof FormData] === '')
        omit(formatedObject, key);
    });

    setFormDataState(formatedObject);
  };

  const setFormError = (values: Partial<typeof formError>) => {
    setFormErrorState({ ...formError, ...values });
  };

  const isFormValid = () => {
    return (
      (hasAccount || formData.name) &&
      formData.email &&
      formData.password &&
      (hasAccount || formData.passwordConfrim) &&
      !Object.values(formError).some((v) => v)
    );
  };

  const validateInput = ({ target }: { target: EventTarget & HTMLFormElement }) => {
    const currentData = formData[target.id as keyof FormData]?.toString();
    if (!target.checkValidity() || !currentData || hasAccount) return;

    if (target.id === 'password') {
      let currentPasswordError = formError.password || [];
      const specialCharacters = '.,:;?!@$%&*^=+~_-';

      if (currentData.length < 8)
        currentPasswordError = [...currentPasswordError, 'Must be at least 8 characters'];
      if (currentData.search(/[0-9]/) === -1)
        currentPasswordError = [...currentPasswordError, 'Must contain at least 1 number'];
      if (currentData.search(/[a-z]/) === -1)
        currentPasswordError = [...currentPasswordError, 'Must contain at least 1 lowercase'];
      if (currentData.search(/[A-Z]/) === -1)
        currentPasswordError = [...currentPasswordError, 'Must contain at least 1 uppercase'];
      if (
        currentData.search(new RegExp(`[${specialCharacters}]`)) === -1 ||
        !new RegExp(`^[a-zA-Z0-9${specialCharacters}]*$`).test(currentData)
      )
        currentPasswordError = [
          ...currentPasswordError,
          `Must contain at least 1 special character in ${specialCharacters}`
        ];

      setFormError({ password: currentPasswordError.length ? currentPasswordError : undefined });
    } else if (target.id === 'passwordConfrim') {
      setFormError({ [target.id]: currentData !== formData.password });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.email && formData.password && isFormValid()) {
      if (!hasAccount) {
        await createUser(formData.email, formData.password, formData.name);
      }

      await signIn(formData.email, formData.password);
    }
  };

  return (
    <Container maxWidth="xs">
      <form
        onSubmit={handleSubmit}
        onBlur={validateInput}
        onFocus={({ target }) => setFormError({ [target.id]: false })}
        onInvalid={({ target }) => setFormError({ [(target as HTMLFormElement).id]: true })}
        onReset={() => {
          setFormDataState({ showPassword: false });
          setFormErrorState({});
        }}
      >
        {!hasAccount && (
          <ControledInput
            fullWidth
            id="name"
            type="name"
            label="Display name"
            onChange={(value) => setFormData({ name: value as string })}
            errorMessage={['Invalid Name']}
            hasError={formError.name}
          />
        )}

        <ControledInput
          fullWidth
          id="email"
          type="email"
          label="Email address"
          onChange={(value) => setFormData({ email: value as string })}
          errorMessage={['Invalid Email']}
          hasError={formError.email}
        />

        <ControledInput
          fullWidth
          id="password"
          type={formData.showPassword ? 'input' : 'password'}
          label="Password"
          onChange={(value) => setFormData({ password: value as string })}
          errorMessage={formError.password}
          hasError={!!formError.password}
          endAdornment={
            <InputAdornment position="end">
              <IconButton onClick={() => setFormData({ showPassword: !formData.showPassword })}>
                {formData.showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
        />

        {!hasAccount && (
          <ControledInput
            fullWidth
            id="passwordConfrim"
            type={formData.showPassword ? 'input' : 'password'}
            label="Confrim Password"
            onChange={(value) => setFormData({ passwordConfrim: value as string })}
            errorMessage={['Passwords mismatch']}
            hasError={formError.passwordConfrim}
            endAdornment={
              <InputAdornment position="end">
                <IconButton onClick={() => setFormData({ showPassword: !formData.showPassword })}>
                  {formData.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
        )}

        <Button
          disabled={!isFormValid()}
          sx={{ marginTop: '1rem' }}
          fullWidth
          type="submit"
          variant="contained"
        >
          {hasAccount ? 'Sign In' : 'Sign Up'}
        </Button>

        <Box display="flex" justifyContent="center" alignItems="center">
          {hasAccount ? "Don't have an account?" : 'Already have an account?'}
          <Button type="reset" onClick={() => setHasAccount(!hasAccount)}>
            {hasAccount ? 'Sign Up' : 'Sign In'}
          </Button>
        </Box>
      </form>
    </Container>
  );
}
