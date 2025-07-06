import {
  CloudDone,
  CloudOff,
  CloudUpload,
  DownloadDone,
  Downloading,
  FileDownloadOff
} from '@mui/icons-material';
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
import { getDownloadURL } from 'firebase/storage';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  classes as allClasses,
  genders as allGenders,
  races as allRaces,
  buildPrompt,
  classColors,
  generateImage
} from '../utils/buildPrompt';
import { CharacterDetails } from '../utils/character';
import { saveUploadMetadata, startFirebaseUpload } from '../utils/firebase';

type BatchEntry = {
  character: CharacterDetails;
  status: 'pending' | 'generating' | 'done' | 'failed';
  url?: string;
  downloadState?: 'downloading' | 'done' | 'failed';
  uploadState?: 'uploading' | 'done' | 'failed';
};

export default function BatchOptions({
  character,
  isLoading
}: {
  character: CharacterDetails;
  isLoading?: boolean;
}) {
  const [filters, setFilters] = useState({
    gender: false,
    class: false,
    race: false
  });
  const [isRunning, setIsRunning] = useState(false);
  const [queue, setQueue] = useState<BatchEntry[]>([]);

  const queueRef = useRef<BatchEntry[]>([]);
  const cancelledRef = useRef(false);

  const clearStates = () => {
    setIsRunning(false);
    cancelledRef.current = false;
    setQueue([]);
    queueRef.current = [];
  };

  useEffect(() => {
    if (isLoading) clearStates();
  }, [isLoading]);

  useEffect(() => {
    if (queue.length > 0 && !isRunning && !cancelledRef.current) {
      runBatch(0);
    }
  }, [queue.length, isRunning, cancelledRef.current]);

  const updateQueueItem = useCallback((index: number, updates: Partial<BatchEntry>) => {
    setQueue((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      queueRef.current = updated;
      return updated;
    });
  }, []);

  const buildQueue = useCallback(() => {
    const genders = filters.gender ? [character.gender] : allGenders;
    const races = filters.race ? [character.race] : allRaces;
    const classes = filters.class ? [character.class] : allClasses;

    const entries: BatchEntry[] = [];
    clearStates();

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

    setQueue(entries);
    queueRef.current = entries;
  }, [character, filters]);

  const runBatch = useCallback(
    async (startIndex = 0) => {
      setIsRunning(true);
      cancelledRef.current = false;

      for (let i = startIndex; i < queue.length; i++) {
        if (cancelledRef.current) break;
        if (queueRef.current[i].status === 'done') continue;

        updateQueueItem(i, { status: 'generating' });

        try {
          const prompt = buildPrompt(queueRef.current[i].character);
          const url = await generateImage(queueRef.current[i].character, prompt);

          updateQueueItem(i, {
            status: url ? 'done' : 'failed',
            url: url || undefined
          });
        } catch (error) {
          updateQueueItem(i, { status: 'failed' });
        }
      }

      setIsRunning(false);
    },
    [queue.length, updateQueueItem]
  );

  const downloadItem = async (index: number, item: BatchEntry) => {
    if (!item.url) {
      updateQueueItem(index, { downloadState: 'failed' });
      return;
    }

    try {
      updateQueueItem(index, { downloadState: 'downloading' });

      const link = document.createElement('a');
      link.href = item.url;
      link.download = `${item.character.race}_${item.character.class}_${item.character.gender}.png`;
      link.click();

      setTimeout(() => {
        updateQueueItem(index, { downloadState: 'done' });
      }, 500);
    } catch {
      updateQueueItem(index, { downloadState: 'failed' });
    }
  };

  const uploadItem = async (index: number, item: BatchEntry) => {
    if (!item.url) return;

    updateQueueItem(index, { uploadState: 'uploading' });

    try {
      const { uploadTask } = startFirebaseUpload(item.url, item.character);
      await uploadTask;

      const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
      await saveUploadMetadata(downloadUrl, item.character);

      updateQueueItem(index, { uploadState: 'done' });
    } catch (error) {
      console.error('Upload failed:', error);
      updateQueueItem(index, { uploadState: 'failed' });
    }
  };

  const performBulkAction = useCallback(
    async (
      filterFn: (item: BatchEntry) => boolean,
      actionFn: (index: number, item: BatchEntry) => Promise<void>
    ) => {
      const items = queue.map((item, idx) => ({ ...item, idx })).filter(filterFn);

      for (const item of items) {
        await actionFn(item.idx, item);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    },
    [queue]
  );

  const downloadAll = () => {
    return performBulkAction(
      (item) => !!(item.status === 'done' && item.url && item.downloadState !== 'done'),
      downloadItem
    );
  };

  const uploadAll = () => {
    return performBulkAction(
      (item) => !!(item.status === 'done' && item.url && item.uploadState !== 'done'),
      uploadItem
    );
  };

  // Computed values
  const stats = {
    generationCompleted: queue.filter((item) => item.status === 'done' && item.url),
    downloadable: queue.filter(
      (item) => item.status === 'done' && item.url && item.downloadState !== 'done'
    ),
    uploadable: queue.filter(
      (item) => item.status === 'done' && item.url && item.uploadState !== 'done'
    ),
    isDownloading: queue.some((item) => item.downloadState === 'downloading'),
    isUploading: queue.some((item) => item.uploadState === 'uploading'),
    isDownloaded: queue
      .filter((item) => item.status === 'done' && item.url)
      .every((item) => item.downloadState === 'done' || item.downloadState === 'failed'),
    isUploaded: queue
      .filter((item) => item.status === 'done' && item.url)
      .every((item) => item.uploadState === 'done' || item.uploadState === 'failed'),
    isDownloadFailed: queue
      .filter((item) => item.status === 'done' && item.url)
      .every((item) => item.downloadState === 'failed'),
    isUploadFailed: queue
      .filter((item) => item.status === 'done' && item.url)
      .every((item) => item.uploadState === 'failed'),
    inProgress: queue.some(
      (item) => item.status === 'generating' || (item.status === 'pending' && !cancelledRef.current)
    )
  };

  const ActionButton = ({
    type,
    onClick,
    status,
    disabled,
    count
  }: {
    type: 'download' | 'upload' | 'downloadAll' | 'uploadAll';
    onClick: () => void;
    status?: 'downloading' | 'uploading' | 'done' | 'failed';
    disabled?: boolean;
    count?: number;
  }) => {
    console.log('ActionButton', { type, status, disabled, count });
    const endIcon = () => {
      switch (status) {
        case 'downloading':
          return <Downloading />;
        case 'uploading':
          return <CloudUpload />;
        case 'done':
          return type.includes('download') ? (
            <DownloadDone color="success" />
          ) : (
            <CloudDone color="success" />
          );
        case 'failed':
          return type.includes('download') ? (
            <FileDownloadOff color="error" />
          ) : (
            <CloudOff color="error" />
          );
        default:
          return null;
      }
    };

    return (
      <Button
        variant="outlined"
        color={type.includes('download') ? 'primary' : 'secondary'}
        onClick={onClick}
        disabled={
          disabled ||
          status === 'uploading' ||
          status === 'downloading' ||
          (type.includes('All') && stats.inProgress)
        }
        endIcon={endIcon()}
      >
        {`${type.includes('download') ? 'Download' : 'Upload'}${
          type.includes('All') ? ' All ' + count : ''
        }`}
      </Button>
    );
  };
  return isLoading ? null : (
    <Box mt={4} justifyItems="center" sx={{ px: 2 }}>
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
        <Button variant="contained" onClick={buildQueue} disabled={isRunning}>
          Start Batch
        </Button>

        <Button
          variant="outlined"
          onClick={() =>
            isRunning
              ? ((cancelledRef.current = true), setIsRunning(false))
              : runBatch(queue.findIndex((entry) => entry.status !== 'done'))
          }
          disabled={queue.length === 0 || queue.every((q) => q.status === 'done')}
        >
          {isRunning ? 'Cancel' : 'Resume'}
        </Button>

        <ActionButton
          type="downloadAll"
          onClick={downloadAll}
          disabled={stats.downloadable.length === 0 || stats.isDownloading}
          count={stats.downloadable.length}
          status={
            stats.isDownloading
              ? 'downloading'
              : stats.isDownloadFailed
              ? 'failed'
              : stats.isDownloaded
              ? 'done'
              : undefined
          }
        />

        <ActionButton
          type="uploadAll"
          onClick={uploadAll}
          disabled={stats.uploadable.length === 0 || stats.isUploading}
          count={stats.uploadable.length}
          status={
            stats.isUploading
              ? 'uploading'
              : stats.isUploadFailed
              ? 'failed'
              : stats.isUploaded
              ? 'done'
              : undefined
          }
        />
      </Box>

      {/* Queue Display */}
      <Box display="flex" flexWrap="wrap" gap={2} mt={3}>
        {queue.map((item, idx) => (
          <Card
            key={`${item.character.class}-${item.character.race}-${item.character.gender}`}
            sx={{
              width: 220,
              borderRadius: 3,
              borderLeft: `6px solid ${classColors[item.character.class] || '#ccc'}`
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                {item.character.race} {item.character.class}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.status}
              </Typography>

              {item.status === 'done' && item.url && (
                <Fragment>
                  <CardMedia component="img" src={item.url} sx={{ borderRadius: 1, mt: 1 }} />
                  <Box mt={1} display="flex" gap={1} flexDirection={'column'}>
                    <ActionButton
                      type="download"
                      onClick={() => downloadItem(idx, item)}
                      status={item.downloadState}
                    />
                    <ActionButton
                      type="upload"
                      onClick={() => uploadItem(idx, item)}
                      status={item.uploadState}
                      disabled={item.uploadState === 'done'}
                    />
                  </Box>
                </Fragment>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
