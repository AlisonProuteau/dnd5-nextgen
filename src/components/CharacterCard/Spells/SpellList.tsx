import { getSpell, getSpellsForClass } from '@api/ressources';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionProps,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  Divider,
  Typography
} from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Version } from '@utils/versions.constants';
import { groupBy, max, maxBy, uniqBy, uniqWith } from 'lodash';
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from 'react';
import { useAuth } from 'src/providers/AuthProvider';
import { SpellCardContent } from './SpellCardContent';
import { SpellDetails } from './SpellDetails';

interface SpellListProps {
  characterInfo: {
    version: Version;
    classIndex?: string;
    subclassIndex?: string;
    charLevel?: number;
    slotLevels: number[];
  };
  additionalSpellList?: DefaultRepresentation[];
  slotLevel?: number;
  spellListOnly?: boolean;
  selectedSpells?: Character['knownSpells'] | Character['preparedSpells'];
  maxSelected?: [number, number];
  hideLevels?: boolean;
}

export function SpellList({
  characterInfo,
  additionalSpellList,
  slotLevel,
  spellListOnly = false,
  selectedSpells = [],
  setSelectedSpells,
  maxSelected = [0, 0],
  hideLevels = false
}: SpellListProps & {
  setSelectedSpells?: Dispatch<SetStateAction<typeof selectedSpells>>;
}) {
  const { version } = useAuth();
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean | undefined>>({});
  const [allSpells, setAllSpells] = useState<Record<string, Array<Spell>>>({});
  const [currentSpell, setCurrentSpell] = useState<Spell>();

  const { data: spells = [], isFetching: spellsFetching } = useQuery({
    queryKey: [
      'fetchCharacterSpells',
      characterInfo.classIndex,
      characterInfo.subclassIndex,
      max(characterInfo.slotLevels)
    ],
    queryFn: async () =>
      characterInfo.classIndex
        ? (
            await getSpellsForClass(
              characterInfo.version,
              characterInfo.classIndex,
              characterInfo.subclassIndex,
              max(characterInfo.slotLevels)
            )
          ).results
        : [],
    enabled: !!characterInfo.classIndex && !spellListOnly
  });

  const { data: additionnalSpells, isFetching: additionnalSpellsFetching } = useQueries({
    queries:
      uniqBy(additionalSpellList, 'index')?.map(({ index }) => ({
        queryKey: ['fetchSpell', version, index],
        queryFn: async () => (version ? await getSpell(version, index) : null),
        enabled: !!index && !!version
      })) || [],
    combine: useCallback((results: UseQueryResult<Spell | null, Error>[]) => {
      return {
        data: results.map(({ data }) => data).filter((data) => data) as Spell[],
        isFetching: results.some((result) => result.isFetching),
        dataUpdatedAt: maxBy(results, 'dataUpdatedAt')
      };
    }, [])
  });

  useEffect(() => {
    if (
      (spellListOnly || !spellsFetching) &&
      !additionnalSpellsFetching &&
      (spells.length || additionnalSpells.length)
    ) {
      const filteredSpells = uniqWith(
        [
          ...(spellListOnly ? [] : spells).filter(
            ({ level }) =>
              !characterInfo.slotLevels.length || characterInfo.slotLevels.includes(level)
          ),
          ...additionnalSpells
        ],
        (a, b) => a.index === b.index && a.level === b.level
      ).sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB));

      !hideLevels
        ? setAllSpells(groupBy(filteredSpells, 'level'))
        : setAllSpells({ all: filteredSpells });
    }
  }, [spellsFetching, additionnalSpellsFetching, spellListOnly]);

  function ConditionalAccordion({
    condition,
    children,
    ...props
  }: {
    condition: boolean;
    children: ReactNode;
  } & AccordionProps) {
    return condition && children ? <Accordion {...props}>{children}</Accordion> : children;
  }

  return !spellsFetching && !additionnalSpellsFetching ? (
    <Fragment>
      {setSelectedSpells && (
        <Fragment>
          {maxSelected[0] > 0 && (
            <Typography>
              {selectedSpells.filter(({ level }) => level === 0).length}/{maxSelected[0]} cantrips
              selected
            </Typography>
          )}
          {maxSelected[1] > 0 && (
            <Typography>
              {selectedSpells.filter(({ level }) => level > 0).length}/{maxSelected[1]} spells
              selected
            </Typography>
          )}
        </Fragment>
      )}
      {Object.keys(allSpells).map((currentLevel) => (
        <ConditionalAccordion
          key={`spell-list-${currentLevel}-${allSpells[currentLevel]?.length}`}
          sx={{ '&:before': { display: 'none' } }}
          elevation={0}
          expanded={isExpanded[currentLevel] ?? true}
          onChange={() =>
            setIsExpanded((prev) => ({ ...prev, [currentLevel]: !(prev[currentLevel] ?? true) }))
          }
          disableGutters
          condition={!hideLevels}
        >
          {!hideLevels && (
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                {currentLevel === '0' ? 'Cantrips' : `Spell Level ${currentLevel}`}
              </Divider>
            </AccordionSummary>
          )}

          <AccordionDetails>
            <Box
              display="grid"
              gap="10px"
              gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))"
            >
              {allSpells[currentLevel].map((spell) => (
                <Card
                  key={`spell-${spell.index}-${spell.level}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow:
                      selectedSpells.find(({ index }) => index === spell.index) &&
                      'inset 0px 0px 5px 2px darkgrey'
                  }}
                >
                  <CardActionArea
                    onClick={() => setCurrentSpell(spell)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      justifyContent: 'space-between',
                      alignItems: 'stretch'
                    }}
                  >
                    <CardHeader
                      title={
                        !setSelectedSpells && (
                          <Typography
                            display="inline"
                            variant="subtitle2"
                            color="darkgrey"
                            margin="5px"
                          >
                            {spell.components}
                            {spell.concentration ? ' - Con' : ''}
                            {spell.ritual ? ' - Ritual' : ''}
                          </Typography>
                        )
                      }
                      subheader={
                        <Typography textAlign="center" color="primary">
                          {spell.name}
                        </Typography>
                      }
                      sx={{ padding: 0, paddingTop: setSelectedSpells ? '15px' : 0 }}
                    />

                    {setSelectedSpells ? (
                      <CardContent sx={{ flex: 1 }}>
                        <Typography textAlign="justify">{spell.desc[0]}</Typography>
                      </CardContent>
                    ) : (
                      <SpellCardContent
                        spell={spell}
                        slotLevels={slotLevel ? [slotLevel] : characterInfo.slotLevels}
                      />
                    )}
                  </CardActionArea>

                  {setSelectedSpells && (
                    <CardActions sx={{ alignSelf: 'center' }}>
                      {selectedSpells.find(({ index }) => index === spell.index) ? (
                        <Button
                          onClick={() =>
                            setSelectedSpells(
                              selectedSpells.filter(({ index }) => index !== spell.index)
                            )
                          }
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          onClick={() =>
                            selectedSpells.filter(({ level }) =>
                              spell.level === 0 ? level === 0 : level > 0
                            ).length < maxSelected[spell.level === 0 ? 0 : 1] &&
                            setSelectedSpells([...selectedSpells, spell])
                          }
                          disabled={
                            selectedSpells.filter(({ level }) =>
                              spell.level === 0 ? level === 0 : level > 0
                            ).length >= maxSelected[spell.level === 0 ? 0 : 1]
                          }
                        >
                          Add
                        </Button>
                      )}
                    </CardActions>
                  )}
                </Card>
              ))}
            </Box>
          </AccordionDetails>
        </ConditionalAccordion>
      ))}

      <Dialog open={!!currentSpell} onClose={() => setCurrentSpell(undefined)} fullWidth>
        {currentSpell && (
          <SpellDetails
            spell={currentSpell}
            charLevel={characterInfo.charLevel}
            slotLevels={slotLevel ? [slotLevel] : characterInfo.slotLevels}
          />
        )}
      </Dialog>
    </Fragment>
  ) : (
    <CircularProgress size={24} sx={{ alignSelf: 'center' }} />
  );
}
