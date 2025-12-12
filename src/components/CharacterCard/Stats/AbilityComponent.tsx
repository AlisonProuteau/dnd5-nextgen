import { RadioButtonChecked, RadioButtonUnchecked, Shield } from '@mui/icons-material';
import {
  Badge,
  Box,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Typography
} from '@mui/material';
import { useToggle } from '@hooks/useToggle';
import type { AbilityScore } from '@representations/campaign/adventure.representation';
import type { DefaultRepresentation } from '@representations/common.representation';

const verticalSubWithMargin = { verticalAlign: 'sub', marginX: '5px' };

interface AbilityProps {
  ability: AbilityScore;
  skills?: DefaultRepresentation[];
  savingThrows?: DefaultRepresentation[];
  score?: number;
  modifier?: number;
}

export function AbilityComponent({
  ability,
  skills,
  savingThrows,
  score,
  modifier = 0
}: AbilityProps) {
  const { isOn: isDialogOpen, turnOn: openDialog, turnOff: closeDialog } = useToggle(false);

  return (
    <Box display="flex" data-testid={`ability-${ability.index}`}>
      <Badge
        badgeContent={
          savingThrows?.find(({ index }) => index === ability.index) ? (
            <IconButton onClick={openDialog}>
              <Shield color="info" aria-label="Saving Throw" />
            </IconButton>
          ) : null
        }
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <Paper
          sx={{
            marginBottom: '15px',
            width: '80px',
            height: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          elevation={24}
        >
          <Typography variant="caption" zIndex={50} paddingTop="10px">
            {ability.full_name}
          </Typography>
          <Typography alignSelf="center">{modifier > 0 ? '+' + modifier : modifier}</Typography>
          <Paper
            sx={{ width: 'fit-content', paddingY: '5px', paddingX: '20px', marginBottom: '-15px' }}
          >
            <Typography variant="subtitle2">{score}</Typography>
          </Paper>
        </Paper>
      </Badge>

      <Box width="max-content">
        {ability?.skills.map((skill) => {
          const isProficient = skills?.find(({ index }) => index.includes(skill.index));
          return (
            <Box key={skill.index}>
              {isProficient ? (
                <RadioButtonChecked
                  fontSize="small"
                  sx={verticalSubWithMargin}
                  data-testid="skill-selected"
                />
              ) : (
                <RadioButtonUnchecked
                  fontSize="small"
                  sx={verticalSubWithMargin}
                  data-testid="skill-unselected"
                />
              )}
              {skill.name.replace('Skill: ', '')}
            </Box>
          );
        })}
      </Box>

      <Dialog open={isDialogOpen} onClose={closeDialog} data-testid="saving-throws-dialog">
        <DialogTitle>Saving Throws</DialogTitle>
        <DialogContent>
          <DialogContentText>{savingThrows?.map(({ name }) => name).join(', ')}</DialogContentText>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
