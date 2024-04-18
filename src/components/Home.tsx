import { AddRounded } from '@mui/icons-material';
import { Box, CircularProgress, Container, IconButton } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { useAuth } from '../providers/AuthProvider';
import { CharacterCard } from './CharacterCard/CharacterCard';
import { type CharacterFormData } from './CharacterCreation/CharacterCreation';

export function Home() {
  const navigate = useNavigate();
  const user = useAuth();
  const [characters, setCharacters] = useState<CharacterFormData[]>();

  useEffect(() => {
    if (user) {
      const ref = collection(database, `users/${user.uid}/characters`);
      getDocs(ref).then(({ docs }) => {
        if (docs) {
          setCharacters(docs.map((d) => d.data()) as CharacterFormData[]);
        } else {
          navigate('/create');
        }
      });
    }
  }, [user?.uid]);

  return (
    user && (
      <Container>
        {characters?.length ? (
          <Box display="flex" flexDirection="column" gap="15px">
            {characters.map((character) => (
              <CharacterCard key={character.name} character={character} />
            ))}
            <IconButton
              sx={{ border: 'solid 2px', inlineSize: 'fit-content', alignSelf: 'center' }}
              onClick={() => navigate('/create')}
            >
              <AddRounded />
            </IconButton>
          </Box>
        ) : (
          <CircularProgress size={24} />
        )}
      </Container>
    )
  );
}
