import { AddRounded } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Fab,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserCharacters } from '../api/users';
import { useAuth } from '../providers/AuthProvider';
import { type CharacterFormData } from './CharacterCreation/CharacterCreation';

export function Home() {
  const navigate = useNavigate();
  const user = useAuth();
  const [characters, setCharacters] = useState<CharacterFormData[]>();

  useEffect(() => {
    if (user) {
      getUserCharacters(user.uid).then((characters) => {
        if (characters?.length) setCharacters(characters);
        else navigate('/create');
      });
    }
  }, [user?.uid]);

  return user && characters?.length ? (
    <Container>
      <Box display="flex" flexDirection="column" gap="15px">
        {characters.map((character) => (
          <Card
            key={character.name}
            sx={{ minWidth: 275 }}
            onClick={() => navigate(`/character/${character.name}`)}
          >
            <CardActionArea>
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
            </CardActionArea>
          </Card>
        ))}
        <Fab
          size="small"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16
          }}
          onClick={() => navigate('/create')}
        >
          <AddRounded />
        </Fab>
      </Box>
    </Container>
  ) : (
    <CircularProgress size={24} />
  );
}
