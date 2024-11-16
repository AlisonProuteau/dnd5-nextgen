import { PrepareIcon, SpellbookIcon } from '@assets';
import { ExpandMore } from '@mui/icons-material';
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
import type { Character } from '@representations/user.representation';
import { useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc } from 'firebase/firestore';
import { isEqual } from 'lodash';
import { Fragment, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { database } from 'src/firebase';
import { useAuth } from 'src/providers/AuthProvider';
import { SpellList } from './SpellList';
import { SpellSearch } from './SpellSearch';

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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveSpells = async (learn: boolean = false) => {
    setIsAddOpen(false);
    learn ? setIsLearnOpen(false) : setIsPrepareOpen(false);
    if (
      !character.id ||
      (learn
        ? !slotInfo.learn || isEqual(character.knownSpells ?? [], knownSpells)
        : (!slotInfo.prepare && !slotInfo.cantrips) ||
          isEqual(character.preparedSpells ?? [], preparedSpells))
    )
      return;
    console.log('hey');

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

  const characterInfo = useMemo(() => {
    return {
      classIndex: character.class.index,
      subclassIndex: character.subclass?.index,
      charLevel: character.level,
      slotLevels: []
    };
  }, [character.class.index, character.subclass?.index, character.level, slotLevels]);

  // TODO: Test more
  // TODO: Am I missing subclass info spells ?
  return (
    <Fragment>
      {!shouldLearn && !shouldPrepare && !isLearnOpen && !isPrepareOpen && (
        <Fragment>
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
          {character.class.index === 'wizard' &&
            knownSpells.filter(({ level }) => level > 0).length && (
              <Accordion sx={{ '&:before': { display: 'none' } }} elevation={0} disableGutters>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                    All Ritual Spells
                  </Divider>
                </AccordionSummary>
                <AccordionDetails>
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
            onClick={() => setIsLearnOpen(true)}
            disabled={isSaving}
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
            <Button onClick={() => setIsAddOpen(true)}>Learn additional spell</Button>
          )}
          <Button onClick={() => saveSpells(isLearnOpen)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        open={isAddOpen}
        onClose={() => saveSpells(true)}
        PaperProps={{ elevation: 0 }}
        slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(50, 50, 50, 0.85)' } } }}
      >
        <DialogTitle>Learn additional spell</DialogTitle>
        <DialogContent>
          {isAddOpen && (
            <SpellSearch
              onSelect={(spell) => {
                !knownSpells.some(
                  ({ index, level }) => index === spell.index && level === spell.level
                ) && setKnownSpells([...knownSpells, { ...spell, added: true }]);
                setIsAddOpen(false);
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
