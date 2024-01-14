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
import { Outlet } from 'react-router-dom';
import { getAllClasses, getClasseInfo } from '../api/classes';
import { getSpellsForClass } from '../api/spells';
import { ClassInfo } from '../representations/classes.representation';

export function Home() {
  const [level, setLevel] = useState<number>();
  const [selectedClass, setSelectedClass] = useState<ClassInfo>();

  const { data: classes } = useQuery('fetchClasses', async () => {
    return (await getAllClasses()).results;
  });

  const { data: classInfo, dataUpdatedAt: classInfoUpdatedAt } = useQuery(
    ['fetchClassInfo', selectedClass?.index],
    async () => {
      if (!selectedClass) return {};

      return await getClasseInfo(selectedClass.index);
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

  return classes ? (
    <Fragment>
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
      <Outlet />
    </Fragment>
  ) : (
    <CircularProgress />
  );
}
