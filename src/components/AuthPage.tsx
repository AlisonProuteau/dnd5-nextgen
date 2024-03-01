import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, Container, IconButton, InputAdornment } from '@mui/material';
import { omit } from 'lodash';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, signIn } from '../api/users';
import { ControledInput } from './ControledInput';

interface FormData {
  email?: string;
  password?: string;
  passwordConfrim?: string;
  showPassword: boolean;
}

export function AuthPage() {
  const [formData, setFormDataState] = useState<FormData>({ showPassword: false });
  const [formError, setFormErrorState] = useState<{
    email?: boolean;
    password?: boolean;
    passwordConfrim?: boolean;
  }>({});
  const [hasAccount, setHasAccount] = useState(true);
  const navigate = useNavigate();

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
      formData.email &&
      formData.password &&
      (hasAccount || formData.passwordConfrim) &&
      !Object.values(formError).some((v) => v)
    );
  };

  const validateInput = ({ target }: { target: EventTarget & HTMLFormElement }) => {
    /** Contains:
     *
     * one digit
     *
     * one lowercase letter
     *
     * one uppercase letter appear anywhere in the string
     *
     * one special character appear anywhere in the string
     *
     * at least 8 characters, but no more than 32
     */
    const PasswordRegex = new RegExp(
      '^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[]:;<>,.?/~_+-=|]).{8,32}$'
    );

    const currentData = formData[target.id as keyof FormData]?.toString();
    let isValid = target.checkValidity();

    if (!isValid || !currentData) return;

    switch (target.id) {
      case 'password':
        isValid = hasAccount || PasswordRegex.test(currentData);
        break;
      case 'passwordConfrim':
        isValid = currentData === formData.password;
        break;
      default:
        break;
    }
    console.log(target.id, 'has error ', !isValid);
    setFormError({ [target.id]: !isValid });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.email && formData.password && isFormValid()) {
      if (!hasAccount) {
        await createUser(formData.email, formData.password);
      }

      await signIn(formData.email, formData.password);
      navigate('/');
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
        <ControledInput
          fullWidth
          id="email"
          type="email"
          label="Email address"
          onChange={(value) => setFormData({ email: value as string })}
          errorMessage="Invalid Email"
          hasError={formError.email}
        />

        <ControledInput
          fullWidth
          id="password"
          type={formData.showPassword ? 'input' : 'password'}
          label="Password"
          onChange={(value) => setFormData({ password: value as string })}
          errorMessage="Invalid Password"
          hasError={formError.password}
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
            errorMessage="Passwords mismatch"
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
