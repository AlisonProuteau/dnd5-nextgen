import { Box, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel } from '@mui/material';
import { useState } from 'react';
import { useQueryClient } from 'react-query';
import { getEquipmentList } from '../../api/ressources';
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
  proficiencies?: DefaultRepresentation[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelected: (data: any) => void;
}

export function Choices({
  choices,
  setSelected,
  selected = [],
  inherited = [],
  proficiencies = []
}: ChoicesProps) {
  const queryClient = useQueryClient();
  const [isEquipmentLoading, setIsEquipmentLoading] = useState<Record<string, Option[]>>({});

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

  const fetchEquipmentList = (id: string): Promise<Option[]> =>
    queryClient.fetchQuery(['fetchEquipmentList', id], async () =>
      (await getEquipmentList(id)).results.map((item) => ({
        option_type: 'reference',
        item
      }))
    );

  const generateChoices = (i: number, choose: number, options: Option[], desc: string) => {
    return (
      <FormGroup>
        {options.map((option) => {
          if (option.option_type === 'reference') {
            return (
              option.item && (
                <FormControlLabel
                  key={`choice-${i}-${option.item.index}`}
                  control={
                    <Checkbox
                      id={`choice-${i}-${option.item.index}`}
                      checked={
                        isChecked(option.item, selected) || isChecked(option.item, inherited)
                      }
                      disabled={isDisabled(option.item, choose, i)}
                      onChange={(_, checked) => onSelect(checked, option.item, i)}
                    />
                  }
                  label={option.item?.name}
                />
              )
            );
          } else if (option.option_type === 'counted_reference') {
            return (
              option.of &&
              (option.prerequisites?.every(({ proficiency }) =>
                proficiency ? proficiencies.includes(proficiency) : true
              ) ??
                true) && (
                <FormControlLabel
                  key={`choice-${i}-${option.of.index}`}
                  control={
                    <Checkbox
                      id={`choice-${i}-${option.of.index}`}
                      checked={isChecked(option.of, selected) || isChecked(option.of, inherited)}
                      disabled={isDisabled(option.of, choose, i)}
                      onChange={(_, checked) => onSelect(checked, option.of, i)}
                    />
                  }
                  label={option.of?.name}
                />
              )
            );
          } else if (option.option_type === 'ability_bonus') {
            return (
              option.ability_score &&
              option.bonus && (
                <FormControlLabel
                  key={`choice-${i}-${option.ability_score.index}`}
                  control={
                    <Checkbox
                      id={`choice-${i}-${option.ability_score.index}`}
                      checked={
                        isChecked(option.ability_score, selected) ||
                        isChecked(option.ability_score, inherited)
                      }
                      disabled={isDisabled(option.ability_score, choose, i)}
                      onChange={(_, checked) => onSelect(checked, option, i)}
                    />
                  }
                  label={option.ability_score?.name}
                />
              )
            );
          } else if (option.option_type === 'choice') {
            let currentOptions: undefined | Option[] = undefined;
            if (option.choice.from.option_set_type === 'options_array') {
              currentOptions = option.choice.from.options;
            } else if (option.choice.from.option_set_type === 'equipment_category') {
              const id = option.choice.from.equipment_category.index;
              if (isEquipmentLoading[id] === undefined) {
                fetchEquipmentList(id).then((res) =>
                  setIsEquipmentLoading({ ...isEquipmentLoading, [id]: res })
                );
              }
            }

            return currentOptions ||
              isEquipmentLoading[option.choice.from.equipment_category?.index || ''] ? (
              <Box
                key={`choice-${i}-${desc})`}
                sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}
              >
                {option.choice &&
                  generateChoices(
                    i,
                    option.choice.choose,
                    currentOptions ||
                      isEquipmentLoading[option.choice.from.equipment_category?.index || ''],
                    option.choice.desc || option.choice.type
                  )}
              </Box>
            ) : null;
          } else {
            throw new Error(`Option type not handled ${option.option_type}`);
          }
        })}
      </FormGroup>
    );
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
