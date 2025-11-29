/** Component parially Vibe coded using Gemini and ChatGPT */
import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import BatchOptions from './components/BatchOptions';
import CharacterForm from './components/CharacterForm';
import PortraitDisplay from './components/PortraitDisplay';
import PromptDisplay from './components/PromptDisplay';
import type { CharacterDetails } from './utils/character';

export default function CharacterGenerator() {
  const [character, setCharacter] = useState<CharacterDetails | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <Container maxWidth="md">
      <Box textAlign="center" py={4} sx={{ px: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
          D&D Character Portrait Generator
        </Typography>
        <CharacterForm
          setPrompt={setPrompt}
          setIsLoading={setIsLoading}
          setCharacter={setCharacter}
        />
        <PortraitDisplay character={character} isLoading={isLoading} />
        {prompt && <PromptDisplay prompt={prompt} />}
        {character && <BatchOptions character={character} isLoading={isLoading} />}
      </Box>
    </Container>
  );
}
