import { useMemo } from 'react';
import { Box, FormControl, FormLabel } from '@mui/material';
import type { ChoiceObjectType } from '@utils/character/creation.utils';
import type { Alignment } from '@representations/character/background.representation';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type { Choice, DefaultRepresentation } from '@representations/common.representation';
import { ChoiceGroup } from './ChoiceGroup';
import { useChoiceSelection } from './hooks/useChoiceSelection';

interface ChoicesProps {
  choices: (Choice | undefined)[];
  inherited?: ((DefaultRepresentation & { count?: number }) | RaceAbilityBonus)[];
  selected?: (ChoiceObjectType | RaceAbilityBonus)[];
  proficiencies?: DefaultRepresentation[];
  alignment?: Alignment;
  setSelected: (data: any) => void;
}

export function Choices({
  choices,
  setSelected,
  alignment,
  selected = [],
  inherited = [],
  proficiencies = []
}: ChoicesProps) {
  const { isChecked, isDisabled, handleSelect } = useChoiceSelection(
    selected,
    inherited,
    setSelected
  );

  const validChoices = useMemo(
    () => choices.filter((choice): choice is Choice => choice !== undefined),
    [choices]
  );

  return (
    <Box
      display="grid"
      sx={{
        gridGap: '50px',
        gridTemplateColumns: `repeat(auto-fit, minmax(350px, 1fr))`
      }}
    >
      {validChoices.map((choice, i) => (
        <FormControl
          key={`choice-${choice.type}-${i}`}
          fullWidth
          margin="dense"
          component="fieldset"
        >
          <FormLabel component="legend">{choice.desc}</FormLabel>
          <ChoiceGroup
            choice={choice}
            choiceIndex={i}
            depth={0}
            alignment={alignment}
            proficiencies={proficiencies}
            isChecked={(item, count, isMultiple) =>
              isChecked(item, selected, count, isMultiple) ||
              isChecked(item, inherited, count, isMultiple)
            }
            isDisabled={(item, choose, choiceIndex, count, isMultiple, options) =>
              isDisabled(item, choose, choiceIndex, count, isMultiple, options)
            }
            onSelect={(checked, item, count, isMultiple) =>
              handleSelect(checked, item, i, count, isMultiple)
            }
          />
        </FormControl>
      ))}
    </Box>
  );
}
