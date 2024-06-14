import { RadioButtonChecked, RadioButtonUnchecked } from '@mui/icons-material';
import { Box, Paper, Typography } from '@mui/material';
import type { AbilityScore } from '../../representations/campaign/adventure.representation';
import type { ChoiceSelection } from '../CharacterCreation/utils';

interface AbilityProps {
  ability: AbilityScore;
  skills?: ChoiceSelection[];
  score?: number;
  modifier?: number;
}

const CIRCLE_SIZE = '80px';
export function AbilityComponent({ ability, skills, score, modifier = 0 }: AbilityProps) {
  return (
    <Box display="flex" marginBottom="15px">
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
        <Typography variant="caption" zIndex={50}>
          {ability.full_name}
        </Typography>
        <Typography alignSelf="center">+ {modifier}</Typography>
        <Paper
          sx={{ width: 'fit-content', paddingY: '5px', paddingX: '20px', marginBottom: '-15px' }}
        >
          <Typography variant="subtitle2">{score}</Typography>
        </Paper>
      </Paper>
      <Box>
        {ability?.skills.map((skill) => {
          const isProficient = skills?.find(({ index }) => index.includes(skill.index));
          console.log(skill, skills, !!isProficient);
          return (
            <Box>
              {isProficient ? (
                <RadioButtonChecked
                  fontSize="small"
                  sx={{ verticalAlign: 'sub', marginX: '5px' }}
                />
              ) : (
                <RadioButtonUnchecked
                  fontSize="small"
                  sx={{ verticalAlign: 'sub', marginX: '5px' }}
                />
              )}
              {skill.name.replace('Skill: ', '')}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
