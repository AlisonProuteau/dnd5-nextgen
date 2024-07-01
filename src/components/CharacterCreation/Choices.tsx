import { getResourceList } from '@api/ressources';
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
import type { Alignment } from '@representations/character/background.representation';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type {
  AbilityBonusOption,
  Choice,
  CountedReferenceOption,
  DefaultRepresentation,
  IdealOption,
  Option,
  ReferenceOption,
  StringOption
} from '@representations/common.representation';
import { useQueryClient } from '@tanstack/react-query';
import { isArray } from 'lodash';
import { useState, type ReactNode } from 'react';
import type { ChoiceObjectType } from './characterCreation.utils';

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
  const [isResourceLoading, setIsResourceLoading] = useState<Record<string, Option[]>>({});

  const onSelect = (
    checked: boolean,
    item: DefaultRepresentation | RaceAbilityBonus | (DefaultRepresentation & { count?: number })[],
    i: number,
    count?: number,
    isMultiple?: boolean
  ) => {
    if (checked) {
      const mapData = (data: DefaultRepresentation | RaceAbilityBonus, currentCount?: number) => {
        const newData =
          currentCount && currentCount > 0
            ? { ...data, type: i, count: currentCount }
            : { ...data, type: i };
        return isMultiple ? { ...newData, isMultiple } : newData;
      };

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
    count?: number
  ) => {
    return selection.some((current) => {
      if ('index' in current)
        return (current.index === item.index && (current.count || 0) === (count || 0)) || false;
      if ('ability_score' in current) return current.ability_score.index === item.index || false;

      return false;
    });
  };

  const isDisabled = (
    item: DefaultRepresentation,
    choose: number,
    i: number,
    count?: number,
    isMultiple?: boolean,
    options?: string[]
  ) => {
    let filteredSelection = selected.filter((selection) =>
      'type' in selection ? selection.type === i : true
    );

    if (!isChecked(item, filteredSelection, count) && isChecked(item, selected, count)) return true;
    if (isChecked(item, inherited, count)) return true;
    if (!filteredSelection.length) return false;
    if (
      filteredSelection.some(
        (select) =>
          (('isMultiple' in select && select.isMultiple) || false) !== (isMultiple || false)
      )
    )
      return true;

    filteredSelection = filteredSelection.filter((selection) =>
      options
        ? options.includes('index' in selection ? selection.index : selection.ability_score.index)
        : true
    );
    if (isChecked(item, filteredSelection, count)) return false;

    return (
      (filteredSelection.reduce(
        (acc, current) => acc + ('count' in current ? current.count || 1 : 1),
        0
      ) || 0) >= choose
    );
  };

  const fetchResourceList = (id: string): Promise<Option[]> =>
    queryClient.fetchQuery({
      queryKey: ['fetchResourceList', id],
      queryFn: async () => (await getResourceList(id)).results
    });

  const genericCheckbox = (
    option:
      | ReferenceOption
      | CountedReferenceOption
      | StringOption
      | IdealOption
      | AbilityBonusOption,
    choose: number,
    i: number,
    type?: string,
    index?: number,
    isMultiple?: boolean,
    options?: (typeof option)[]
  ) => {
    const formattedOption: DefaultRepresentation & {
      count?: number;
      label: string | ReactNode;
      prerequisites: boolean;
    } = {
      index:
        option.item?.index || option.of?.index || option.ability_score?.index || `${type}-${index}`,
      name:
        option.item?.name ||
        option.string ||
        option.desc ||
        option.of?.name ||
        option.ability_score?.name ||
        `${type}-${index}`,
      count: option.count,
      label:
        option.item?.name ||
        option.ability_score?.name ||
        option.string ||
        (option.of && `${option.count} ${option.of.name}`) ||
        (option.alignments && (
          <Box paddingY="5px">
            <Typography variant="caption" display="block">
              {option.alignments.map(({ name }) => name).join(' / ')}
            </Typography>
            {option.desc}
          </Box>
        )) ||
        '',
      prerequisites: option.prerequisites
        ? option.prerequisites.every(({ proficiency }) =>
            proficiency ? proficiencies.includes(proficiency) : true
          )
        : true
    };

    const formatOptions = options?.map(
      (o) => o.item?.index || o.of?.index || o.ability_score?.index || `${type}-${index}`
    );

    return (
      formattedOption.prerequisites && (
        <FormControlLabel
          key={`choice-${i}-${formattedOption.index}${
            formattedOption.count && '-' + formattedOption.count
          }`}
          control={
            <Checkbox
              id={`choice-${i}-${formattedOption.index}${
                formattedOption.count && '-' + formattedOption.count
              }`}
              checked={
                isChecked(formattedOption, selected, formattedOption.count) ||
                isChecked(formattedOption, inherited, formattedOption.count)
              }
              disabled={
                isDisabled(formattedOption, choose, i, option.count, isMultiple, formatOptions) ||
                (alignment && option.alignments
                  ? !option.alignments.find(({ index }) => index === alignment?.index)
                  : false)
              }
              onChange={(_, checked) =>
                onSelect(
                  checked,
                  option.ability_score ? option : formattedOption,
                  i,
                  option.count,
                  isMultiple
                )
              }
            />
          }
          label={formattedOption.label}
        />
      )
    );
  };

  const generateCheckboxes = (
    i: number,
    choose: number,
    options: Option[],
    type: string,
    isMultiple?: boolean
  ) => {
    return options?.map((option, index) => {
      if (
        option.option_type === 'reference' ||
        option.option_type === 'string' ||
        option.option_type === 'ideal' ||
        option.option_type === 'counted_reference' ||
        option.option_type === 'ability_bonus'
      ) {
        const limitedOptions = isMultiple
          ? (options.filter((o) => typeof o === typeof option) as (typeof option)[])
          : undefined;

        return genericCheckbox(
          option,
          choose,
          i,
          type,
          index,
          isMultiple,
          limitedOptions?.length ? limitedOptions : undefined
        );
      } else if (option.option_type === 'choice') {
        return (
          <FormGroup key={`choice-${i}-${index}-${type})`}>
            <FormControl>{formatChoice(option.choice, i, isMultiple)}</FormControl>
          </FormGroup>
        );
      } else if (option.option_type === 'multiple') {
        const totalCount = option.items.reduce(
          (total, currentItem) => total + parseInt(currentItem.count?.toString() || '1'),
          0
        );

        return (
          <FormGroup key={`multiple-${i}-${index}-${type})`}>
            <FormControl>{generateCheckboxes(i, totalCount, option.items, type, true)}</FormControl>
          </FormGroup>
        );
      } else {
        console.error(`Option type not handled ${option.option_type}`);

        return (
          <FormControlLabel
            key={`choice-${i + index}-${type})`}
            control={<Checkbox id={`choice-${i + index}-${type})`} />}
            label={option.option_type}
          />
        );
      }
    });
  };

  const formatChoice = (choice: Choice, i: number, isMultiple?: boolean) => {
    let currentOptions: undefined | Option[] = undefined;
    if (choice.from.option_set_type === 'options_array') {
      currentOptions = choice.from.options;
    } else if (
      choice.from.option_set_type === 'resource_list' ||
      choice.from.option_set_type === 'equipment_category'
    ) {
      const id = choice.from.equipment_category?.index || choice.from.resource_list_path;

      if (id && isResourceLoading[id] === undefined) {
        fetchResourceList(
          choice.from.option_set_type === 'equipment_category' ? `/equipment-categories/${id}` : id
        ).then((res) => setIsResourceLoading({ ...isResourceLoading, [id]: res }));
      }
    }

    const loadedData =
      currentOptions ||
      isResourceLoading[
        choice.from.equipment_category?.index || choice.from.resource_list_path || ''
      ];

    return loadedData ? (
      <FormGroup key={`choice-${i}-${choice.type})}`}>
        {choice && generateCheckboxes(i, choice.choose, loadedData, choice.type, isMultiple)}
      </FormGroup>
    ) : (
      <CircularProgress size={24} key={`choice-${i}-${choice.type})}`} />
    );
  };

  return (
    <Box
      display="grid"
      sx={{
        gridGap: '50px',
        gridTemplateColumns: `repeat(auto-fit, minmax(350px, 1fr))`
      }}
    >
      {(choices.filter((data) => data !== undefined) as Choice[]).map((choice, i) => (
        <FormControl
          key={`choice-${choice.type}-${i}`}
          fullWidth
          margin="dense"
          component="fieldset"
        >
          <FormLabel component="legend">{choice.desc}</FormLabel>
          {formatChoice(choice, i)}
        </FormControl>
      ))}
    </Box>
  );
}
