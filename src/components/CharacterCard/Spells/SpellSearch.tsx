import { getMatchingSpells, getSpellsForClass } from '@api/ressources';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import { Character } from '@representations/user.representation';
import type { TypeFromArray } from '@representations/utils.representation';
import { ControledInput } from '@shared/ControledInput';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useLayoutEffect, useState } from 'react';

export function SpellSearch({
  classIndex,
  subclassIndex,
  maxLevel,
  selectedSpells = [],
  onSelect
}: {
  classIndex: string;
  subclassIndex?: string;
  maxLevel?: number;
  selectedSpells?: Character['knownSpells'];
  onSelect?: (spell: TypeFromArray<Character['knownSpells']>, remove?: boolean) => void;
}) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [search, setSearch] = useState('');
  const [runningTimer, setRunningTimer] = useState<NodeJS.Timeout>();

  const { data: allSpells } = useQuery({
    queryKey: ['fetchAllSpells', maxLevel],
    queryFn: async () => (await getMatchingSpells(maxLevel)).results,
    enabled: search.length > 0
  });

  const { data: knownSpells = [], isFetching: spellsFetching } = useQuery({
    queryKey: ['fetchCharacterSpells', classIndex, subclassIndex, maxLevel],
    queryFn: async () =>
      classIndex ? (await getSpellsForClass(classIndex, subclassIndex, maxLevel)).results : [],
    enabled: !!classIndex && !!allSpells?.length
  });

  useLayoutEffect(() => {
    if (!allSpells?.length || !search.length || spellsFetching) setSpells([]);
    else {
      const filteredSpells =
        allSpells
          .filter(({ name }) => name.toLowerCase().includes(search.toLowerCase()))
          .filter(({ index }) => !knownSpells.find((known) => known.index === index))
          .filter(({ index }) => !selectedSpells.find((selected) => selected.index === index)) ||
        [];

      setSpells(filteredSpells);
    }
  }, [allSpells, spellsFetching, knownSpells, search, selectedSpells]);

  return onSelect ? (
    <Fragment>
      <ControledInput
        fullWidth
        id="search"
        type="text"
        label="Search"
        onChange={(value) => {
          if (runningTimer) clearTimeout(runningTimer);
          setRunningTimer(setTimeout(() => setSearch(value as string), 500));
        }}
      />

      <Box
        display="grid"
        gridTemplateColumns="fit-content(36px) 1fr"
        alignItems="center"
        justifySelf="center"
      >
        {selectedSpells.map((spell) => (
          <Fragment>
            <IconButton onClick={() => onSelect(spell, true)}>
              <RemoveCircleOutline color="info" fontSize="small" />
            </IconButton>
            <Typography key={spell.index}>{spell.name}</Typography>
          </Fragment>
        ))}

        {spells.map((spell) => (
          <Fragment>
            <IconButton onClick={() => onSelect(spell)}>
              <AddCircleOutline color="info" fontSize="small" />
            </IconButton>
            <Typography key={spell.index}>{spell.name}</Typography>
          </Fragment>
        ))}
      </Box>
    </Fragment>
  ) : (
    spells?.map((spell) => <Typography key={spell.index}>{spell.name}</Typography>)
  );
}
