import { getClassInfo } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import type { Classes } from '@representations/character/class.representation';
import type { Character } from '@representations/user.representation';
import { SplitButton } from '@shared/SplitButton';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';
import { SpellList } from './SpellList';

export function SpellStep({ character }: { character: Character }) {
  // const [page, setPage] = useState<'main' | 'full' | 'prepare' | 'howto'>('prepare');
  const [page, setPage] = useState<'full' | 'howto'>('howto');

  const { data: classSpellcasting } = useQuery({
    queryKey: ['fetchClassInfo', character?.class.index],
    queryFn: async () =>
      character ? ((await getClassInfo(character.class.index)) as Classes | null) : null,
    enabled: !!character,
    select: (classInfo) => classInfo?.spellcasting // Gives user info on how it works + spellcasting ability + level?
  });

  // const { data: levelSpellcasting } = useQuery({
  //   queryKey: ['fetchClassInfoLevel', character?.class?.index, character?.subclass?.index, 1],
  //   queryFn: async () => {
  //     if (!character?.class?.index) return null;
  //     let levelRes: Partial<Level> = {};

  //     const classRes = (await getClassInfo(character.class.index, 1)) as Level | null;
  //     if (classRes) levelRes = { ...classRes };

  //     if (character.subclass?.index) {
  //       const subclassRes = (await getSubclassInfo(
  //         character.class.index,
  //         character.subclass.index,
  //         1
  //       )) as Level | null;

  //       if (subclassRes) levelRes = { ...levelRes, ...subclassRes };
  //     }

  //     return Object.keys(levelRes).length ? (levelRes as Level) : null;
  //   },
  //   enabled: !!character?.class.index,
  //   select: (levelInfo) => {
  //     // If i have spells but level is not 1, cannot cast ?
  //     // What about only sub then?
  //     // What if only sub and no known spells or spell slots all 0? (paladin)
  //     return levelInfo?.spellcasting; // Spell slots
  //   }
  // });

  // useEffect(() => {
  //   if (classSpellcasting && levelSpellcasting) {
  //     console.log('class spellcasting: ', classSpellcasting);
  //     console.log('level spellcasting: ', levelSpellcasting);
  //   }
  // }, [!!classSpellcasting, !!levelSpellcasting]);

  const spellMenu = useMemo(
    () => [
      // { text: 'Known/Prepared Spells', value: 'main' },
      // { text: 'Prepare or Learn or whatever', value: 'prepare' },
      { text: 'See Full List', value: 'full' },
      { text: 'How does it work ?', value: 'howto' }
    ],
    []
  );

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

      {/* {page === 'main' && <Typography>Main</Typography>} */}
      {/* {page === 'prepare' && (
        <SpellList
          classIndex={character.class.index}
          subclassIndex={character.subclass?.index}
          charLevel={1}
          moreSpells={character.traits?.flatMap(({ spells }) => spells || [])}
          selectable
        />  */}
      {page === 'full' && (
        <SpellList
          classIndex={character.class.index}
          subclassIndex={character.subclass?.index}
          charLevel={1}
          moreSpells={character.traits?.flatMap(({ spells }) => spells || [])}
        />
      )}
      {page === 'howto' &&
        classSpellcasting?.info.map((info) => (
          <Accordion key={info.name}>
            <AccordionSummary expandIcon={<ExpandMore />}>{info.name}</AccordionSummary>
            <AccordionDetails sx={{ textAlign: 'justify' }}>
              {info.desc.map((desc, i) => (
                <Typography key={`${info.name}-description-${i}`}>{desc}</Typography>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
    </Fragment>
  );
}
