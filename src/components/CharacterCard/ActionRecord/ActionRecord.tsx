import { Fragment, useEffect, useRef, useState } from 'react';
import { Add, Clear } from '@mui/icons-material';
import { Box, Button, Chip, IconButton, SwipeableDrawer, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Dayjs } from 'dayjs';
import { getEquipment, getFeature, getMagicItem } from '@api/ressources';
import { getActionRecords } from '@api/users';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import {
  formatResourceUsageIncrement,
  getRelatedFeatures,
  getUsageType,
  revertActionRecordUsage
} from '@utils/character/resourceUsage.utils';
import { Feature } from '@representations/abilities/feature.representation';
import type {
  Character,
  ActionRecordType as FilterType
} from '@representations/user.representation';
import { ActionRecord as ActionRecordType } from '@representations/user.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { ActionRecordForm, type ActionRecordFormData } from './ActionRecordForm';
import { ActionRecordList } from './ActionRecordList';

const FILTERS: { value: FilterType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'spell', label: 'Spells' },
  { value: 'feature', label: 'Features' },
  { value: 'trait', label: 'Traits' },
  { value: 'health', label: 'Health' },
  { value: 'money', label: 'Money' },
  { value: 'custom', label: 'Custom' }
];

interface ActionRecordProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
}

export function ActionRecord({ isOpen, onClose, character }: ActionRecordProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType | 'all'>('all');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const { isOn: isFormOpen, turnOn: openForm, turnOff: closeForm } = useToggle(false);

  const firebaseCrud = useFirebaseCrud<Character>({ collectionPath: 'users/{userId}/characters' });

  const {
    logAction,
    removeAction,
    updateAction,
    isLoading: isActioning,
    refetchRecords
  } = useActionRecord(character.id);

  const { data: records, isFetching } = useQuery({
    queryKey: ['fetchActionRecords', user?.uid, character.id],
    queryFn: async () =>
      (user?.uid ? await getActionRecords(user.uid, character.id) : null)?.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    enabled: !!user?.uid && !!character.id
  });

  const workingCharacterRef = useRef<Character>(character);
  useEffect(() => {
    workingCharacterRef.current = character;
  }, [character]);

  useEffect(() => {
    if (!isOpen) refetchRecords();
  }, [isOpen]);

  const handleAddCustom = async (data: ActionRecordFormData) => {
    let resourceUsageMeta;
    const item = data.equipmentIndex
      ? await queryClient.fetchQuery({
          queryKey: ['fetchEquipment', character.version, data.equipmentIndex],
          queryFn: async () => {
            const item = await getEquipment(character.version, data.equipmentIndex ?? '');
            return item ? item : await getMagicItem(character.version, data.equipmentIndex ?? '');
          }
        })
      : undefined;

    if (data?.usage || item?.usage) {
      const fullFeatures: Feature[] = (
        await Promise.all(
          getRelatedFeatures([data, item]).map((index) =>
            queryClient.fetchQuery({
              queryKey: ['fetchFeature', character.version, index],
              queryFn: async () => await getFeature(character.version || 'Legacy', index)
            })
          )
        )
      ).filter((f): f is Feature => !!f);

      if (data?.usage && (data.type === 'feature' || data.type === 'trait') && data.sourceIndex)
        resourceUsageMeta = {
          index: data.sourceIndex,
          usage: getUsageType(data.usage, fullFeatures),
          type: data.type
        };
      else if (item?.usage)
        resourceUsageMeta = {
          index: item.index,
          usage: getUsageType(item.usage, fullFeatures),
          type: 'other' as const
        };
    }

    const baseAction = {
      type: data.type,
      name: data.name.trim(),
      description: data.isRitual
        ? 'Ritual Cast' + (data.description && '\n' + data.description.trim())
        : data.description?.trim() || undefined,
      value: data.value,
      valueUnit: data.valueUnit?.trim() || undefined,
      auto: false,
      ...((data.type === 'feature' || data.type === 'trait') && data.sourceIndex
        ? { sourceIndex: data.sourceIndex }
        : {})
    };
    const equipment = data.equipmentIndex
      ? character.equipments?.find((e) => e.index === data.equipmentIndex)
      : undefined;

    const success = await logAction(
      equipment
        ? {
            ...baseAction,
            equipment: { index: equipment.index, name: equipment.name }
          }
        : baseAction
    );

    if (success && resourceUsageMeta?.usage && resourceUsageMeta.index) {
      const recordUsage = formatResourceUsageIncrement(resourceUsageMeta);
      const successUsage = await firebaseCrud.update(character.id, recordUsage, false);
      if (successUsage)
        await queryClient.invalidateQueries({
          queryKey: ['fetchCharacter', user?.uid, character.id]
        });
    }

    if (success) closeForm();
  };

  const handleRemove = async (record: ActionRecordType, invalidate?: boolean) => {
    const success = await removeAction(record.id);

    if (success) {
      const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(
        workingCharacterRef.current,
        record
      );
      if (Object.keys(firestoreUpdate).length > 0) {
        const updateSuccess = await firebaseCrud.update(character.id, firestoreUpdate, false);
        if (updateSuccess) workingCharacterRef.current = updatedCharacter;
      }

      if (invalidate)
        await queryClient.invalidateQueries({
          queryKey: ['fetchCharacter', user?.uid, character.id]
        });
    }
    return success;
  };

  return (
    <Fragment>
      <SwipeableDrawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        onOpen={() => undefined}
        ModalProps={{ keepMounted: false }}
        disableSwipeToOpen={true}
        disableBackdropTransition={true}
        data-testid={`action-record-drawer-${character.id}`}
      >
        <Box
          paddingY={2}
          paddingX={4}
          display="flex"
          flexDirection="column"
          gap={2}
          flex={1}
          overflow="hidden"
          width="500px"
          maxWidth="100vw"
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Action Record</Typography>
              <IconButton onClick={openForm} data-testid="add-action-record">
                <Add />
              </IconButton>
            </Box>

            <Box display="flex" gap={0.75} flexWrap="wrap" justifyContent="center">
              {FILTERS.map(({ value, label }) => (
                <Chip
                  key={value}
                  label={label}
                  size="small"
                  variant={filter === value ? 'filled' : 'outlined'}
                  color={filter === value ? 'primary' : 'default'}
                  onClick={() => (value === filter ? setFilter('all') : setFilter(value))}
                  sx={{ fontWeight: filter === value ? 600 : 400 }}
                />
              ))}
            </Box>

            <Box display="flex" gap={1} alignItems="center" mt={2}>
              <DatePicker
                disableFuture
                closeOnSelect
                label="From"
                value={dateFrom}
                onChange={setDateFrom}
                maxDate={dateTo ?? undefined}
                format="DD/MM/YYYY"
                views={['year', 'month', 'day']}
                slotProps={{
                  textField: {
                    size: 'small',
                    id: 'dateFilterFrom'
                  }
                }}
              />
              <DatePicker
                disableFuture
                closeOnSelect
                label="To"
                value={dateTo}
                onChange={setDateTo}
                minDate={dateFrom ?? undefined}
                format="DD/MM/YYYY"
                views={['year', 'month', 'day']}
                slotProps={{
                  textField: {
                    size: 'small',
                    id: 'dateFilterTo'
                  }
                }}
              />
              {(dateFrom || dateTo) && (
                <IconButton
                  size="small"
                  data-testid="date-filter-clear"
                  onClick={() => {
                    setDateFrom(null);
                    setDateTo(null);
                  }}
                >
                  <Clear fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>

          <ActionRecordList
            records={records ?? []}
            onDelete={handleRemove}
            onEditDescription={async (id: string, description: string) =>
              await updateAction(id, { description: description.trim() || null })
            }
            filter={filter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            isLoading={isFetching}
          />

          <Button sx={{ alignSelf: 'flex-end' }} onClick={onClose}>
            Close
          </Button>
        </Box>
      </SwipeableDrawer>

      <ActionRecordForm
        open={isFormOpen}
        onClose={closeForm}
        onSubmit={handleAddCustom}
        isLoading={isActioning}
        character={character}
      />
    </Fragment>
  );
}
