import { Box } from '@mui/material';
import type { CharacterFormData } from '../CharacterCreation/CharacterCreation';

export function ClassData({ characters }: { characters: CharacterFormData[] }) {
  return characters.map((c) => (
    <Box key={c.name} sx={{ marginBottom: 10 }}>
      {JSON.stringify(c)}
    </Box>
  ));
}
