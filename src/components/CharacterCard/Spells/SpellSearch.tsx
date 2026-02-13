import { Fragment, useMemo, useState } from 'react';
import { Separator } from '@base-ui/react';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getMatchingSpells, getSpellsForClass } from '@api/ressources';
import { useToggle } from '@hooks/useToggle';
import { ControledInput } from '@shared/ControledInput';
import { Loader } from '@shared/Loader';
import type { Character } from '@representations/user.representation';
import type { TypeFromArray } from '@representations/utils.representation';
import { useAuth } from 'src/providers/AuthProvider';

interface SpellSearchProps {
  classIndex: string;
  subclassIndex?: string;
  maxLevel?: number;
  selectedSpells?: Character['knownSpells'];
  onSelect?: (spell: TypeFromArray<Character['knownSpells']>, remove?: boolean) => void;
}

export function SpellSearch({
  classIndex,
  subclassIndex,
  maxLevel,
  selectedSpells = [],
  onSelect
}: SpellSearchProps) {
  const { version } = useAuth();
  const [search, setSearch] = useState('');
  const [runningTimer, setRunningTimer] = useState<NodeJS.Timeout>();
  const { isOn: isLoading, setIsOn: setIsLoading } = useToggle(false);

  const { data: allSpells, isFetching: spellsFetching } = useQuery({
    queryKey: ['fetchAllSpells', version, maxLevel],
    queryFn: async () => (version ? (await getMatchingSpells(version, maxLevel)).results : null),
    enabled: search.length > 0 && !!version
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
    if (!search.length || !allSpells?.length || spellsFetching || knownSpellsFetching) return [];
    else {
      return (
        allSpells
          .filter(({ name }) => name.toLowerCase().includes(search.toLowerCase()))
          .filter(({ index }) => !knownSpells.find((known) => known.index === index))
          .filter(({ index }) => !selectedSpells.find((selected) => selected.index === index)) || []
      );
    }
  }, [
    search,
    spellsFetching,
    knownSpellsFetching,
    allSpells
      ?.map(({ index }) => index)
      .sort((a, b) => a.localeCompare(b))
      .join(', '),
    knownSpells
      .map(({ index }) => index)
      .sort((a, b) => a.localeCompare(b))
      .join(', '),
    selectedSpells
      .map(({ index }) => index)
      .sort((a, b) => a.localeCompare(b))
      .join(', ')
  ]);

  return onSelect ? (
    <Fragment>
      <ControledInput
        fullWidth
        id="search"
        type="text"
        label="Search"
        autoComplete="off"
        onChange={(value: string | boolean | undefined) => {
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
        display="grid"
        gridTemplateColumns="fit-content(36px) 1fr"
        alignItems="center"
        justifySelf="center"
        paddingRight="8px"
      >
        {selectedSpells.map((spell) => (
          <Fragment>
            <IconButton
              onClick={() => onSelect(spell, true)}
              key={spell.index}
              data-testid={`search-spell-item-${spell.index}-selected`}
            >
              <RemoveCircleOutline color="info" fontSize="small" />
            </IconButton>
            <Typography>{spell.name}</Typography>
          </Fragment>
        ))}

        {selectedSpells.length && spells.length ? (
          <Separator
            orientation="horizontal"
            css={{
              gridColumn: '1 / span 2',
              height: '1px',
              width: '110%',
              backgroundColor: '#343434'
            }}
          />
        ) : null}

        {!spellsFetching &&
          !isLoading &&
          spells.map((spell) => (
            <Fragment>
              <IconButton
                onClick={() => onSelect(spell)}
                key={spell.index}
                data-testid={`search-spell-item-${spell.index}`}
              >
                <AddCircleOutline color="info" fontSize="small" />
              </IconButton>
              <Typography>{spell.name}</Typography>
            </Fragment>
          ))}
      </Box>

      {spellsFetching || isLoading ? (
        <Loader />
      ) : search.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" marginTop={2}>
          Start typing to find spells to add to your spellbook
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
