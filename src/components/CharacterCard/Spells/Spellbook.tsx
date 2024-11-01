import { PrepareIcon, SpellbookIcon } from '@assets';
import { Button, Dialog, DialogActions, DialogTitle, IconButton, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Character } from '@representations/user.representation';
import { useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc } from 'firebase/firestore';
import { isEqual } from 'lodash';
import { Fragment, useMemo, useState } from 'react';
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
  const queryClient = useQueryClient();
  const [user] = useAuth();
  const [knownSpells, setKnownSpells] = useState(character.knownSpells || []);
  const [preparedSpells, setPreparedSpells] = useState(character.preparedSpells || []);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isPrepareOpen, setIsPrepareOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveSpells = async (learn: boolean = false) => {
    const shouldSavSpells = (
      slot: number | undefined,
      currentSpells: any[],
      characterSpells?: any[]
    ) => character.id && slot && !isEqual(characterSpells ?? [], currentSpells);

    learn ? setIsLearnOpen(false) : setIsPrepareOpen(false);

    if (
      learn
        ? !shouldSavSpells(slots.learn, knownSpells, character.knownSpells)
        : !shouldSavSpells(
            (slots.prepare ?? 0) + (slots.cantrips ?? 0),
            preparedSpells,
            character.preparedSpells
          )
    )
      return;

    setIsSaving(true);
    if (user?.uid) {
      const path = `users/${user.uid}/characters`;
      const document = doc(database, path, character.id);

      try {
        await updateDoc(
          document,
          learn ? { knownSpells: knownSpells } : { preparedSpells: preparedSpells }
        );
        await queryClient.invalidateQueries({
          queryKey: ['fetchCharacter', user.uid, character.id]
        });
      } catch (error: any) {
        console.error(error.stack);
        toast.error(`Something went wrong
           ${error.code || 'Error'}`);
      }
    }

    setIsSaving(false);
  };

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
  const characterInfo = useMemo(
    () => ({
      classIndex: character.class.index,
      subclassIndex: character.subclass?.index,
      charLevel: character.level
    }),
    [character.class.index, character.subclass?.index, character.level]
  );

  // TODO: Make spell smaller when editable (less data? Maybe just attack or heal or something?)
  // TODO: Link to the how to maybe when need to learn/prepare?
  // TODO: should additional race/subrace spells be always prepared? (current yes)
  return (
    <Fragment>
      {shouldLearn || shouldPrepare ? (
        <Typography>Click on the spellbooks to setup your spells</Typography>
      ) : (
        !isLearnOpen &&
        !isPrepareOpen && (
          <SpellList
            characterInfo={characterInfo}
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

      <Box display="flex" justifyContent="space-evenly">
        {slots.learn && (
          <IconButton
            sx={{
              alignSelf: 'center',
              width: 'fit-content',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={() => setIsLearnOpen(true)}
            disabled={!shouldLearn || isSaving}
          >
            <SpellbookIcon
              height="75px"
              width="75px"
              fill="currentColor"
              css={{
                margin: '10px'
              }}
            />
            Learn
          </IconButton>
        )}

        {(slots.cantrips || slots.prepare) && (
          <IconButton
            sx={{
              alignSelf: 'center',
              width: 'fit-content',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={() => setIsPrepareOpen(true)}
            disabled={shouldLearn || isSaving}
          >
            <PrepareIcon
              height="80px"
              width="80px"
              fill="currentColor"
              css={{
                margin: '10px'
              }}
            />
            Prepare
          </IconButton>
        )}
      </Box>

      <Dialog
        fullWidth
        open={isLearnOpen || isPrepareOpen}
        onClose={() => saveSpells(isLearnOpen)}
        PaperProps={{ elevation: 0 }}
        slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(50, 50, 50, 0.85)' } } }}
      >
        <DialogTitle>{isLearnOpen ? 'Learn' : 'Prepare'}</DialogTitle>
        {isLearnOpen ? (
          <SpellList
            characterInfo={characterInfo}
            slotLevels={slotLevels}
            selectedSpells={knownSpells}
            setSelectedSpells={setKnownSpells}
            maxSelected={[0, slots.learn || 0]}
          />
        ) : (
          <SpellList
            characterInfo={characterInfo}
            additionalSpellList={slots.prepare ? knownSpells : []}
            slotLevels={slots.learn || !slots.prepare ? [0] : [0, ...slotLevels]}
            selectedSpells={preparedSpells}
            setSelectedSpells={setPreparedSpells}
            maxSelected={[slots.cantrips || 0, slots.prepare || 0]}
          />
        )}
        <DialogActions>
          <Button onClick={() => saveSpells(isLearnOpen)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
