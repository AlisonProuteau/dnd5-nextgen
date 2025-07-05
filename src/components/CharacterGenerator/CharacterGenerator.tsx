import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import BatchOptions from './components/BatchOptions';
import CharacterForm from './components/CharacterForm';
import PortraitDisplay from './components/PortraitDisplay';
import PromptDisplay from './components/PromptDisplay';
import { CharacterDetails } from './utils/character';

// TODO: Loading is not displayed correctly when generating a new character image
// TODO: Upload fails for single image generation
// TODO: Icons not showing up correctly in the batch options
// TODO: Batch cards need to be in dark mode
// TODO: Missing generation state for batch generation
// TODO: Improve UX and UI
export default function CharacterGenerator() {
  const [character, setCharacter] = useState<CharacterDetails | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setLoading] = useState<boolean>(false);

  return (
    <Container maxWidth="md">
      <Box textAlign="center" py={4} sx={{ px: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
          D&D Character Portrait Generator
        </Typography>
        <CharacterForm setPrompt={setPrompt} setLoading={setLoading} setCharacter={setCharacter} />
        {character && (
          <PortraitDisplay character={character} isLoading={isLoading} prompt={prompt} />
        )}
        {prompt && <PromptDisplay prompt={prompt} />}
        {character && <BatchOptions character={character} isLoading={isLoading} />}
      </Box>
    </Container>
  );
}
