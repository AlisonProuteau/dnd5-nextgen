import { getMatchingSpells } from '@api/ressources';
import { Button, Typography } from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import { ControledInput } from '@shared/ControledInput';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

export function SpellSearch({ onSelect }: { onSelect?: (spell: Spell) => void }) {
  const [search, setSearch] = useState('');
  const [runningTimer, setRunningTimer] = useState<NodeJS.Timeout>();

  const { data: spells } = useQuery({
    queryKey: ['fetchSpells', search],
    queryFn: async () => (await getMatchingSpells(search)).results,
    enabled: search.length > 0
  });

  // TODO: Make display better
  return (
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

      {spells?.map((spell) =>
        onSelect ? (
          <Button onClick={() => onSelect(spell)}>{spell.name}</Button>
        ) : (
          <Typography>{spell.name}</Typography>
        )
      )}
    </Fragment>
  );
}
