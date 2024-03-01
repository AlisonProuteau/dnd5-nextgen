import {
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { omit } from 'lodash';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { database } from '../firebase';
import type { Level } from '../representations/campaign/level.representation';
import type { Subclass } from '../representations/character/class.representation';
import type { Subrace } from '../representations/character/race.representation';
import type { DefaultRepresentation } from '../representations/common.representation';

export function DataBasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [docID, setDocID] = useState<string>('');
  const [docContent, setDocContent] = useState<string>('');

  const createDocument = async () => {
    if (docContent.length && docID.length) {
      setIsLoading(true);

      try {
        const formattedData: [] = JSON.parse(docContent.replaceAll(/,\n^\s*"url":.*"$/gm, ''));

        await Promise.all(
          formattedData.map(async (item: DefaultRepresentation & unknown) => {
            let path = docID;
            if (item.index) {
              let formattedItem: unknown = { ...item };

              if (docID === 'classes') {
                formattedItem = omit(item, ['subclasses', 'class_levels']);
              } else if (docID === 'subclasses') {
                path = `classes/${(item as Subclass).class.index}/subclasses`;
                formattedItem = omit(item, ['class', 'subclass_levels']);
              } else if (docID === 'races') {
                formattedItem = omit(item, ['subraces']);
              } else if (docID === 'subraces' && (item as Subrace).race.index) {
                path = `races/${(item as Subrace).race.index}/subraces`;
                formattedItem = omit(item, ['race']);
              } else if (docID === 'levels' && (item as unknown as Level).class) {
                const level = item as unknown as Level;
                const subclass = level.subclass?.index;

                path = subclass
                  ? `classes/${level.class.index}/subclasses/${subclass}/levels`
                  : `classes/${level.class.index}/levels`;
                formattedItem = omit(item, ['class', 'subclass']);
              }

              const document = doc(database, path, (formattedItem as DefaultRepresentation).index);
              return await setDoc(document, formattedItem);
            }
          })
        );

        setIsLoading(false);
        setDocID('');
        setDocContent('');
        toast.success(`Done: ${docID}`);
      } catch (e) {
        console.error(e);
        setIsLoading(false);
        toast.error(`Something went wrong`);
      }
    }
  };

  return (
    <Container maxWidth="md">
      <form>
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="docId">Doc ID</InputLabel>
          <OutlinedInput
            id="docId"
            autoComplete="docId"
            label="Doc ID"
            value={docID}
            onChange={({ currentTarget }) => setDocID(currentTarget.value)}
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <OutlinedInput
            id="data"
            autoComplete="data"
            multiline
            value={docContent}
            onChange={({ currentTarget }) => setDocContent(currentTarget.value)}
            sx={{ overflow: 'scroll', height: '75vh' }}
          />
        </FormControl>

        <Button fullWidth variant="contained" disabled={isLoading} onClick={createDocument}>
          {isLoading ? <CircularProgress size={24} /> : 'Add to database'}
        </Button>
      </form>
    </Container>
  );
}
