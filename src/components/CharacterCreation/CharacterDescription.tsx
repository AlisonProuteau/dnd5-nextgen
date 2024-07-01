import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { DefaultRepresentation } from '@representations/common.representation';
import { ControledInput } from '@shared/ControledInput';
import type { CharacterFormData } from './CharacterCreation';

interface CharacterDescriptionProps {
  setFormData: (data: Partial<CharacterFormData>) => void;
  onPrev: () => void;
}

export enum GenderIndexes {
  female = 'F',
  male = 'M',
  other = 'O'
}
export function CharacterDescription({ setFormData, onPrev }: CharacterDescriptionProps) {
  const genderInstances: DefaultRepresentation[] = [
    { index: GenderIndexes.female, name: 'Female' },
    { index: GenderIndexes.male, name: 'Male' },
    { index: GenderIndexes.other, name: 'Other' }
  ];

  return (
    <Box display="flex" flexWrap="wrap" gap="15px" justifyContent="space-between">
      <ControledInput
        id="name"
        label="Name"
        sx={{ flexGrow: 1, flexBasis: '50%' }}
        onChange={(value) => setFormData({ name: value as string })}
      />
      <ControledInput
        id="age"
        type="number"
        label="Age"
        sx={{ width: '85px' }}
        onChange={(value) => value && setFormData({ age: parseInt(value.toString()) })}
      />
      <FormControl margin="dense" sx={{ width: '100px' }}>
        <InputLabel htmlFor="sex">Sex</InputLabel>
        <Select
          fullWidth
          id="sex"
          label="Sex"
          defaultValue="O"
          onChange={({ target }) =>
            setFormData({ sex: genderInstances.find(({ index }) => index === target.value) })
          }
        >
          {genderInstances.map((currentSex: DefaultRepresentation) => (
            <MenuItem key={currentSex.index} id={currentSex.index} value={currentSex.index}>
              {currentSex.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <ControledInput
        fullWidth
        id="apperance"
        multiline
        label="Appearance"
        onChange={(value) => setFormData({ appearance: value as string })}
      />

      <Button sx={{ float: 'left', paddingBottom: '15px' }} onClick={onPrev}>
        Back
      </Button>
    </Box>
  );
}
