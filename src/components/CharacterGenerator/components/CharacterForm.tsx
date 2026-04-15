import type { Dispatch, SetStateAction } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography
} from '@mui/material';
import { ControledInput } from '@shared/ControledInput';
import type { CharacterDetails } from '../utils/character';
import {
  buildPrompt,
  classes,
  ethnicities,
  genders,
  generateImage,
  imageRatios,
  imageTypes,
  races
} from '../utils/imageUtils';

export default function CharacterForm({
  setIsLoading,
  setPrompt,
  setCharacter
}: {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setPrompt: (prompt: string) => void;
  setCharacter: (character: CharacterDetails | null) => void;
}) {
  const { control, getValues } = useForm<CharacterDetails>({
    mode: 'onChange',
    defaultValues: {
      race: 'Human',
      gender: 'Gender-neutral',
      class: 'Barbarian',
      ethnicity: undefined,
      imageType: undefined,
      imageRatio: undefined,
      refinement: undefined
    }
  });

  const fieldNames: Record<keyof CharacterDetails, string> = {
    race: 'Race',
    gender: 'Gender',
    class: 'Class',
    ethnicity: 'Ethnicity',
    imageType: 'Image Type',
    imageRatio: 'Image Ratio',
    refinement: 'Refinement',
    url: ''
  };

  const handleGenerate = async () => {
    setCharacter(null);
    setPrompt('');

    try {
      setIsLoading(true);
      const formData = getValues();

      const prompt = buildPrompt(formData as CharacterDetails);
      setPrompt(prompt);

      const url = await generateImage(formData as CharacterDetails, prompt);
      if (url) setCharacter({ ...(formData as CharacterDetails), url });
    } catch (err: any) {
      console.error('Generation failed:', err);
      alert(`Image generation failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }} data-testid="character-form">
      <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
        Character Settings
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }} data-testid="form-container">
        {(
          [
            ['race', races],
            ['gender', genders],
            ['class', classes],
            ['ethnicity', ethnicities],
            ['imageType', imageTypes],
            ['imageRatio', imageRatios]
          ] as [keyof CharacterDetails, string[]][]
        ).map(([field, options]) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={field}>
            <FormControl fullWidth>
              <InputLabel htmlFor={fieldNames[field]}>{fieldNames[field]}</InputLabel>
              <Controller
                name={field}
                control={control}
                render={({ field: formField }) => (
                  <Select
                    id={fieldNames[field]}
                    data-testid={`${field}-select`}
                    label={fieldNames[field]}
                    {...formField}
                    value={formField.value ?? ''}
                  >
                    {options.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt || 'None'}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
        ))}
        <Grid size={{ xs: 12 }}>
          <ControledInput
            fullWidth
            multiline
            minRows={2}
            id="refinement"
            control={control}
            label="Refinement"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button
            variant="contained"
            sx={{ borderRadius: 2, boxShadow: 2 }}
            onClick={handleGenerate}
            fullWidth
            size="large"
          >
            Generate Portrait
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
