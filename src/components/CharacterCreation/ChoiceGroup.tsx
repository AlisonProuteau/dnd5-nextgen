import { type ReactElement, useMemo } from 'react';
import { Box, Checkbox, CircularProgress, FormControlLabel, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getResourceList } from '@api/ressources';
import type { Alignment } from '@representations/character/background.representation';
import type { RaceAbilityBonus } from '@representations/character/race.representation';
import type {
  AbilityBonusOption,
  Choice,
  DefaultRepresentation
} from '@representations/common.representation';
import { useAuth } from 'src/providers/AuthProvider';
import {
  formatOption,
  getBundleItems,
  hasRequiredProficiencies,
  isCheckboxOption
} from './utils/optionUtils';

interface ChoiceGroupProps {
  choice: Choice;
  choiceIndex: number;
  depth?: number;
  isMultiple?: boolean;
  bundleSiblings?: (AbilityBonusOption | (DefaultRepresentation & { count?: number }))[];
  alignment?: Alignment;
  proficiencies: DefaultRepresentation[];
  isChecked: (item: DefaultRepresentation, count?: number, isMultiple?: boolean) => boolean;
  isDisabled: (
    item: DefaultRepresentation,
    choose: number,
    choiceIndex: number,
    count?: number,
    isMultiple?: boolean,
    options?: string[]
  ) => boolean;
  onSelect: (
    checked: boolean,
    item:
      | DefaultRepresentation
      | RaceAbilityBonus
      | (RaceAbilityBonus | (DefaultRepresentation & { count?: number }))[],
    count?: number,
    isMultiple?: boolean
  ) => void;
}

/**
 * Recursively renders a choice with all its options (merged component)
 */
export function ChoiceGroup({
  choice,
  choiceIndex,
  depth = 0,
  isMultiple,
  bundleSiblings,
  alignment,
  proficiencies,
  isChecked,
  isDisabled,
  onSelect
}: ChoiceGroupProps): ReactElement {
  const { version } = useAuth();

  const resourcePath = useMemo(() => {
    const id = choice.from.equipment_category?.index || choice.from.resource_list_path;

    return choice.from.option_set_type === 'equipment_category' ? `/equipment/${id}` : id;
  }, [
    choice.from.equipment_category?.index,
    choice.from.resource_list_path,
    choice.from.option_set_type
  ]);

  // Use React Query to fetch resources
  const { data: resourceOptions, isLoading } = useQuery({
    queryKey: ['fetchResourceList', version, resourcePath],
    queryFn: async () => {
      if (!version || !resourcePath) return [];
      const result = await getResourceList(version, resourcePath);
      return result.results;
    },
    enabled: !!version && !choice.from.options && !!resourcePath,
    staleTime: Infinity
  });

  // Recursive rendering function
  const renderChoice = (nestedChoice: Choice, nestedIsMultiple?: boolean): ReactElement => (
    <ChoiceGroup
      choice={nestedChoice}
      choiceIndex={choiceIndex}
      depth={depth + 1}
      isMultiple={nestedIsMultiple}
      bundleSiblings={bundleSiblings}
      alignment={alignment}
      proficiencies={proficiencies}
      isChecked={isChecked}
      isDisabled={isDisabled}
      onSelect={onSelect}
    />
  );

  return isLoading ? (
    <CircularProgress size={24} />
  ) : (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderLeft:
          depth &&
          (choice.from.options || resourceOptions || []).filter(
            (option) => !isCheckboxOption(option)
          ).length > 1
            ? '2px solid'
            : 'none',
        borderColor: 'divider'
      }}
    >
      {(choice.from.options || resourceOptions || []).map((option, index) => {
        // Simple checkbox options
        if (isCheckboxOption(option)) {
          const { item, label, labelData, prerequisites } = formatOption(
            option,
            choice.type,
            index
          );
          if (!prerequisites || !hasRequiredProficiencies(option, proficiencies)) return null;

          const alignmentMismatch =
            alignment && 'alignments' in option && option.alignments
              ? !option.alignments.find(({ index: idx }) => idx === alignment.index)
              : false;
          if (alignmentMismatch) return null;

          // Format related options for disable check
          const limitedOptions = isMultiple ? choice.from.options || resourceOptions : undefined;
          const formatOptions = limitedOptions?.map(
            (o) =>
              o.item?.index ||
              o.of?.index ||
              o.ability_score?.index ||
              (o.string && `${o.string}-${choice.type}`) ||
              `${choice.type}-${index}`
          );

          const checked = isChecked(item, item.count, isMultiple);
          const disabled = isDisabled(
            item,
            choice.choose,
            choiceIndex,
            item.count,
            isMultiple,
            formatOptions
          );

          const checkboxId = `choice-${choiceIndex}-${item.index}${item.count ? '-' + item.count : ''}`;
          const formattedLabel = labelData ? (
            <Box paddingY="5px">
              <Typography variant="caption" display="block">
                {labelData.alignments}
              </Typography>
              {labelData.desc}
            </Box>
          ) : (
            label
          );

          return disabled ? null : (
            <FormControlLabel
              key={`option-${choiceIndex}-${index}-${choice.type}`}
              control={
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  disabled={disabled}
                  onChange={(_, isCheckboxChecked) => {
                    const itemToSelect = option.ability_score ? option : item;

                    // Auto-select/deselect all bundle siblings including current item
                    if (isMultiple && bundleSiblings && bundleSiblings.length > 0) {
                      const allBundleItems = getBundleItems(itemToSelect, bundleSiblings);
                      onSelect(isCheckboxChecked, allBundleItems, undefined, isMultiple);
                    } else
                      onSelect(isCheckboxChecked, itemToSelect, itemToSelect.count, isMultiple);
                  }}
                />
              }
              label={formattedLabel}
            />
          );
        }

        // Nested choice option (recursive)
        if (option.option_type === 'choice') {
          return (
            <Box key={`choice-${choiceIndex}-${index}-${choice.type}`}>
              {renderChoice(option.choice, isMultiple)}
            </Box>
          );
        }

        // Multiple items bundled together - must select ALL items in the bundle
        if (option.option_type === 'multiple') {
          // Calculate total items in bundle
          const bundleChoose = option.items.reduce(
            (total, item) => total + parseInt(item.count?.toString() || '1'),
            0
          );

          // Extract direct checkboxes from bundle items to pass down
          const directCheckboxes = option.items
            .filter((opt) => isCheckboxOption(opt))
            .map((opt, idx) => {
              const formatted = formatOption(opt, choice.type, idx);
              return opt.ability_score ? opt : formatted.item;
            });

          return (
            <Box
              key={`multiple-${choiceIndex}-${index}-${choice.type}`}
              sx={{
                pl: 1,
                borderLeft: '2px solid',
                borderColor: 'divider'
              }}
            >
              <ChoiceGroup
                choice={{
                  ...choice,
                  from: { option_set_type: 'options_array', options: option.items },
                  choose: bundleChoose
                }}
                choiceIndex={choiceIndex}
                depth={depth + 1}
                isMultiple={true}
                bundleSiblings={directCheckboxes}
                alignment={alignment}
                proficiencies={proficiencies}
                isChecked={isChecked}
                isDisabled={isDisabled}
                onSelect={onSelect}
              />
            </Box>
          );
        }

        // Unhandled option type - log error
        console.error(`Option type not handled: ${option.option_type}`);
        return null;
      })}
    </Box>
  );
}
