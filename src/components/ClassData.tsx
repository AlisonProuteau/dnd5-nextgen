import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Select,
  Slider,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tabs,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import {
  getAllClasses,
  getAllRaces,
  getClassInfo,
  getFeaturesForClass,
  getProficiencies,
  getRaceInfo,
  getSpellsForClass,
  getSubclassInfo
} from '../api/ressources';
import type { Spell } from '../representations/abilities/magic.representation';
import type { Classes, Subclass } from '../representations/character/class.representation';
import type { Race } from '../representations/character/race.representation';

const AvailableTabs = [
  { id: 'races', label: 'Races' },
  { id: 'classes', label: 'Classes' },
  { id: 'proficiencies', label: 'Proficiencies' }
];

export function ClassData() {
  const [selectedTab, setSelectedTab] = useState(AvailableTabs[0].id);
  const [level, setLevel] = useState<number>();
  const [selectedClass, setSelectedClass] = useState<Partial<Classes>>();
  const [selectedSubclass, setSelectedSubclass] = useState<Partial<Subclass>>();
  const [selectedRace, setSelectedRace] = useState<Partial<Race>>();
  // const [selectedRace, setSelectedRace] = useState<Partial<Race>>();

  const { data: races } = useQuery('fetchRaces', async () => {
    return (await getAllRaces()).results;
  });

  const { data: raceInfo, dataUpdatedAt: raceInfoUpdatedAt } = useQuery(
    ['fetchRaceInfo', selectedRace?.index],
    async () => {
      if (!selectedRace?.index) return {};

      return await getRaceInfo(selectedRace.index);
    },
    { enabled: !!selectedRace?.index }
  );

  useEffect(() => {
    setSelectedRace(races?.[0]);
  }, [!selectedRace?.index ? JSON.stringify(races) : '']);

  useEffect(() => {
    if (selectedRace) {
      const expandedRace = { ...selectedRace, ...raceInfo };
      setSelectedRace(expandedRace);
    }
  }, [selectedRace?.index, raceInfoUpdatedAt]);

  const { data: classes } = useQuery('fetchClasses', async () => {
    return (await getAllClasses()).results;
  });

  const { data: classInfo, dataUpdatedAt: classInfoUpdatedAt } = useQuery(
    ['fetchClassInfo', selectedClass?.index, selectedSubclass?.index],
    async () => {
      if (!selectedClass?.index) return {};

      return await getClassInfo(selectedClass.index);
    },
    { enabled: !!selectedClass?.index }
  );

  const { data: subclassInfo, dataUpdatedAt: subclassInfoUpdatedAt } = useQuery(
    ['fetchSubclassInfo', selectedClass?.index, selectedSubclass?.index],
    async () => {
      if (!selectedClass?.index || !selectedSubclass?.index) return {};

      return await getSubclassInfo(selectedClass.index, selectedSubclass.index);
    },
    { enabled: !!(selectedClass?.index && selectedSubclass?.index) }
  );

  const { data: spells, isLoading: isSpellsLoading } = useQuery(
    ['fetchSpells', selectedClass?.index, selectedSubclass?.index, level],
    async () => {
      if (!selectedClass?.index) return { count: 0, results: undefined };

      return await getSpellsForClass(selectedClass.index, selectedSubclass?.index, level);
    },
    { enabled: !!selectedClass?.index }
  );

  const { data: features, isLoading: isFeaturesLoading } = useQuery(
    ['fetchFeatures', selectedClass?.index, selectedSubclass?.index, level],
    async () => {
      if (!selectedClass?.index) return;

      return await getFeaturesForClass(selectedClass?.index, selectedSubclass?.index, level);
    },
    { enabled: !!selectedClass?.index }
  );

  const { data: proficiencies, isLoading: isProficienciesLoading } = useQuery(
    'fetchProficiencies',
    async () => await getProficiencies()
  );

  useEffect(() => {
    setSelectedClass(classes?.[0]);
  }, [!selectedClass?.index ? JSON.stringify(classes) : '']);

  useEffect(() => {
    setSelectedSubclass(selectedClass?.subclasses?.[0]);
  }, [selectedClass?.index, JSON.stringify(selectedClass?.subclasses)]);

  useEffect(() => {
    if (selectedClass?.index) {
      const expandedClass = { ...selectedClass, ...classInfo };
      setSelectedClass(expandedClass);
    }
  }, [selectedClass?.index, classInfoUpdatedAt]);

  useEffect(() => {
    if (selectedSubclass?.index) {
      const expandedSubclass = { ...selectedSubclass, ...subclassInfo };
      setSelectedSubclass(expandedSubclass);
    }
  }, [selectedSubclass?.index, subclassInfoUpdatedAt]);

  return (
    <Container>
      <Tabs
        value={selectedTab}
        onChange={(_, value) => setSelectedTab(value)}
        aria-label="wrapped label tabs example"
      >
        {AvailableTabs.map(({ id, label }) => (
          <Tab key={id} value={id} label={label} />
        ))}
      </Tabs>

      <Box padding="15px">
        {selectedTab === 'races' &&
          (!races ? (
            <CircularProgress />
          ) : (
            <Box display="flex" flexDirection="column" gap="15px">
              <Select
                value={selectedRace?.index || ''}
                onChange={({ target }) =>
                  setSelectedRace(races?.find((e) => e.index === target.value))
                }
              >
                {races.map((currentRace) => (
                  <MenuItem key={currentRace.index} value={currentRace.index}>
                    {currentRace.name}
                  </MenuItem>
                ))}
              </Select>

              {selectedRace && (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableBody>
                      {Object.keys(selectedRace).map((key) => (
                        <TableRow
                          key={key}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{key}</TableCell>
                          <TableCell>{JSON.stringify(selectedRace[key as keyof Race])}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ))}

        {selectedTab === 'classes' &&
          (!classes ? (
            <CircularProgress />
          ) : (
            <Box display="flex" flexDirection="column" gap="15px">
              <Box display="flex">
                <Select
                  fullWidth
                  value={selectedClass?.index || ''}
                  onChange={({ target }) => {
                    setSelectedSubclass(undefined);
                    setSelectedClass(classes?.find((e) => e.index === target.value));
                  }}
                >
                  {classes.map((currentClass) => (
                    <MenuItem key={currentClass.index} value={currentClass.index}>
                      {currentClass.name}
                    </MenuItem>
                  ))}
                </Select>
                {selectedClass?.subclasses?.length && (
                  <Select
                    fullWidth
                    value={selectedSubclass?.index || selectedClass.subclasses[0].index}
                    onChange={({ target }) =>
                      setSelectedSubclass(
                        selectedClass.subclasses?.find((e) => e.index === target.value)
                      )
                    }
                  >
                    {selectedClass.subclasses?.map((currentSubclass) => (
                      <MenuItem key={currentSubclass.index} value={currentSubclass.index}>
                        {currentSubclass.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
                <Checkbox
                  aria-label="All Levels"
                  title="All levels"
                  defaultChecked={true}
                  onChange={(_, checked) => (checked ? setLevel(undefined) : setLevel(1))}
                />
              </Box>

              {!!level && (
                <Slider
                  style={{ marginTop: '30px' }}
                  aria-label="Levels"
                  valueLabelDisplay="auto"
                  marks
                  min={1}
                  max={9}
                  value={level}
                  onChange={(_, value) => setLevel(typeof value === 'number' ? value : undefined)}
                />
              )}

              {selectedClass && (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableBody>
                      {Object.keys(selectedClass).map((key) => (
                        <TableRow
                          key={key}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{key}</TableCell>
                          <TableCell>
                            {JSON.stringify(selectedClass[key as keyof Classes])}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {selectedSubclass && (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableBody>
                      {Object.keys(selectedSubclass).map((key) => (
                        <TableRow
                          key={key}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{key}</TableCell>
                          <TableCell>
                            {JSON.stringify(selectedSubclass[key as keyof Subclass])}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  {`Spells - ${
                    isSpellsLoading ? <CircularProgress size={12} /> : spells?.count || 'none'
                  }`}
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                      <TableBody>
                        {spells?.results?.map((spell) => (
                          <TableRow key={`spell-${spell.index}`}>
                            <TableCell>{spell.index}</TableCell>
                            {Object.keys(spell).map((key) => (
                              <TableCell key={key}>
                                {key}: {JSON.stringify(spell[key as keyof Spell])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  {`Features - ${
                    isFeaturesLoading ? <CircularProgress size={12} /> : features?.count || 'none'
                  }`}
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                      <TableBody>
                        {features?.results?.map((feat) => (
                          <TableRow key={`feature-${feat.index}`}>
                            <TableCell>{feat.index}</TableCell>
                            <TableCell>{feat.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Box>
          ))}

        {selectedTab === 'proficiencies' &&
          (isProficienciesLoading || !proficiencies?.count ? (
            <CircularProgress />
          ) : (
            <Box display="flex" flexDirection="column" gap="15px">
              <Typography variant="h5">Proficiencies - {proficiencies?.count || 'none'}</Typography>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableBody>
                    {proficiencies?.results?.map((prof) => (
                      <TableRow key={`spell-${prof.index}`}>
                        <TableCell>{prof.index}</TableCell>
                        <TableCell>{prof.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
      </Box>
    </Container>
  );
}
