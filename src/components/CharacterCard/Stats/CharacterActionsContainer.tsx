import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { CoinPurse, HealIcon } from '@assets';
import { Delete, EditRounded, EventNote } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab } from '@mui/material';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { button, fab, linkButton } from '@utils/ui';
import type { Character } from '@representations/user.representation';
import { CharacterNotes } from '../CharacterNotes/CharacterNotes';
import { HealthManager } from '../Equipment/HealthManager';
import { MoneyManager } from '../Equipment/MoneyManager';

export function CharacterActionsContainer({
  character,
  activeStep
}: {
  character: Character;
  activeStep: number;
}) {
  const { isOn: isNoteOpen, turnOn: openNote, turnOff: closeNote } = useToggle(false);
  const { isOn: isDeleteOpen, turnOn: openDelete, turnOff: closeDelete } = useToggle(false);
  const {
    isOn: isMoneyDialogOpen,
    turnOn: openMoneyDialog,
    turnOff: closeMoneyDialog
  } = useToggle(false);
  const {
    isOn: isHealthDialogOpen,
    turnOn: openHealthDialog,
    turnOff: closeHealthDialog
  } = useToggle(false);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacters'],
    successMessages: { delete: 'Character deleted successfully' },
    redirect: { delete: { path: '/' } }
  });

  return (
    <Fragment>
      <Fab
        size="small"
        sx={{ ...button, ...fab }}
        onClick={openNote}
        data-testid={`notes-${character.id}`}
      >
        <EventNote />
      </Fab>
      <CharacterNotes isNoteOpen={isNoteOpen} closeNote={closeNote} character={character} />

      <Fab
        size="small"
        sx={{ ...button, ...fab, padding: 0.6, marginRight: 6 }}
        onClick={openMoneyDialog}
        data-testid={`coin-purse-${character.id}`}
      >
        <CoinPurse fill="currentColor" width="100%" height="100%" />
      </Fab>

      <MoneyManager
        characterId={character.id}
        isMoneyDialogOpen={isMoneyDialogOpen}
        closeMoneyDialog={closeMoneyDialog}
        currentAmount={character.money}
      />

      <Fab
        size="small"
        sx={{ ...button, ...fab, padding: 0.6, marginRight: 12 }}
        onClick={openHealthDialog}
        data-testid={`health-${character.id}`}
      >
        <HealIcon fill="currentColor" width="100%" height="100%" />
      </Fab>

      <HealthManager
        character={character}
        isHealthDialogOpen={isHealthDialogOpen}
        closeHealthDialog={closeHealthDialog}
      />

      {activeStep === 0 && (
        // TODO: Make this a modal
        <Fragment>
          <Fab
            size="small"
            sx={{ ...button, ...fab, marginRight: 18 }}
            data-testid={`edit-points-${character.id}`}
          >
            <Link to="points" state={{ characterId: character.id }} css={linkButton}>
              <EditRounded />
            </Link>
          </Fab>

          <Fab
            size="small"
            sx={{ ...button, ...fab, padding: 0.6, marginRight: 24 }}
            onClick={openDelete}
            data-testid={`delete-${character.id}`}
          >
            <Delete />
          </Fab>
        </Fragment>
      )}

      <Dialog maxWidth="xs" open={isDeleteOpen} onClose={closeDelete}>
        <DialogTitle>Delete {character.name}</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this character?
          <br />
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button autoFocus disabled={firebaseCrud.isLoading} onClick={closeDelete}>
            Cancel
          </Button>
          <Button
            disabled={firebaseCrud.isLoading}
            onClick={async () => {
              await firebaseCrud.remove(character.id);
              closeDelete();
            }}
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
