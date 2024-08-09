import { getClassInfo, getSubclassInfo } from '@api/ressources';
import { Box, Typography } from '@mui/material';
import type { Level } from '@representations/campaign/level.representation';
import type { Classes } from '@representations/character/class.representation';
import type { Character } from '@representations/user.representation';
import { SplitButton } from '@shared/SplitButton';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';
import { SpellList } from './SpellList';

export function SpellStep({ character }: { character: Character }) {
  const [page, setPage] = useState<'main' | 'full' | 'prepare' | 'howto'>('full');

  const { data: classInfo } = useQuery({
    queryKey: ['fetchClassInfo', character?.class.index],
    queryFn: async () =>
      character ? ((await getClassInfo(character.class.index)) as Classes | null) : null,
    enabled: !!character
  });

  const { data: levelInfo } = useQuery({
    queryKey: ['fetchClassInfoLevel', character?.class?.index, character?.subclass?.index, 1],
    queryFn: async () => {
      if (!character?.class?.index) return null;
      let levelRes: Partial<Level> = {};

      const classRes = (await getClassInfo(character.class.index, 1)) as Level | null;
      if (classRes) levelRes = { ...classRes };

      if (character.subclass?.index) {
        const subclassRes = (await getSubclassInfo(
          character.class.index,
          character.subclass.index,
          1
        )) as Level | null;

        if (subclassRes) levelRes = { ...levelRes, ...subclassRes };
      }

      return Object.keys(levelRes).length ? (levelRes as Level) : null;
    },
    enabled: !!character?.class.index
  });

  useEffect(() => {
    console.log('class: ', classInfo?.spellcasting); // Gives user info on how it works + spellcasting ability + level?
    // If i have spells but level is not 1, cannot cast ?
    // What about only sub then?
    // What if only sub and no known spells or spell slots all 0? (paladin)
    console.log('level: ', levelInfo?.spellcasting); // Actual usable spell data
  }, [classInfo?.spellcasting, levelInfo?.spellcasting]);

  const spellMenu = [
    { text: 'Known/Prepared Spells', value: 'main' },
    { text: 'See Full List', value: 'full' },
    { text: 'Prepare or Learn or whatever', value: 'prepare' },
    { text: 'How does it work ?', value: 'howto' }
  ];

  return (
    <Fragment>
      <Box display="flex" flexDirection="column" alignItems="center" flex={1}>
        <SplitButton
          options={spellMenu}
          onClick={(val) => setPage(val as typeof page)}
          defaultValue={page}
          variant="outlined"
        />
      </Box>

      {page === 'main' && <Typography>Main</Typography>}
      {page === 'full' && (
        <SpellList
          classIndex={character.class.index}
          subclassIndex={character.subclass?.index}
          charLevel={1}
          moreSpells={character.traits?.flatMap(({ spells }) => spells || [])}
        />
      )}
      {page === 'prepare' && <Typography>Prepare</Typography>}
      {page === 'howto' && <Typography>HowTo</Typography>}
    </Fragment>
  );
}
