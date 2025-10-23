import { Box, Button, CircularProgress, Container, Step, StepLabel, Stepper } from '@mui/material';
import type { CharacterFormData } from '@representations/user.representation';
import { useQueryClient } from '@tanstack/react-query';
import type { ChoiceSelection } from '@utils/character';
import { collection, doc, setDoc } from 'firebase/firestore';
import { omit, pickBy, uniqBy } from 'lodash';
import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { database } from 'src/firebase';
import { useAuth } from 'src/providers/AuthProvider';
import { CharacterBackgroundForm } from './CharacterBackgroundForm';
import { CharacterClassForm } from './CharacterClassForm';
import { CharacterDescription, GenderIndexes } from './CharacterDescription';
import { CharacterRaceForm } from './CharacterRaceForm';

const steps = [
  { id: 'race', label: 'Race' },
  { id: 'class', label: 'Class' },
  { id: 'background', label: 'Background' },
  { id: 'info', label: 'Character Info' }
];

export function CharacterCreation() {
  const [isSaving, setIsSaving] = useState(false);
  const { user, version } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormDataState] = useState<Partial<CharacterFormData>>({
    sex: { index: GenderIndexes.other, name: 'Other' }
  });
  const [formError, setFormErrorState] = useState({});
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [activeStep]);

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

  const isFormValid = () =>
    formData.name &&
    formData.age &&
    formData.sex &&
    formData.background?.index &&
    formData.alignment?.index &&
    formData.race?.index &&
    formData.class?.index;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const skills = formData.proficiencies?.filter((p) => p.index.startsWith('skill-'));
    const formattedProficiencies = formData.proficiencies?.filter(
      (p) => !p.index.startsWith('saving-throw-') && !p.index.startsWith('skill-')
    );
    const formattedData = pickBy(
      {
        ...formData,
        class: { index: formData.class?.name, name: formData.class?.name },
        race: { index: formData.race?.name, name: formData.race?.name },
        languages: uniqBy(formData.languages, 'index'),
        proficiencies: uniqBy(formattedProficiencies, 'index'),
        skills: uniqBy(skills, 'index'),
        equipments: formData.equipments?.reduce((acc: ChoiceSelection[], curr) => {
          const existingIndex = acc.findIndex(({ index }) => index === curr.index);
          if (existingIndex >= 0)
            return acc.with(existingIndex, {
              ...curr,
              count: (acc[existingIndex].count || 1) + (curr.count || 1)
            });

          return [...acc, curr];
        }, []),
        level: 1
      },
      (d) => !!(Array.isArray(d) ? d?.length : d)
    );

    if (user?.uid) {
      const path = `users/${user.uid}/characters`;

      const newCharacterRef = doc(collection(database, path));
      setDoc(newCharacterRef, {
        ...formattedData,
        id: newCharacterRef.id,
        version
      })
        .then(() => {
          navigate(`/character`, { state: { characterId: newCharacterRef.id } });
          queryClient.invalidateQueries({ queryKey: ['fetchCharacters', user?.uid] });
          toast.success('Character created');
        })
        .catch((error) =>
          toast.error(`Something went wrong
        ${(error as Error).message || 'Error'}`)
        )
        .finally(() => setIsSaving(false));
    } else setIsSaving(false);
  };

  return (
    <Container sx={{ overflowX: 'clip' }}>
      <Stepper
        activeStep={activeStep}
        sx={{ marginBottom: '15px' }}
        alternativeLabel
        data-testid="character-stepper"
        role="tablist"
      >
        {steps.map(({ id, label }, index) => (
          <Step key={id} active={steps[activeStep].id === id}>
            <StepLabel
              data-testid="step-label"
              className={steps[activeStep].id === id ? 'active' : ''}
              role="tab"
              aria-selected={steps[activeStep].id === id}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {!isSaving ? (
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
              onPrev={(input) => {
                setFormData(input);
                setActiveStep((prevActiveStep) => prevActiveStep - 1);
              }}
              proficiencies={formData.proficiencies}
              languages={formData.languages}
              equipment={formData.equipments}
            />
          </Box>

          <Box display={steps[activeStep].id === 'info' ? 'revert' : 'none'}>
            <CharacterDescription
              setFormData={setFormData}
              onPrev={() => setActiveStep((prevActiveStep) => prevActiveStep - 1)}
            />
          </Box>

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
      ) : (
        <CircularProgress size={24} />
      )}
    </Container>
  );
}
