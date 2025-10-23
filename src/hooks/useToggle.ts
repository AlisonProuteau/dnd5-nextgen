import { useCallback, useState } from 'react';

export interface UseToggleReturn {
  isOn: boolean;
  turnOn: () => void;
  turnOff: () => void;
  toggle: () => void;
  setIsOn: (value: boolean) => void;
}

export const useToggle = (initialValue: boolean = false): UseToggleReturn => {
  const [isOn, setIsOn] = useState(initialValue);

  const turnOn = useCallback(() => setIsOn(true), []);
  const turnOff = useCallback(() => setIsOn(false), []);
  const toggle = useCallback(() => setIsOn((prev) => !prev), []);

  return {
    isOn,
    turnOn,
    turnOff,
    toggle,
    setIsOn
  };
};
