import { getCharacterNotes } from '@api/users';
import { EditNote, NoteAdd } from '@mui/icons-material';
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
import { useQuery } from '@tanstack/react-query';
import { collection, doc, setDoc, updateDoc, type Timestamp } from 'firebase/firestore';
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

// TODO: Cleanup and test
export function CharacterNotes({ isNoteOpen, setIsNoteOpen, character }: CharacterNotesProps) {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [note, setNote] = useState<Partial<CharacterNote>>({});

  const {
    data: characterNotes,
    isFetching: isCharacterNotesLoading,
    refetch: refetchCharacterNotes
  } = useQuery({
    queryKey: ['fetchNotes', user?.uid, character.id],
    queryFn: async () =>
      user?.uid && character.id ? await getCharacterNotes(user.uid, character.id) : null,
    select(data) {
      return data
        ?.map((note) =>
          note.updatedAt
            ? {
                ...note,
                createdAt: (note.createdAt as unknown as Timestamp).toDate(),
                updatedAt: (note.updatedAt as unknown as Timestamp).toDate()
              }
            : { ...note, createdAt: (note.createdAt as unknown as Timestamp).toDate() }
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    enabled: !!user?.uid && !!character.id
  });

  useEffect(() => {
    if (isNoteOpen && !editMode) refetchCharacterNotes();
  }, [isNoteOpen, editMode]);

  const isValid = useMemo(() => {
    if (!note.id) return !!note.content?.trim()?.length;

    const existingNote = characterNotes?.filter(({ id }) => id === note.id)?.[0];
    return !!note.content?.trim()?.length && note.content?.trim() !== existingNote?.content;
  }, [note, characterNotes]);

  const saveNote = async () => {
    if (isValid && character.id && user?.uid) {
      let formattedNote = {
        ...note,
        content: note.content?.trim()
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
          await updateDoc(document, { ...formattedNote, updatedAt: new Date() });
        }

        toast.success('Character Points Updated');
      } catch (error) {
        toast.error(`Something went wrong
          ${(error as Error).message || 'Error'}`);
      } finally {
        setEditMode(false);
        await refetchCharacterNotes();
      }
    }
  };

  return (
    <Drawer
      anchor="bottom"
      open={isNoteOpen}
      onClose={() => setIsNoteOpen(false)}
      variant="temporary"
      ModalProps={{
        keepMounted: false
      }}
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
                {Object.entries(
                  groupBy(characterNotes, ({ createdAt }) =>
                    createdAt.toLocaleDateString(navigator.language, {
                      month: 'long',
                      year: 'numeric'
                    })
                  )
                ).map(([date, datedNotes]) => (
                  <Fragment key={`notes-${date}`}>
                    <Typography textTransform="capitalize">{date}</Typography>
                    {datedNotes?.map((note) => (
                      <Card key={note.id}>
                        <IconButton
                          sx={{ position: 'relative', float: 'right' }}
                          onClick={() => {
                            setNote(note);
                            setEditMode(true);
                          }}
                        >
                          <EditNote fontSize="large" />
                        </IconButton>
                        <CardContent>
                          <Typography variant="caption" color="text.secondary">
                            {note.createdAt.toLocaleDateString(navigator.language, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                          <Typography>{note.content}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Fragment>
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
