import { Fragment, useEffect, useState } from 'react';
import { Add } from '@mui/icons-material';
import { Box, Button, Chip, IconButton, SwipeableDrawer, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getActionRecords } from '@api/users';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { getUsageType } from '@utils/index';
import type {
  Character,
  ActionRecordType as FilterType
} from '@representations/user.representation';
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

// TODO: Add date picker to filter by date range
export function ActionRecord({ isOpen, onClose, character }: ActionRecordProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType | 'all'>('all');
  const { isOn: isFormOpen, turnOn: openForm, turnOff: closeForm } = useToggle(false);

  const {
    logAction,
    removeAction,
    updateAction,
    isLoading: isActioning,
    refetchRecords
  } = useActionRecord(character.id);
  const characterCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id]
  });

  const { data: records, isFetching } = useQuery({
    queryKey: ['fetchActionRecords', user?.uid, character.id],
    queryFn: async () =>
      (user?.uid ? await getActionRecords(user.uid, character.id) : null)?.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    enabled: !!user?.uid && !!character.id && isOpen
  });

  useEffect(() => {
    if (!isOpen) refetchRecords();
  }, [isOpen]);

  const handleAddCustom = async (data: ActionRecordFormData) => {
    if ((data.type === 'feature' || data.type === 'trait') && data?.usage && data.sourceIndex) {
      const current = character.resourceUsages?.[data.sourceIndex]?.current ?? 0;
      const usageType = getUsageType(data.usage, []);
      await characterCrud.update(character.id, {
        [`resourceUsages.${data.sourceIndex}`]: {
          type: data.type,
          usage: usageType,
          current: current + 1
        }
      });
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

    await logAction(
      equipment
        ? {
            ...baseAction,
            equipment: { index: equipment.index, name: equipment.name }
          }
        : baseAction
    );
    closeForm();
  };

  const handleRemove = async (id: string) => {
    const success = await removeAction(id);

    const sourceIndex = records?.flat().find((r) => r?.id === id)?.sourceIndex;
    if (success && sourceIndex) {
      const existing = character.resourceUsages?.[sourceIndex];
      if (existing) {
        await characterCrud.update(character.id, {
          [`resourceUsages.${sourceIndex}`]: {
            ...existing,
            current: Math.max(0, existing.current - 1)
          }
        });
      }
    }
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

            <Box display="flex" gap={0.75} flexWrap="wrap">
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
          </Box>

          <ActionRecordList
            records={records?.flat().filter(Boolean) ?? []}
            onDelete={handleRemove}
            onEditDescription={async (id: string, description: string) =>
              await updateAction(id, { description: description.trim() || undefined })
            }
            filter={filter}
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
