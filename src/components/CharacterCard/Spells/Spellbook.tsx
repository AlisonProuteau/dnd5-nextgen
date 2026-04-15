import { Fragment, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PrepareIcon, SpellbookIcon } from '@assets';
import { ExpandMore, InfoOutlined } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from '@mui/material';
import { Box } from '@mui/system';
import { increment } from 'firebase/firestore';
import { isEqual, max } from 'lodash';
import { useActionRecord } from '@hooks/useActionRecord';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { formatActionRecord, getSpellActionRecordData } from '@utils/actions.utils';
import { filterValidPreparedSpells } from '@utils/character/spells.utils';
import type { Spell } from '@representations/abilities/magic.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { CastSpellMenu } from './CastSpellMenu';
import { SpellList } from './SpellList';
import { SpellSearch } from './SpellSearch';
import { SpellSlots } from './SpellSlots';

interface SpellbookProps {
  character: Character & { ritualCaster?: boolean };
  slotInfo: {
    cantrips?: number;
    learn?: number;
    prepare?: number;
    slots: Record<string, number>;
  };
}

export function Spellbook({ character, slotInfo }: SpellbookProps) {
  const [knownSpells, setKnownSpells] = useState(character.knownSpells || []);
  const [preparedSpells, setPreparedSpells] = useState(character.preparedSpells || []);
  const { isOn: isLearnOpen, turnOn: openLearn, turnOff: closeLearn } = useToggle();
  const { isOn: isPrepareOpen, turnOn: openPrepare, turnOff: closePrepare } = useToggle();
  const { isOn: isAddOpen, turnOn: openAdd, turnOff: closeAdd } = useToggle();

  const { logAction } = useActionRecord(character.id);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    successMessages: {
      update: 'Spells saved successfully'
    },
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id]
  });

  const updateKnownSpellsWithCascade = async () => {
    if (!slotInfo.learn) return;

    if (character.id && !isEqual(character.knownSpells, knownSpells)) {
      const updatedSpells: {
        knownSpells: typeof knownSpells;
        preparedSpells?: typeof preparedSpells;
      } = { knownSpells };
      const validPreparedSpells = filterValidPreparedSpells(preparedSpells, knownSpells);

      if (!isEqual(validPreparedSpells, preparedSpells)) {
        setPreparedSpells(validPreparedSpells);
        updatedSpells.preparedSpells = validPreparedSpells;
      }

      firebaseCrud.update(character.id, updatedSpells);
    }
  };

  const savePreparedSpells = async () => {
    closePrepare();
    if (
      !character.id ||
      (!slotInfo.prepare && !slotInfo.cantrips) ||
      isEqual(character.preparedSpells, preparedSpells)
    )
      return;

    await firebaseCrud.update(character.id, { preparedSpells });
  };

  const handleRestoreAll = async () => {
    if (!character.id) return;
    await firebaseCrud.update(character.id, { usedSpellSlots: {} }, false);
  };

  const handleCastSpell = async (spell: Spell, slotLevel?: number | 'ritual') => {
    if (!character.id || spell.level === 0 || !slotLevel) return;

    let success = slotLevel === 'ritual';
    if (!success) {
      if (
        (character.usedSpellSlots?.[slotLevel.toString()] ?? 0) <
        (slotInfo.slots[slotLevel.toString()] ?? 0)
      )
        success = await firebaseCrud.update(
          character.id,
          { [`usedSpellSlots.${slotLevel}`]: increment(1) },
          false
        );
      else toast.error(`No spell slots of level ${slotLevel} available`);
    }

    if (success)
      await logAction(formatActionRecord('spell', getSpellActionRecordData(spell, slotLevel)));
  };

  const shouldLearn = useMemo(
    () => knownSpells.filter(({ added }) => !added).length < (slotInfo.learn || 0),
    [slotInfo.learn, knownSpells]
  );
  const shouldPrepare = useMemo(
    () => preparedSpells.length < (slotInfo.prepare || 0) + (slotInfo.cantrips || 0),
    [slotInfo.prepare, preparedSpells.length, slotInfo.cantrips]
  );

  const slotLevels = useMemo(
    () =>
      Object.entries(slotInfo.slots).reduce(
        (acc: number[], [key, value]) => (value > 0 ? [...acc, parseInt(key)] : acc),
        []
      ),
    [slotInfo.slots]
  );

  const availableSlots = useMemo(
    () =>
      Object.entries(slotInfo.slots).reduce(
        (acc, [level, total]) => {
          const used = character.usedSpellSlots?.[level] || 0;
          acc[level] = Math.max(total - used, 0);
          return acc;
        },
        {} as Record<string, number>
      ),
    [slotInfo.slots, character.usedSpellSlots]
  );

  const characterInfo = useMemo(() => {
    return {
      version: character.version,
      classIndex: character.class.index,
      subclassIndex: character.subclass?.index,
      charLevel: character.level,
      slotLevels,
      features: character.features || []
    };
  }, [
    character.class.index,
    character.subclass?.index,
    character.level,
    slotLevels,
    character.features,
    character.version
  ]);

  return (
    <Fragment>
      {!shouldLearn && !shouldPrepare && !isLearnOpen && !isPrepareOpen && (
        <Fragment>
          {Object.values(slotInfo.slots).length ? (
            <SpellSlots
              slots={slotInfo.slots}
              usedSlots={character.usedSpellSlots || {}}
              onRestoreAll={handleRestoreAll}
              disabled={firebaseCrud.isLoading}
            />
          ) : null}

          <SpellList
            characterInfo={characterInfo}
            additionalSpellList={(character.traits || [])
              .flatMap(
                ({ spells }) =>
                  spells?.map((spell): DefaultRepresentation & { racial?: boolean } => ({
                    ...spell,
                    racial: true
                  })) || []
              )
              .concat(...preparedSpells)
              .concat(
                ...(slotInfo.prepare ? knownSpells.filter(({ level }) => level === 0) : knownSpells)
              )}
            spellListOnly={true}
            actions={(spell, onClick) => (
              <CastSpellMenu
                spell={spell}
                availableSlots={availableSlots}
                handleCastSpell={(spell, slotLevel) => {
                  handleCastSpell(spell, slotLevel);
                  onClick?.();
                }}
                canCastRitual={character.ritualCaster}
                disabled={firebaseCrud.isLoading}
              />
            )}
          />

          {character.class.index === 'wizard' &&
            knownSpells.filter(({ level }) => level > 0).length && (
              <Accordion sx={{ '&:before': { display: 'none' } }} elevation={0} disableGutters>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">All Ritual Spells</Typography>
                  </Divider>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight="normal"
                    display="block"
                    textAlign="center"
                    sx={{ position: 'relative', top: '-20px', height: '15px' }}
                  >
                    Wizards can cast any ritual spell from their spellbook without preparing it or
                    using a spell slot. <br />
                    When casting a spell as a ritual, spell slots aren’t expended but the casting
                    time is 10 minutes longer than normal.
                  </Typography>
                  <SpellList
                    characterInfo={characterInfo}
                    additionalSpellList={knownSpells
                      .filter(({ level }) => level > 0)
                      .filter(({ ritual }) => ritual)}
                    spellListOnly={true}
                    hideLevels
                  />
                </AccordionDetails>
              </Accordion>
            )}
        </Fragment>
      )}

      <Box display="flex" justifyContent="space-evenly">
        {slotInfo.learn && (
          <IconButton
            sx={{
              alignSelf: 'center',
              width: 'fit-content',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={openLearn}
            disabled={firebaseCrud.isLoading}
          >
            <SpellbookIcon
              height="75px"
              width="75px"
              fill="currentColor"
              css={{
                margin: '10px'
              }}
            />
            {<Typography>Learn spells</Typography>}
          </IconButton>
        )}

        {(slotInfo.cantrips || slotInfo.prepare) && (
          <IconButton
            sx={{
              alignSelf: 'center',
              width: 'fit-content',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={openPrepare}
            disabled={shouldLearn || firebaseCrud.isLoading}
          >
            <PrepareIcon
              height="80px"
              width="80px"
              fill="currentColor"
              css={{
                margin: '10px'
              }}
            />
            {!shouldLearn && <Typography>Prepare your spells</Typography>}
          </IconButton>
        )}
      </Box>

      <Dialog
        fullWidth
        maxWidth="lg"
        open={isLearnOpen || isPrepareOpen}
        onClose={
          isLearnOpen
            ? async () => {
                closeLearn();
                await updateKnownSpellsWithCascade();
              }
            : savePreparedSpells
        }
        PaperProps={{ elevation: 0 }}
        slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(50, 50, 50, 0.85)' } } }}
      >
        <DialogTitle>{isLearnOpen ? 'Learn' : 'Prepare'}</DialogTitle>
        <DialogContent>
          {isLearnOpen ? (
            <SpellList
              characterInfo={characterInfo}
              selectedSpells={knownSpells.filter(({ added }) => !added)}
              setSelectedSpells={setKnownSpells}
              maxSelected={[0, slotInfo.learn || 0]}
            />
          ) : (
            <SpellList
              characterInfo={{
                ...characterInfo,
                slotLevels: slotInfo.learn || !slotInfo.prepare ? [0] : [0, ...slotLevels]
              }}
              additionalSpellList={slotInfo.prepare ? knownSpells : []}
              selectedSpells={preparedSpells}
              setSelectedSpells={setPreparedSpells}
              maxSelected={[slotInfo.cantrips || 0, slotInfo.prepare || 0]}
            />
          )}
        </DialogContent>
        <DialogActions>
          {isLearnOpen && character.class.index === 'wizard' && (
            <Button onClick={openAdd}>More spells</Button>
          )}
          <Button
            onClick={
              isLearnOpen
                ? async () => {
                    closeLearn();
                    await updateKnownSpellsWithCascade();
                  }
                : savePreparedSpells
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="lg"
        open={isAddOpen}
        onClose={() => {
          closeAdd();
          updateKnownSpellsWithCascade();
        }}
        PaperProps={{ elevation: 0 }}
        slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(50, 50, 50, 0.85)' } } }}
      >
        <DialogTitle>
          <Accordion disableGutters>
            <AccordionSummary
              expandIcon={
                <InfoOutlined color="info" fontSize="small" alignmentBaseline="central" />
              }
            >
              <Typography variant="subtitle2">Additional spells</Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <Typography variant="caption">
                You might find other spells during your adventures. You could discover a spell
                recorded on a scroll in an evil wizard’s chest, for example, or in a dusty tome in
                an ancient library.
              </Typography>
              <Typography variant="caption">
                When you find a wizard spell of 1st level or higher, you can add it to your
                spellbook if it is of a spell level you can prepare and if you can spare the time to
                decipher and copy it.
              </Typography>
              <Typography variant="caption">
                For each level of the spell, the process takes 2 hours and costs 50 gp. Once you
                have spent this time and money, you can prepare the spell just like your other
                spells.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </DialogTitle>
        <DialogContent>
          {isAddOpen && (
            <SpellSearch
              classIndex={character.class.index}
              subclassIndex={character.subclass?.index}
              maxLevel={max(slotLevels)}
              selectedSpells={knownSpells.filter(({ added }) => added)}
              onSelect={(spell, remove = false) => {
                if (
                  remove ===
                  knownSpells.some(
                    ({ index, level }) => index === spell.index && level === spell.level
                  )
                ) {
                  remove
                    ? setKnownSpells((prev) => prev.filter(({ index }) => index !== spell.index))
                    : setKnownSpells((prev) => [...prev, { ...spell, added: true }]);
                }
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              closeAdd();
              updateKnownSpellsWithCascade();
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
