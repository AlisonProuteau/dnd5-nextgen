import { getAllClasses, getAllRaces, getAllSubclasses, getAllSubraces } from '@api/ressources';
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
import type { ClassGuide, RaceGuide } from '@representations/guide.representation';
import { getAll } from '@utils/api.utils';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { omit, uniqBy } from 'lodash';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { database } from 'src/firebase';
import { useAuth } from './AuthProvider';

export function DataBasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [docID, setDocID] = useState<string>('');
  const [docContent, setDocContent] = useState<string>('');
  const { version } = useAuth();

  const migrateData = async () => {
    if (!version) return;
    setIsMigrating(true);

    const simpleCollections = [
      'ability-scores',
      'alignments',
      'backgrounds',
      'conditions',
      'damage-types',
      'equipment-categories',
      'equipment',
      'feats',
      'features',
      'languages',
      'magic-items',
      'magic-schools',
      'monsters',
      'proficiencies',
      'rule-sections',
      'rules',
      'skills',
      'traits',
      'weapon-properties',
      'classes',
      'races',
      'spells'
    ];

    await Promise.allSettled(
      simpleCollections.map(async (col) => {
        const value = (await getAll('', `versions/${version.toLowerCase()}/${col}`)).results;
        return createDocument(JSON.stringify(value), col);
      })
    );

    console.info('Done simple collections');

    const classes = (await getAllClasses(version)).results;
    const classValue: (Subclass & { class: DefaultRepresentation })[] = [];
    for (let i = 0; i < classes.length; i++) {
      const subclasses = (await getAllSubclasses(version, classes[i].index)).results;
      subclasses.forEach((sub: Subclass) => {
        classValue.push({
          ...sub,
          class: classes[i]
        });
      });
    }
    await createDocument(JSON.stringify(classValue), 'subclasses');

    const races = (await getAllRaces(version)).results;
    const raceValue: (Subrace & { race: DefaultRepresentation })[] = [];
    for (let i = 0; i < races.length; i++) {
      const subraces = (await getAllSubraces(version, races[i].index)).results;
      subraces.forEach((sub: Subrace) => {
        raceValue.push({
          ...sub,
          race: races[i]
        });
      });
    }
    await createDocument(JSON.stringify(raceValue), 'subraces');

    const levels: (Level & { class: DefaultRepresentation })[] = [];
    for (let i = 0; i < classes.length; i++) {
      const { index } = classes[i];
      const subclasses = (await getAllSubclasses(version, index)).results;
      const encodedSubclasses = encodeURIComponent(subclasses.map(({ index }) => index).join(', '));
      const classLevels: Level[] = JSON.parse(
        await (
          await fetch(
            `https://www.dnd5eapi.co/api/classes/${index}/levels?subclass=${encodedSubclasses}`
          )
        ).text()
      );
      levels.push(...classLevels);
    }
    await createDocument(JSON.stringify(levels), 'levels');

    console.info('Done advanced collections');

    setIsMigrating(false);
  };

  const createDocument = async (content: string, id: string) => {
    if (content.length && id.length && version) {
      setIsLoading(true);

      try {
        const formattedData: [] = JSON.parse(content.replaceAll(/,\n^\s*"url":.*"$/gm, ''));

        for (const item of formattedData as (DefaultRepresentation & unknown)[]) {
          if (!item.index) continue;

          let path = id;
          let formattedItem: unknown = { ...item };

          if (id === 'classes') {
            formattedItem = omit(item, ['class_levels', 'spells']);
          } else if (id === 'subclasses') {
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
          } else if (id === 'subraces' && (item as Subrace).race.index) {
            path = `races/${(item as Subrace).race.index}/subraces`;
            formattedItem = omit(item, ['race']);
          } else if (id === 'levels' && (item as unknown as Level).class) {
            const level = item as unknown as Level;
            const subclass = level.subclass?.index;

            path = subclass
              ? `classes/${level.class.index}/subclasses/${subclass}/levels`
              : `classes/${level.class.index}/levels`;
            formattedItem = omit(item, ['class', 'subclass']);
          } else if (id === 'spells') {
            let spell = item as Spell;

            if (!isMigrating) {
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
            formattedItem = spell;
          } else if (id === 'guides') {
            let guide = item as ClassGuide | RaceGuide;
            const entity = { index: guide.index, name: guide.name };

            if ('evolution' in guide) {
              path = `classes/${guide.index}/guides`;
              guide = { ...guide, class: entity };
            } else {
              path = `races/${guide.index}/guides`;
              guide = { ...guide, race: entity };
            }
            formattedItem = {
              ...guide,
              index: `${guide.index}-guide-v1`,
              name: `${guide.name} Guide V1`
            };
          }

          path = `versions/${version.toLowerCase()}/${path}`;
          const document = doc(database, path, (formattedItem as DefaultRepresentation).index);
          await (isUpdate
            ? updateDoc(document, formattedItem as { [x: string]: any })
            : setDoc(document, formattedItem));
        }

        if (!isMigrating && (id === 'classes' || id === 'races')) {
          const uniqInstances = uniqBy(
            formattedData.map((data: DefaultRepresentation) => ({
              index: data.index,
              name: data.name
            })),
            'index'
          );
          await setDoc(doc(database, id, 'all'), {
            count: uniqInstances.length,
            results: uniqInstances
          });
        }

        setDocID('');
        setDocContent('');
        toast.success(`Done: ${id}`);
      } catch (e) {
        console.error(e);
        toast.error(`Something went wrong: ${id}`);
      } finally {
        setIsLoading(false);
      }
      return void 0;
    }
  };

  return (
    <Container maxWidth="md">
      <Button
        fullWidth
        variant="outlined"
        disabled={isLoading || isMigrating || true}
        onClick={migrateData}
      >
        {isMigrating ? <CircularProgress size={24} /> : 'Migrate All'}
      </Button>

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

        <FormControl fullWidth margin="dense" sx={{ overflow: 'scroll', height: '75vh' }}>
          <OutlinedInput
            id="data"
            autoComplete="data"
            multiline
            value={docContent}
            onChange={({ currentTarget }) => setDocContent(currentTarget.value)}
          />
        </FormControl>
        <Box display="flex" gap="5px">
          <Button
            sx={{ flexGrow: 1 }}
            variant="contained"
            disabled={isLoading || isMigrating}
            onClick={() => createDocument(docContent, docID)}
          >
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
