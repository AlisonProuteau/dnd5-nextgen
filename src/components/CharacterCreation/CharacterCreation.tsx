import { Box, Button, Container, Step, StepLabel, Stepper } from '@mui/material';
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
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { id: 'race', label: 'Race' },
    { id: 'class', label: 'Class' },
    { id: 'info', label: 'Character Info' }
  ];

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
      <Stepper activeStep={activeStep} sx={{ marginBottom: '15px' }}>
        {steps.map(({ id, label }) => (
          <Step key={id} active={steps[activeStep].id === id}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form
        onSubmit={handleSubmit}
        onFocus={({ target }) => setFormError({ [target.id]: false })}
        onInvalid={({ target }) => setFormError({ [(target as HTMLFormElement).id]: true })}
        onReset={() => {
          setFormDataState({});
          setFormErrorState({});
        }}
      >
        <Box display={steps[activeStep].id === 'race' ? 'revert' : 'none'}>
          <CharacterRaceForm
            onNext={(input) => {
              setFormData(input);
              setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }}
          />
        </Box>

        <Box display={steps[activeStep].id === 'class' ? 'revert' : 'none'}>
          <CharacterClassForm
            onNext={(input) => {
              setFormData(input);
              setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }}
          />
        </Box>

        <Box display={steps[activeStep].id === 'info' ? 'revert' : 'none'}>
          <ControledInput
            id="email"
            label="Name"
            onChange={(value) => setFormData({ name: value as string })}
            errorMessage="Invalid Email"
            hasError={formError.name}
          />
        </Box>

        {activeStep > 0 && (
          <Button onClick={() => setActiveStep((prevActiveStep) => prevActiveStep - 1)}>
            Back
          </Button>
        )}

        {activeStep === steps.length - 1 && (
          <Button
            sx={{ float: 'right' }}
            variant="contained"
            type="submit"
            disabled={!isFormValid()}
          >
            Create
          </Button>
        )}
      </form>
    </Container>
  );
}
