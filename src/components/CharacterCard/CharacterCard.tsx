import { CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { getCharacter } from '../../api/users';
import { useAuth } from '../../providers/AuthProvider';
import type { CharacterFormData } from '../CharacterCreation/CharacterCreation';

export function CharacterCard() {
  const user = useAuth();
  const { id } = useParams();
  // const navigate = useNavigate();

  const { data: character } = useQuery<CharacterFormData | undefined>(
    ['fetchCharacter', user?.uid, id],
    async () => {
      if (user?.uid && id) return await getCharacter(user.uid, id);
    },
    { enabled: !!user?.uid && !!id }
  );

  return character?.name ? <div>Hello {id}</div> : <CircularProgress size={24} />;
}
