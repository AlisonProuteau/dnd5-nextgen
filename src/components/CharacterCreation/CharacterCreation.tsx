import { type FormEvent, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  Step,
  StepLabel,
  Stepper
} from '@mui/material';
import { useFirebaseCrud, useForm } from '@hooks/index';
import { transformFormData } from '@utils/character';
import type { CharacterFormData } from '@representations/user.representation';
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
  const { version } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<CharacterFormData>({
    steps,
    initialData: {
      sex: { index: GenderIndexes.other, name: 'Other' }
    },
    autoScroll: true
  });

  const firebaseActions = useFirebaseCrud<CharacterFormData>({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacters'],
    successMessages: {
      create: 'Character created successfully'
    },
    redirect: {
      create: { path: '/character', state: { characterId: '{id}' } }
    }
  });

  useEffect(() => {
    if (location.state?.step !== null && location.state?.step !== form.activeStep)
      form.goToStep(location.state?.step || 0);
  }, [location.state?.step]);

  const isFormValid = () =>
    form.formData.name &&
    form.formData.age &&
    form.formData.sex &&
    form.formData.background?.index &&
    form.formData.alignment?.index &&
    form.formData.race?.index &&
    form.formData.class?.index;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid()) return;

    await firebaseActions.create({
      ...transformFormData(form.formData),
      version
    });
  };

  const onNextStep = (input?: Partial<CharacterFormData>) => {
    if (firebaseActions.isLoading) return;

    if (input) form.setFormData(input);
    navigate('/create', {
      state: { step: form.activeStep + 1 },
      viewTransition: false
    });
    form.nextStep();
  };

  const onPrevStep = (input?: Partial<CharacterFormData>) => {
    if (firebaseActions.isLoading) return;

    if (input) form.setFormData(input);
    navigate('/create', {
      state: { step: form.activeStep - 1 },
      viewTransition: false
    });
    form.prevStep();
  };

  return (
    <Container sx={{ overflowX: 'clip' }}>
      <Stepper
        activeStep={form.activeStep}
        sx={{ marginBottom: '15px' }}
        alternativeLabel
        data-testid="character-stepper"
        role="tablist"
      >
        {form.steps.map(({ id, label }) => (
          <Step key={id} active={form.steps[form.activeStep].id === id}>
            <StepLabel
              data-testid="step-label"
              className={steps[form.activeStep].id === id ? 'active' : ''}
              aria-selected={steps[form.activeStep].id === id}
              role="tab"
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <form
        onReset={form.resetForm}
        onSubmit={handleSubmit}
        onFocus={({ target }) => form.clearFieldError(target.id as keyof CharacterFormData)}
        onInvalid={({ target }) =>
          form.setErrors({ [(target as HTMLFormElement).id]: ['Invalid'] })
        }
      >
        <Box display={form.steps[form.activeStep].id === 'race' ? 'revert' : 'none'}>
          <CharacterRaceForm
            onNext={onNextStep}
            proficiencies={form.formData.proficiencies}
            isActive={form.steps[form.activeStep].id === 'race'}
          />
        </Box>

        <Box display={form.steps[form.activeStep].id === 'class' ? 'revert' : 'none'}>
          <CharacterClassForm
            onNext={onNextStep}
            onPrev={onPrevStep}
            proficiencies={form.formData.proficiencies}
            isActive={form.steps[form.activeStep].id === 'class'}
          />
        </Box>

        <Box display={form.steps[form.activeStep].id === 'background' ? 'revert' : 'none'}>
          <CharacterBackgroundForm
            onNext={onNextStep}
            onPrev={onPrevStep}
            proficiencies={form.formData.proficiencies}
            languages={form.formData.languages}
            equipment={form.formData.equipments}
            isActive={form.steps[form.activeStep].id === 'background'}
          />
        </Box>

        <Box display={form.steps[form.activeStep].id === 'info' ? 'revert' : 'none'}>
          <CharacterDescription
            setFormData={form.setFormData}
            onPrev={() => onPrevStep()}
            isActive={form.steps[form.activeStep].id === 'info'}
          />
        </Box>

        {form.isLastStep && (
          <Button
            sx={{ float: 'right' }}
            variant="contained"
            type="submit"
            disabled={!form.isValid || !isFormValid() || firebaseActions.isLoading}
          >
            Create
          </Button>
        )}
      </form>

      <Backdrop
        sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1 })}
        open={firebaseActions.isLoading}
      >
        <CircularProgress />
      </Backdrop>
    </Container>
  );
}
