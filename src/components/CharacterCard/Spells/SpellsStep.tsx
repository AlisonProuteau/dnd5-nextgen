import { getClassInfo, getSubclassInfo } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import type { Level } from '@representations/campaign/level.representation';
import type { Classes } from '@representations/character/class.representation';
import type { Character } from '@representations/user.representation';
import { SplitButton } from '@shared/SplitButton';
import { useQuery } from '@tanstack/react-query';
import { max } from 'lodash';
import { Fragment, useMemo, useState } from 'react';
import { SpellList } from './SpellList';

export function SpellStep({ character }: { character: Character }) {
  const [page, setPage] = useState<'full' | 'prepare' | 'learn' | 'howto'>('learn');
  const [knownSpells, setKnownSpells] = useState<Spell[]>([]);
  const [preparedSpells, setPreparedSpells] = useState<Spell[]>([]);

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
      character.level
    ],
    queryFn: async () => {
      if (!character?.class?.index) return null;
      let levelRes: Partial<Level> = {};

      const classRes = (await getClassInfo(character.class.index, character.level)) as Level | null;
      if (classRes) levelRes = { ...classRes };

      if (character.subclass?.index) {
        const subclassRes = (await getSubclassInfo(
          character.class.index,
          character.subclass.index,
          character.level
        )) as Level | null;

        if (subclassRes) levelRes = { ...levelRes, ...subclassRes };
      }

      return Object.keys(levelRes).length ? (levelRes as Level) : null;
    },
    enabled: !!character?.class.index,
    select: (levelInfo) => levelInfo?.spellcasting
  });

  // TODO: warlock add more spells without leveling
  const slots = useMemo(
    () =>
      Object.entries(levelSpellcasting || {}).reduce(
        (
          acc: {
            cantrips?: number;
            learn?: number;
            prepare?: number;
            slots: Record<string, number>;
          },
          [key, value]
        ) => {
          const level = key.includes('spell_slots_level_')
            ? key.replace('spell_slots_level_', '')
            : undefined;

          return level && value > 0 ? { ...acc, slots: { ...acc.slots, [level]: value } } : acc;
        },
        {
          cantrips: levelSpellcasting?.cantrips_known,
          learn:
            character.class.index === 'wizard'
              ? 6 + (character.level - 1) * 2
              : levelSpellcasting?.spells_known,
          prepare: classSpellcasting?.prepare
            ? (character.abilityScores[classSpellcasting?.spellcasting_ability?.index || '']
                ?.modifier || 0) + character.level
            : undefined,
          slots: {}
        }
      ),
    [levelSpellcasting, classSpellcasting]
  );

  // TODO: Make those better
  const spellMenu = useMemo(() => {
    const menu = [];

    if (slots.prepare) menu.push({ text: 'Prepare/Prepared Spells', value: 'prepare' });
    if (slots.cantrips || slots.learn)
      menu.push({ text: 'Learn Spells/Spellbook', value: 'learn' });

    return menu.concat([
      { text: 'All Spells', value: 'full' },
      { text: 'How does it work ?', value: 'howto' }
    ]);
  }, [slots.cantrips, slots.learn, slots.prepare]);

  const isDisabled = (spells: Spell[], spellNumber: number, prepare: boolean = false) => {
    const levels = spells.map(({ level }) => level);
    const cantripsLength = levels.filter((level) => level === 0).length;
    const spellsLength = levels.filter((level) => level > 0).length;

    const val: number[] = [];
    if (cantripsLength >= (slots.cantrips || 0) || prepare) val.push(0);
    if (spellsLength >= spellNumber) val.push(1);

    console.log(cantripsLength >= (slots.cantrips || 0), cantripsLength, slots.cantrips);

    return val;
  };

  // TODO: Test more
  // TODO: Make more user friendly + conditionnal titles for prepare and learn
  // TODO: Manually add more cantrips/spells/slots?
  // TODO: One page pour learn and prepare with spellbook icon -> Available instead
  // TODO: also little sentence for please learn first (conditionnal on cantrip/spell)
  return slots ? (
    <Fragment>
      <Box display="flex" flexDirection="column" alignItems="center" flex={1}>
        <SplitButton
          options={spellMenu}
          onClick={(val) => setPage(val as typeof page)}
          defaultValue={page}
          variant="outlined"
        />
      </Box>
      {/* TODO: Save selection and edit? */}
      {page === 'learn' && (slots.cantrips || slots.learn) && (
        <Fragment>
          <Typography>
            {slots.cantrips && `Learn ${slots.cantrips} cantrip${slots.cantrips > 1 ? 's' : ''}`}
            {slots.learn &&
              `${slots.cantrips ? ' and ' : ' '}${slots.learn} spell${slots.learn > 1 ? 's' : ''}`}
          </Typography>
          <SpellList
            classIndex={character.class.index}
            subclassIndex={character.subclass?.index}
            highestSpellLevel={
              Object.keys(slots.slots).length
                ? parseInt(max(Object.keys(slots.slots)) ?? '0')
                : undefined
            }
            charLevel={character.level}
            moreSpells={character.traits?.flatMap(({ spells }) => spells || [])}
            selectedSpells={knownSpells}
            setSelectedSpells={setKnownSpells}
            disabledLevels={isDisabled(knownSpells, slots.learn || 0)}
          />
        </Fragment>
      )}

      {/* TODO: Save selection and edit? */}
      {page === 'prepare' &&
        slots.prepare &&
        (!slots.learn || knownSpells.length ? (
          <Fragment>
            <Typography>
              Prepare {slots.prepare} spell{slots.prepare > 1 ? 's' : ''}
            </Typography>
            <SpellList
              classIndex={!slots.learn ? character.class.index : undefined}
              subclassIndex={character.subclass?.index}
              highestSpellLevel={
                Object.keys(slots.slots).length
                  ? parseInt(max(Object.keys(slots.slots)) ?? '0')
                  : undefined
              }
              charLevel={character.level}
              moreSpells={character.traits
                ?.flatMap(({ spells }) => spells || [])
                .concat(slots.learn ? knownSpells : [])}
              selectedSpells={preparedSpells}
              setSelectedSpells={setPreparedSpells}
              disabledLevels={isDisabled(preparedSpells, slots.prepare || 0, true)}
            />
          </Fragment>
        ) : (
          <Typography>First, learn some spells</Typography>
        ))}

      {page === 'full' && (
        <SpellList
          classIndex={character.class.index}
          subclassIndex={character.subclass?.index}
          charLevel={character.level}
          highestSpellLevel={0}
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
  ) : (
    <CircularProgress size={24} />
  );
}
