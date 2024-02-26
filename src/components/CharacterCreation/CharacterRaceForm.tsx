import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getAllRaces, getRaceInfo } from '../../api/characters';
import type { DefaultInstance } from '../../representations/default.representation';
import type { CharacterFormData } from './CharacterCreation';

export function CharacterRaceForm({
  setFormData
}: {
  setFormData: (raceInfo: Partial<CharacterFormData>) => void;
}) {
  const [selectedRace, setselectedRace] = useState<DefaultInstance>();
  const [selectedSubrace, setselectedSubrace] = useState<DefaultInstance>();

  const { data: races } = useQuery('fetchRaces', async () => {
    return (await getAllRaces()).results;
  });

  const { data: raceInfo } = useQuery(
    ['fetchRaceInfo', selectedRace?.index],
    async () => {
      if (!selectedRace?.index) return;

      return await getRaceInfo(selectedRace?.index);
    },
    { enabled: !!selectedRace?.index }
  );

  useEffect(() => {
    if (raceInfo?.subraces?.length && !selectedSubrace) setselectedSubrace(raceInfo.subraces[0]);
  }, [raceInfo?.subraces?.map((r) => r.index).join(' ')]);

  return (
    <Box>
      <Divider component="div" role="presentation" sx={{ paddingTop: '15px' }} variant="middle">
        <Typography>Race Selection</Typography>
      </Divider>
      {races && (
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="race">Race</InputLabel>
          <Select
            fullWidth
            id="race"
            label="Race"
            disabled={!races}
            value={selectedRace?.index || ''}
            onChange={({ target }) => {
              setselectedRace(races.find((e) => e.index === target.value));
              setselectedSubrace(undefined);
            }}
          >
            {races.map((currentRace) => (
              <MenuItem key={currentRace.index} id={currentRace.index} value={currentRace.index}>
                {currentRace.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {!!raceInfo?.subraces?.length && (
        <FormControl fullWidth margin="dense">
          <InputLabel htmlFor="subRace">Sub-Race</InputLabel>
          <Select
            fullWidth
            id="subRace"
            label="Sub-Race"
            value={selectedSubrace?.index || raceInfo.subraces[0].index}
            onChange={({ target }) =>
              setselectedSubrace(raceInfo.subraces?.find((e) => e.index === target.value))
            }
          >
            {raceInfo.subraces.map((currentSubRace) => (
              <MenuItem
                key={currentSubRace.index}
                id={currentSubRace.index}
                value={currentSubRace.index}
              >
                {currentSubRace.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Button
        disabled={!selectedRace?.index && (!raceInfo?.subraces?.length || !selectedSubrace?.index)}
        sx={{ marginTop: '1rem' }}
        fullWidth
        type="button"
        variant="contained"
        onClick={() => {
          if (selectedSubrace?.index) setFormData({ race: selectedRace, subrace: selectedSubrace });
          else setFormData({ race: selectedRace });
        }}
      >
        Next
      </Button>
    </Box>
  );
}
