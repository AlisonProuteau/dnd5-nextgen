import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AddRounded } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  Fab,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getUserCharacters } from '@api/users';
import { Loader } from '@shared/Loader';
import { button, fab, linkButton } from '@utils/ui';
import { useAuth } from '../providers/AuthProvider';

const RaceImages: Record<string, string> = {
  dragonborn: 'https://www.dndbeyond.com/attachments/9/41/chromatic-dragonborn.jpg',
  dwarf:
    'https://img.stablecog.com/insecure/1920w/aHR0cHM6Ly9iLnN0YWJsZWNvZy5jb20vZDU3YmJiYjYtODUyMi00MmY0LTg2ZjctYjI2OWMxODQ2ODlhLmpwZWc.webp',
  elf: 'https://images.nightcafe.studio/jobs/jj2keiBDTywHJDb9zp1I/jj2keiBDTywHJDb9zp1I--1--zwyke.jpg?tr=w-1600,c-at_max',
  gnome:
    'https://2.bp.blogspot.com/-uk3zoIXqpyI/WwLSPfb-EwI/AAAAAAAABT4/v1tIfXs8W4UzUUB71ANZGcN-Sfflnv63wCLcBGAs/s1600/Halfling.png',
  'half-elf':
    'https://images.nightcafe.studio/jobs/RDuvk28nHqHVvlpO3jFA/RDuvk28nHqHVvlpO3jFA--1--mth6c.jpg?tr=w-1600,c-at_max',
  'half-orc':
    'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/7facde28-ad26-431a-8868-f1ab10ef1c6e/dh1s7vm-a5cda15c-4633-4fea-b597-b0fa8bf02f35.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzdmYWNkZTI4LWFkMjYtNDMxYS04ODY4LWYxYWIxMGVmMWM2ZVwvZGgxczd2bS1hNWNkYTE1Yy00NjMzLTRmZWEtYjU5Ny1iMGZhOGJmMDJmMzUuanBnIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.1nkf8XcaYZBU3UNdnF8a97goGPIxBdypxQa7RU30gmc',
  halfling:
    'https://preview.redd.it/14x-halfling-portraits-v0-srbb4lemiqab1.png?width=640&crop=smart&auto=webp&s=1f026d2252c01fda7e526c2b80cf5ac79276979e',
  human: 'https://r2.starryai.com/results/1018523396/2da63fea-5b71-4956-805c-b90996f7671e.webp',
  tiefling: 'https://www.siemens-mobile.com/wp-content/uploads/2023/11/image-12-1024x574.png'
};

export function Home() {
  const navigate = useNavigate();
  const { user, version } = useAuth();

  const { data: characters, isLoading } = useQuery({
    queryKey: ['fetchCharacters', user?.uid, version],
    queryFn: async () => (user && version ? await getUserCharacters(user.uid, version) : null),
    enabled: !!(user?.uid && version)
  });

  useEffect(() => {
    if (user && !isLoading && !characters?.length) navigate('/create');
  }, [isLoading]);

  return (
    <Container>
      <Box
        display="grid"
        data-testid="character-grid"
        sx={{
          gridGap: '24px',
          gridTemplateColumns: `repeat(auto-fit, minmax(275px, 1fr))`
        }}
      >
        {characters
          ?.filter((c) => !!c.class && !!c.race)
          .map((character) => (
            <Box key={character.id} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card
                sx={{ flex: 1, maxWidth: '500px' }}
                data-testid={`character-card-${character.id}`}
              >
                <CardActionArea
                  onClick={() => navigate(`/character`, { state: { characterId: character.id } })}
                >
                  <CardMedia
                    alt="Character"
                    component="img"
                    height="250"
                    src={RaceImages[character.race.index]}
                    sx={{ objectPosition: 'top' }}
                  />
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
            </Box>
          ))}

        <Fab size="small" sx={{ ...button, ...fab }} data-testid="create-character-fab">
          <Link to="/create" css={linkButton}>
            <AddRounded />
          </Link>
        </Fab>
      </Box>

      <Loader open={!characters?.length} />
    </Container>
  );
}
