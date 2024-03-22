import { Box, Button, Container, Step, StepLabel, Stepper } from '@mui/material';
import { omit } from 'lodash';
import { useState, type FormEvent } from 'react';
import type {
  Alignment,
  Background
} from '../../representations/character/background.representation';
import type { RaceAbilityBonus } from '../../representations/character/race.representation';
import type { DefaultRepresentation } from '../../representations/common.representation';
import { CharacterBackgroundForm } from './CharacterBackgroundForm';
import { CharacterClassForm } from './CharacterClassForm';
import { CharacterDescription } from './CharacterDescription';
import { CharacterRaceForm } from './CharacterRaceForm';

const steps = [
  { id: 'race', label: 'Race' },
  { id: 'class', label: 'Class' },
  { id: 'background', label: 'Background' },
  { id: 'info', label: 'Character Info' }
];

export type ChoiceSelection = DefaultRepresentation & { type: 'class' | 'race' };

export interface CharacterFormData {
  name: string;
  age?: string;
  sex: DefaultRepresentation;
  appearance?: string;
  personality?: string;
  background: Background;
  alignment: Alignment;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  race: DefaultRepresentation;
  subrace?: DefaultRepresentation;
  class: DefaultRepresentation;
  subclass?: DefaultRepresentation;
  proficiencies: ChoiceSelection[];
  languages: ChoiceSelection[];
  abilities: RaceAbilityBonus[];
}

export function CharacterCreation() {
  const [formData, setFormDataState] = useState<Partial<CharacterFormData>>({});
  const [formError, setFormErrorState] = useState({});
  const [activeStep, setActiveStep] = useState(0);

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
    return (
      Object.values(formData).some((value) => value === undefined) &&
      !Object.values(formError).some((v) => v)
    );
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
            proficiencies={formData.proficiencies}
          />
        </Box>

        <Box display={steps[activeStep].id === 'class' ? 'revert' : 'none'}>
          <CharacterClassForm
            onNext={(input) => {
              setFormData(input);
              setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }}
            onPrev={(input) => {
              setFormData(input);
              setActiveStep((prevActiveStep) => prevActiveStep - 1);
            }}
            proficiencies={formData.proficiencies}
          />
        </Box>

        <Box display={steps[activeStep].id === 'background' ? 'revert' : 'none'}>
          <CharacterBackgroundForm
            onNext={(input) => {
              setFormData(input);
              setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }}
            proficiencies={formData.proficiencies}
            languages={formData.languages}
          />
        </Box>

        <Box display={steps[activeStep].id === 'info' ? 'revert' : 'none'}>
          <CharacterDescription setFormData={setFormData} />
        </Box>

        {activeStep > 1 && (
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
