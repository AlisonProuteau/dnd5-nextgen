import { SpellbookIcon } from '@assets';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc } from 'firebase/firestore';
import { isEqual, max } from 'lodash';
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
  const [isSpellbookOpen, setIsSpellbookOpen] = useState(false);
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

  const highestSlot = useMemo(
    () =>
      Object.keys(slots.slots).length ? parseInt(max(Object.keys(slots.slots)) ?? '0') : undefined,
    [slots]
  );

  // TODO: Put back disabled?
  // TODO: Make spell smaller when editable, no need to see as much maybe + add info button to see more if needed
  return (
    <Fragment>
      {(knownSpells?.length || 0) < (slots.learn || 0) + (slots.cantrips || 0) ? (
        <Typography>Click on the spellbook to learn some spells</Typography>
      ) : preparedSpells?.length < (slots.prepare || 0) ? (
        <Typography>Click on the spellbook to prepare your spells</Typography>
      ) : (
        <SpellList
          classIndex={character.class.index}
          subclassIndex={character.subclass?.index}
          charLevel={character.level}
          highestSpellLevel={highestSlot}
          selectedSpells={(() => {
            let spells = knownSpells.concat(preparedSpells);

            if (slots.learn) {
              spells = knownSpells;
              if (slots.prepare)
                spells = spells.filter(
                  ({ index, level }) =>
                    level === 0 || preparedSpells.find((spell) => spell.index === index)
                );
            }

            return spells;
          })()}
          moreSpells={(character.traits || []).flatMap(({ spells }) => spells || [])}
        />
      )}

      {(slots.cantrips || slots.learn || slots.prepare) && (
        <Fragment>
          <IconButton
            sx={{
              alignSelf: 'center',
              width: 'fit-content',
              color: 'white'
            }}
            onClick={() => setIsSpellbookOpen(true)}
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
            open={isSpellbookOpen}
            onClose={() => {
              setIsSpellbookOpen(false);

              if (isEdit) {
                setKnownSpells(character.knownSpells || []);
                setIsEdit(
                  (character.knownSpells?.length || 0) < (slots.learn || 0) + (slots.cantrips || 0)
                );
              } else savePreparedSpells();
            }}
            fullWidth
            PaperProps={{ elevation: 0 }}
            slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(50, 50, 50, 0.85)' } } }}
          >
            <DialogTitle display="flex" alignItems="center" justifyContent="space-between">
              {isEdit ? 'Learn' : slots.prepare ? 'Prepare' : 'Available spells'}
            </DialogTitle>

            <DialogContent>
              {(
                isEdit
                  ? (knownSpells?.length || 0) === (slots.learn || 0) + (slots.cantrips || 0)
                  : (preparedSpells.length || 0) === (slots.prepare || 0)
              ) ? (
                <DialogContentText>
                  Unselect a spell to see the full available list of spells
                </DialogContentText>
              ) : (
                <DialogContentText>
                  {isEdit ? (
                    <Fragment>
                      {slots.cantrips &&
                        `Select ${slots.cantrips} cantrip${slots.cantrips > 1 ? 's' : ''}`}
                      {slots.learn &&
                        `${slots.cantrips ? ' and ' : ' '}${slots.learn} spell${
                          slots.learn > 1 ? 's' : ''
                        }`}
                    </Fragment>
                  ) : (
                    <Fragment>{slots.prepare && `Select ${slots.prepare} spells`}</Fragment>
                  )}
                </DialogContentText>
              )}

              <SpellList
                classIndex={
                  isEdit || !slots.learn
                    ? character.class.index
                    : !slots.prepare
                    ? character.class.index
                    : undefined
                }
                subclassIndex={character.subclass?.index}
                charLevel={character.level}
                highestSpellLevel={highestSlot}
                selectedSpells={isEdit || !slots.prepare ? knownSpells : preparedSpells}
                setSelectedSpells={
                  isEdit ? setKnownSpells : slots.prepare ? setPreparedSpells : undefined
                }
                disabledLevels={
                  isEdit
                    ? isDisabled(knownSpells, slots.learn || 0)
                    : slots.prepare
                    ? isDisabled(preparedSpells, slots.prepare || 0, true)
                    : []
                }
                moreSpells={
                  isEdit || !slots.prepare
                    ? undefined
                    : (character.traits || [])
                        .flatMap(({ spells }) => spells || [])
                        .concat(slots.learn || slots.cantrips ? knownSpells : [])
                }
              />
            </DialogContent>

            <DialogActions>
              {isEdit ? (
                <Fragment>
                  <Button
                    onClick={() => {
                      setKnownSpells(character.knownSpells || []);
                      setPreparedSpells(
                        preparedSpells.filter(({ index }) =>
                          character.knownSpells?.find((spell) => spell.index === index)
                        )
                      );
                      setIsEdit(false);
                    }}
                    disabled={
                      (character.knownSpells?.length || 0) <
                        (slots.learn || 0) + (slots.cantrips || 0) || isSaving
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={
                      isSaving // knownSpells.length < (slots.learn || 0) + (slots.cantrips || 0) ||
                    }
                    onClick={() => {
                      setPreparedSpells(
                        preparedSpells.filter(({ index }) =>
                          knownSpells.find((spell) => spell.index === index)
                        )
                      );

                      savePreparedSpells();
                      saveLearnedSpells();
                    }}
                  >
                    Save
                  </Button>
                </Fragment>
              ) : (
                <Fragment>
                  <Button
                    onClick={() => {
                      savePreparedSpells();
                      setIsSpellbookOpen(false);
                    }}
                  >
                    Close
                  </Button>
                  <Button onClick={() => setIsEdit(true)}>Edit</Button>
                </Fragment>
              )}
            </DialogActions>
          </Dialog>
        </Fragment>
      )}
    </Fragment>
  );
}
