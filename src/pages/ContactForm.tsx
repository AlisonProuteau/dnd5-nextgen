import { Fragment, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { omit, omitBy } from 'lodash';
import { getUserCharacters } from '@api/users';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { ControledInput } from '@shared/ControledInput';
import { FilterSelect } from '@shared/FilterSelect';
import { FullPageLoader } from '@shared/Loader';
import type { Version } from '@utils/constants/versions.constants';
import { getAllValidationErrors } from '@utils/form.utils';
import { useAuth } from 'src/providers/AuthProvider';

enum ContactType {
  FEEDBACK = 'Feedback',
  BUG = 'Bug',
  REQUEST = 'Request'
}

enum BugSeverity {
  CRITICAL = 'Critical',
  MAJOR = 'Major',
  MEDIUM = 'Medium',
  MINOR = 'Minor',
  TRIVIAL = 'Trivial'
}

enum AppArea {
  NAV = 'Navigation',
  AUTH = 'Authentification',
  CREATION = 'Character Creation',
  POINTS = 'Character Points',
  SHEET = 'Character Sheet',
  SPELLS = 'Spells',
  OTHER = 'Other'
}

enum RequestArea {
  CONTENT = 'Content',
  FEATURE = 'Feature',
  IMPROVEMENT = 'Improvement',
  OTHER = 'Other'
}

enum TicketStatus {
  OPEN = 'open',
  TRIAGED = 'triaged',
  INPROGRESS = 'inProgress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

interface FormData {
  type: ContactType;
  canContact: boolean;
  severity?: BugSeverity;
  area?: AppArea | string;
  requestArea?: RequestArea | string;
  reproSteps?: string;
  character?: string;
  corrupted?: boolean;
  requestContent?: string;
  message?: string;
  status: TicketStatus;
}

const DEFAULT_FORM = {
  type: ContactType.FEEDBACK,
  canContact: false,
  status: TicketStatus.OPEN
};

export function ContactForm() {
  const { user, version } = useAuth();
  const { isOn: isAnonymous, setIsOn: setIsAnonymous } = useToggle(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    clearErrors,
    control,
    formState: { errors, isValid }
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: DEFAULT_FORM,
    delayError: 1000
  });

  // Only watch fields needed for conditional rendering
  const [type, area, requestArea, severity, character] = watch([
    'type',
    'area',
    'requestArea',
    'severity',
    'character'
  ]);

  const firebaseCrud = useFirebaseCrud<FormData>({
    collectionPath: 'tickets',
    successMessages: {
      create: 'Ticket created'
    }
  });

  const { data: characters, isLoading: isCharactersLoading } = useQuery({
    queryKey: ['fetchCharacters', user?.uid, version],
    queryFn: async () => (user && version ? await getUserCharacters(user.uid, version) : null),
    enabled: !!(user?.uid && version)
  });

  const onSubmit = async (data: FormData) => {
    if (user?.uid) {
      let formattedForm: Partial<FormData> & {
        userId?: string;
        userEmail?: string;
        version: Version | string;
      } = { ...data, version: version ?? 'unknown' };

      if (!isAnonymous || data.type === ContactType.BUG)
        formattedForm = { ...formattedForm, userId: user.uid };
      if (data.canContact) formattedForm = { ...formattedForm, userEmail: user.email ?? '' };
      else formattedForm = omit(formattedForm, 'canContact');

      const cleanedData = omitBy(formattedForm, (v) => v === undefined) as any;
      await firebaseCrud.create(cleanedData);
      if (!firebaseCrud.isLoading) reset();
    }
  };

  const isAppArea = useMemo(() => Object.values(AppArea).includes(area as AppArea), [area]);

  const isRequestArea = useMemo(
    () => Object.values(RequestArea).includes(requestArea as RequestArea),
    [requestArea]
  );

  return (
    <Container maxWidth="xs">
      <form onSubmit={handleSubmit(onSubmit)} onReset={() => reset()} data-testid="contact-form">
        <FilterSelect
          id="type"
          margin="dense"
          fullWidth
          required
          data-testid="type-form"
          label="Contact Type"
          value={type || ''}
          onChange={(v) => {
            const newType = v as ContactType;
            if (newType === ContactType.BUG || type === ContactType.BUG) {
              setValue('message', undefined);
            }
            setValue('type', newType);
            clearErrors();
          }}
          options={Object.values(ContactType).map((t) => ({ value: t, label: t }))}
        />

        {type === ContactType.BUG && (
          <Fragment>
            <FilterSelect
              id="severity"
              margin="dense"
              fullWidth
              required
              data-testid="severity-form"
              label="Severity"
              value={severity || BugSeverity.MEDIUM}
              onChange={(v) => setValue('severity', v as BugSeverity)}
              options={Object.values(BugSeverity).map((s) => ({ value: s, label: s }))}
            />
            <FormControl margin="dense" fullWidth required data-testid="area-form">
              <InputLabel htmlFor="area">Area</InputLabel>
              <Controller
                name="area"
                control={control}
                rules={{
                  required: 'Required',
                  validate: (value) => (value === AppArea.OTHER ? 'Required' : undefined)
                }}
                render={({ field }) => (
                  <Select
                    id="area"
                    label="Area"
                    {...field}
                    value={!isAppArea || !field.value ? AppArea.OTHER : field.value}
                    error={!!errors.area}
                  >
                    {Object.values(AppArea).map((areaOption) => (
                      <MenuItem key={areaOption} value={areaOption}>
                        {areaOption}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {(!area || area === AppArea.OTHER || !isAppArea) && (
                <ControledInput
                  required
                  id="area"
                  label="Area"
                  hiddenValues={[AppArea.OTHER]}
                  data-testid="area-input"
                  control={control}
                  rules={{ required: 'Required' }}
                />
              )}
            </FormControl>
            <ControledInput
              fullWidth
              required
              id="message"
              label="Summary"
              {...register('message', { required: 'Required' })}
              hasError={!!errors.message}
              errorMessage={getAllValidationErrors(errors.message)}
              data-testid="message-input"
            />
            <ControledInput
              fullWidth
              multiline
              required
              id="reproSteps"
              label="Reproduction Steps"
              {...register('reproSteps', { required: 'Required' })}
              hasError={!!errors.reproSteps}
              errorMessage={getAllValidationErrors(errors.reproSteps)}
              data-testid="reproSteps-input"
            />
            {!isCharactersLoading &&
              characters?.length &&
              area &&
              ![AppArea.NAV, AppArea.AUTH].includes(area as AppArea) && (
                <FilterSelect
                  id="character"
                  data-testid="character-form"
                  margin="dense"
                  fullWidth
                  label="Character"
                  value={character || ''}
                  onChange={(v) => setValue('character', v as string)}
                  options={characters.map((char) => ({
                    value: char.id,
                    label: `${char.name} - ${char.race?.name} ${char.class?.name}`
                  }))}
                />
              )}
            <FormControlLabel
              sx={{ marginX: 0 }}
              data-testid="corrupted-form"
              control={
                <Controller
                  name="corrupted"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="corrupted"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label="Data is corrupted"
            />
          </Fragment>
        )}

        {type === ContactType.REQUEST && (
          <Fragment>
            <FormControl margin="dense" fullWidth required data-testid="request-area-form">
              <InputLabel htmlFor="requestArea">Area</InputLabel>
              <Controller
                name="requestArea"
                control={control}
                rules={{
                  required: 'Required',
                  validate: (value) => (value === RequestArea.OTHER ? 'Required' : undefined)
                }}
                render={({ field }) => (
                  <Select
                    id="requestArea"
                    label="Improvement Area"
                    {...field}
                    value={!isRequestArea || !field.value ? RequestArea.OTHER : field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      setValue('requestContent', undefined);
                    }}
                  >
                    {Object.values(RequestArea).map((areaOption) => (
                      <MenuItem key={areaOption} value={areaOption}>
                        {areaOption}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {(!requestArea || requestArea === RequestArea.OTHER || !isRequestArea) && (
                <ControledInput
                  required
                  id="requestArea"
                  label="Area"
                  hiddenValues={[RequestArea.OTHER]}
                  control={control}
                  rules={{ required: 'Required' }}
                  errorMessage={getAllValidationErrors(errors.requestArea)}
                  data-testid="requestArea-input"
                />
              )}
              {requestArea === RequestArea.CONTENT && (
                <ControledInput
                  required
                  id="requestContent"
                  label="Type of content"
                  placeholder="Race, class, language, background, spell..."
                  {...register('requestContent', { required: 'Required' })}
                  hasError={!!errors.requestContent}
                  errorMessage={getAllValidationErrors(errors.requestContent)}
                  data-testid="requestContent-input"
                />
              )}
            </FormControl>
            <ControledInput
              fullWidth
              multiline
              required
              id="message"
              label="Message"
              {...register('message', { required: 'Required' })}
              hasError={!!errors.message}
              errorMessage={getAllValidationErrors(errors.message)}
              data-testid="message-input"
            />
            <FormControlLabel
              sx={{ marginX: 0 }}
              data-testid="can-contact-form"
              control={
                <Controller
                  name="canContact"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="canContact"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label="Accept to be contacted"
            />
          </Fragment>
        )}

        {type === ContactType.FEEDBACK && (
          <Fragment>
            <ControledInput
              fullWidth
              multiline
              required
              id="message"
              label="Message"
              {...register('message', { required: 'Required' })}
              hasError={!!errors.message}
              errorMessage={getAllValidationErrors(errors.message)}
              data-testid="message-input"
            />
            <FormControlLabel
              sx={{ marginX: 0 }}
              data-testid="anonymous-form"
              control={
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(_, checked) => setIsAnonymous(checked)}
                />
              }
              label="Anonymous"
            />
          </Fragment>
        )}

        <Button
          disabled={!isValid || firebaseCrud.isLoading}
          sx={{ marginY: 1 }}
          fullWidth
          type="submit"
          variant="contained"
        >
          Submit
        </Button>
      </form>

      <FullPageLoader open={firebaseCrud.isLoading} />
    </Container>
  );
}
