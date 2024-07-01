import { getClassInfo, getSpellsForClass, getSubclassInfo } from '@api/ressources';
import { Button, Typography } from '@mui/material';
import type { Level } from '@representations/campaign/level.representation';
import type { Classes } from '@representations/character/class.representation';
import type { Character } from '@representations/user.representation';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useEffect } from 'react';

// TODO
export function Spells({ character }: { character: Character }) {
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

  // TODO: App spells from traits
  const { data: spells } = useQuery({
    queryKey: ['fetchSpells', character?.class?.index, character?.subclass?.index, 1],
    queryFn: async () =>
      character?.class?.index
        ? (await getSpellsForClass(character.class.index, character.subclass?.index, 1)).results
        : null,
    enabled: !!character?.class.index
  });

  useEffect(() => {
    console.log('class: ', classInfo?.spellcasting); // Gives user info on how it works + spellcasting ability + level?
    // If i have spells but level is not 1, cannot cast ?
    // What about only sub then?
    // What if only sub and no known spells or spell slots all 0? (paladin)
    console.log('level: ', levelInfo?.spellcasting); // Actual usable spell data
    console.log('spells: ', spells); // Spell list
  }, [classInfo?.spellcasting, levelInfo?.spellcasting, spells]);

  return (
    <Fragment>
      <Typography>Known/Prepared Spells</Typography>
      <Button variant="outlined">See Full List</Button>
      <Button variant="outlined">Prepare or Learn or whatever</Button>
      <Button variant="outlined">How does it work ?</Button>
    </Fragment>
  );
}
