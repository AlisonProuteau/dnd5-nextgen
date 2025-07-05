import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Checkbox,
  FormControlLabel,
  Typography
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import {
  classes as allClasses,
  genders as allGenders,
  races as allRaces,
  buildPrompt,
  classColors,
  generateImage
} from '../utils/buildPrompt';
import { CharacterDetails } from '../utils/character';

type BatchEntry = {
  character: CharacterDetails;
  status: 'pending' | 'generating' | 'done' | 'failed';
  url?: string;
};

export default function BatchOptions({
  character,
  isLoading
}: {
  character: CharacterDetails;
  isLoading?: boolean;
}) {
  const [genderFilter, setGenderFilter] = useState(false);
  const [classFilter, setClassFilter] = useState(false);
  const [raceFilter, setRaceFilter] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [queue, setQueue] = useState<BatchEntry[]>([]);

  const queueRef = useRef<BatchEntry[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      setIsRunning(false);
      cancelledRef.current = false;
      setQueue([]);
      queueRef.current = [];
    }
  }, [isLoading]);

  const buildQueue = () => {
    const genders = genderFilter ? [character.gender] : allGenders;
    const races = raceFilter ? [character.race] : allRaces;
    const classes = classFilter ? [character.class] : allClasses;

    const entries: BatchEntry[] = [];
    for (const gender of genders) {
      for (const race of races) {
        const allowEthnicity = !['Dragonborn', 'Tiefling', 'Half-Orc'].includes(race);
        for (const cls of classes) {
          entries.push({
            character: {
              ...character,
              gender,
              race,
              class: cls,
              ethnicity: allowEthnicity ? character.ethnicity : ''
            },
            status:
              cls === character.class && race === character.race && gender === character.gender
                ? 'done'
                : 'pending',
            url:
              cls === character.class && race === character.race && gender === character.gender
                ? character.url
                : undefined
          });
        }
      }
    }

    setQueue(() => {
      queueRef.current = entries;
      return entries;
    });
  };

  useEffect(() => {
    if (queue.length > 0 && !isRunning && !cancelledRef.current) runBatch(0);
  }, [queue.length, isRunning, cancelledRef.current]);

  const runBatch = async (startIndex = 0) => {
    setIsRunning(true);
    cancelledRef.current = false;

    const next = async (i: number) => {
      if (cancelledRef.current || i >= queue.length) {
        setIsRunning(false);
        return;
      }
      if (queueRef.current[i].status === 'done') return next(i + 1);

      setQueue((prev) => {
        const updated = [...prev];
        updated[i].status = 'generating';
        queueRef.current = updated;
        return updated;
      });

      const prompt = buildPrompt(queueRef.current[i].character);
      const url = await generateImage(queueRef.current[i].character, prompt);

      setQueue((prev) => {
        const updated = [...prev];
        updated[i] = {
          ...updated[i],
          status: url ? 'done' : 'failed',
          url: url || undefined
        };
        queueRef.current = updated;
        return updated;
      });

      next(i + 1);
    };

    next(startIndex);
  };

  const cancelBatch = () => {
    cancelledRef.current = true;
    setIsRunning(false);
  };

  const resumeBatch = () => {
    const firstUnfinished = queue.findIndex((entry) => entry.status !== 'done');
    if (firstUnfinished !== -1) runBatch(firstUnfinished);
  };

  return !isLoading ? (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>
        Batch Generation Options
      </Typography>
      <FormControlLabel
        control={
          <Checkbox checked={genderFilter} onChange={() => setGenderFilter(!genderFilter)} />
        }
        label={`Only ${character.gender}`}
      />
      <FormControlLabel
        control={<Checkbox checked={classFilter} onChange={() => setClassFilter(!classFilter)} />}
        label={`Only ${character.class}`}
      />
      <FormControlLabel
        control={<Checkbox checked={raceFilter} onChange={() => setRaceFilter(!raceFilter)} />}
        label={`Only ${character.race}`}
      />

      <Box mt={2}>
        <Button variant="contained" sx={{ ml: 2 }} onClick={buildQueue} disabled={isRunning}>
          Start
        </Button>
        {isRunning ? (
          <Button variant="outlined" sx={{ ml: 2 }} onClick={cancelBatch} disabled={!isRunning}>
            Cancel
          </Button>
        ) : (
          <Button
            variant="outlined"
            sx={{ ml: 2 }}
            onClick={resumeBatch}
            disabled={isRunning || queue.every((q) => q.status === 'done')}
          >
            Resume
          </Button>
        )}
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2} mt={3}>
        {queue.map(({ character: currentCharacter, status, url }) => (
          <Card
            key={`${currentCharacter.class}-${currentCharacter.race}-${currentCharacter.gender}`}
            sx={{
              width: 180,
              p: 1,
              borderRadius: 2,
              boxShadow: 2,
              borderLeft: `6px solid ${classColors[currentCharacter.class] || '#ccc'}`
            }}
          >
            <CardContent>
              <Typography
                variant="caption"
                fontWeight={700}
                style={{ color: classColors[currentCharacter.class] || '#666' }}
              >
                {currentCharacter.gender} {currentCharacter.race} {currentCharacter.class}
              </Typography>
              {status === 'pending' && <Typography variant="body2">Pending...</Typography>}
              {status === 'generating' && <Typography variant="body2">Generating...</Typography>}
              {status === 'failed' && <Typography color="error">Failed</Typography>}
              {status === 'done' && url && (
                <CardMedia component="img" src={url} sx={{ borderRadius: 1, mt: 1 }} />
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  ) : null;
}
