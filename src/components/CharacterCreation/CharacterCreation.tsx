import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper
} from '@mui/material';
import { omit } from 'lodash';
import { useState, type FormEvent } from 'react';
import type {
  Alignment,
  Background
} from '../../representations/character/background.representation';
import type { RaceAbilityBonus } from '../../representations/character/race.representation';
import type { DefaultRepresentation } from '../../representations/common.representation';
import { ControledInput } from '../ControledInput';
import { CharacterBackgroundForm } from './CharacterBackgroundForm';
import { CharacterClassForm } from './CharacterClassForm';
import { CharacterRaceForm } from './CharacterRaceForm';

const steps = [
  { id: 'race', label: 'Race' },
  { id: 'class', label: 'Class' },
  { id: 'background', label: 'Background' },
  { id: 'info', label: 'Character Info' }
];
const genderInstances: DefaultRepresentation[] = [
  { index: 'F', name: 'Female' },
  { index: 'M', name: 'Male' },
  { index: 'O', name: 'Other' }
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

        {/* Choose your class (archetype? -> Subclass ?) */}
        {/* Choosing your starting_equipment */}
        {/* Choosing your features? */}
        {/* Choosing your multiclassing? */}
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

        {/* Calculate your ability scores ?(custom, simple, point buy, roll)? + bonuses */}
        {/* Calculate your hit points with modifiers */}
        {/* Calculate your armor class */}
        {/* Figuring out your proficiency modifier */}

        {/* Calculate your skill points */}
        {/* Choosing your spells (C level, spellattack, spell DC)? */}
        {/* Choosing your equipment */}
        {/* Choosing your feats */}

        {/*  Background // TODO: Use DB/repr*/}

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

        <Box
          display={steps[activeStep].id === 'info' ? 'flex' : 'none'}
          flexWrap="wrap"
          gap="15px"
          justifyContent="space-between"
        >
          <ControledInput
            id="name"
            label="Name"
            sx={{ flexGrow: 1, flexBasis: '50%' }}
            onChange={(value) => setFormData({ name: value as string })}
          />
          <ControledInput
            id="age"
            type="number"
            label="Age"
            sx={{ width: '85px' }}
            onChange={(value) => setFormData({ age: value as string })}
          />
          <FormControl margin="dense" sx={{ width: '100px' }}>
            <InputLabel htmlFor="sex">Sex</InputLabel>
            <Select
              fullWidth
              id="sex"
              label="Sex"
              defaultValue="O"
              onChange={({ target }) =>
                setFormData({ sex: genderInstances.find(({ index }) => index === target.value) })
              }
            >
              {genderInstances.map((currentSex: DefaultRepresentation) => (
                <MenuItem key={currentSex.index} id={currentSex.index} value={currentSex.index}>
                  {currentSex.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ControledInput
            fullWidth
            id="apperance"
            multiline
            label="Appearance"
            onChange={(value) => setFormData({ appearance: value as string })}
          />
          <ControledInput
            fullWidth
            id="personality"
            multiline
            label="Personality Traits"
            onChange={(value) => setFormData({ personality: value as string })}
          />
        </Box>

        {activeStep > 1 && (
          <Button onClick={() => setActiveStep((prevActiveStep) => prevActiveStep - 1)}>
            Back
          </Button>
        )}

        {/* TODO: Create an edge case test class/race */}
        {/* TODO: Add all known data (proficiencies, skills, equipments, etc), Format and Remove duplicates */}
        {/* TODO: Save to DB */}
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
