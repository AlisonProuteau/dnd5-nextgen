import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import type { Level } from '@representations/campaign/level.representation';
import type { Subclass } from '@representations/character/class.representation';
import type { Subrace } from '@representations/character/race.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import { getAll } from '@utils/api.utils';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { omit, uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { database } from '../firebase';

export function DataBasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [docID, setDocID] = useState<string>('');
  const [docContent, setDocContent] = useState<string>('');

  const getFullDatabase = async () => {
    let allData: Record<string, any> = {};

    await Promise.all(
      [
        'ability-scores',
        'alignments',
        'backgrounds',
        'classes',
        'conditions',
        'damage-types',
        'equipment',
        'equipment-categories',
        'feats',
        'features',
        'languages',
        'magic-items',
        'magic-schools',
        'monsters',
        'proficiencies',
        'races',
        'rule-sections',
        'rules',
        'skills',
        'spells',
        'traits',
        'weapon-properties'
      ].map(async (collection) => {
        const data = await getAll(collection, `/${collection}`);
        allData[collection] = data.results;
      })
    );
    return allData;
  };
  useEffect(() => void getFullDatabase().then(console.warn), []);

  const createDocument = async () => {
    if (docContent.length && docID.length) {
      setIsLoading(true);

      try {
        const formattedData: [] = JSON.parse(docContent.replaceAll(/,\n^\s*"url":.*"$/gm, ''));

        for (const item of formattedData as (DefaultRepresentation & unknown)[]) {
          if (!item.index) continue;

          let path = docID;
          let formattedItem: unknown = { ...item };

          if (docID === 'classes') {
            formattedItem = omit(item, ['class_levels', 'spells']);
          } else if (docID === 'subclasses') {
            let formattedSubclass = item as Subclass & { class: DefaultRepresentation };
            if (formattedSubclass.spells?.length) {
              formattedSubclass = {
                ...formattedSubclass,
                spells: formattedSubclass.spells.map((spell) => {
                  const formattedSpell = spell as typeof spell & {
                    spell?: DefaultRepresentation;
                  };
                  return {
                    index: formattedSpell.spell?.index || spell.index,
                    name: formattedSpell.spell?.name || spell.name,
                    prerequisites: spell.prerequisites
                  };
                })
              };
            }

            path = `classes/${formattedSubclass.class.index}/subclasses`;
            formattedItem = omit(formattedSubclass, ['class', 'subclass_levels']);
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
          } else if (docID === 'spells') {
            let spell = item as Spell;
            spell = {
              ...spell,
              classes: (item as unknown as { classes: DefaultRepresentation[] }).classes.map(
                (currentClass) => (currentClass as DefaultRepresentation).index
              )
            };

            formattedItem = spell.subclasses?.length
              ? {
                  ...spell,
                  subclasses: (
                    item as unknown as { subclasses: DefaultRepresentation[] }
                  ).subclasses.map(
                    (currentSubclass) => (currentSubclass as DefaultRepresentation).index
                  )
                }
              : spell;
          }

          const document = doc(database, path, (formattedItem as DefaultRepresentation).index);
          await (isUpdate
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              updateDoc(document, formattedItem as { [x: string]: any })
            : setDoc(document, formattedItem));
        }

        if (docID === 'classes' || docID === 'races') {
          const uniqInstances = uniqBy(
            formattedData.map((data: DefaultRepresentation) => ({
              index: data.index,
              name: data.name
            })),
            'index'
          );
          await setDoc(doc(database, docID, 'all'), {
            count: uniqInstances.length,
            results: uniqInstances
          });
        }

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
        <Box display="flex">
          <Button fullWidth variant="contained" disabled={isLoading} onClick={createDocument}>
            {isLoading ? <CircularProgress size={24} /> : 'Add to database'}
          </Button>
          <FormControlLabel
            sx={{ marginX: 0 }}
            control={<Checkbox id="isUpdate" onChange={(_, checked) => setIsUpdate(checked)} />}
            label="Update"
          />
        </Box>
      </form>
    </Container>
  );
}
