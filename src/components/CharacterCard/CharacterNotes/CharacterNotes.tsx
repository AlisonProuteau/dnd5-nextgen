import { Fragment, useEffect, useMemo, useState } from 'react';
import { ArchiveOutlined, NoteAdd, NoteAlt } from '@mui/icons-material';
import { Box, Button, Drawer, IconButton, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCharacterNotes } from '@api/users';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { ControledInput } from '@shared/ControledInput';
import { Loader } from '@shared/Loader';
import type { Character, CharacterNote } from '@representations/user.representation';
import { useAuth } from 'src/providers/AuthProvider';
import { CharacterNotesList } from './CharacterNotesList';

interface CharacterNotesProps {
  isNoteOpen: boolean;
  closeNote: () => void;
  character: Character;
}

export function CharacterNotes({ isNoteOpen, closeNote, character }: CharacterNotesProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    isOn: editMode,
    turnOn: enterEditMode,
    turnOff: exitEditMode,
    setIsOn: setEditMode
  } = useToggle(false);
  const {
    isOn: archiveMode,
    toggle: toggleArchiveMode,
    turnOff: exitArchiveMode
  } = useToggle(false);
  const [note, setNote] = useState<Partial<CharacterNote>>({});

  const firebaseCrud = useFirebaseCrud<CharacterNote>({
    collectionPath: `users/{userId}/characters/${character.id}/notes`,
    successMessages: {
      create: 'Note created successfully',
      update: 'Note updated successfully',
      delete: 'Note deleted successfully'
    }
  });

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
    if (!isNoteOpen) exitArchiveMode();
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
      let formattedNote = {
        ...note,
        content: note.content?.trim() || ''
      };

      let noteID: string | null = '';
      if (formattedNote.id) {
        formattedNote = { ...formattedNote, updatedAt: new Date() };
        await firebaseCrud.update(formattedNote.id || '', formattedNote);
      } else {
        formattedNote = { ...formattedNote, createdAt: new Date() };
        noteID = await firebaseCrud.create(formattedNote);
      }

      optimisticUpdateNotes({ id: noteID, ...formattedNote } as CharacterNote);
      exitEditMode();
    }
  };

  const updateNote = async (
    id: string,
    content: Record<string, boolean | string>,
    del: boolean = false
  ) => {
    const currentNote = characterNotes?.flat().filter((note) => note?.id === id)?.[0];

    if (currentNote && !editMode && character.id && user?.uid) {
      if (del) await firebaseCrud.remove(id);
      else await firebaseCrud.update(id, content);

      optimisticUpdateNotes({ ...currentNote, ...content }, del);
    }
  };

  return (
    <Drawer
      anchor="bottom"
      open={isNoteOpen}
      onClose={closeNote}
      variant="temporary"
      data-testid={`notes-drawer-${character.id}`}
    >
      <Box height="500px" padding={2} display="flex" flexDirection="column" gap={2} overflow="auto">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">
            {character.name}'s Notes{archiveMode ? ' - Archive' : ''}
          </Typography>

          {!editMode && !isCharacterNotesLoading && (
            <Box>
              {characterNotes?.filter(({ archived }) => archived).length ? (
                <IconButton onClick={toggleArchiveMode} data-testid="archive-toggle">
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
                    enterEditMode();
                  }}
                  data-testid="add-note"
                >
                  <NoteAdd fontSize="medium" />
                </IconButton>
              ) : null}
            </Box>
          )}
        </Box>

        {isCharacterNotesLoading ? (
          <Loader key={`${character.id}-notes-loading`} size={40} />
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
                  onChange={(_, value) => setNote((n) => ({ ...n, content: value as string }))}
                />
              </Fragment>
            ) : (
              <CharacterNotesList
                characterNotes={characterNotes || []}
                updateNote={updateNote}
                setNote={setNote}
                setEditMode={setEditMode}
                isLoading={firebaseCrud.isLoading}
                showArchived={archiveMode}
              />
            )}
          </Box>
        )}

        <Box alignSelf="flex-end">
          {editMode ? (
            <Button onClick={saveNote} disabled={!isValid || firebaseCrud.isLoading}>
              Save
            </Button>
          ) : null}
          <Button
            disabled={firebaseCrud.isLoading}
            onClick={() => {
              setNote({});
              editMode ? exitEditMode() : closeNote();
            }}
          >
            {editMode ? 'Cancel' : 'Close'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
