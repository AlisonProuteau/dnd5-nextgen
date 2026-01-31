import { Fragment, useEffect, useRef, useState } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { useToggle } from '@hooks/useToggle';

interface SplitButtonProps {
  options: { text: string; value: string }[];
  onClick: (value: string) => void;
  defaultValue?: string;
  variant?: 'contained' | 'outlined' | 'text';
}

export function SplitButton({
  options,
  onClick,
  defaultValue,
  variant = 'contained'
}: SplitButtonProps) {
  const { isOn, turnOff, toggle } = useToggle();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(defaultValue || options[0].value);

  const handleMenuItemClick = (index: string) => {
    setSelectedIndex(index);
    onClick(index);
    turnOff();
  };

  const handleClose = (event: Event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) return;
    turnOff();
  };

  useEffect(() => {
    if (defaultValue) setSelectedIndex(defaultValue);
  }, [defaultValue]);

  return (
    <Fragment>
      <ButtonGroup variant={variant} ref={anchorRef} aria-label="Button group with a nested menu">
        <Button>{options.find(({ value }) => selectedIndex === value)?.text}</Button>
        <Button
          size="small"
          aria-controls={isOn ? 'split-button-menu' : undefined}
          aria-expanded={isOn ? 'true' : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={toggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1
        }}
        open={isOn}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom'
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option) => (
                    <MenuItem
                      key={`split-button-${option.value}`}
                      selected={option.value === selectedIndex}
                      onClick={() => handleMenuItemClick(option.value)}
                    >
                      {option.text}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Fragment>
  );
}
