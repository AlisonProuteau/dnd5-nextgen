import { useEffect, useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { ControledInput } from '@shared/ControledInput';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { CharacterFormData } from '@representations/user.representation';

interface CharacterDescriptionProps {
  setFormData?: (data: Partial<CharacterFormData>) => void;
  onPrev?: (_: any) => void;
  onNext?: (info: Partial<CharacterFormData>) => void;
  defaultData?: Partial<CharacterFormData>;
  isActive?: boolean;
}

export enum GenderIndexes {
  female = 'F',
  male = 'M',
  other = 'O'
}
export function CharacterDescription({
  setFormData,
  onPrev,
  onNext,
  defaultData,
  isActive = false
}: CharacterDescriptionProps) {
  const [localFormData, setLocalFormData] = useState<Partial<CharacterFormData>>(defaultData || {});

  useEffect(() => {
    if (defaultData && isActive)
      setLocalFormData({
        name: defaultData.name,
        age: defaultData?.age,
        sex: defaultData?.sex,
        appearance: defaultData?.appearance
      });
  }, [defaultData, isActive]);

  const genderInstances: DefaultRepresentation[] = [
    { index: GenderIndexes.female, name: 'Female' },
    { index: GenderIndexes.male, name: 'Male' },
    { index: GenderIndexes.other, name: 'Other' }
  ];
  const isValid = () => (localFormData.name || '').trim() !== '' && localFormData.age;

  return (
    <Box data-testid="description-selection">
      <Box
        display="flex"
        flexWrap="wrap"
        gap="15px"
        justifyContent="space-between"
        paddingBottom={setFormData ? '15px' : ''}
      >
        <ControledInput
          id="name"
          label="Name"
          sx={{ flexGrow: 1, flexBasis: '50%' }}
          value={localFormData?.name}
          onChange={(value) => {
            const name = value as string | undefined;
            setLocalFormData((prev) => ({ ...prev, name }));
            setFormData?.({ name });
          }}
        />
        <ControledInput
          id="age"
          type="number"
          label="Age"
          sx={{ width: '85px' }}
          value={localFormData?.age}
          onChange={(value) => {
            const age =
              !value || isNaN(parseInt(value?.toString() || ''))
                ? undefined
                : parseInt(value?.toString()) || undefined;
            setLocalFormData((prev) => ({ ...prev, age }));
            setFormData?.({ age });
          }}
        />
        <FormControl margin="dense" sx={{ width: '100px' }}>
          <InputLabel htmlFor="sex">Sex</InputLabel>
          <Select
            fullWidth
            id="sex"
            label="Sex"
            value={localFormData?.sex?.index ?? 'O'}
            onChange={({ target }) => {
              const sex = genderInstances.find(({ index }) => index === target.value);
              setLocalFormData((prev) => ({ ...prev, sex }));
              setFormData?.({ sex });
            }}
          >
            {genderInstances.map((currentSex: DefaultRepresentation) => (
              <MenuItem
                key={`sex-${currentSex.index}`}
                id={currentSex.index}
                value={currentSex.index}
              >
                {currentSex.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <ControledInput
          fullWidth
          multiline
          id="appearance"
          label="Appearance"
          value={localFormData?.appearance}
          onChange={(value) => {
            const appearance = value as string | undefined;
            setFormData
              ? setFormData({ appearance })
              : setLocalFormData({ ...localFormData, appearance });
          }}
        />
      </Box>

      {onPrev && (
        <Button sx={{ float: 'left', paddingBottom: '15px' }} onClick={() => onPrev({})}>
          Back
        </Button>
      )}

      {onNext && (
        <Button sx={{ float: 'right' }} disabled={!isValid()} onClick={() => onNext(localFormData)}>
          Next
        </Button>
      )}
    </Box>
  );
}
