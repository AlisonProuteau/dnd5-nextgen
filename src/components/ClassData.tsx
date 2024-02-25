import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getAllClasses, getAllRaces, getClassInfo, getRaceInfo } from '../api/characters';
import { getSpellsForClass } from '../api/spells';
import { ClassInfo, type RaceInfo } from '../representations/classes.representation';

export function ClassData() {
  const [level, setLevel] = useState<number>();
  const [selectedClass, setSelectedClass] = useState<ClassInfo>();
  const [selectedRace, setSelectedRace] = useState<RaceInfo>();

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

  useEffect(() => {
    setSelectedClass(classes?.[0]);
  }, [!selectedClass?.index ? JSON.stringify(classes) : '']);

  useEffect(() => {
    if (selectedClass) {
      const expandedClass = { ...selectedClass, ...classInfo };
      setSelectedClass(expandedClass);
    }
  }, [selectedClass?.index, classInfoUpdatedAt]);

  return classes && races ? (
    <Fragment>
      <Select
        label="Races"
        value={selectedRace?.index || ''}
        onChange={({ target }) => setSelectedRace(races?.find((e) => e.index === target.value))}
      >
        {races.map((currentRace) => (
          <MenuItem key={currentRace.index} value={currentRace.index}>
            {currentRace.name}
          </MenuItem>
        ))}
      </Select>

      <Select
        label="Classes"
        value={selectedClass?.index || ''}
        onChange={({ target }) => setSelectedClass(classes?.find((e) => e.index === target.value))}
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

      {selectedRace && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableBody>
              {Object.keys(selectedRace).map((key) => (
                <TableRow key={key} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{key}</TableCell>
                  <TableCell>{JSON.stringify(selectedRace[key as keyof RaceInfo])}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedClass && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableBody>
              {Object.keys(selectedClass).map((key) => (
                <TableRow key={key} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{key}</TableCell>
                  <TableCell>{JSON.stringify(selectedClass[key as keyof ClassInfo])}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedClass?.spellcasting && (
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            Spells - {isSpellsLoading ? <CircularProgress size={12} /> : spells?.count || 'none'}
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
    </Fragment>
  ) : (
    <CircularProgress />
  );
}
