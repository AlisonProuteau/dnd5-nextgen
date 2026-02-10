import { Fragment } from 'react';
import { CoinPurse, HealIcon } from '@assets';
import { Delete, EditRounded, EventNote } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Typography
} from '@mui/material';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { button, fab } from '@utils/ui';
import type { Character } from '@representations/user.representation';
import { CharacterNotes } from '../CharacterNotes/CharacterNotes';
import { CharacterPoints } from '../CharacterPoints';
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
  const { isOn: isPointsOpen, turnOn: openPoints, turnOff: closePoints } = useToggle(false);
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
        <Fragment>
          <Fab
            size="small"
            sx={{ ...button, ...fab, marginRight: 18 }}
            onClick={openPoints}
            data-testid={`edit-points-${character.id}`}
          >
            <EditRounded />
          </Fab>

          <Dialog maxWidth="sm" fullWidth open={isPointsOpen} onClose={closePoints}>
            <Box display="flex" flexDirection="column" gap={3} p={3}>
              <Typography variant="h6">Edit Character Points</Typography>
              <CharacterPoints characterId={character.id} redirect={false} onSave={closePoints} />
            </Box>
          </Dialog>

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
