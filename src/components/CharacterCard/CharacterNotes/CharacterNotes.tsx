import { getCharacterNotes } from '@api/users';
import { ArchiveOutlined, NoteAdd, NoteAlt } from '@mui/icons-material';
import { Box, Button, CircularProgress, Drawer, IconButton, Typography } from '@mui/material';
import type { Character, CharacterNote } from '@representations/user.representation';
import { ControledInput } from '@shared/ControledInput';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Fragment, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { database } from 'src/firebase';
import { useAuth } from 'src/providers/AuthProvider';
import { CharacterNotesList } from './CharacterNotesList';

interface CharacterNotesProps {
  isNoteOpen: boolean;
  setIsNoteOpen: (open: boolean) => void;
  character: Character;
}

export function CharacterNotes({ isNoteOpen, setIsNoteOpen, character }: CharacterNotesProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [archiveMode, setArchiveMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [note, setNote] = useState<Partial<CharacterNote>>({});

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
    if (!isNoteOpen) setArchiveMode(false);
  }, [isNoteOpen]);

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
      await (del ? deleteDoc(document) : updateDoc(document, content))
        .then(() => optimisticUpdateNotes({ ...currentNote, ...content }, del))
        .catch((error) =>
          toast.error(`Something went wrong
          ${(error as Error).message || 'Error'}`)
        )
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <Drawer
      anchor="bottom"
      open={isNoteOpen}
      onClose={() => setIsNoteOpen(false)}
      variant="temporary"
    >
      <Box height="500px" padding={2} display="flex" flexDirection="column" gap={2} overflow="auto">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">
            {character.name}'s Notes{archiveMode ? ' - Archive' : ''}
          </Typography>

          {!editMode && !isCharacterNotesLoading && (
            <Box>
              {characterNotes?.filter(({ archived }) => archived).length ? (
                <IconButton onClick={() => setArchiveMode((mode) => !mode)}>
                  {archiveMode ? (
                    <NoteAlt fontSize="medium" />
                  ) : (
                    <ArchiveOutlined fontSize="medium" />
                  )}
                </IconButton>
              ) : null}
              {!archiveMode && characterNotes?.filter(({ archived }) => !archived).length ? (
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
          )}
        </Box>

        {isCharacterNotesLoading ? (
          <CircularProgress key={`${character.id}-notes-loading`} sx={{ margin: 'auto' }} />
        ) : (
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
            ) : (
              <CharacterNotesList
                characterNotes={characterNotes || []}
                updateNote={updateNote}
                setNote={setNote}
                setEditMode={setEditMode}
                isLoading={isLoading}
                showArchived={archiveMode}
              />
            )}
          </Box>
        )}

        <Box alignSelf="flex-end">
          {editMode ? (
            <Button onClick={saveNote} disabled={!isValid || isLoading}>
              Save
            </Button>
          ) : null}
          <Button
            disabled={isLoading}
            onClick={() => {
              setNote({});
              editMode ? setEditMode(false) : setIsNoteOpen(false);
            }}
          >
            {editMode ? 'Cancel' : 'Close'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
