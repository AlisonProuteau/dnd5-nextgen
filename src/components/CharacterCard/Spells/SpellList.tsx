import {
  type Dispatch,
  Fragment,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useMemo,
  useState
} from 'react';
import { ExpandMore, Rule } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  type AccordionProps,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  Divider,
  Typography
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { groupBy, max, uniqBy, uniqWith } from 'lodash';
import { getSpell, getSpellsForClass } from '@api/ressources';
import { ControledInput } from '@shared/ControledInput';
import { Loader } from '@shared/Loader';
import { filterSpellsByPrerequisites } from '@utils/character/spells.utils';
import type { Version } from '@utils/constants/versions.constants';
import { createQueryCombiner } from '@utils/query.utils';
import type { Spell } from '@representations/abilities/magic.representation';
import type { Subclass } from '@representations/character/class.representation';
import type { DefaultRepresentation } from '@representations/common.representation';
import type { Character } from '@representations/user.representation';
import type { TypeFromArray } from '@representations/utils.representation';
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
    features?: DefaultRepresentation[];
  };
  additionalSpellList?: (DefaultRepresentation &
    Partial<TypeFromArray<Subclass['spells']>> & { racial?: boolean })[];
  slotLevel?: number;
  spellListOnly?: boolean;
  selectedSpells?: Character['knownSpells'] | Character['preparedSpells'];
  actions?: (_: Spell, _fn?: () => void) => ReactNode;
  searchable?: boolean;
  maxSelected?: [number, number];
  hideLevels?: boolean;
  showDesc?: boolean;
  filterPrerequisites?: boolean;
}

export function SpellList({
  characterInfo,
  additionalSpellList,
  slotLevel,
  spellListOnly = false,
  selectedSpells = [],
  setSelectedSpells,
  actions,
  searchable = false,
  maxSelected = [0, 0],
  hideLevels = false,
  showDesc = false,
  filterPrerequisites = false
}: SpellListProps & {
  setSelectedSpells?: Dispatch<SetStateAction<typeof selectedSpells>>;
}) {
  const { version } = useAuth();
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean | undefined>>({});
  const [currentSpell, setCurrentSpell] = useState<Spell>();
  const [searchText, setSearchText] = useState('');

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

  const filteredAdditionalSpellList = useMemo(
    () =>
      filterPrerequisites && additionalSpellList
        ? filterSpellsByPrerequisites(
            additionalSpellList,
            characterInfo.charLevel || 1,
            characterInfo.classIndex || '',
            characterInfo.features || []
          )
        : additionalSpellList,
    [additionalSpellList, characterInfo, filterPrerequisites]
  );

  const { data: additionalSpells, isFetching: additionalSpellsFetching } = useQueries({
    queries:
      uniqBy(filteredAdditionalSpellList || [], 'index').map(({ index }) => ({
        queryKey: ['fetchSpell', version, index],
        queryFn: async () => (version ? await getSpell(version, index) : null),
        enabled: !!index && !!version
      })) || [],
    combine: useCallback(
      createQueryCombiner<Spell>((data) =>
        data.map((spell) => {
          let formattedData = { ...spell } as Spell;
          const currentSpell = filteredAdditionalSpellList?.find(
            ({ index }) => index === spell?.index
          );

          if (currentSpell?.prerequisites) {
            const preRequisiteLevel = parseInt(
              currentSpell.prerequisites
                .find(({ type }) => type === 'level')
                ?.index.replace(new RegExp(`^${characterInfo.classIndex}-`), '') || '0'
            );

            if (preRequisiteLevel > (spell?.level || 0)) formattedData.level = preRequisiteLevel;
          }
          if (currentSpell?.racial) formattedData.racial = true;

          return formattedData;
        })
      ),
      [filteredAdditionalSpellList, characterInfo.classIndex]
    )
  });

  const allSpells: Record<string, Array<Spell>> = useMemo(() => {
    if (
      !(
        (spellListOnly || !spellsFetching) &&
        !additionalSpellsFetching &&
        (spells.length || additionalSpells.length)
      )
    )
      return {};

    const filteredSpells = (spellListOnly ? [] : spells).filter(({ name, level }) => {
      const isLevel = characterInfo.slotLevels.length
        ? level > 0
          ? (max(characterInfo.slotLevels) ?? 1 >= level)
          : characterInfo.slotLevels.includes(0)
        : true;

      return (
        isLevel && (!searchText.length || name.toLowerCase().includes(searchText.toLowerCase()))
      );
    });
    const sortedSpells = uniqWith(
      [
        ...filteredSpells,
        ...additionalSpells.filter(
          ({ name }) => !searchText.length || name.toLowerCase().includes(searchText.toLowerCase())
        )
      ],
      (a, b) => a.index === b.index && a.level === b.level
    ).sort((a, b) => {
      const aSelected = selectedSpells.find(
        ({ index, level }) => index === a.index && level === a.level
      );
      const bSelected = selectedSpells.find(
        ({ index, level }) => index === b.index && level === b.level
      );

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name);
    });

    return !hideLevels ? groupBy(sortedSpells, 'level') : { all: sortedSpells };
  }, [
    spellListOnly,
    spellsFetching,
    additionalSpellsFetching,
    spells,
    additionalSpells.map(({ index, level }) => `${index}-${level}`).join(', '),
    characterInfo.slotLevels.join(', '),
    hideLevels,
    searchText
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

  return !spellsFetching && !additionalSpellsFetching ? (
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

      {searchable ? (
        <ControledInput
          fullWidth
          id="search"
          type="text"
          label="Search"
          autoComplete="off"
          onChange={(_, value) => setSearchText(value as string)}
        />
      ) : null}

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
                              {spell.racial ? ' - Racial' : ''}
                            </Typography>
                          )}
                          {filteredAdditionalSpellList
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

                  {(setSelectedSpells || actions) && (
                    <CardActions
                      disableSpacing
                      sx={{
                        padding: 0,
                        width: '100%',
                        flexDirection: 'column'
                      }}
                    >
                      {setSelectedSpells &&
                        (selectedSpells.find(({ index }) => index === spell.index) ? (
                          <Button
                            fullWidth
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
                            fullWidth
                            data-testid={`add-spell-${spell.index}`}
                            onClick={() =>
                              setSelectedSpells((prev) => {
                                const canAdd =
                                  prev
                                    .filter((s) => ('added' in s ? !s.added : true))
                                    .filter(({ level }) =>
                                      spell.level === 0 ? level === 0 : level > 0
                                    ).length < maxSelected[spell.level === 0 ? 0 : 1];

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
                        ))}

                      {actions && actions(spell)}
                    </CardActions>
                  )}
                </Card>
              ))}
            </Box>
          </AccordionDetails>
        </ConditionalAccordion>
      ))}

      {Object.values(allSpells).flat().length === 0 && (
        <Typography color="text.secondary" textAlign="center" marginTop={2}>
          No spells to display
        </Typography>
      )}

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
            actions={actions}
            onClose={() => setCurrentSpell(undefined)}
          />
        )}
      </Dialog>
    </Fragment>
  ) : (
    <Loader sx={{ margin: 1 }} />
  );
}
