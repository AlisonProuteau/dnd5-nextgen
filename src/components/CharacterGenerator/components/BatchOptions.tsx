import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { type ActionState, downloadImage, uploadImage } from '@utils/ui';
import type { CharacterDetails } from '../utils/character';
import {
  classes as allClasses,
  genders as allGenders,
  races as allRaces,
  buildPrompt,
  generateImage
} from '../utils/imageUtils';
import ActionButton from './ActionButton';
import CharacterCard from './CharacterCard';

type BatchEntry = {
  character: CharacterDetails;
  status: 'pending' | 'generating' | 'done' | 'failed';
  url?: string;
  downloadState?: ActionState;
  uploadState?: ActionState;
};

export default function BatchOptions({
  character,
  isLoading
}: {
  character: CharacterDetails;
  isLoading?: boolean;
}) {
  const [filters, setFilters] = useState({ gender: false, class: false, race: false });
  const [isRunning, setIsRunning] = useState(false);
  const [queue, setQueue] = useState<BatchEntry[]>([]);
  const [bulkDownloadState, setBulkDownloadState] = useState<ActionState>('idle');
  const [bulkUploadState, setBulkUploadState] = useState<ActionState>('idle');

  const cancelledRef = useRef(false);
  const queueRef = useRef<BatchEntry[]>([]);

  const clear = () => {
    setIsRunning(false);
    cancelledRef.current = false;
    setQueue([]);
    queueRef.current = [];
    setBulkDownloadState('idle');
    setBulkUploadState('idle');
  };

  useEffect(() => {
    if (isLoading) clear();
  }, [isLoading]);

  const updateQueueItem = useCallback((index: number, updates: Partial<BatchEntry>) => {
    setQueue((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      queueRef.current = updated;
      return updated;
    });
  }, []);

  const runBatch = useCallback(
    async (startIndex = 0, entries?: BatchEntry[]) => {
      const queueToUse = entries || queueRef.current; // Use provided entries or ref
      setIsRunning(true);
      cancelledRef.current = false;

      for (let i = startIndex; i < queueToUse.length; i++) {
        if (cancelledRef.current) break;
        if (queueToUse[i].status === 'done') continue;

        updateQueueItem(i, { status: 'generating' });

        try {
          const prompt = buildPrompt(queueToUse[i].character);
          const url = await generateImage(queueToUse[i].character, prompt);

          updateQueueItem(i, {
            status: url ? 'done' : 'failed',
            url: url || undefined
          });
        } catch {
          updateQueueItem(i, { status: 'failed' });
        }
      }

      setIsRunning(false);
    },
    [updateQueueItem]
  );

  const buildQueueAndStart = useCallback(() => {
    if (isRunning) return;
    clear();

    const genders = filters.gender ? [character.gender] : allGenders;
    const races = filters.race ? [character.race] : allRaces;
    const classes = filters.class ? [character.class] : allClasses;

    const entries: BatchEntry[] = [];

    for (const gender of genders) {
      for (const race of races) {
        for (const cls of classes) {
          const isCurrentCharacter =
            cls === character.class && race === character.race && gender === character.gender;

          entries.push({
            character: {
              ...character,
              gender,
              race,
              class: cls,
              ethnicity: ['Dragonborn', 'Tiefling', 'Half-Orc'].includes(race)
                ? ''
                : character.ethnicity
            },
            status: isCurrentCharacter ? 'done' : 'pending',
            url: isCurrentCharacter ? character.url : undefined
          });
        }
      }
    }

    queueRef.current = entries;
    setQueue(entries);
    runBatch(0, entries);
  }, [character, filters, runBatch]);

  const resumeBatch = useCallback(() => {
    const nextIndex = queue.findIndex(
      (item) => item.status === 'pending' || item.status === 'failed'
    );
    if (nextIndex !== -1) {
      runBatch(nextIndex);
    }
  }, [queue, runBatch]);

  const performBulkAction = useCallback(
    async (action: 'download' | 'upload') => {
      const setState = action === 'download' ? setBulkDownloadState : setBulkUploadState;
      const stateKey = action === 'download' ? 'downloadState' : 'uploadState';

      const items = queueRef.current
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.status === 'done' && item.url && item[stateKey] !== 'done');

      if (items.length === 0) return;

      setState(action === 'download' ? 'downloading' : 'uploading');

      for (const { item, index } of items) {
        if (!item.url) continue;

        updateQueueItem(index, { [stateKey]: action === 'download' ? 'downloading' : 'uploading' });

        const success =
          action === 'download'
            ? await downloadImage(item.url, item.character)
            : await uploadImage(item.url, item.character);
        updateQueueItem(index, { [stateKey]: success ? 'done' : 'failed' });

        if (!success) {
          setState('failed');
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setState('done');
    },
    [updateQueueItem]
  );

  const stats = {
    completed: queue.filter((item) => item.status === 'done' && item.url),
    downloadable: queue.filter(
      (item) => item.status === 'done' && item.url && item.downloadState !== 'done'
    ),
    uploadable: queue.filter(
      (item) => item.status === 'done' && item.url && item.uploadState !== 'done'
    ),
    hasIncomplete: queue.some((item) => item.status === 'pending' || item.status === 'failed')
  };

  const handleDownload = useCallback(
    async (index: number) => {
      const item = queueRef.current[index];
      if (!item?.url) return;

      updateQueueItem(index, { downloadState: 'downloading' });
      const success = await downloadImage(item.url, item.character);
      updateQueueItem(index, { downloadState: success ? 'done' : 'failed' });
    },
    [updateQueueItem]
  );

  const handleUpload = useCallback(
    async (index: number) => {
      const item = queueRef.current[index];
      if (!item?.url) return;

      updateQueueItem(index, { uploadState: 'uploading' });
      const success = await uploadImage(item.url, item.character);
      updateQueueItem(index, { uploadState: success ? 'done' : 'failed' });
    },
    [updateQueueItem]
  );

  if (isLoading) return null;

  return (
    <Box
      mt={4}
      sx={{ px: 2 }}
      display="flex"
      flexDirection="column"
      alignItems="center"
      data-testid="batch-options"
    >
      <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
        Batch Generation Options
      </Typography>

      {/* Filters */}
      <Box display="flex" gap={2} flexWrap="wrap">
        {Object.entries({
          gender: character.gender,
          class: character.class,
          race: character.race
        }).map(([key, value]) => (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={filters[key as keyof typeof filters]}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    [key]: !prev[key as keyof typeof filters]
                  }))
                }
              />
            }
            label={`Only ${value}`}
          />
        ))}
      </Box>

      {/* Action Buttons */}
      <Box mt={2} display="flex" gap={1} flexWrap="wrap">
        {queue.length === 0 ? (
          <Button variant="contained" onClick={buildQueueAndStart} disabled={isRunning}>
            Start Batch
          </Button>
        ) : (
          <Button variant="contained" onClick={clear} disabled={isRunning}>
            Clear Batch
          </Button>
        )}

        {isRunning ? (
          <Button
            variant="outlined"
            onClick={() => {
              cancelledRef.current = true;
              setIsRunning(false);
            }}
          >
            Cancel
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={resumeBatch}
            disabled={!stats.hasIncomplete || queue.length === 0}
          >
            Resume
          </Button>
        )}

        <ActionButton
          bulk
          actionType="download"
          state={bulkDownloadState}
          onClick={() => performBulkAction('download')}
          count={stats.downloadable.length}
          disabled={stats.downloadable.length === 0 || isRunning}
        />

        <ActionButton
          bulk
          actionType="upload"
          state={bulkUploadState}
          onClick={() => performBulkAction('upload')}
          count={stats.uploadable.length}
          disabled={stats.uploadable.length === 0 || isRunning}
        />
      </Box>

      {/* Queue Display */}
      <Box display="flex" flexWrap="wrap" gap={2} mt={3} justifyContent="space-evenly">
        {queue.map((item, idx) => (
          <CharacterCard
            key={`${item.character.class}-${item.character.race}-${item.character.gender}`}
            character={item.character}
            status={item.status}
            url={item.url}
            downloadState={item.downloadState}
            uploadState={item.uploadState}
            onDownload={() => handleDownload(idx)}
            onUpload={() => handleUpload(idx)}
          />
        ))}
      </Box>
    </Box>
  );
}
