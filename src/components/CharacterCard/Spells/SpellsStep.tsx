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
import type { Level } from '@representations/campaign/level.representation';
import type { Classes } from '@representations/character/class.representation';
import { SplitButton } from '@shared/SplitButton';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';
import type { DefaultProps } from 'src/components/Header';
import { SpellList } from './SpellList';
import { Spellbook } from './Spellbook';

export function SpellStep({ character }: DefaultProps) {
  const [page, setPage] = useState<'available' | 'full' | 'howto'>('available');

  const { data: classSpellcasting } = useQuery({
    queryKey: ['fetchClassInfo', character.version, character?.class.index],
    queryFn: async () =>
      character
        ? ((await getClassInfo(character.version, character.class.index)) as Classes | null)
        : null,
    enabled: !!character,
    select: (classInfo) => classInfo?.spellcasting // Gives user info on how it works + spellcasting ability + level?
  });

  const { data: levelSpellcasting } = useQuery({
    queryKey: [
      'fetchClassInfoLevel',
      character.version,
      character?.class?.index,
      character?.subclass?.index,
      character.level
    ],
    queryFn: async () => {
      if (!character?.class?.index) return null;
      let levelRes: Partial<Level> = {};

      const classRes = (await getClassInfo(
        character.version,
        character.class.index,
        character.level
      )) as Level | null;
      if (classRes) levelRes = { ...classRes };

      if (character.subclass?.index) {
        const subclassRes = (await getSubclassInfo(
          character.version,
          character.class.index,
          character.subclass.index,
          character.level
        )) as Level | null;

        if (subclassRes) levelRes = { ...levelRes, ...subclassRes };
      }

      return Object.keys(levelRes).length ? (levelRes as Level) : null;
    },
    enabled: !!character?.class.index && !!character?.version,
    select: (levelInfo) => levelInfo?.spellcasting
  });

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

  const spellMenu = useMemo(() => {
    return [
      { text: 'Spellbook', value: 'available' },
      { text: 'All Spells', value: 'full' },
      { text: 'How does it work ?', value: 'howto' }
    ];
  }, [slots.cantrips, slots.learn, slots.prepare]);

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

      {page === 'available' && <Spellbook character={character} slotInfo={slots} />}

      {page === 'full' && (
        <SpellList
          characterInfo={{
            version: character.version,
            classIndex: character.class.index,
            subclassIndex: character.subclass?.index,
            slotLevels: []
          }}
          additionalSpellList={character.traits?.flatMap(({ spells }) => spells || [])}
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
    <CircularProgress size={24} sx={{ alignSelf: 'center' }} />
  );
}
