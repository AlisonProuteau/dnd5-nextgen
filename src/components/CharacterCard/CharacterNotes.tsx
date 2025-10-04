import { getCharacterNotes } from '@api/users';
import {
  ArchiveOutlined,
  Delete,
  EditNote,
  NoteAdd,
  PushPin,
  PushPinOutlined,
  Restore
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Drawer,
  IconButton,
  Typography
} from '@mui/material';
import type { Character, CharacterNote } from '@representations/user.representation';
import { ControledInput } from '@shared/ControledInput';
import SpeedDialButton from '@shared/SpeedDialButton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, deleteDoc, doc, setDoc, updateDoc, type Timestamp } from 'firebase/firestore';
import { groupBy } from 'lodash';
import { Fragment, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { database } from 'src/firebase';
import { useAuth } from 'src/providers/AuthProvider';

interface CharacterNotesProps {
  isNoteOpen: boolean;
  setIsNoteOpen: (open: boolean) => void;
  character: Character;
}

// TODO: Hide archived notes by default, with a button to show them
export function CharacterNotes({ isNoteOpen, setIsNoteOpen, character }: CharacterNotesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [note, setNote] = useState<Partial<CharacterNote>>({});
  const [isLoading, setIsLoading] = useState(false);

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
    notes: CharacterNote[]
  ): [CharacterNote[] | undefined, CharacterNote[] | undefined] => {
    const formattedNotes = notes.map(formatNoteDates);
    const pinnedNotes = formattedNotes
      .filter((note) => note.pinned)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const unpinnedNotes = formattedNotes
      .filter((note) => !note.pinned)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return [pinnedNotes, unpinnedNotes];
  };

  const {
    data: characterNotes,
    isFetching: isCharacterNotesLoading,
    refetch: refetchCharacterNotes
  } = useQuery({
    queryKey: ['fetchNotes', user?.uid, character.id],
    queryFn: async () =>
      user?.uid && character.id ? await getCharacterNotes(user.uid, character.id) : null,
    enabled: !!user?.uid && !!character.id
  });

  useEffect(() => {
    if (isNoteOpen && !editMode) refetchCharacterNotes();
  }, [isNoteOpen, editMode]);

  const isValid = useMemo(() => {
    if (!note.id) return !!note.content?.trim()?.length;

    const existingNote = characterNotes?.flat().filter((current) => current?.id === note.id)?.[0];
    return !!note.content?.trim()?.length && note.content?.trim() !== existingNote?.content;
  }, [note, characterNotes]);

  const optimisticUpdateNotes = (note: CharacterNote, del: boolean = false) => {
    queryClient.setQueryData(
      ['fetchNotes', user?.uid, character.id],
      (oldData: CharacterNote[] | undefined) => {
        if (oldData)
          return del
            ? oldData.filter(({ id }) => id !== note.id)
            : [...oldData.filter(({ id }) => id !== note.id), note];
        return oldData;
      }
    );
  };

  const saveNote = async () => {
    if (isValid && character.id && user?.uid) {
      setIsLoading(true);

      let formattedNote = {
        ...note,
        content: note.content?.trim() || ''
      };

      const path = `users/${user.uid}/characters/${character.id}/notes`;
      try {
        if (!formattedNote?.id) {
          const document = doc(collection(database, path));
          formattedNote = {
            ...formattedNote,
            id: document.id,
            createdAt: new Date()
          };
          await setDoc(document, formattedNote);
        } else {
          const document = doc(database, path, formattedNote.id);
          formattedNote = { ...formattedNote, updatedAt: new Date() };
          await updateDoc(document, formattedNote);
        }

        setEditMode(false);
        optimisticUpdateNotes(formattedNote as CharacterNote);
      } catch (error) {
        toast.error(`Something went wrong
          ${(error as Error).message || 'Error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateNote = async (
    id: string,
    content: Record<string, boolean | string>,
    del: boolean = false
  ) => {
    const currentNote = characterNotes?.flat().filter((note) => note?.id === id)?.[0];

    if (currentNote && !editMode && character.id && user?.uid) {
      setIsLoading(true);
      const path = `users/${user.uid}/characters/${character.id}/notes`;

      const document = doc(database, path, id);
      return await (del ? deleteDoc(document) : updateDoc(document, content))
        .then(() => optimisticUpdateNotes({ ...currentNote, ...content }, del))
        .catch((error) =>
          toast.error(`Something went wrong
          ${(error as Error).message || 'Error'}`)
        )
        .finally(() => setIsLoading(false));
    }
  };

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
      name: 'Edit'
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
      name: note.pinned ? 'Pin' : 'Unpin'
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
    <Drawer
      anchor="bottom"
      open={isNoteOpen}
      onClose={() => setIsNoteOpen(false)}
      variant="temporary"
    >
      {isCharacterNotesLoading ? (
        <CircularProgress size={24} key={`${character.id}-notes-loading`} />
      ) : (
        <Box
          height="500px"
          padding={2}
          display="flex"
          flexDirection="column"
          gap={2}
          overflow="auto"
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">{character.name}'s Notes</Typography>

            {characterNotes?.length ? (
              <IconButton
                onClick={() => {
                  setNote({});
                  setEditMode(true);
                }}
              >
                <NoteAdd fontSize="medium" />
              </IconButton>
            ) : null}
          </Box>

          <Box flex={1} overflow="auto">
            {editMode ? (
              <Fragment>
                <ControledInput
                  fullWidth
                  required
                  multiline
                  minRows={4}
                  id="content"
                  type="text"
                  label="Content"
                  value={note.content || ''}
                  onChange={(value) => setNote((n) => ({ ...n, content: value as string }))}
                />
              </Fragment>
            ) : characterNotes?.length ? (
              <Box display="flex" flexDirection="column" gap={1} overflow="visible">
                {formatCharacterNotes(characterNotes).map((noteList, free) => (
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
                          <Card key={note.id} elevation={note.pinned ? 1 : 5}>
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
                                  {` (last edit ${note.updatedAt.toLocaleDateString(
                                    navigator.language,
                                    {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }
                                  )})`}
                                </Typography>
                              ) : null}
                              <Typography>{note.content}</Typography>
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
            )}
          </Box>

          <Box alignSelf="flex-end">
            {editMode ? (
              <Button onClick={saveNote} disabled={!isValid}>
                Save
              </Button>
            ) : null}
            <Button
              onClick={() => {
                setNote({});
                editMode ? setEditMode(false) : setIsNoteOpen(false);
              }}
            >
              {editMode ? 'Cancel' : 'Close'}
            </Button>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
