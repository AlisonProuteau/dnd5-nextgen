import { useState } from 'react';
import { CheckCircle, ExpandMore } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Typography
} from '@mui/material';
import type { Condition } from '@representations/campaign/adventure.representation';
import { DESCRIPTION_CHAR_LIMIT } from 'src/utils';

interface ConditionCardProps {
  condition: Condition;
  isSelected: boolean;
  isDisabled: boolean;
  selectedLevel?: number;
  onToggle: (el: Condition) => void;
}

export function ConditionCard({
  condition,
  isSelected,
  isDisabled,
  selectedLevel,
  onToggle
}: ConditionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: isSelected ? 'primary.main' : undefined,
        position: 'relative',
        opacity: isDisabled ? 0.5 : 1
      }}
    >
      <CardActionArea
        data-testid={`condition-card-${condition.index}`}
        onClick={() => onToggle(condition)}
        disabled={isDisabled}
        aria-selected={isSelected}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            data-testid={`condition-label-${condition.index}`}
          >
            <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
              {condition.name}
            </Typography>
            {isSelected &&
              (selectedLevel !== undefined ? (
                <Chip
                  label={selectedLevel}
                  color="primary"
                  size="small"
                  sx={{
                    fontWeight: 500,
                    margin: '1.6px',
                    width: '16px',
                    height: '16px',
                    '> *': { p: 0.4 }
                  }}
                />
              ) : (
                <CheckCircle color="primary" fontSize="small" />
              ))}
          </Box>

          {!isDisabled && condition.desc?.length && (
            <Collapse in={expanded} collapsedSize="3em">
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {condition.desc.join('\n')}
              </Typography>
            </Collapse>
          )}
        </CardContent>
      </CardActionArea>

      {!isDisabled && condition.desc?.join('\n')?.length > DESCRIPTION_CHAR_LIMIT && (
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            transform: expanded ? 'rotate(180deg)' : undefined
          }}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          <ExpandMore />
        </IconButton>
      )}
    </Card>
  );
}
