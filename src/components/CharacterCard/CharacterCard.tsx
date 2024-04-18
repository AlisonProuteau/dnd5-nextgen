import { Card, CardContent, Typography } from '@mui/material';
import type { CharacterFormData } from '../CharacterCreation/CharacterCreation';

export function CharacterCard({ character }: { character: CharacterFormData }) {
  // const navigate = useNavigate();

  return (
    <Card sx={{ minWidth: 275 }} onClick={() => console.log('go')}>
      <CardContent>
        <Typography variant="h5" component="div">
          {character.name}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          {character.race.name}
          {character.subrace && ` - ${character.subrace.name}`}
        </Typography>
        <Typography variant="body2">
          {character.class.name}
          {character.subclass && ` - ${character.subclass.name}`}
        </Typography>
      </CardContent>
    </Card>
  );
}
