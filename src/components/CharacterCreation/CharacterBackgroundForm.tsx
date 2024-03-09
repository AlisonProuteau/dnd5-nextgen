import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getAllAligmenents, getAllBackgrounds } from '../../api/ressources';
import type {
  Alignment,
  Background
} from '../../representations/character/background.representation';
import type { DefaultRepresentation } from '../../representations/common.representation';
import { ControledInput } from '../ControledInput';
import type { CharacterFormData } from './CharacterCreation';

interface CharacterBackgroundFormProps {
  onNext: (raceInfo: Partial<CharacterFormData>) => void;
  proficiencies?: DefaultRepresentation[];
  languages?: DefaultRepresentation[];
}

export function CharacterBackgroundForm({
  onNext,
  proficiencies = [],
  languages = []
}: CharacterBackgroundFormProps) {
  const [selectedBackground, setSelectedBackground] = useState<Background>();
  const [selectedIdeals, setSelectedIdeals] = useState<string>();
  const [selectedBonds, setSelectedBonds] = useState<string>();
  const [selectedFlaws, setSelectedFlaws] = useState<string>();
  const [selectedAlignment, setSelectedAlignment] = useState<Alignment>();

  const { data: backgrounds } = useQuery(
    'fetchBackgrounds',
    async () => (await getAllBackgrounds()).results
  );

  const { data: alignments } = useQuery(
    ['fetchAlignments'],
    async () => (await getAllAligmenents()).results
  );

  // TODO: Remove
  useEffect(() => console.log(proficiencies, languages), []);

  // const isChecked = (type: 'proficiency' | 'language' | 'ability', item: DefaultRepresentation) => {
  //   if (type === 'proficiency')
  //     return (
  //       proficiencies.some(({ index }) => index === item.index) ||
  //       selectedProficiencies.some(({ index }) => index === item.index) ||
  //       false
  //     );
  //   else if (type === 'language')
  //     return (
  //       languages.some(({ index }) => index === item.index) ||
  //       selectedLanguages.some(({ index }) => index === item.index) ||
  //       false
  //     );
  //   else if (type === 'ability')
  //     return (
  //       selectedAbilities.some(({ ability_score }) => ability_score.index === item.index) || false
  //     );

  //   return false;
  // };

  // const isDisabled = (
  //   itemType: 'proficiency' | 'language' | 'ability',
  //   item: DefaultRepresentation,
  //   choose: number,
  //   i?: number
  // ) => {
  //   if (itemType === 'proficiency')
  //     return (
  //       !isChecked(itemType, item) &&
  //       (selectedProficiencies.filter(({ type }) => type === i).length || 0) >= choose
  //     );
  //   else if (itemType === 'language')
  //     return !isChecked(itemType, item) && (selectedLanguages.length || 0) >= choose;
  //   else if (itemType === 'ability')
  //     return !isChecked(itemType, item) && (selectedAbilities.length || 0) >= choose;
  //   return false;
  // };

  // const onChange = (
  //   type: 'proficiency' | 'language' | 'ability',
  //   checked: boolean,
  //   item: DefaultRepresentation | RaceAbilityBonus,
  //   i?: number
  // ) => {
  //   const onProficiencySelect = (checked: boolean, item: DefaultRepresentation, i: number) => {
  //     if (checked) {
  //       setSelectedProficiencies([...(selectedProficiencies || []), { ...item, type: i }]);
  //     } else if (selectedProficiencies.length) {
  //       const proficiencyIndex = selectedProficiencies.findIndex(
  //         ({ index }) => index === item.index
  //       );

  //       setSelectedProficiencies(selectedProficiencies.toSpliced(proficiencyIndex, 1));
  //     }
  //   };
  //   const onLanguageSelect = (checked: boolean, item: DefaultRepresentation) => {
  //     if (checked) {
  //       setSelectedLanguages([...(selectedLanguages || []), item]);
  //     } else if (selectedLanguages.length) {
  //       const languageIndex = selectedLanguages.findIndex(({ index }) => index === item.index);
  //       setSelectedLanguages(selectedLanguages.toSpliced(languageIndex, 1));
  //     }
  //   };
  //   const onAbilitySelect = (checked: boolean, item: RaceAbilityBonus) => {
  //     if (checked) {
  //       setSelectedAbilities([...(selectedAbilities || []), item]);
  //     } else if (selectedAbilities.length) {
  //       const abilityIndex = selectedAbilities.findIndex(
  //         ({ ability_score }) => ability_score.index === item.ability_score.index
  //       );
  //       setSelectedAbilities(selectedAbilities.toSpliced(abilityIndex, 1));
  //     }
  //   };

  //   if (type === 'proficiency') onProficiencySelect(checked, item as DefaultRepresentation, i || 0);
  //   else if (type === 'language') onLanguageSelect(checked, item as DefaultRepresentation);
  //   else if (type === 'ability') onAbilitySelect(checked, item as RaceAbilityBonus);
  // };

  // const generateChoices = (
  //   i: number,
  //   choose: number,
  //   options: Option[],
  //   desc: string,
  //   type: 'proficiency' | 'language' | 'ability'
  // ) => {
  //   if (options[0].option_type === 'reference') {
  //     return (
  //       <FormGroup key={`${type}-${i}-${desc})}`}>
  //         {options.map(
  //           ({ item }) =>
  //             item && (
  //               <FormControlLabel
  //                 key={`${type}-${i}-${item.index || item}`}
  //                 control={
  //                   <Checkbox
  //                     id={`${type}-${i}-${item.index}`}
  //                     checked={isChecked(type, item)}
  //                     disabled={isDisabled(type, item, choose, i)}
  //                     onChange={(_, checked) => onChange(type, checked, item, i)}
  //                   />
  //                 }
  //                 label={item?.name}
  //               />
  //             )
  //         )}
  //       </FormGroup>
  //     );
  //   } else if (options[0].option_type === 'ability_bonus') {
  //     return (
  //       <FormGroup key={`${type}-${i}-${desc})}`}>
  //         {options.map(
  //           ({ ability_score, bonus }) =>
  //             ability_score &&
  //             bonus && (
  //               <FormControlLabel
  //                 key={`${type}-${i}-${ability_score.index}`}
  //                 control={
  //                   <Checkbox
  //                     id={`${type}-${i}-${ability_score.index}`}
  //                     checked={isChecked(type, ability_score)}
  //                     disabled={isDisabled(type, ability_score, choose, i)}
  //                     onChange={(_, checked) =>
  //                       onChange(type, checked, { ability_score, bonus }, i)
  //                     }
  //                   />
  //                 }
  //                 label={ability_score?.name}
  //               />
  //             )
  //         )}
  //       </FormGroup>
  //     );
  //   } else if (options[0]?.option_type === 'choice') {
  //     return (
  //       <Box sx={{ display: 'flex', flexDirection: 'row', columnGap: '50px' }}>
  //         {options.map(
  //           ({ choice }, index) =>
  //             choice &&
  //             choice.from.option_set_type === 'options_array' &&
  //             generateChoices(
  //               i,
  //               choice.choose,
  //               choice.from.options,
  //               choice.desc || index.toString(),
  //               type
  //             )
  //         )}
  //       </Box>
  //     );
  //   } else {
  //     throw new Error('Option type not handled');
  //   }
  // };

  const isValid = () => {
    return selectedBackground?.index && selectedAlignment?.index;
  };

  return (
    <Box>
      {backgrounds && (
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="background">Background</InputLabel>
          <Select
            fullWidth
            id="race"
            label="Backgrounds"
            disabled={!backgrounds}
            value={selectedBackground?.index || ''}
            onChange={({ target }) => {
              setSelectedBackground(backgrounds.find((e) => e.index === target.value));
            }}
          >
            {backgrounds.map((currentBackground) => (
              <MenuItem
                key={currentBackground.index}
                id={currentBackground.index}
                value={currentBackground.index}
              >
                {currentBackground.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {/* // TODO: use values from background object */}
      {/* // TODO: add custom bockground */}
      <FormControl margin="dense">
        <InputLabel htmlFor="alignment">Alignment</InputLabel>
        <Select
          fullWidth
          id="alignment"
          label="Alignment"
          defaultValue=""
          onChange={({ target }) =>
            setSelectedAlignment(alignments?.find(({ index }) => index === target.value))
          }
        >
          {alignments?.map((currentAlignment: DefaultRepresentation) => (
            <MenuItem
              key={currentAlignment.index}
              id={currentAlignment.index}
              value={currentAlignment.index}
            >
              {currentAlignment.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <ControledInput
        fullWidth
        id="ideals"
        multiline
        label="Ideals"
        onChange={(value) => setSelectedIdeals(value as string)}
      />
      <ControledInput
        fullWidth
        id="bonds"
        multiline
        label="Bonds"
        onChange={(value) => setSelectedBonds(value as string)}
      />
      <ControledInput
        fullWidth
        id="flaws"
        multiline
        label="Flaws"
        onChange={(value) => setSelectedFlaws(value as string)}
      />

      <Button
        sx={{ float: 'right' }}
        disabled={!isValid()}
        onClick={() => {
          const data = {
            background: selectedBackground,
            ideals: selectedIdeals,
            bonds: selectedBonds,
            flaws: selectedFlaws,
            alignment: selectedAlignment
          };
          onNext(data);
        }}
      >
        Next
      </Button>
    </Box>
  );
}
