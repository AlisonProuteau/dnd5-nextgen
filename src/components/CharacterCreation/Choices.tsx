import { Box, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel } from '@mui/material';
import type { RaceAbilityBonus } from '../../representations/character/race.representation';
import type {
  Choice,
  DefaultRepresentation,
  Option
} from '../../representations/common.representation';

interface ChoicesProps {
  choices: (Choice | undefined)[];
  inherited?: (DefaultRepresentation | RaceAbilityBonus)[];
  selected?: ((DefaultRepresentation & { type: number }) | RaceAbilityBonus)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelected: (data: any) => void;
}

export function Choices({ choices, setSelected, selected = [], inherited = [] }: ChoicesProps) {
  const onSelect = (
    checked: boolean,
    item: DefaultRepresentation | RaceAbilityBonus,
    i: number
  ) => {
    if (checked) {
      setSelected([...(selected || []), { ...item, type: i }]);
    } else if (selected?.length) {
      const selectedIndex = selected.findIndex((current) => {
        if ('index' in current && 'index' in item) return current.index === item.index || false;
        if ('ability_score' in current && 'ability_score' in item)
          return current.ability_score.index === item.ability_score.index || false;

        return false;
      });

      setSelected(selected.toSpliced(selectedIndex, 1));
    }
  };

  const isChecked = (
    item: DefaultRepresentation,
    selection: (
      | (DefaultRepresentation & { type: number })
      | DefaultRepresentation
      | RaceAbilityBonus
    )[]
  ) => {
    return selection.some((current) => {
      if ('index' in current) return current.index === item.index || false;
      if ('ability_score' in current) return current.ability_score.index === item.index || false;

      return false;
    });
  };

  const isDisabled = (item: DefaultRepresentation, choose: number, i?: number) => {
    const filteredSelection = selected.filter((selection) =>
      'type' in selection ? selection.type === i : true
    );

    return (
      isChecked(item, inherited) ||
      (!isChecked(item, selected) && (filteredSelection.length || 0) >= choose)
    );
  };

  const generateChoices = (i: number, choose: number, options: Option[], desc: string) => {
    if (options[0].option_type === 'reference') {
      return (
        <FormGroup key={`choice-${i}-${desc})}`}>
          {options.map(
            ({ item }) =>
              item && (
                <FormControlLabel
                  key={`choice-${i}-${item.index || item}`}
                  control={
                    <Checkbox
                      id={`choice-${i}-${item.index}`}
                      checked={isChecked(item, selected) || isChecked(item, inherited)}
                      disabled={isDisabled(item, choose, i)}
                      onChange={(_, checked) => onSelect(checked, item, i)}
                    />
                  }
                  label={item?.name}
                />
              )
          )}
        </FormGroup>
      );
    } else if (options[0].option_type === 'ability_bonus') {
      return (
        <FormGroup key={`choice-${i}-${desc})}`}>
          {options.map(
            ({ ability_score, bonus }) =>
              ability_score &&
              bonus && (
                <FormControlLabel
                  key={`choice-${i}-${ability_score.index}`}
                  control={
                    <Checkbox
                      id={`choice-${i}-${ability_score.index}`}
                      checked={
                        isChecked(ability_score, selected) || isChecked(ability_score, inherited)
                      }
                      disabled={isDisabled(ability_score, choose, i)}
                      onChange={(_, checked) => onSelect(checked, { ability_score, bonus }, i)}
                    />
                  }
                  label={ability_score?.name}
                />
              )
          )}
        </FormGroup>
      );
    } else if (options[0]?.option_type === 'choice') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
          {options.map(
            ({ choice }, index) =>
              choice &&
              choice.from.option_set_type === 'options_array' &&
              generateChoices(
                i,
                choice.choose,
                choice.from.options,
                choice.desc || index.toString()
              )
          )}
        </Box>
      );
    } else {
      throw new Error('Option type not handled');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
      {(choices.filter((data) => data !== undefined) as Choice[]).map(
        ({ desc, choose, from }, i) => (
          <FormControl key={`proficiencies-${i}`} fullWidth margin="dense" component="fieldset">
            <FormLabel component="legend">{desc}</FormLabel>
            {from?.option_set_type === 'options_array' &&
              generateChoices(i, choose, from.options, desc || i.toString())}
          </FormControl>
        )
      )}
    </Box>
  );
}
