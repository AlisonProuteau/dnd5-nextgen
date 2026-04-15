import { CoinPurse, HealIcon } from '@assets';
import { EventNote, History } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useToggle } from '@hooks/useToggle';
import { button, fab } from '@utils/ui/style.utils';
import type { Character } from '@representations/user.representation';
import { ActionRecord } from '../ActionRecord/ActionRecord';
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
  const {
    isOn: isActionRecordOpen,
    turnOn: openActionRecord,
    turnOff: closeActionRecord
  } = useToggle(false);

  return (
    <Box
      sx={fab}
      display="grid"
      gridAutoFlow="column"
      gridAutoColumns="40px"
      gap={0.5}
      overflow="clip"
    >
      <IconButton
        data-testid={`health-${character.id}`}
        onClick={openHealthDialog}
        sx={{ ...button, height: '40px', p: '5px' }}
      >
        <HealIcon fill="currentColor" />
      </IconButton>
      <HealthManager
        character={character}
        isHealthDialogOpen={isHealthDialogOpen}
        closeHealthDialog={closeHealthDialog}
      />

      <IconButton
        data-testid={`coin-purse-${character.id}`}
        onClick={openMoneyDialog}
        sx={{ ...button, height: '40px', p: '5px' }}
      >
        <CoinPurse fill="currentColor" height="40px" />
      </IconButton>
      <MoneyManager
        characterId={character.id}
        isMoneyDialogOpen={isMoneyDialogOpen}
        closeMoneyDialog={closeMoneyDialog}
        currentAmount={character.money}
      />

      <IconButton
        data-testid={`action-record-${character.id}`}
        onClick={openActionRecord}
        sx={{ ...button, height: '40px' }}
      >
        <History />
      </IconButton>
      <ActionRecord character={character} isOpen={isActionRecordOpen} onClose={closeActionRecord} />

      <IconButton
        data-testid={`notes-${character.id}`}
        onClick={openNote}
        sx={{ ...button, height: '40px' }}
      >
        <EventNote />
      </IconButton>
      <CharacterNotes isNoteOpen={isNoteOpen} closeNote={closeNote} character={character} />
    </Box>
  );
}
