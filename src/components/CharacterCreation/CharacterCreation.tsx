import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Step, StepLabel, Stepper } from '@mui/material';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useMultiStepForm } from '@hooks/useMultiStepForm';
import { FullPageLoader } from '@shared/Loader';
import { transformFormData } from '@utils/character/creation.utils';
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

  const {
    handleSubmit,
    watch,
    reset,
    formState: { isValid }
  } = useForm<CharacterFormData>({
    mode: 'onChange',
    defaultValues: {
      sex: { index: GenderIndexes.other, name: 'Other' }
    }
  });
  const stepper = useMultiStepForm({ steps, autoScroll: true });
  const formData = watch();

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
    if (location.state?.step !== null && location.state?.step !== stepper.activeStep)
      stepper.goToStep(location.state?.step || 0);
  }, [location.state?.step, stepper.activeStep, stepper.goToStep]);

  const isFormValid = () =>
    formData.name &&
    formData.age &&
    formData.sex &&
    formData.background?.index &&
    formData.alignment?.index &&
    formData.race?.index &&
    formData.class?.index;

  const onSubmit = async (data: CharacterFormData) => {
    if (!isFormValid()) return;

    await firebaseActions.create({
      ...transformFormData(data),
      version: version ?? 'Legacy'
    });
  };

  const setFormData = (input: Partial<CharacterFormData>) => {
    reset((prev) => ({ ...prev, ...input }), { keepDefaultValues: true });
  };

  const onNextStep = (input?: Partial<CharacterFormData>) => {
    if (firebaseActions.isLoading) return;

    if (input) setFormData(input);
    navigate('/create', {
      state: { step: stepper.activeStep + 1 },
      viewTransition: false
    });
    stepper.nextStep();
  };

  const onPrevStep = (input?: Partial<CharacterFormData>) => {
    if (firebaseActions.isLoading) return;

    if (input) setFormData(input);
    navigate('/create', {
      state: { step: stepper.activeStep - 1 },
      viewTransition: false
    });
    stepper.prevStep();
  };

  return (
    <Container sx={{ overflowX: 'clip' }}>
      <Stepper
        activeStep={stepper.activeStep}
        sx={{ marginBottom: '15px' }}
        alternativeLabel
        data-testid="character-stepper"
        role="tablist"
      >
        {stepper.steps.map(({ id, label }) => (
          <Step key={id} active={stepper.steps[stepper.activeStep].id === id}>
            <StepLabel
              data-testid="step-label"
              className={steps[stepper.activeStep].id === id ? 'active' : ''}
              aria-selected={steps[stepper.activeStep].id === id}
              role="tab"
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onReset={() => reset()} onSubmit={handleSubmit(onSubmit)}>
        <Box display={stepper.steps[stepper.activeStep].id === 'race' ? 'revert' : 'none'}>
          <CharacterRaceForm
            onNext={onNextStep}
            proficiencies={formData.proficiencies}
            isActive={stepper.steps[stepper.activeStep].id === 'race'}
          />
        </Box>

        <Box display={stepper.steps[stepper.activeStep].id === 'class' ? 'revert' : 'none'}>
          <CharacterClassForm
            onNext={onNextStep}
            onPrev={onPrevStep}
            proficiencies={formData.proficiencies}
            isActive={stepper.steps[stepper.activeStep].id === 'class'}
          />
        </Box>

        <Box display={stepper.steps[stepper.activeStep].id === 'background' ? 'revert' : 'none'}>
          <CharacterBackgroundForm
            onNext={onNextStep}
            onPrev={onPrevStep}
            proficiencies={formData.proficiencies}
            languages={formData.languages}
            equipment={formData.equipments}
            isActive={stepper.steps[stepper.activeStep].id === 'background'}
          />
        </Box>

        <Box display={stepper.steps[stepper.activeStep].id === 'info' ? 'revert' : 'none'}>
          <CharacterDescription
            setFormData={setFormData}
            onPrev={() => onPrevStep()}
            isActive={stepper.steps[stepper.activeStep].id === 'info'}
          />
        </Box>

        {stepper.isLastStep && (
          <Button
            sx={{ float: 'right' }}
            variant="contained"
            type="submit"
            disabled={!isValid || !isFormValid() || firebaseActions.isLoading}
          >
            Create
          </Button>
        )}
      </form>

      <FullPageLoader open={firebaseActions.isLoading} />
    </Container>
  );
}
