import { PrepareIcon, SpellbookIcon } from '@assets';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material';
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
  slotInfo
}: {
  character: Character;
  slotInfo: {
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
    learn ? setIsLearnOpen(false) : setIsPrepareOpen(false);
    if (
      !character.id ||
      (learn
        ? !slotInfo.learn || isEqual(character.knownSpells ?? [], knownSpells)
        : (!slotInfo.prepare && !slotInfo.cantrips) ||
          isEqual(character.preparedSpells ?? [], preparedSpells))
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

        if (learn) {
          const newPreparedSpells = preparedSpells.filter((spell) =>
            spell.level > 0
              ? knownSpells.find(
                  ({ index, level }) => index === spell.index && level === spell.level
                )
              : true
          );
          if (!isEqual(newPreparedSpells, preparedSpells)) {
            console.log('different');
            setPreparedSpells(newPreparedSpells);
            await saveSpells();
          }
        } else {
          await queryClient.invalidateQueries({
            queryKey: ['fetchCharacter', user.uid, character.id]
          });
        }
      } catch (error: any) {
        console.error(error.stack);
        toast.error(`Something went wrong
           ${error.code || 'Error'}`);
      }
    }

    setIsSaving(false);
  };

  const shouldLearn = useMemo(
    () => knownSpells.length < (slotInfo.learn || 0),
    [slotInfo.learn, knownSpells.length]
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

  const characterInfo = useMemo(() => {
    return {
      classIndex: character.class.index,
      subclassIndex: character.subclass?.index,
      charLevel: character.level,
      slotLevels: []
    };
  }, [character.class.index, character.subclass?.index, character.level, slotLevels]);

  // TODO: Test more
  // TODO: Manually add more cantrips/spells/slots? Warlock can add more spells without levelingg to check or if you made a mistake)
  // TODO: Should learn be disabled? (current only if should prepare => might be annoyin
  // TODO: Should additional race/subrace spells be always prepared? (current yes)
  // TODO: Am I missing subclass info spells ?
  return (
    <Fragment>
      {!shouldLearn && !shouldPrepare && !isLearnOpen && !isPrepareOpen && (
        <SpellList
          characterInfo={characterInfo}
          additionalSpellList={(character.traits || [])
            .flatMap(({ spells }) => spells || [])
            .concat(...preparedSpells)
            .concat(
              ...(slotInfo.prepare ? knownSpells.filter(({ level }) => level === 0) : knownSpells)
            )}
          spellListOnly={true}
        />
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
            onClick={() => setIsLearnOpen(true)}
            disabled={(!shouldLearn && shouldPrepare) || isSaving}
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
            {!shouldLearn && <Typography>Prepare your spells</Typography>}
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
        <DialogContent>
          {isLearnOpen ? (
            <SpellList
              characterInfo={{ ...characterInfo, slotLevels }}
              selectedSpells={knownSpells}
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
          <Button onClick={() => saveSpells(isLearnOpen)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
