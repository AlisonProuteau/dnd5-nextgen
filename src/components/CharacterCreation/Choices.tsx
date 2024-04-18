import {
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Typography
} from '@mui/material';
import { isArray } from 'lodash';
import { useState } from 'react';
import { useQueryClient } from 'react-query';
import { getResourceList } from '../../api/ressources';
import type { Alignment } from '../../representations/character/background.representation';
import type { RaceAbilityBonus } from '../../representations/character/race.representation';
import type {
  Choice,
  DefaultRepresentation,
  Option
} from '../../representations/common.representation';
import type { ChoiceObjectType } from './utils';

interface ChoicesProps {
  choices: (Choice | undefined)[];
  inherited?: ((DefaultRepresentation & { count?: number }) | RaceAbilityBonus)[];
  selected?: (ChoiceObjectType | RaceAbilityBonus)[];
  proficiencies?: DefaultRepresentation[];
  alignment?: Alignment;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const queryClient = useQueryClient();
  // const [isEquipmentLoading, setIsEquipmentLoading] = useState<Record<string, Option[]>>({});
  const [isResourceLoading, setIsResourceLoading] = useState<Record<string, Option[]>>({});

  const onSelect = (
    checked: boolean,
    item: DefaultRepresentation | RaceAbilityBonus | (DefaultRepresentation & { count?: number })[],
    i: number,
    count?: number
  ) => {
    if (checked) {
      const mapData = (data: DefaultRepresentation | RaceAbilityBonus, currentCount?: number) =>
        currentCount ? { ...data, type: i, count: currentCount } : { ...data, type: i };

      if (isArray(item))
        setSelected([...(selected || []), ...item.map((i) => mapData(i, i.count))]);
      else setSelected([...(selected || []), mapData(item, count)]);
    } else if (selected?.length) {
      const findIndexFn = (current: (typeof selected)[0], toSearch: typeof item) => {
        if ('index' in current && 'index' in toSearch)
          return current.index === toSearch.index || false;
        if ('ability_score' in current && 'ability_score' in toSearch)
          return current.ability_score.index === toSearch.ability_score.index || false;

        return false;
      };

      if (isArray(item)) {
        let newArray = [...selected];
        item.forEach((i) => {
          const selectedIndex = newArray.findIndex((current) => findIndexFn(current, i));
          newArray = newArray.toSpliced(selectedIndex, 1);
        });
        setSelected(newArray);
      } else {
        const selectedIndex = selected.findIndex((current) => findIndexFn(current, item));
        setSelected(selected.toSpliced(selectedIndex, 1));
      }
    }
  };

  const isChecked = (
    item: DefaultRepresentation,
    selection: ((DefaultRepresentation & { type?: number; count?: number }) | RaceAbilityBonus)[],
    i: number,
    count?: number
  ) => {
    return selection.some((current) => {
      if ('index' in current)
        return (current.index === item.index && (current.count || 0) === (count || 0)) || false;
      if ('ability_score' in current) return current.ability_score.index === item.index || false;

      return false;
    });
  };

  const isDisabled = (item: DefaultRepresentation, choose: number, i: number, count?: number) => {
    const filteredSelection = selected.filter((selection) =>
      'type' in selection ? selection.type === i : true
    );

    return (
      isChecked(item, inherited, i, count) ||
      (!isChecked(item, filteredSelection, i, count) &&
        (filteredSelection.reduce(
          (acc, current) => acc + ('count' in current ? current.count || 1 : 1),
          0
        ) || 0) >= choose)
    );
  };

  const fetchResourceList = (id: string): Promise<Option[]> =>
    queryClient.fetchQuery(
      ['fetchResourceList', id],
      async () => (await getResourceList(id)).results
    );

  const generateChoices = (i: number, choose: number, options: Option[], type: string) => {
    return options?.map((option, index) => {
      if (option.option_type === 'reference') {
        return (
          option.item && (
            <FormControlLabel
              key={`choice-${i}-${option.item.index}`}
              control={
                <Checkbox
                  id={`choice-${i}-${option.item.index}`}
                  checked={
                    isChecked(option.item, selected, i) || isChecked(option.item, inherited, i)
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
              key={`choice-${i}-${option.of.index}-${option.count}`}
              control={
                <Checkbox
                  id={`choice-${i}-${option.of.index}-${option.count}`}
                  checked={
                    isChecked(option.of, selected, i, option.count) ||
                    isChecked(option.of, inherited, i, option.count)
                  }
                  disabled={isDisabled(option.of, choose, i, option.count)}
                  onChange={(_, checked) => onSelect(checked, option.of, i, option.count)}
                />
              }
              label={`${option.count} ${option.of?.name}`}
            />
          )
        );
      } else if (option.option_type === 'string') {
        const formattedOption: DefaultRepresentation = {
          index: `${type}-${index}`,
          name: option.string
        };
        return (
          <FormControlLabel
            key={`choice-${i}-${formattedOption.index}`}
            control={
              <Checkbox
                id={`choice-${i}-${formattedOption.index}`}
                checked={
                  isChecked(formattedOption, selected, i, option.count) ||
                  isChecked(formattedOption, inherited, i, option.count)
                }
                disabled={isDisabled(formattedOption, choose, i, option.count)}
                onChange={(_, checked) => onSelect(checked, formattedOption, i, option.count)}
              />
            }
            label={option.string}
          />
        );
      } else if (option.option_type === 'ideal') {
        const formattedOption: DefaultRepresentation = {
          index: `${type}-${index}`,
          name: option.desc
        };
        return (
          <FormControlLabel
            key={`choice-${i}-${formattedOption.index}`}
            control={
              <Checkbox
                id={`choice-${i}-${formattedOption.index}`}
                checked={
                  isChecked(formattedOption, selected, i, option.count) ||
                  isChecked(formattedOption, inherited, i, option.count)
                }
                disabled={
                  isDisabled(formattedOption, choose, i, option.count) ||
                  (alignment
                    ? !option.alignments.find(({ index }) => index === alignment?.index)
                    : false)
                }
                onChange={(_, checked) => onSelect(checked, formattedOption, i, option.count)}
              />
            }
            label={
              <Box paddingY="5px">
                <Typography variant="caption" display="block">
                  {option.alignments.map(({ name }) => name).join(' / ')}
                </Typography>
                {option.desc}
              </Box>
            }
          />
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
                    isChecked(option.ability_score, selected, i) ||
                    isChecked(option.ability_score, inherited, i)
                  }
                  disabled={isDisabled(option.ability_score, choose, i)}
                  onChange={(_, checked) => onSelect(checked, option, i)}
                />
              }
              label={option.ability_score?.name}
            />
          )
        );
      } else if (option.option_type === 'multiple') {
        if (
          option.items.every(
            (item) => item.option_type === 'reference' || item.option_type === 'counted_reference'
          )
        )
          return (
            <FormControlLabel
              key={`choice-${i}-multiple-${option.items.length}-${
                (option.items[0].of || option.items[0].item)?.index
              }`}
              control={
                <Checkbox
                  id={`choice-${i}-multiple-${option.items.length}-${
                    (option.items[0].of || option.items[0].item)?.index
                  }`}
                  checked={option.items.every(
                    (item) =>
                      (item.of || item.item) &&
                      (isChecked(item.of || item.item, selected, i, item.count) ||
                        isChecked(item.of || item.item, inherited, i, item.count))
                  )}
                  disabled={option.items.every(
                    (item) =>
                      (item.of || item.item) &&
                      isDisabled(item.of || item.item, choose, i, item.count)
                  )}
                  onChange={(_, checked) =>
                    onSelect(
                      checked,
                      option.items.reduce(
                        (acc: (DefaultRepresentation & { count?: number })[], curr) => {
                          return curr.item || curr.of
                            ? [...acc, { ...(curr.item || curr.of), count: curr.count }]
                            : acc;
                        },
                        []
                      ),
                      i
                    )
                  }
                />
              }
              label={option.items.map((i) => `${i.count} ${i.of!.name}`).join(' + ')}
            />
          );
        else console.error(`Unknown multiple: ${option.items[0].option_type}`);
      } else if (option.option_type === 'choice') {
        let currentOptions: undefined | Option[] = undefined;
        if (option.choice.from.option_set_type === 'options_array') {
          currentOptions = option.choice.from.options;
        } else if (
          option.choice.from.option_set_type === 'resource_list' ||
          option.choice.from.option_set_type === 'equipment_category'
        ) {
          const id =
            option.choice.from.equipment_category?.index || option.choice.from.resource_list_path;

          if (id && isResourceLoading[id] === undefined) {
            fetchResourceList(
              option.choice.from.option_set_type === 'equipment_category'
                ? `/equipment-categories/${id}`
                : id
            ).then((res) => setIsResourceLoading({ ...isResourceLoading, [id]: res }));
          }
        }

        const loadedData =
          currentOptions ||
          isResourceLoading[
            option.choice.from.equipment_category?.index ||
              option.choice.from.resource_list_path ||
              ''
          ];
        return loadedData ? (
          <FormGroup key={`choice-${i + index}-${type})}`}>
            {option.choice &&
              generateChoices(i, option.choice.choose, loadedData, option.choice.type)}
          </FormGroup>
        ) : (
          <CircularProgress size={24} key={`choice-${i + index}-${type})}`} />
        );
      } else {
        console.error(`Option type not handled ${option.option_type}`);
      }
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
      {(choices.filter((data) => data !== undefined) as Choice[]).map((choice, i) => (
        <FormControl
          key={`choice-${choice.type}-${i}`}
          fullWidth
          margin="dense"
          component="fieldset"
        >
          <FormLabel component="legend">{choice.desc}</FormLabel>
          {generateChoices(i, 1, [{ choice, option_type: 'choice' }], choice.type)}
        </FormControl>
      ))}
    </Box>
  );
}
