import { Typography } from '@mui/material';
import { Box } from '@mui/system';

export function EquipmentLine({ label, data }: { label: string; data: string | string[] }) {
  return (
    <Box display="flex" flexWrap="wrap" alignItems="baseline" columnGap="5px" textAlign="justify">
      <Typography variant="body2" color="lightgrey" display="inline">
        {label}:
      </Typography>
      {Array.isArray(data)
        ? data.map((d, i) => (
            <Typography key={`${label}-${i}`} display={i === 0 ? 'contents' : 'inline-flex'}>
              {d}
            </Typography>
          ))
        : data}
    </Box>
  );
}
