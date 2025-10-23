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
import type { AbilityScore } from '@representations/campaign/adventure.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { useState } from 'react';

const verticalSubWithMargin = { verticalAlign: 'sub', marginX: '5px' };

interface AbilityProps {
  ability: AbilityScore;
  skills?: DefaultRepresentation[];
  savingThrows?: DefaultRepresentation[];
  score?: number;
  modifier?: number;
}

const CIRCLE_SIZE = '80px';
export function AbilityComponent({
  ability,
  skills,
  savingThrows,
  score,
  modifier = 0
}: AbilityProps) {
  const [isDialogOpen, setIsDialogueOpen] = useState(false);

  return (
    <Box display="flex" data-testid={`ability-${ability.index}`}>
      <Badge
        badgeContent={
          savingThrows?.find(({ index }) => index === ability.index) ? (
            <IconButton onClick={() => setIsDialogueOpen(true)}>
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
                <RadioButtonChecked fontSize="small" sx={verticalSubWithMargin} />
              ) : (
                <RadioButtonUnchecked fontSize="small" sx={verticalSubWithMargin} />
              )}
              {skill.name.replace('Skill: ', '')}
            </Box>
          );
        })}
      </Box>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogueOpen(false)}
        data-testid="saving-throws-dialog"
      >
        <DialogTitle>Saving Throws</DialogTitle>
        <DialogContent>
          <DialogContentText>{savingThrows?.map(({ name }) => name).join(', ')}</DialogContentText>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
