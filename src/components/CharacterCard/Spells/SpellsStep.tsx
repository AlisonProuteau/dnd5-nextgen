import { getClassInfo, getSubclassInfo } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import type { Level } from '@representations/campaign/level.representation';
import type { Classes } from '@representations/character/class.representation';
import type { Character } from '@representations/user.representation';
import { SplitButton } from '@shared/SplitButton';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';
import { SpellList } from './SpellList';

const CHAR_LEVEL = 1; // TODO: implement leveling
export function SpellStep({ character }: { character: Character }) {
  const [page, setPage] = useState<'main' | 'full' | 'prepare' | 'howto'>('prepare');
  const [selectedSpells, setSelectedSpells] = useState<Spell[]>([]);

  const { data: classSpellcasting } = useQuery({
    queryKey: ['fetchClassInfo', character?.class.index],
    queryFn: async () =>
      character ? ((await getClassInfo(character.class.index)) as Classes | null) : null,
    enabled: !!character,
    select: (classInfo) => classInfo?.spellcasting // Gives user info on how it works + spellcasting ability + level?
  });

  const { data: levelSpellcasting } = useQuery({
    queryKey: [
      'fetchClassInfoLevel',
      character?.class?.index,
      character?.subclass?.index,
      CHAR_LEVEL
    ],
    queryFn: async () => {
      if (!character?.class?.index) return null;
      let levelRes: Partial<Level> = {};

      const classRes = (await getClassInfo(character.class.index, CHAR_LEVEL)) as Level | null;
      if (classRes) levelRes = { ...classRes };

      if (character.subclass?.index) {
        const subclassRes = (await getSubclassInfo(
          character.class.index,
          character.subclass.index,
          CHAR_LEVEL
        )) as Level | null;

        if (subclassRes) levelRes = { ...levelRes, ...subclassRes };
      }

      return Object.keys(levelRes).length ? (levelRes as Level) : null;
    },
    enabled: !!character?.class.index,
    select: (levelInfo) => {
      // If i have spells but level is not 1, cannot cast ?
      // What about only sub then?
      // What if only sub and no known spells or spell slots all 0? (paladin)
      return levelInfo?.spellcasting; // Spell slots
    }
  });

  // useEffect(() => {
  //   if (classSpellcasting && levelSpellcasting) {
  //     console.log('class spellcasting: ', classSpellcasting);
  //     console.log('level spellcasting: ', levelSpellcasting);
  //   }
  // }, [!!classSpellcasting, !!levelSpellcasting]);

  const spellMenu = useMemo(
    () => [
      { text: 'Known/Prepared Spells', value: 'main' },
      { text: 'Prepare or Learn or whatever', value: 'prepare' },
      { text: 'See Full List', value: 'full' },
      { text: 'How does it work ?', value: 'howto' }
    ],
    []
  );

  const slots = useMemo(
    () =>
      Object.entries(levelSpellcasting || {}).reduce(
        (
          acc: { cantrips: number; spells: number; slots: Record<string, number>[] },
          [key, value]
        ) => {
          const level = key.includes('spell_slots_level_')
            ? key.replace('spell_slots_level_', '')
            : undefined;

          return level && value > 0 ? { ...acc, slots: [...acc.slots, { [level]: value }] } : acc;
        },
        {
          cantrips: levelSpellcasting?.cantrips_known || 0,
          spells:
            levelSpellcasting?.spells_known ??
            ((character.abilityScores[classSpellcasting?.spellcasting_ability?.index || '']
              ?.modifier || 0) + CHAR_LEVEL ||
              1),
          slots: []
        }
      ),
    [levelSpellcasting]
  );

  const isDisabled = useMemo(() => {
    const levels = selectedSpells.map(({ level }) => level);
    const cantripsLength = levels.filter((level) => level === 0).length;
    const spellsLength = levels.filter((level) => level > 0).length;

    const val: number[] = [];
    if (cantripsLength === slots.cantrips) val.push(0);
    if (spellsLength === slots.spells) val.push(1);

    return val;
  }, [selectedSpells.length]);

  // TODO: Add a limit on the selection depending on the number of cantrips/spells
  // TODO: Figure out all the comments
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
      {
        page === 'main' && <Typography>Main</Typography> // TODO
      }
      {page === 'prepare' && levelSpellcasting && (
        <Fragment>
          <Typography>Select {slots.cantrips} cantrips</Typography>
          <Typography>Select {slots.spells} spells</Typography>
          <SpellList
            classIndex={character.class.index}
            subclassIndex={character.subclass?.index}
            charLevel={CHAR_LEVEL}
            moreSpells={character.traits?.flatMap(({ spells }) => spells || [])}
            selectedSpells={selectedSpells}
            setSelectedSpells={setSelectedSpells}
            disabledLevels={isDisabled}
          />
        </Fragment>
      )}
      {page === 'full' && (
        <SpellList
          classIndex={character.class.index}
          subclassIndex={character.subclass?.index}
          charLevel={CHAR_LEVEL}
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
