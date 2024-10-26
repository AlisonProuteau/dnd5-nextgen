import { SpellbookIcon } from '@assets';
import { Button, Dialog, DialogActions, DialogTitle, IconButton, Typography } from '@mui/material';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc } from 'firebase/firestore';
import { isEqual } from 'lodash';
import { Fragment, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { database } from 'src/firebase';
import { useAuth } from 'src/providers/AuthProvider';
import { SpellList } from './SpellList';

export function Spellbook({
  character,
  slots
}: {
  character: Character;
  slots: {
    cantrips?: number;
    learn?: number;
    prepare?: number;
    slots: Record<string, number>;
  };
}) {
  const [user] = useAuth();
  const queryClient = useQueryClient();
  const [knownSpells, setKnownSpells] = useState(character.knownSpells || []);
  const [preparedSpells, setPreparedSpells] = useState(character.preparedSpells || []);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isPrepareOpen, setIsPrepareOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(true);

  const isDisabled = (
    spells: (DefaultRepresentation & { level: number })[],
    spellNumber: number,
    prepare: boolean = false
  ) => {
    const levels = spells.map(({ level }) => level);
    const cantripsLength = levels.filter((level) => level === 0).length;
    const spellsLength = levels.filter((level) => level > 0).length;

    const val: number[] = [];
    if (cantripsLength >= (slots.cantrips || 0) || prepare) val.push(0);
    if (spellsLength >= spellNumber) val.push(1);

    return val;
  };

  const saveLearnedSpells = () => {
    if (!character || isEqual(character.knownSpells, knownSpells)) return;

    setIsSaving(true);
    if (user?.uid) {
      const path = `users/${user.uid}/characters`;
      const document = doc(database, path, character.id);

      updateDoc(document, { knownSpells: knownSpells })
        .then(async () => {
          await queryClient.invalidateQueries({
            queryKey: ['fetchCharacter', user.uid, character.id]
          });
          toast.success('Learned spells saved');
        })
        .catch((error) =>
          toast.error(`Something went wrong
          ${(error as Error).message || 'Error'}`)
        )
        .finally(() => {
          setIsSaving(false);
          setIsEdit(false);
        });
    } else setIsSaving(false);
  };

  const savePreparedSpells = () => {
    if (!slots.prepare || !character || isEqual(character.preparedSpells, preparedSpells)) return;

    setIsSaving(true);
    if (user?.uid) {
      const path = `users/${user.uid}/characters`;
      const document = doc(database, path, character.id);

      updateDoc(document, { preparedSpells: preparedSpells })
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: ['fetchCharacter', user.uid, character.id]
          })
        )
        .catch((error) =>
          toast.error(`Something went wrong
          ${(error as Error).message || 'Error'}`)
        )
        .finally(() => setIsSaving(false));
    } else setIsSaving(false);
  };

  useEffect(() => {
    setIsEdit((character.knownSpells?.length || 0) < (slots.learn || 0) + (slots.cantrips || 0));
  }, [slots, character.knownSpells?.length]);

  const slotLevels = useMemo(
    () =>
      Object.entries(slots.slots).reduce(
        (acc: number[], [key, value]) => (value > 0 ? [...acc, parseInt(key)] : acc),
        []
      ),
    [slots.slots]
  );

  const shouldLearn = useMemo(
    () => knownSpells.length < (slots.learn || 0),
    [slots.learn, knownSpells.length]
  );
  const shouldPrepare = useMemo(
    () => preparedSpells.length < (slots.prepare || 0) + (slots.cantrips || 0),
    [slots.prepare, preparedSpells.length, slots.cantrips]
  );

  // TODO: Make spell smaller when editable (less data? Maybe just attack or heal or something?)
  // TODO: More rules/info for learn/prepare per class?
  // TODO: should additional race/subrace spells be always prepared? (current yes)
  return (
    <Fragment>
      {shouldLearn || shouldPrepare ? (
        <Typography>Click on the spellbooks to setup your spells</Typography>
      ) : (
        !isLearnOpen &&
        !isPrepareOpen && (
          <SpellList
            characterInfo={{
              classIndex: character.class.index,
              subclassIndex: character.subclass?.index,
              charLevel: character.level
            }}
            additionalSpellList={(character.traits || [])
              .flatMap(({ spells }) => spells || [])
              .concat(...preparedSpells)
              .concat(
                ...(slots.prepare ? knownSpells.filter(({ level }) => level === 0) : knownSpells)
              )}
            spellListOnly={true}
          />
        )
      )}

      {slots.learn && (
        <Fragment>
          <IconButton
            sx={{
              alignSelf: 'center',
              width: 'fit-content',
              color: 'white'
            }}
            onClick={() => setIsLearnOpen(true)}
          >
            <SpellbookIcon
              height="80px"
              width="80px"
              fill="currentColor"
              css={{
                margin: '10px'
              }}
            />
          </IconButton>

          <Dialog
            fullWidth
            open={isLearnOpen}
            onClose={() => {
              saveLearnedSpells();
              setIsLearnOpen(false);
            }}
            PaperProps={{ elevation: 0 }}
            slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(50, 50, 50, 0.85)' } } }}
          >
            <DialogTitle>Learn</DialogTitle>
            <SpellList
              characterInfo={{
                classIndex: character.class.index,
                subclassIndex: character.subclass?.index,
                charLevel: character.level
              }}
              slotLevels={slotLevels}
              selectedSpells={knownSpells}
              setSelectedSpells={setKnownSpells}
              maxSelected={[0, slots.learn]}
            />
            <DialogActions>
              <Button
                onClick={() => {
                  saveLearnedSpells();
                  setIsLearnOpen(false);
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Fragment>
      )}

      {(slots.cantrips || slots.prepare) && (
        <Fragment>
          <IconButton
            sx={{
              alignSelf: 'center',
              width: 'fit-content',
              color: 'white'
            }}
            onClick={() => setIsPrepareOpen(true)}
            disabled={shouldLearn}
          >
            <SpellbookIcon
              height="80px"
              width="80px"
              fill="currentColor"
              css={{
                margin: '10px'
              }}
            />
            Prepare
          </IconButton>

          <Dialog
            fullWidth
            open={isPrepareOpen}
            onClose={() => {
              savePreparedSpells();
              setIsPrepareOpen(false);
            }}
            PaperProps={{ elevation: 0 }}
            slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(50, 50, 50, 0.85)' } } }}
          >
            <DialogTitle>Prepare</DialogTitle>
            <SpellList
              characterInfo={{
                classIndex: character.class.index,
                subclassIndex: character.subclass?.index,
                charLevel: character.level
              }}
              additionalSpellList={slots.prepare ? knownSpells : []}
              slotLevels={slots.learn || !slots.prepare ? [0] : [0, ...slotLevels]}
              selectedSpells={preparedSpells}
              setSelectedSpells={setPreparedSpells}
              maxSelected={[slots.cantrips || 0, slots.prepare || 0]}
            />
            <DialogActions>
              <Button
                onClick={() => {
                  savePreparedSpells();
                  setIsPrepareOpen(false);
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Fragment>
      )}
    </Fragment>
  );
}
