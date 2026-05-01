import { Fragment, useEffect, useState } from 'react';
import { Search } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getConditions } from '@api/ressources';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { Loader } from '@shared/Loader';
import type { Condition } from '@representations/campaign/adventure.representation';
import type { Character } from '@representations/user.representation';
import { ControledInput } from 'src/components/shared/ControledInput';
import { useActionRecord } from 'src/hooks';
import { DefaultRepresentation } from 'src/representations/common.representation';
import { formatActionRecord, formatConditionRecord } from 'src/utils/actions.utils';
import { ActiveCondition } from './ActiveCondition';
import { ConditionCard } from './ConditionCard';

const EXHAUSTION_INDEX = 'exhaustion';
const EXHAUSTION_MAX_LEVEL = 6;

type CharacterCondition = NonNullable<Character['conditions']>;
interface ConditionsManagerProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
}

export function ConditionsManager({ character, isOpen, onClose }: ConditionsManagerProps) {
  const [selected, setSelected] = useState<CharacterCondition>(character.conditions ?? []);
  const [pendingRemovals, setPendingRemovals] = useState<CharacterCondition>([]);
  const [tab, setTab] = useState(character.conditions?.length ? 0 : 1);
  const [searchText, setSearchText] = useState('');

  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id],
    successMessages: { update: 'Conditions Updated' }
  });
  const { logAction } = useActionRecord(character.id);

  const { data: conditions, isLoading: isLoadingConditions } = useQuery({
    queryKey: ['fetchConditions', character.version],
    queryFn: async () => (await getConditions(character.version || 'Legacy'))?.results,
    enabled: isOpen
  });

  useEffect(() => {
    if (isOpen) {
      setSelected(character.conditions ?? []);
      setPendingRemovals([]);
      setSearchText('');
      setTab(character.conditions?.length ? 0 : 1);
    }
  }, [isOpen, character.conditions]);

  const toggleAdd = (condition: Condition) => {
    if (character.conditions?.some((s) => s.index === condition.index)) return;

    setSelected((prev) => {
      const existingIndex = prev.findIndex((s) => s.index === condition.index);
      if (condition.index === EXHAUSTION_INDEX) {
        if (existingIndex === -1)
          return [...prev, { index: condition.index, name: condition.name, level: 1 }];
        if ((prev[existingIndex].level ?? 1) >= EXHAUSTION_MAX_LEVEL)
          return prev.filter((s) => s.index !== condition.index);

        return prev.map((s) =>
          s.index === EXHAUSTION_INDEX ? { ...s, level: (s.level ?? 1) + 1 } : s
        );
      }

      return existingIndex === -1
        ? [...prev, { index: condition.index, name: condition.name }]
        : prev.filter((s) => s.index !== condition.index);
    });
  };

  const changeExhaustionLevel = (condition: DefaultRepresentation, lvl: number) => {
    setSelected((prev) =>
      prev.map((s) =>
        s.index === condition.index ? { ...s, level: Math.min(EXHAUSTION_MAX_LEVEL, lvl) } : s
      )
    );
  };

  const onSave = async () => {
    const success = await firebaseCrud.update(character.id, {
      conditions: selected.filter((s) => !pendingRemovals.some(({ index }) => index === s.index))
    });

    if (success) {
      onClose();
      await logAction(
        formatActionRecord(
          'custom',
          formatConditionRecord(character.conditions, selected, pendingRemovals)
        )
      );
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth>
      <DialogTitle>Conditions</DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          gap: 2,
          height: '500px'
        }}
      >
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)}>
          <Tab
            label={`Active (${character.conditions?.length ?? 0})`}
            disabled={!character.conditions?.length}
          />
          <Tab label="Add" />
        </Tabs>

        {tab === 0 && (
          <Box display="flex" flexDirection="column" gap={0.75}>
            {selected
              .filter(({ index }) => character.conditions?.some(({ index: i }) => i === index))
              .map((condition, i) => (
                <Fragment key={`condition-${i}-${condition.index}`}>
                  {i > 0 && <Divider />}
                  <ActiveCondition
                    condition={condition}
                    maxLevel={
                      condition.index === EXHAUSTION_INDEX ? EXHAUSTION_MAX_LEVEL : undefined
                    }
                    onRemove={(el) => {
                      const isSaved = character.conditions?.some(({ index }) => index === el.index);
                      if (isSaved)
                        setPendingRemovals((prev) =>
                          prev.some(({ index }) => index === el.index)
                            ? prev.filter(({ index }) => index !== el.index)
                            : [...prev, el]
                        );
                      else setSelected((prev) => prev.filter(({ index }) => index !== el.index));
                    }}
                    isPendingRemoval={pendingRemovals.some(({ index: i }) => i === condition.index)}
                    onLevelChange={changeExhaustionLevel}
                    block
                  />
                </Fragment>
              ))}
          </Box>
        )}

        {tab === 1 && (
          <Fragment>
            <ControledInput
              fullWidth
              id="condition-search"
              size="small"
              autoComplete="off"
              value={searchText}
              onChange={(_, v) => setSearchText(v?.toString() ?? '')}
              startAdornment={<Search fontSize="small" sx={{ mr: 0.5 }} />}
              placeholder="Search"
            />

            <Box overflow="auto" flex={1}>
              {isLoadingConditions ? (
                <Loader />
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  {conditions
                    ?.filter((c) => c.name.toLowerCase().includes(searchText.toLowerCase()))
                    .map((condition) => (
                      <ConditionCard
                        key={`condition-card-${condition.index}`}
                        condition={condition}
                        isSelected={selected.some((s) => s.index === condition.index)}
                        isDisabled={
                          !!character.conditions?.some((s) => s.index === condition.index)
                        }
                        selectedLevel={selected?.find((s) => s.index === condition.index)?.level}
                        onToggle={toggleAdd}
                      />
                    ))}
                </Box>
              )}
            </Box>
          </Fragment>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSave} disabled={firebaseCrud.isLoading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
