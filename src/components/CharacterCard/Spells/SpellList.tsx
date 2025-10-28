import { getSpell, getSpellsForClass } from '@api/ressources';
import { ExpandMore, Rule } from '@mui/icons-material';
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
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  Typography
} from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';
import type { Subclass } from '@representations/character/class.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import type { TypeFromArray } from '@representations/utils.representation';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Version } from '@utils/versions.constants';
import { groupBy, max, maxBy, uniqBy, uniqWith } from 'lodash';
import {
  Fragment,
  useCallback,
  useMemo,
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
  additionalSpellList?: (DefaultRepresentation & Partial<TypeFromArray<Subclass['spells']>>)[];
  slotLevel?: number;
  spellListOnly?: boolean;
  selectedSpells?: Character['knownSpells'] | Character['preparedSpells'];
  maxSelected?: [number, number];
  hideLevels?: boolean;
  showDesc?: boolean;
}

export function SpellList({
  characterInfo,
  additionalSpellList,
  slotLevel,
  spellListOnly = false,
  selectedSpells = [],
  setSelectedSpells,
  maxSelected = [0, 0],
  hideLevels = false,
  showDesc = false
}: SpellListProps & {
  setSelectedSpells?: Dispatch<SetStateAction<typeof selectedSpells>>;
}) {
  const { version } = useAuth();
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean | undefined>>({});
  const [currentSpell, setCurrentSpell] = useState<Spell>();

  // TODO: Add filter for prerequisites (maybe just subclass?)
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
        data: results
          .map(({ data }) => {
            let formattedData = { ...data } as Spell;
            const currentSpell = additionalSpellList?.find(({ index }) => index === data?.index);

            if (currentSpell?.prerequisites) {
              const preRequisiteLevel = parseInt(
                currentSpell.prerequisites
                  .find(({ type }) => type === 'level')
                  ?.index.replace(new RegExp(`^${characterInfo.classIndex}-`), '') || '0'
              );

              if (preRequisiteLevel > (data?.level || 0)) formattedData.level = preRequisiteLevel;
            }

            return formattedData;
          })
          .filter((data) => data) as Spell[],
        isFetching: results.some((result) => result.isFetching),
        dataUpdatedAt: maxBy(results, 'dataUpdatedAt')
      };
    }, [])
  });

  const allSpells: Record<string, Array<Spell>> = useMemo(() => {
    if (
      !(
        (spellListOnly || !spellsFetching) &&
        !additionnalSpellsFetching &&
        (spells.length || additionnalSpells.length)
      )
    )
      return {};

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

    return !hideLevels ? groupBy(filteredSpells, 'level') : { all: filteredSpells };
  }, [
    spellListOnly,
    spellsFetching,
    additionnalSpellsFetching,
    spells,
    additionnalSpells.map(({ index, level }) => `${index}-${level}`).join(', '),
    characterInfo.slotLevels.join(', '),
    hideLevels
  ]);

  const ConditionalAccordion = useMemo(
    () =>
      ({
        condition,
        children,
        ...props
      }: {
        condition: boolean;
        children: ReactNode;
      } & AccordionProps) =>
        condition && children ? <Accordion {...props}>{children}</Accordion> : <>{children}</>,
    []
  );

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
          data-testid={`spell-list-${currentLevel}`}
          sx={{ '&:before': { display: 'none' } }}
          elevation={0}
          expanded={isExpanded[currentLevel] ?? true}
          onChange={(_, expanded) =>
            setIsExpanded((prev) => ({ ...prev, [currentLevel]: expanded }))
          }
          disableGutters
          condition={!hideLevels}
        >
          {!hideLevels && (
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Divider component="div" role="presentation" variant="middle" sx={{ flex: 1 }}>
                <Typography variant="subtitle2">
                  {currentLevel === '0' ? 'Cantrips' : `Spell Level ${currentLevel}`}
                </Typography>
              </Divider>
            </AccordionSummary>
          )}

          <AccordionDetails>
            <Box
              display="grid"
              gap="20px"
              gridTemplateColumns={`repeat(auto-fill, minmax(${
                setSelectedSpells || showDesc ? 230 : 150
              }px, 1fr))`}
            >
              {allSpells[currentLevel].map((spell) => (
                <Card
                  key={`spell-${spell.index}-${spell.level}`}
                  data-testid={`${setSelectedSpells ? 'edit' : 'view'}-spell-item-${spell.index}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow:
                      selectedSpells.find(({ index }) => index === spell.index) &&
                      'inset 0px 0px 5px 2px darkgrey',
                    overflow: 'visible',
                    marginTop: '10px'
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
                        <Box width="100%" display="flex" justifyContent="space-between">
                          {!setSelectedSpells && (
                            <Typography variant="subtitle2" color="darkgrey" margin="5px">
                              {spell.components}
                              {spell.concentration ? ' - Con' : ''}
                              {spell.ritual ? ' - Ritual' : ''}
                            </Typography>
                          )}
                          {additionalSpellList
                            ?.find(
                              ({ index, prerequisites }) =>
                                index === spell.index &&
                                prerequisites?.find(({ type }) => type !== 'level')
                            )
                            ?.prerequisites?.map(({ name, type }) =>
                              type !== 'level' ? (
                                <Chip
                                  sx={{
                                    width: 'fit-content',
                                    position: 'relative',
                                    top: '-15px',
                                    right: '-10px'
                                  }}
                                  icon={<Rule />}
                                  label={name}
                                />
                              ) : null
                            )}
                        </Box>
                      }
                      subheader={
                        <Typography textAlign="center" color="primary">
                          {spell.name}
                        </Typography>
                      }
                      sx={{ padding: 0, paddingTop: setSelectedSpells ? '15px' : 0 }}
                    />

                    {setSelectedSpells || showDesc ? (
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
                          data-testid={`remove-spell-${spell.index}`}
                          onClick={() =>
                            setSelectedSpells((prev) =>
                              prev.filter(({ index }) => index !== spell.index)
                            )
                          }
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          data-testid={`add-spell-${spell.index}`}
                          onClick={() =>
                            setSelectedSpells((prev) => {
                              const canAdd =
                                prev
                                  .filter((s) => ('added' in s ? !s.added : true))
                                  .filter(({ level }) =>
                                    spell.level === 0 ? level === 0 : level > 0
                                  ).length < maxSelected[spell.level === 0 ? 0 : 1];

                              console.log({ prev, spell, maxSelected, selectedSpells, canAdd });
                              return canAdd ? [...prev, spell] : prev;
                            })
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

      <Dialog
        open={!!currentSpell}
        onClose={() => setCurrentSpell(undefined)}
        fullWidth
        disableRestoreFocus={true}
        keepMounted={false}
      >
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
