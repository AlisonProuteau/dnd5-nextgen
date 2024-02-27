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
import type { DefaultRepresentation } from '../../representations/common.representation';
import { ControledInput } from '../ControledInput';
import { CharacterClassForm } from './CharacterClassForm';
import { CharacterRaceForm } from './CharacterRaceForm';

export interface CharacterFormData {
  name: string;
  age?: string;
  sex: DefaultRepresentation;
  appearance?: string;
  personality?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  race: DefaultRepresentation;
  subrace?: DefaultRepresentation;
  class: DefaultRepresentation;
  subclass?: DefaultRepresentation;
  proficiencies: (DefaultRepresentation & { type: number })[];
}

export function CharacterCreation() {
  const [formData, setFormDataState] = useState<Partial<CharacterFormData>>({});
  const [formError, setFormErrorState] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { id: 'race', label: 'Race' },
    { id: 'class', label: 'Class' },
    { id: 'info', label: 'Character Info' }
  ];

  const genderInstances: DefaultRepresentation[] = [
    { index: 'F', name: 'Female' },
    { index: 'M', name: 'Male' },
    { index: 'O', name: 'Other' }
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
        {/* Choose your race/species */}
        {/* Choosing your proficiencies // TODO: Make common? */}
        {/* Choosing your ability_bonus */}
        {/* Choosing your subrace language */}
        <Box display={steps[activeStep].id === 'race' ? 'revert' : 'none'}>
          <CharacterRaceForm
            onNext={(input) => {
              setFormData(input);
              setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }}
          />
        </Box>

        {/* Choose your class (archetype? -> Subclass ?)  // TODO: Missing subclasses */}
        {/* Choosing your proficiencies // TODO: Disable already added ones, fix representation and selection */}
        {/* Choosing your multiclassing? */}
        {/* Choosing your starting_equipment */}
        <Box display={steps[activeStep].id === 'class' ? 'revert' : 'none'}>
          <CharacterClassForm
            onNext={(input) => {
              setFormData(input);
              setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }}
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

        {/* Alignment -  Background - Gender // TODO: Use representations*/}
        <Box
          display={steps[activeStep].id === 'info' ? 'flex' : 'none'}
          flexWrap="wrap"
          gap="15px"
          justifyContent="space-between"
        >
          <ControledInput
            id="name"
            label="Name"
            sx={{ flexGrow: 1 }}
            onChange={(value) => setFormData({ name: value as string })}
          />
          <ControledInput
            id="age"
            type="number"
            label="Age"
            onChange={(value) => setFormData({ age: value as string })}
          />
          <FormControl margin="dense">
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
          <ControledInput
            fullWidth
            id="ideals"
            multiline
            label="Ideals"
            onChange={(value) => setFormData({ ideals: value as string })}
          />
          <ControledInput
            fullWidth
            id="bonds"
            multiline
            label="Bonds"
            onChange={(value) => setFormData({ bonds: value as string })}
          />
          <ControledInput
            fullWidth
            id="flaws"
            multiline
            label="Flaws"
            onChange={(value) => setFormData({ flaws: value as string })}
          />
        </Box>

        {/* TODO: Save all known data (proficiencies, skills, equipments, etc) and save to DB */}
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
