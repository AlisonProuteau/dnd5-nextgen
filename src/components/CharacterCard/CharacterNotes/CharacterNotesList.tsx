import {
  ArchiveOutlined,
  Delete,
  EditNote,
  NoteAdd,
  PushPin,
  PushPinOutlined,
  Restore
} from '@mui/icons-material';
import { Box, Card, CardContent, IconButton, Typography } from '@mui/material';
import type { CharacterNote } from '@representations/user.representation';
import SpeedDialButton from '@shared/SpeedDialButton';
import { type Timestamp } from 'firebase/firestore';
import { groupBy } from 'lodash';
import { Fragment } from 'react';

interface CharacterNotesListProps {
  characterNotes: CharacterNote[];
  updateNote: (id: string, data: Record<string, string | boolean>, del?: boolean) => Promise<void>;
  setNote: (note: Partial<CharacterNote>) => void;
  setEditMode: (edit: boolean) => void;
  isLoading?: boolean;
  showArchived?: boolean;
}

export function CharacterNotesList({
  characterNotes,
  updateNote,
  setNote,
  setEditMode,
  isLoading,
  showArchived = false
}: CharacterNotesListProps) {
  const formatNoteDates = (note: CharacterNote) => {
    const createdAtFormatted =
      note.createdAt instanceof Date
        ? note.createdAt
        : (note.createdAt as unknown as Timestamp).toDate();
    const updatedAtFormatted = note.updatedAt
      ? note.updatedAt instanceof Date
        ? note.updatedAt
        : (note.updatedAt as unknown as Timestamp).toDate()
      : undefined;

    return note.updatedAt
      ? {
          ...note,
          createdAt: createdAtFormatted,
          updatedAt: updatedAtFormatted
        }
      : { ...note, createdAt: createdAtFormatted };
  };

  const formatCharacterNotes = (
    notes: CharacterNote[],
    archived: boolean = false
  ): [CharacterNote[] | undefined, CharacterNote[] | undefined] => {
    console.log('Formatting notes', notes, archived);
    const formattedNotes = notes
      .filter((note) => (note.archived || false) === archived)
      .map(formatNoteDates);
    if (archived)
      return [
        undefined,
        formattedNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      ];

    const pinnedNotes = formattedNotes
      .filter((note) => note.pinned)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const unpinnedNotes = formattedNotes
      .filter((note) => !note.pinned)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return [pinnedNotes, unpinnedNotes];
  };

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

  const pinNote = async (id: string, pinned: boolean) => updateNote(id, { pinned });
  const archiveNote = async (id: string, archived: boolean) => updateNote(id, { archived });
  const deleteNote = async (id: string) => updateNote(id, {}, true);

  return characterNotes?.filter(({ archived }) => (archived || false) === showArchived)?.length ? (
    <Box display="flex" flexDirection="column" gap={1} overflow="visible" data-testid="notes-list">
      {formatCharacterNotes(characterNotes, showArchived).map((noteList, free) => (
        <Box
          key={free ? 'unpinned' : 'pinned'}
          sx={{
            borderBottom: free || !noteList?.length ? '' : '1px solid',
            borderColor: 'divider'
          }}
          paddingBottom={1}
        >
          {Object.entries(
            groupBy(noteList, ({ createdAt }) =>
              createdAt.toLocaleDateString(navigator.language, {
                month: 'long',
                year: 'numeric'
              })
            )
          ).map(([date, datedNotes]) => (
            <Fragment key={`${!free ? 'pinned' : 'unpinned'}-notes-${date}`}>
              <Typography textTransform="capitalize">{date}</Typography>
              {datedNotes?.map((note) => (
                <Card
                  key={note.id}
                  elevation={note.pinned ? 1 : 5}
                  data-testid={`note-card-${note.id}`}
                >
                  <Box
                    position="relative"
                    sx={{ float: 'right', marginRight: 1 }}
                    height="100%"
                    width="100%"
                  >
                    <SpeedDialButton
                      ariaLabel="SpeedDial basic example"
                      sx={{
                        position: 'absolute',
                        right: 0
                      }}
                      direction="left"
                      actions={noteActions(note)}
                      disabled={isLoading}
                      data-testid={`note-actions-${note.id}`}
                    />
                  </Box>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      {note.createdAt.toLocaleDateString(navigator.language, {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                    {note.updatedAt ? (
                      <Typography variant="caption" color="text.secondary">
                        {` (last edit ${note.updatedAt.toLocaleDateString(navigator.language, {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })})`}
                      </Typography>
                    ) : null}
                    <Typography data-testid={`note-content-${note.id}`}>{note.content}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Fragment>
          ))}
        </Box>
      ))}
    </Box>
  ) : (
    <Box height="100%" alignContent="center" textAlign="center">
      <Typography color={'text.secondary'}>No notes yet</Typography>
      <IconButton
        onClick={() => {
          setNote({});
          setEditMode(true);
        }}
      >
        <NoteAdd fontSize="large" />
      </IconButton>
    </Box>
  );
}
