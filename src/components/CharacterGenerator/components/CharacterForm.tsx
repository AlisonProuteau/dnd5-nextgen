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
import { useState } from 'react';
import { buildPrompt, generateImage } from '../utils/buildPrompt';
import type { CharacterDetails } from '../utils/character';

const races = [
  'Human',
  'Elf',
  'Dwarf',
  'Halfling',
  'Gnome',
  'Dragonborn',
  'Tiefling',
  'Half-Orc',
  'Half-Elf'
];
const genders = ['gender-neutral', 'Male', 'Female', 'Non-binary'];
const classes = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard'
];
const ethnicities = [
  '',
  'Caucasian',
  'East Asian',
  'South Asian',
  'African',
  'Hispanic',
  'Middle Eastern',
  'Native American'
];
const imageTypes = ['', 'portrait', 'full body'];
const imageRatios = ['1:1', '9:16', '16:9'];

export default function CharacterForm({
  setLoading,
  setPrompt,
  setCharacter
}: {
  setLoading: (loading: boolean) => void;
  setPrompt: (prompt: string) => void;
  setCharacter: (character: CharacterDetails | null) => void;
}) {
  const [form, setForm] = useState<CharacterDetails>({
    race: 'Human',
    gender: 'gender-neutral',
    class: 'Barbarian',
    ethnicity: '',
    imageType: '',
    imageRatio: '1:1',
    refinement: ''
  });

  const handleChange = (field: keyof CharacterDetails) => (e: any) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleGenerate = async () => {
    setCharacter(null);
    try {
      setLoading(true);

      const prompt = buildPrompt(form);
      setPrompt(prompt);

      const url = await generateImage(form, prompt);
      if (url) setCharacter({ ...form, url });
    } catch (err: any) {
      console.error('Generation failed:', err);
      alert(`Image generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
        Character Settings
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {[
          ['race', races],
          ['gender', genders],
          ['class', classes],
          ['ethnicity', ethnicities],
          ['imageType', imageTypes],
          ['imageRatio', imageRatios]
        ].map(([field, options]) => (
          <Grid item xs={12} sm={6} md={4} key={field as string}>
            <FormControl fullWidth>
              <InputLabel>{field}</InputLabel>
              <Select
                value={(form as any)[field as string]}
                label={field}
                onChange={handleChange(field as keyof CharacterDetails)}
              >
                {(options as string[]).map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt || 'None'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}
        <Grid item xs={12}>
          <TextField
            label="Refinement"
            fullWidth
            multiline
            minRows={2}
            value={form.refinement}
            onChange={(e) => setForm({ ...form, refinement: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" sx={{ borderRadius: 2, boxShadow: 2 }} onClick={handleGenerate} fullWidth size="large">
            Generate Portrait
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
