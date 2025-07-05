import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import BatchOptions from './components/BatchOptions';
import CharacterForm from './components/CharacterForm';
import PortraitDisplay from './components/PortraitDisplay';
import PromptDisplay from './components/PromptDisplay';
import { CharacterDetails } from './utils/character';

// TODO: Add the ability to save the images locally and to firestore both one by one and full batch
// TODO: Improve UX and UI
export default function CharacterGenerator() {
  const [character, setCharacter] = useState<CharacterDetails | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setLoading] = useState<boolean>(false);

  return (
    <Container maxWidth="md">
      <Box textAlign="center" py={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          D&D Character Portrait Generator
        </Typography>
        <CharacterForm setPrompt={setPrompt} setLoading={setLoading} setCharacter={setCharacter} />
        <PortraitDisplay imageUrl={character?.url || ''} isLoading={isLoading} />
        {prompt && <PromptDisplay prompt={prompt} />}
        {character && <BatchOptions character={character} isLoading={isLoading} />}
      </Box>
    </Container>
  );
}
