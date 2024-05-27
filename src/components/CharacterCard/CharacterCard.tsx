import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Typography
} from '@mui/material';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getCharacter } from '../../api/users';
import { useAuth } from '../../providers/AuthProvider';
import type { CharacterFormData } from '../CharacterCreation/CharacterCreation';

export function CharacterCard() {
  const { id } = useParams();
  const user = useAuth();
  const navigate = useNavigate();

  const { data: character, isLoading: isCharacterLoading } = useQuery<
    (CharacterFormData & { hitPoints?: number }) | undefined
  >(
    ['fetchCharacter', user?.uid, id],
    async () => {
      if (user?.uid && id) return await getCharacter(user.uid, id);
    },
    { enabled: !!user?.uid && !!id }
  );

  useEffect(() => {
    if (!isCharacterLoading && !character?.hitPoints) navigate('points', { relative: 'path' });
  }, [isCharacterLoading]);

  return (
    <Container>
      {character?.name ? (
        <Card key={character.name} sx={{ minWidth: 275 }}>
          <CardHeader
            title={
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                  <Typography variant="subtitle1" color="text.secondary">
                    {character.class.name}
                    {character.subclass && ` - ${character.subclass.name}`}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {character.race.name}
                    {character.subrace && ` - ${character.subrace.name}`}
                  </Typography>
                </Box>
                <Typography variant="h5">{character.name}</Typography>
              </Box>
            }
          />
          <CardContent>Things</CardContent>
        </Card>
      ) : (
        <CircularProgress size={24} />
      )}
    </Container>
  );
}
