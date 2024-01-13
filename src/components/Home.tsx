import { Search } from '@mui/icons-material';
import { MenuItem, Select, Slider } from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Outlet } from 'react-router-dom';
import { getSpellsForClass } from '../api/spells';
import { Classes } from '../representations/class';

export function Home() {
  const [level, setLevel] = useState<number>();
  const [selectedClass, setSelectedClass] = useState<Classes>();

  useEffect(() => {
    setSelectedClass(Classes.sorcerer);
  }, []);

  const { data: spells, isLoading: isSpellsLoading } = useQuery<{
    count: number;
    results: unknown;
  }>(
    ['fetchSpells', selectedClass, level],
    async () => {
      if (!selectedClass) return { count: 0, results: undefined };

      const data = await getSpellsForClass(selectedClass, level);
      console.log(data);
      return data;
    },
    { enabled: !!selectedClass }
  );

  return (
    <Fragment>
      <Select
        label="Classes"
        value={selectedClass}
        onChange={({ target }) => setSelectedClass(target.value as Classes)}
      >
        {Object.values(Classes).map((currentClass: Classes) => (
          <MenuItem key={currentClass} value={currentClass}>
            {currentClass}
          </MenuItem>
        ))}
      </Select>
      <Slider
        style={{ marginTop: '30px' }}
        aria-label="Spell levels"
        valueLabelDisplay="auto"
        marks
        defaultValue={0}
        min={0}
        max={9}
        value={level}
        onChange={(_, value) => setLevel(typeof value === 'number' ? value : undefined)}
      />
      <div>Spells: {isSpellsLoading ? <Search fontSize="small" /> : spells?.count || 'none'}</div>
      <Outlet />
    </Fragment>
  );
}
