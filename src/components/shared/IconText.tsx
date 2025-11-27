import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { FunctionComponent, SVGProps } from 'react';

interface IconTextProps {
  Icon: FunctionComponent<SVGProps<SVGSVGElement> & { title?: string | undefined }>;
  value?: string | number;
  label?: string;
  color?: string;
  size?: string;
  top?: string;
  testid?: string;
}

export function IconText({
  Icon,
  value,
  label,
  color,
  size = '50px',
  top = '38px',
  testid
}: IconTextProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      textAlign="center"
      marginTop={`-${top}`}
      paddingBottom={label ? '0px' : '20px'}
      data-testid={testid}
    >
      {value !== undefined && value !== null ? (
        <Typography
          position="relative"
          top={top}
          sx={{ textShadow: '1px 1px 0 #000, -1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000' }}
        >
          {value}
        </Typography>
      ) : null}
      <Icon title={label} aria-label={label} width={size} height={size} fill={color} />
      {label && <Typography>{label}</Typography>}
    </Box>
  );
}
