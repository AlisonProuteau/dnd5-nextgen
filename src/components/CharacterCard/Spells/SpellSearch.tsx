import { Fragment, useMemo, useState } from 'react';
import { Box, Chip, Divider, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { mapValues } from 'lodash';
import {
  getAllClasses,
  getAllSubclasses,
  getMagicSchools,
  getMatchingSpells,
  getSpellsForClass
} from '@api/ressources';
import { useToggle } from '@hooks/useToggle';
import { ControledInput } from '@shared/ControledInput';
import { FilterSelect } from '@shared/FilterSelect';
import { Loader } from '@shared/Loader';
import { toKey } from '@utils/index';
import { SpellFilters } from '@representations/abilities/magic.representation';
import type { Character } from '@representations/user.representation';
import type { TypeFromArray } from '@representations/utils.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { SpellSearchRow } from './SpellSearchRow';

interface SpellSearchProps {
  classIndex: string;
  subclassIndex?: string;
  maxLevel?: number;
  selectedSpells?: Character['knownSpells'];
  excludeSpells?: { index: string }[];
  onSelect?: (spell: TypeFromArray<Character['knownSpells']>, remove?: boolean) => void;
}

export function SpellSearch({
  classIndex,
  subclassIndex,
  maxLevel,
  selectedSpells = [],
  excludeSpells = [],
  onSelect
}: SpellSearchProps) {
  const { version } = useAuth();
  const [search, setSearch] = useState('');
  const [runningTimer, setRunningTimer] = useState<NodeJS.Timeout>();
  const { isOn: isLoading, setIsOn: setIsLoading } = useToggle(false);

  const [filters, setFilters] = useState<SpellFilters>({
    minLevel: 0,
    maxLevel: maxLevel ?? undefined,
    school: '',
    ritual: false,
    concentration: false,
    racial: false,
    classFilter: '',
    subclassFilter: ''
  });

  const { data: allClasses = [] } = useQuery({
    queryKey: ['fetchAllClasses', version],
    queryFn: async () => (version ? (await getAllClasses(version)).results : []),
    enabled: !!version
  });

  const { data: allSubclasses = [] } = useQuery({
    queryKey: ['fetchAllSubclasses', version, filters.classFilter],
    queryFn: async () =>
      version && filters.classFilter
        ? (await getAllSubclasses(version, filters.classFilter)).results
        : [],
    enabled: !!version && !!filters.classFilter
  });

  const { data: allSchools = [] } = useQuery({
    queryKey: ['fetchMagicSchools', version],
    queryFn: async () => (version ? (await getMagicSchools(version)).results : []),
    enabled: !!version
  });

  const hasFilters = useMemo(
    () =>
      search.length > 0 ||
      (filters.minLevel ?? 0) > 0 ||
      (maxLevel !== undefined && filters.maxLevel !== maxLevel) ||
      !!filters.school ||
      filters.ritual ||
      filters.concentration ||
      filters.racial ||
      !!filters.classFilter,
    [search, filters, maxLevel]
  );

  const { data: allSpells, isFetching: spellsFetching } = useQuery({
    queryKey: ['fetchAllSpells', version, mapValues(filters, (v) => (!v ? undefined : v))],
    queryFn: async () =>
      version
        ? (
            await getMatchingSpells(
              version,
              mapValues(filters, (v) => (!v ? undefined : v)) as SpellFilters
            )
          ).results
        : null,
    enabled: hasFilters && !!version
  });

  const { data: knownSpells = [], isFetching: knownSpellsFetching } = useQuery({
    queryKey: ['fetchCharacterSpells', version, classIndex, subclassIndex, maxLevel],
    queryFn: async () =>
      classIndex && version
        ? (await getSpellsForClass(version, classIndex, subclassIndex, maxLevel)).results
        : [],
    enabled: !!classIndex && !!allSpells?.length && !!version
  });

  const spells = useMemo(() => {
    if (!hasFilters || !allSpells?.length || spellsFetching || knownSpellsFetching) return [];
    return allSpells
      .filter(({ name }) => !search.length || name.toLowerCase().includes(search.toLowerCase()))
      .filter(({ index }) => !knownSpells.find((known) => known.index === index))
      .filter(({ index }) => !selectedSpells.find((selected) => selected.index === index))
      .filter(({ index }) => !excludeSpells.find((ex) => ex.index === index));
  }, [
    hasFilters || spellsFetching || knownSpellsFetching,
    search,
    spellsFetching,
    knownSpellsFetching,
    toKey(allSpells),
    toKey(knownSpells),
    toKey(selectedSpells),
    toKey(excludeSpells)
  ]);

  const levelOptions = useMemo(() => {
    const cap = maxLevel ?? 9;
    return Array.from({ length: cap + 1 }, (_, i) => i);
  }, [maxLevel]);

  const chipFilters = useMemo(
    () => [
      {
        label: 'Ritual',
        active: filters.ritual,
        toggle: () => setFilters((data) => ({ ...data, ritual: !data.ritual }))
      },
      {
        label: 'Concentration',
        active: filters.concentration,
        toggle: () => setFilters((data) => ({ ...data, concentration: !data.concentration }))
      },
      {
        label: 'Racial',
        active: filters.racial,
        toggle: () => setFilters((data) => ({ ...data, racial: !data.racial }))
      }
    ],
    [filters.ritual, filters.concentration, filters.racial]
  );

  const setFilterData = (data: Partial<SpellFilters>) =>
    setFilters((f) => ({
      ...f,
      ...data
    }));

  return onSelect ? (
    <Fragment>
      <ControledInput
        fullWidth
        id="search"
        type="text"
        label="Search by name"
        autoComplete="off"
        onChange={(_, value) => {
          setIsLoading(true);
          if (runningTimer) clearTimeout(runningTimer);
          setRunningTimer(
            setTimeout(() => {
              setSearch(value as string);
              setIsLoading(false);
            }, 500)
          );
        }}
      />

      <Box
        display="flex"
        flexWrap="wrap"
        gap={1}
        alignItems="center"
        justifyContent="center"
        mt={1}
        mb={1}
      >
        <FilterSelect
          id="level-min"
          label="Min level"
          value={filters.minLevel ?? ''}
          onChange={(v) => setFilterData({ minLevel: v === '' ? undefined : Number(v) })}
          options={[
            ...levelOptions.map((option) => ({
              value: option,
              label: option === 0 ? 'Cantrip' : `Level ${option}`,
              disabled: filters.maxLevel !== undefined && option > filters.maxLevel
            }))
          ]}
          sx={{ flex: '1 1 100px' }}
        />
        <FilterSelect
          id="level-max"
          label="Max level"
          value={filters.maxLevel ?? ''}
          onChange={(v) => setFilterData({ maxLevel: v === '' ? undefined : Number(v) })}
          options={[
            ...(maxLevel === undefined ? [{ value: '', label: 'Any' }] : []),
            ...levelOptions.map((option) => ({
              value: option,
              label: option === 0 ? 'Cantrip' : `Level ${option}`,
              disabled: filters.minLevel !== undefined && option < filters.minLevel
            }))
          ]}
          sx={{ flex: '1 1 100px' }}
        />
        <FilterSelect
          id="class"
          label="Class"
          value={filters.classFilter as string}
          onChange={(v) => {
            setFilterData({ classFilter: v as string, subclassFilter: '' });
          }}
          options={[
            { value: '', label: 'Any' },
            ...allClasses.map((c) => ({ value: c.index, label: c.name }))
          ]}
          sx={{ flex: '1 1 130px' }}
        />
        {allSubclasses.length > 0 && (
          <FilterSelect
            id="subclass"
            label="Subclass"
            value={filters.subclassFilter as string}
            onChange={(v) => setFilterData({ subclassFilter: v as string })}
            options={[
              { value: '', label: 'Any' },
              ...allSubclasses.map((s) => ({ value: s.index, label: s.name }))
            ]}
            sx={{ flex: '1 1 130px' }}
          />
        )}
        <FilterSelect
          id="school"
          label="School"
          value={filters.school as string}
          onChange={(v) => setFilterData({ school: v as string })}
          options={[
            { value: '', label: 'Any' },
            ...allSchools.map((s) => ({ value: s.index, label: s.name }))
          ]}
          sx={{ flex: '1 1 130px' }}
        />
        <Box display="flex" gap={1} sx={{ flex: '0 0 auto' }}>
          {chipFilters.map(({ label, active, toggle }) => (
            <Chip
              key={label}
              label={label}
              size="small"
              variant={active ? 'filled' : 'outlined'}
              color={active ? 'primary' : 'default'}
              onClick={toggle}
              sx={{ fontWeight: active ? 600 : 400 }}
            />
          ))}
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={0.25} maxWidth={500} mx="auto" width="100%">
        {selectedSpells.map((spell, i) => (
          <SpellSearchRow
            testId={`search-spell-item-${spell.index}-selected`}
            spell={spell}
            showMeta={false}
            isFirst={i === 0}
            icon="remove"
            onAction={() => onSelect(spell, true)}
          />
        ))}

        {selectedSpells.length > 0 && spells.length > 0 && (
          <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.25)', margin: '6px 0' }} />
        )}

        {!spellsFetching &&
          !isLoading &&
          spells.map((spell, i) => (
            <SpellSearchRow
              testId={`search-spell-item-${spell.index}`}
              spell={spell}
              showMeta={true}
              isFirst={i === 0}
              icon="add"
              onAction={() => onSelect(spell)}
            />
          ))}
      </Box>

      {spellsFetching || isLoading ? (
        <Loader />
      ) : !hasFilters ? (
        <Typography color="text.secondary" textAlign="center" marginTop={2}>
          Search by name or apply a filter to find spells
        </Typography>
      ) : !spells.length ? (
        <Typography color="text.secondary" textAlign="center" marginTop={2}>
          No spells found
        </Typography>
      ) : null}
    </Fragment>
  ) : spellsFetching ? (
    <Loader />
  ) : (
    spells?.map((spell) => <Typography key={spell.index}>{spell.name}</Typography>)
  );
}
