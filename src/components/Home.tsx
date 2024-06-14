import { AddRounded } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Fab,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserCharacters } from '../api/users';
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
    'https://neural.love/cdn/thumbnails/1ee9033b-8368-6cda-9037-ed2935f6a1cf/f081de57-b8ae-526b-9eaa-1dc5d199eec7.webp?Expires=1717199999&Signature=mFjxhpcM-goUQ9dp26u6OxNPaSxS4aon6tYPZ0Dljt2-kc8ZxUbwFzH-k10wxvxqVMFUCCMhjmaAODL2gbPWrD4~OU~kIyLTbt0iVb50uBgfUo4NRqPjC4hWXe8RfG3GBJGHEaOn1Xd21RBlvt796KWn8Pjo0VRpLIFIiPaPsnBSU9CrleG-KGneTfn4hhE1CekISDuQ2Z7QH9ASmaCA2R84YZqxQ51YNdaqEJDcaFJ~QzXfm-T3zXMz9p~-7U5bkSyfupcNDbCSasv-lLfu9x7duQPHVDdO3A1c3kkcSTGV16sqcCWRr3ZZuPPf9ja-~aiMteJmrIW4M4UsOVS49A__&Key-Pair-Id=K2RFTOXRBNSROX',
  halfling:
    'https://preview.redd.it/14x-halfling-portraits-v0-srbb4lemiqab1.png?width=640&crop=smart&auto=webp&s=1f026d2252c01fda7e526c2b80cf5ac79276979e',
  human: 'https://r2.starryai.com/results/1018523396/2da63fea-5b71-4956-805c-b90996f7671e.webp',
  tiefling: 'https://www.siemens-mobile.com/wp-content/uploads/2023/11/image-12-1024x574.png'
};

export function Home() {
  const navigate = useNavigate();
  const user = useAuth();

  const { data: characters, isLoading } = useQuery({
    queryKey: ['fetchCharacters', user?.uid],
    queryFn: () => (user ? getUserCharacters(user.uid) : null)
  });

  useEffect(() => {
    if (user && !isLoading && !characters?.length) navigate('/create');
  }, [isLoading]);

  return characters?.length ? (
    <Container>
      <Box
        display="grid"
        sx={{
          gridGap: '50px',
          gridTemplateColumns: `repeat(auto-fit, minmax(275px, 1fr))`
        }}
      >
        {characters.map((character) => (
          <Box key={character.id} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card sx={{ flex: 1, maxWidth: '500px' }}>
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

        <Fab
          size="small"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16
          }}
        >
          <Link
            to="/create"
            css={{
              ':visited:focus:hover:active': { color: 'inherit' },
              display: 'flex',
              flex: 1,
              justifyContent: 'space-evenly',
              alignSelf: 'stretch',
              alignItems: 'center'
            }}
          >
            <AddRounded />
          </Link>
        </Fab>
      </Box>
    </Container>
  ) : (
    <CircularProgress size={24} />
  );
}
