import { SpeedDial, SpeedDialAction, SpeedDialIcon, type SpeedDialProps } from '@mui/material';
import { useMemo, type ReactNode } from 'react';

export default function SpeedDialButton({
  actions,
  size,
  disabled = false,
  ...props
}: SpeedDialProps & {
  actions: { icon: ReactNode; name: string }[];
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}) {
  const getSize = (size: 'small' | 'medium' | 'large' | undefined) => {
    switch (size) {
      case 'small':
        return 25;
      case 'small':
        return 25;
      case 'medium':
        return 30;
      case 'large':
      default:
        return 35;
    }
  };

  const buttonSize = useMemo(
    () => ({
      width: `${getSize(size)}px`,
      height: `${getSize(size)}px`,
      minHeight: `${getSize(size)}px`
    }),
    [size]
  );

  return (
    <SpeedDial
      FabProps={{ size, sx: buttonSize }} // slotProps={{ fab: { ... } }}
      icon={<SpeedDialIcon />}
      {...props}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          slotProps={{
            fab: { size, sx: { margin: 1, ...buttonSize }, disabled },
            tooltip: { title: action.name }
          }}
        />
      ))}
    </SpeedDial>
  );
}
