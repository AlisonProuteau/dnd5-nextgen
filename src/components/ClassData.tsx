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
  getSpellsForClass
} from '../api/ressources';
import type { Classes } from '../representations/character/class.representation';
import type { Race } from '../representations/character/race.representation';
import type { DefaultRepresentation } from '../representations/common.representation';

const AvailableTabs = [
  { id: 'races', label: 'Races' },
  { id: 'classes', label: 'Classes' },
  { id: 'proficiencies', label: 'Proficiencies' },
  { id: 'features', label: 'Features' }
];

export function ClassData() {
  const [selectedTab, setSelectedTab] = useState(AvailableTabs[0].id);
  const [level, setLevel] = useState<number>();
  const [selectedClass, setSelectedClass] = useState<Classes | DefaultRepresentation>();
  const [selectedRace, setSelectedRace] = useState<Race | DefaultRepresentation>();

  const { data: races } = useQuery('fetchRaces', async () => {
    return (await getAllRaces()).results;
  });

  const { data: raceInfo, dataUpdatedAt: raceInfoUpdatedAt } = useQuery(
    ['fetchRaceInfo', selectedRace?.index],
    async () => {
      if (!selectedRace) return {};

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
    ['fetchClassInfo', selectedClass?.index],
    async () => {
      if (!selectedClass) return {};

      return await getClassInfo(selectedClass.index);
    },
    { enabled: !!selectedClass?.index }
  );

  const { data: spells, isLoading: isSpellsLoading } = useQuery(
    ['fetchSpells', selectedClass?.index, level],
    async () => {
      if (!selectedClass) return { count: 0, results: undefined };

      return await getSpellsForClass(selectedClass.index, level);
    },
    { enabled: !!selectedClass?.index }
  );

  const { data: features, isLoading: isFeaturesLoading } = useQuery(
    ['fetchFeatures', selectedClass?.index],
    async () => {
      if (!selectedClass?.index) return;

      return await getFeaturesForClass(selectedClass?.index);
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
    if (selectedClass) {
      const expandedClass = { ...selectedClass, ...classInfo };
      setSelectedClass(expandedClass);
    }
  }, [selectedClass?.index, classInfoUpdatedAt]);

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
                          <TableCell>
                            {JSON.stringify(
                              selectedRace[key as keyof (DefaultRepresentation | Race)]
                            )}
                          </TableCell>
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
                  onChange={({ target }) =>
                    setSelectedClass(classes?.find((e) => e.index === target.value))
                  }
                >
                  {classes.map((currentClass) => (
                    <MenuItem key={currentClass.index} value={currentClass.index}>
                      {currentClass.name}
                    </MenuItem>
                  ))}
                </Select>
                <Checkbox
                  aria-label="All Levels"
                  title="All levels"
                  defaultChecked={true}
                  onChange={(_, checked) => (checked ? setLevel(undefined) : setLevel(1))}
                />
              </Box>

              {!!level && !!(selectedClass as Classes)?.spellcasting && (
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
                            {JSON.stringify(
                              selectedClass[key as keyof (DefaultRepresentation | Classes)]
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {(selectedClass as Classes)?.spellcasting && (
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    Spells -{' '}
                    {isSpellsLoading ? <CircularProgress size={12} /> : spells?.count || 'none'}
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableBody>
                          {spells?.results?.map((spell) => (
                            <TableRow key={`spell-${spell.index}`}>
                              <TableCell>{spell.index}</TableCell>
                              <TableCell>{spell.name}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}
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

        {selectedTab === 'features' &&
          (isFeaturesLoading || !features?.count ? (
            <CircularProgress />
          ) : (
            <Box display="flex" flexDirection="column" gap="15px">
              <Typography variant="h5">Features - {features?.count || 'none'}</Typography>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableBody>
                    {features?.results?.map((feat) => (
                      <TableRow key={`spell-${feat.index}`}>
                        <TableCell>{feat.index}</TableCell>
                        <TableCell>{feat.name}</TableCell>
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
