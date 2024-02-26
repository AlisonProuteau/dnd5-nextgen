import { Button, Container } from '@mui/material';
import { omit } from 'lodash';
import { useState, type FormEvent } from 'react';
import type { DefaultInstance } from '../../representations/default.representation';
import { ControledInput } from '../ControledInput';
import { CharacterClassForm } from './CharacterClassForm';
import { CharacterRaceForm } from './CharacterRaceForm';

export interface CharacterFormData {
  name: string;
  race: DefaultInstance;
  subrace?: DefaultInstance;
  class: DefaultInstance;
  proficiencies: (DefaultInstance & { type: number })[];
}

export function CharacterCreation() {
  const [formData, setFormDataState] = useState<Partial<CharacterFormData>>({});
  const [formError, setFormErrorState] = useState<{ name?: boolean }>({});

  const setFormData = (values: Partial<CharacterFormData>) => {
    const formatedObject = { ...formData, ...values };

    Object.keys(formatedObject).forEach((key) => {
      if (
        values[key as keyof CharacterFormData] === undefined ||
        values[key as keyof CharacterFormData] === ''
      )
        omit(formatedObject, key);
    });

    setFormDataState(formatedObject);
  };

  const setFormError = (values: Partial<typeof formError>) => {
    setFormErrorState({ ...formError, ...values });
  };

  const isFormValid = () => {
    return formData.name && !Object.values(formError).some((v) => v);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log(formData);
  };

  return (
    <Container>
      <form
        onSubmit={handleSubmit}
        onFocus={({ target }) => setFormError({ [target.id]: false })}
        onInvalid={({ target }) => setFormError({ [(target as HTMLFormElement).id]: true })}
        onReset={() => {
          setFormDataState({});
          setFormErrorState({});
        }}
      >
        <ControledInput
          id="email"
          label="Name"
          onChange={(value) => setFormData({ name: value as string })}
          errorMessage="Invalid Email"
          hasError={formError.name}
        />

        <CharacterRaceForm setFormData={setFormData} />

        <CharacterClassForm setFormData={setFormData} />

        <Button
          disabled={!isFormValid()}
          sx={{ marginTop: '1rem' }}
          fullWidth
          type="submit"
          variant="contained"
        >
          Create
        </Button>
      </form>
    </Container>
  );
}
