import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCharacter } from '../../api/users';
import { useAuth } from '../../providers/AuthProvider';
import type { DefaultRepresentation } from '../../representations/common.representation';
import type { CharacterFormData } from '../CharacterCreation/CharacterCreation';

export type Character = CharacterFormData & {
  id: string;
  hit_die: number;
  saving_throws?: DefaultRepresentation[];
  armorClass: number;
  abilityScores: Record<
    string,
    {
      index: string;
      name: string;
      full_name: string;
      score: number;
      modifier: number;
    }
  >;
};

export function CharacterCard() {
  const { id } = useParams();
  const user = useAuth();
  const navigate = useNavigate();

  const { data: character, isFetching: isCharacterLoading } = useQuery<Character | undefined>({
    queryKey: ['fetchCharacter', user?.uid, id],
    queryFn: async () => {
      if (user?.uid && id) return await getCharacter(user.uid, id);
    },
    enabled: !!user?.uid && !!id
  });

  useEffect(() => {
    if (!isCharacterLoading && !character?.abilityScores) navigate('points', { relative: 'path' });
  }, [isCharacterLoading]);

  return (
    <Container>
      {character?.id ? (
        <Card key={character.id} sx={{ minWidth: 275 }}>
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
