import { useEffect, useMemo, useState } from 'react';
import {
  ArchiveOutlined,
  Delete,
  EditNote,
  NoteAdd,
  PushPin,
  PushPinOutlined,
  Restore
} from '@mui/icons-material';
import { Box, Card, CardContent, IconButton, Tab, Tabs, Typography } from '@mui/material';
import { ScrollableContainer } from '@shared/ScrollableContainer';
import SpeedDialButton from '@shared/SpeedDialButton';
import { formatDateDisplay, groupByDay } from '@utils/date.utils';
import type { CharacterNote } from '@representations/user.representation';

type NoteTab = 'notes' | 'pinned' | 'archived';

interface CharacterNotesListProps {
  characterNotes: CharacterNote[];
  updateNote: (id: string, data: Record<string, string | boolean>, del?: boolean) => Promise<void>;
  setNote: (note: Partial<CharacterNote>) => void;
  setEditMode: (edit: boolean) => void;
  isLoading?: boolean;
}

export function CharacterNotesList({
  characterNotes,
  updateNote,
  setNote,
  setEditMode,
  isLoading
}: CharacterNotesListProps) {
  const [tab, setTab] = useState<NoteTab>('notes');

  const activeNotes = useMemo(
    () =>
      characterNotes
        .filter((n) => !n.archived && !n.pinned)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [characterNotes]
  );
  const pinnedNotes = useMemo(
    () =>
      characterNotes
        .filter((n) => !n.archived && !!n.pinned)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [characterNotes]
  );
  const archivedNotes = useMemo(
    () =>
      characterNotes
        .filter((n) => !!n.archived)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [characterNotes]
  );

  const currentNotes = useMemo(
    () => (tab === 'pinned' ? pinnedNotes : tab === 'archived' ? archivedNotes : activeNotes),
    [tab, pinnedNotes, archivedNotes, activeNotes]
  );

  useEffect(() => {
    if ((tab === 'pinned' || tab === 'archived') && !currentNotes.length) setTab('notes');
  }, [currentNotes.length, tab]);

  const pinNote = async (id: string, pinned: boolean) => updateNote(id, { pinned });
  const archiveNote = async (id: string, archived: boolean) => updateNote(id, { archived });
  const deleteNote = async (id: string) => updateNote(id, {}, true);

  const noteActions = (note: CharacterNote) => [
    {
      icon: (
        <EditNote
          onClick={() => {
            setNote(note);
            setEditMode(true);
          }}
        />
      ),
      name: 'Edit',
      hidden: note.archived
    },
    {
      icon: note.pinned ? (
        <PushPin onClick={() => pinNote(note.id, !note.pinned)} />
      ) : (
        <PushPinOutlined
          sx={{ transform: 'rotate(60deg)' }}
          onClick={() => pinNote(note.id, !note.pinned)}
        />
      ),
      name: note.pinned ? 'Unpin' : 'Pin',
      hidden: note.archived
    },
    {
      icon: note.archived ? (
        <Restore onClick={() => archiveNote(note.id, !note.archived)} />
      ) : (
        <ArchiveOutlined onClick={() => archiveNote(note.id, !note.archived)} />
      ),
      name: note.archived ? 'Restore' : 'Archive'
    },
    {
      icon: <Delete onClick={() => deleteNote(note.id)} />,
      name: 'Delete'
    }
  ];

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 1 }}>
        <Tab label="Notes" value="notes" />
        {!!pinnedNotes.length && <Tab label={`Pinned (${pinnedNotes.length})`} value="pinned" />}
        {!!archivedNotes.length && (
          <Tab label={`Archived (${archivedNotes.length})`} value="archived" />
        )}
      </Tabs>

      <ScrollableContainer flex={1}>
        {currentNotes.length ? (
          <Box display="flex" flexDirection="column" gap={1} data-testid="notes-list">
            {groupByDay(currentNotes).map(([date, datedNotes]) => (
              <Box key={`${tab}-notes-${date}`}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ lineHeight: 1.5, fontSize: '0.68rem', letterSpacing: 1 }}
                >
                  {date}
                </Typography>
                {datedNotes.map((note) => (
                  <Card key={note.id} elevation={5} data-testid={`note-card-${note.id}`}>
                    <Box
                      position="relative"
                      sx={{ float: 'right', marginRight: 1 }}
                      height="100%"
                      width="100%"
                    >
                      <SpeedDialButton
                        ariaLabel="note actions"
                        sx={{ position: 'absolute', right: 0 }}
                        direction="left"
                        actions={noteActions(note)}
                        disabled={isLoading}
                        data-testid={`note-actions-${note.id}`}
                      />
                    </Box>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateDisplay(note.createdAt, 'minute')}
                      </Typography>
                      {note.updatedAt ? (
                        <Typography variant="caption" color="text.secondary">
                          {` (last edit ${formatDateDisplay(note.updatedAt, 'minute')})`}
                        </Typography>
                      ) : null}
                      <Typography data-testid={`note-content-${note.id}`}>
                        {note.content}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ))}
          </Box>
        ) : (
          <Box alignContent="center" textAlign="center" pt={4}>
            <Typography color="text.secondary">No notes yet</Typography>
            <IconButton
              onClick={() => {
                setNote({});
                setEditMode(true);
              }}
              data-testid="add-note"
            >
              <NoteAdd fontSize="large" />
            </IconButton>
          </Box>
        )}
      </ScrollableContainer>
    </Box>
  );
}
