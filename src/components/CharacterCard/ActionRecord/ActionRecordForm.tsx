import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { omit, uniqBy } from 'lodash';
import { getClassInfo, getFeature, getTrait } from '@api/ressources';
import { ControledInput } from '@shared/ControledInput';
import {
  createQueryCombiner,
  formatUsageLabelText,
  getRelatedFeatures,
  getUsageTimes,
  getUsageType,
  getUsageTypeLabel
} from '@utils/index';
import { Feature } from '@representations/abilities/feature.representation';
import { Classes } from '@representations/character/class.representation';
import { Usage } from '@representations/common.representation';
import { ActionRecordType, Character } from '@representations/user.representation';

export const ACTION_RECORD_TYPES: Partial<Record<ActionRecordType, { label: string }>> = {
  custom: { label: 'Custom' },
  trait: { label: 'Trait' },
  feature: { label: 'Feature' },
  spell: { label: 'Spell' }
};

export interface ActionRecordFormData {
  type: ActionRecordType;
  sourceIndex?: string;
  name: string;
  description?: string;
  value?: number;
  valueUnit?: string;
  equipmentIndex?: string;
  slotLevel?: number;
  isRitual?: boolean;
  usage?: Usage;
}

const DEFAULT_FORM_VALUES: ActionRecordFormData = {
  type: 'custom',
  sourceIndex: undefined,
  name: '',
  description: '',
  value: undefined,
  valueUnit: '',
  equipmentIndex: undefined,
  slotLevel: undefined,
  isRitual: false
};

interface ActionRecordFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ActionRecordFormData) => Promise<void>;
  isLoading?: boolean;
  character: Character;
}

export function ActionRecordForm({
  open,
  onClose,
  onSubmit,
  isLoading,
  character
}: ActionRecordFormProps) {
  const { control, handleSubmit, watch, reset, setValue, clearErrors, formState } =
    useForm<ActionRecordFormData>({ mode: 'onTouched', defaultValues: DEFAULT_FORM_VALUES });
  const [type, sourceIndex, isRitual] = watch(['type', 'sourceIndex', 'isRitual']);

  const { data: canCastRitual } = useQuery({
    queryKey: ['fetchClassInfo', character.version, character?.class.index],
    queryFn: async () =>
      character
        ? ((await getClassInfo(character.version, character.class.index)) as Classes | null)
        : null,
    enabled: !!character,
    select: (classInfo) =>
      classInfo?.spellcasting?.info.some(({ name }) => name === 'Ritual Casting') ?? false
  });

  const { data: trait, isFetching: isTraitFetching } = useQuery({
    queryKey: ['fetchTrait', character.version, sourceIndex],
    queryFn: async () =>
      sourceIndex ? await getTrait(character.version || 'Legacy', sourceIndex) : null,
    enabled: !!sourceIndex && type === 'trait' && open
  });

  const { data: feature, isFetching: isFeatureFetching } = useQuery({
    queryKey: ['fetchFeature', character.version, sourceIndex],
    queryFn: async () =>
      sourceIndex ? await getFeature(character.version || 'Legacy', sourceIndex) : null,
    enabled: !!sourceIndex && type === 'feature' && open
  });

  const selectedResource = useMemo(() => trait ?? feature, [trait, feature]);

  const { data: fullFeatures } = useQueries({
    queries:
      uniqBy(character.features, 'index')?.map(({ index }) => ({
        queryKey: ['fetchFeature', character.version, index],
        queryFn: async () => await getFeature(character.version || 'Legacy', index),
        enabled:
          !!index && (selectedResource ? getRelatedFeatures([selectedResource]).length > 0 : false)
      })) || [],
    combine: useCallback(createQueryCombiner<Feature>(), [])
  });

  const usageInfo = useMemo(() => {
    if (!selectedResource?.usage) return null;
    const max = getUsageTimes(selectedResource.usage, character);

    const current = character.resourceUsages?.[selectedResource.index];
    const label = getUsageTypeLabel(
      current?.usage ?? getUsageType(selectedResource.usage, fullFeatures)
    );

    return { current: current?.current ?? 0, max: max === Infinity ? undefined : max, label };
  }, [selectedResource, character, fullFeatures]);

  const spells = useMemo(() => {
    const known = character.knownSpells ?? [];
    const prepared = character.preparedSpells ?? [];
    return (
      (uniqBy([...prepared, ...known], 'index').sort(
        (a, b) => a.level - b.level
      ) as Character['knownSpells']) || []
    );
  }, [character.knownSpells, character.preparedSpells]);

  useEffect(() => {
    if (!sourceIndex) return;
    let name: string | undefined;

    if (type === 'spell') name = spells.find((s) => s.index === sourceIndex)?.name;
    else if (type === 'feature')
      name = character.features?.find((f) => f.index === sourceIndex)?.name;
    else if (type === 'trait') name = character.traits?.find((t) => t.index === sourceIndex)?.name;

    if (name) setValue('name', name);
  }, [sourceIndex, type]);

  useEffect(() => {
    Object.entries(DEFAULT_FORM_VALUES).forEach(([key, value]) => {
      if (key !== 'type') setValue(key as keyof ActionRecordFormData, value);
    });
    clearErrors();
  }, [type]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit({ ...data, name: data.name.trim(), usage: selectedResource?.usage });
  });

  const availableTypes = useMemo(() => {
    const omitted = [
      !spells.length ? 'spell' : undefined,
      !character.features?.length ? 'feature' : undefined,
      !character.traits?.length ? 'trait' : undefined
    ].filter(Boolean) as string[];
    return omitted.length ? omit(ACTION_RECORD_TYPES, omitted) : ACTION_RECORD_TYPES;
  }, [spells]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Action Record</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box display="flex" flexDirection="column" gap={2.5}>
          <Box display="flex" gap={0.75} flexWrap="wrap">
            {Object.entries(availableTypes).map(([value, { label }]) => (
              <Chip
                key={value}
                label={label}
                variant={type === value ? 'filled' : 'outlined'}
                color={type === value ? 'primary' : 'default'}
                onClick={() => setValue('type', value as ActionRecordType)}
                sx={{ fontWeight: value === type ? 600 : 400 }}
              />
            ))}
          </Box>

          {type === 'spell' && (
            <Box display="flex" flexDirection="column" gap={0.75}>
              <Controller
                name="sourceIndex"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth size="small" required>
                    <InputLabel>{ACTION_RECORD_TYPES[type]?.label}</InputLabel>
                    <Select
                      id="source-select"
                      label={ACTION_RECORD_TYPES[type]?.label}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    >
                      {spells.filter((s) => s.level === 0).length > 0 && [
                        <ListSubheader key="cantrip-header">Cantrips</ListSubheader>,
                        ...spells
                          .filter((s) => s.level === 0)
                          .map((s) => (
                            <MenuItem key={s.index} value={s.index}>
                              {s.name}
                            </MenuItem>
                          ))
                      ]}
                      {spells.filter((s) => s.level > 0).length > 0 && [
                        <ListSubheader key="levelled-header">Spells</ListSubheader>,
                        ...spells
                          .filter((s) => s.level > 0)
                          .map((s) => (
                            <MenuItem key={s.index} value={s.index}>
                              <Box display="flex" flex={1} justifyContent="space-between" gap={1}>
                                {s.name}
                                <Chip
                                  label={`Lv ${s.level}`}
                                  size="small"
                                  sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                                />
                              </Box>
                            </MenuItem>
                          ))
                      ]}
                    </Select>
                  </FormControl>
                )}
              />
              {canCastRitual && !!spells.find((s) => s.index === sourceIndex)?.ritual && (
                <Controller
                  name="isRitual"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      data-testid="ritual-checkbox"
                      label="Cast as Ritual (+10 min, no slot)"
                      control={
                        <Checkbox
                          size="small"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                    />
                  )}
                />
              )}
              {(spells.find((s) => s.index === sourceIndex)?.level ?? 0) > 0 && !isRitual && (
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Slot consumption isn't tracked here — head to the Spells page to expend a slot.
                </Typography>
              )}
            </Box>
          )}

          {(type === 'feature' || type === 'trait') && (
            <Box display="flex" flexDirection="column" gap={0.75}>
              <Controller
                name="sourceIndex"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth size="small" required>
                    <InputLabel>{ACTION_RECORD_TYPES[type]?.label}</InputLabel>
                    <Select
                      id="source-select"
                      label={ACTION_RECORD_TYPES[type]?.label}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    >
                      {(type === 'feature' ? character.features : character.traits)?.map((item) => (
                        <MenuItem key={item.index} value={item.index}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              {sourceIndex &&
                (isTraitFetching || isFeatureFetching ? (
                  <CircularProgress size={16} />
                ) : usageInfo ? (
                  <Fragment>
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      Each record expends a use, tracked on the Resources page. You may push beyond
                      your limit if the situation calls for it.
                    </Typography>
                    <Typography
                      variant="caption"
                      color={
                        usageInfo.max !== undefined && usageInfo.current >= usageInfo.max
                          ? 'error'
                          : 'inherit'
                      }
                      textAlign="center"
                    >
                      {formatUsageLabelText(usageInfo.current, usageInfo.max)} uses
                      {usageInfo.label && ` - Resets on ${usageInfo.label.toLocaleLowerCase()}`}
                    </Typography>
                  </Fragment>
                ) : null)}
            </Box>
          )}

          {type === 'custom' && (
            <Fragment>
              <ControledInput
                id="name"
                label="Name"
                fullWidth
                size="small"
                required
                sx={{ my: 0 }}
                control={control}
                rules={{ required: true, minLength: 1 }}
                errorMessage={['Name is required']}
              />
              <Box display="flex" gap={1}>
                <ControledInput
                  id="value"
                  control={control}
                  label="Value (optional)"
                  type="number"
                  size="small"
                  sx={{ flex: 1, my: 0 }}
                />

                <ControledInput
                  id="valueUnit"
                  control={control}
                  label="Unit (optional)"
                  placeholder="hp, gp, uses…"
                  size="small"
                  sx={{ flex: 1, my: 0 }}
                />
              </Box>
              {character.equipments.length > 0 && (
                <Controller
                  name="equipmentIndex"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Equipment (optional)</InputLabel>
                      <Select
                        id="equipment-select"
                        label="Equipment (optional)"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {character.equipments.map((eq) => (
                          <MenuItem key={eq.index} value={eq.index}>
                            {eq.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              )}
            </Fragment>
          )}

          <ControledInput
            id="description"
            label="Description"
            multiline
            fullWidth
            minRows={2}
            maxRows={10}
            size="small"
            placeholder="e.g. upcast at level 3, used on the goblin lord, added to equipment…"
            control={control}
            sx={{ maxHeight: '150px', overflowY: 'auto' }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!formState.isValid || isLoading}
          onClick={handleFormSubmit}
        >
          Add Record
        </Button>
      </DialogActions>
    </Dialog>
  );
}
