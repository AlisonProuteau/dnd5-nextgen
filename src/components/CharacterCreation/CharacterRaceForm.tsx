import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getAllRaces, getRaceInfo } from '../../api/ressources';
import type { DefaultRepresentation } from '../../representations/common.representation';
import type { CharacterFormData } from './CharacterCreation';

interface CharacterRaceFormProps {
  onNext: (raceInfo: Partial<CharacterFormData>) => void;
}

export function CharacterRaceForm({ onNext }: CharacterRaceFormProps) {
  const [selectedRace, setselectedRace] = useState<DefaultRepresentation>();
  const [selectedSubrace, setselectedSubrace] = useState<DefaultRepresentation>();

  const { data: races } = useQuery('fetchRaces', async () => (await getAllRaces()).results);
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
        sx={{ float: 'right' }}
        disabled={!selectedRace?.index && (!raceInfo?.subraces?.length || !selectedSubrace?.index)}
        onClick={() => {
          if (selectedSubrace?.index) onNext({ race: selectedRace, subrace: selectedSubrace });
          else onNext({ race: selectedRace });
        }}
      >
        Next
      </Button>
    </Box>
  );
}
