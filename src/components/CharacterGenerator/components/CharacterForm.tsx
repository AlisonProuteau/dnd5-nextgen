import type { Dispatch, SetStateAction } from 'react';
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { useForm } from '@hooks/useForm';
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
  const form = useForm<CharacterDetails>({
    initialData: {
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

  const handleChange = (field: keyof CharacterDetails) => (e: any) => {
    form.setFormData({ [field]: e.target.value });
  };

  const handleGenerate = async () => {
    setCharacter(null);
    setPrompt('');

    try {
      setIsLoading(true);

      const prompt = buildPrompt(form.formData as CharacterDetails);
      setPrompt(prompt);

      const url = await generateImage(form.formData as CharacterDetails, prompt);
      if (url) setCharacter({ ...(form.formData as CharacterDetails), url });
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
              <Select
                id={fieldNames[field]}
                data-testid={`${field}-select`}
                value={form.formData[field] ?? ''}
                label={fieldNames[field]}
                onChange={handleChange(field)}
              >
                {options.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt || 'None'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Refinement"
            id="Refinement"
            fullWidth
            multiline
            minRows={2}
            value={form.formData.refinement || ''}
            onChange={(e) => form.setFormData({ refinement: e.target.value })}
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
