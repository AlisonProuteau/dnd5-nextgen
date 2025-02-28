import {
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { ControledInput } from '@shared/ControledInput';
import { omit } from 'lodash';
import { Fragment, useState, type FormEvent } from 'react';
import { useAuth } from 'src/providers/AuthProvider';

enum ContactType {
  FEEDBACK = 'Feedback',
  BUG = 'Bug',
  REQUEST = 'Request'
}

interface FormData {
  type: ContactType;
  message?: string;
}

export function ContactForm() {
  const { user, version } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormDataState] = useState<FormData>({
    type: ContactType.FEEDBACK
  });
  const [formError, setFormErrorState] = useState<{
    message?: boolean;
  }>({});

  const setFormData = (values: Partial<FormData>) => {
    const formatedObject = { ...formData, ...values };

    if (formatedObject) {
      Object.keys(formatedObject).forEach((key) => {
        if (values[key as keyof FormData] === undefined || values[key as keyof FormData] === '')
          omit(formatedObject, key);
      });

      setFormDataState(formatedObject);
    }
  };

  const setFormError = (values: Partial<typeof formError>) => {
    setFormErrorState({ ...formError, ...values });
  };

  const isFormValid = () => {
    return formData.type && !Object.values(formError).some((v) => v);
  };

  const validateInput = ({ target }: { target: EventTarget & HTMLFormElement }) => {
    const currentData = formData[target.id as keyof FormData]?.toString();
    if (!target.checkValidity || !target.checkValidity() || !currentData) return;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    if (isFormValid() && user?.uid) {
      // TODO: save or send?
      console.log(formData);
    }
    setIsSaving(false);
  };

  return (
    <Container maxWidth="xs">
      <form
        onSubmit={handleSubmit}
        onBlur={validateInput}
        onFocus={({ target }) => setFormError({ [target.id]: false })}
        onInvalid={({ target }) => setFormError({ [(target as HTMLFormElement).id]: true })}
        onReset={() => {
          setFormDataState({ type: ContactType.FEEDBACK, message: '' });
          setFormErrorState({});
        }}
      >
        {!isSaving ? (
          <Fragment>
            <FormControl margin="dense" fullWidth required>
              <InputLabel htmlFor="type">Contact Type</InputLabel>
              <Select
                id="type"
                label="Contact Type"
                value={formData.type}
                onChange={({ target }) => setFormData({ type: target.value as ContactType })}
              >
                {Object.values(ContactType).map((contactType) => (
                  <MenuItem key={contactType} value={contactType}>
                    {contactType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* TODO */}
            {formData.type === ContactType.BUG && <Fragment></Fragment>}

            {/* TODO */}
            {formData.type === ContactType.REQUEST && <Fragment></Fragment>}

            {/* TODO */}
            {formData.type === ContactType.FEEDBACK && <Fragment></Fragment>}

            {formData.type !== ContactType.BUG && (
              <ControledInput
                fullWidth
                multiline
                required
                id="message"
                label="Message"
                onChange={(value) => setFormData({ message: value?.toString() })}
                hasError={formError.message}
                errorMessage={['Required']}
              />
            )}

            {/* TODO: Anonymous */}
            {/* TODO: Can be contacted */}
          </Fragment>
        ) : (
          <CircularProgress size={24} />
        )}

        <Button
          disabled={!isFormValid() || isSaving}
          sx={{ marginTop: '1rem' }}
          fullWidth
          type="submit"
          variant="contained"
        >
          Submit
        </Button>
      </form>
    </Container>
  );
}
