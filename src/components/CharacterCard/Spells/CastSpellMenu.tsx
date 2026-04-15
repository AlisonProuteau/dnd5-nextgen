import { Fragment, useMemo, useState } from 'react';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import type { Spell } from '@representations/abilities/magic.representation';

interface CastSpellMenuProps {
  spell: Spell;
  availableSlots?: Record<string, number>;
  handleCastSpell?: (spell: Spell, slotLevel?: number | 'ritual') => void;
  canCastRitual?: boolean;
  disabled?: boolean;
}

export function CastSpellMenu({
  spell,
  availableSlots = {},
  handleCastSpell = () => undefined,
  canCastRitual = false,
  disabled = false
}: CastSpellMenuProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const availableSlotLevels = useMemo(() => {
    if (spell.level === 0) return [];

    const regularAvailableSlots = Object.entries(availableSlots)
      .filter(([level, available]) => parseInt(level) >= spell.level && available > 0)
      .map(([level]) => parseInt(level))
      .sort((a, b) => a - b);

    return spell.ritual && canCastRitual && regularAvailableSlots.length
      ? regularAvailableSlots.concat([0])
      : regularAvailableSlots;
  }, [availableSlots, spell]);

  const castDisabled = useMemo(
    () =>
      spell.level > 0 &&
      (!availableSlots ||
        !Object.entries(availableSlots).some(
          ([level, available]) => parseInt(level) >= spell.level && available > 0
        )),
    [availableSlots, spell]
  );

  return spell.level > 0 && !spell.racial ? (
    <Fragment>
      <Button
        fullWidth
        key={`cast-spell-${spell.index}`}
        data-testid={`cast-spell-${spell.index}`}
        disabled={castDisabled || disabled}
        onClick={(e) => {
          if (availableSlotLevels.length > 1) setMenuAnchor(e.currentTarget);
          else handleCastSpell(spell, availableSlotLevels[0]);
        }}
      >
        Cast
      </Button>

      {availableSlotLevels.length > 1 && (
        <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
          {menuAnchor &&
            availableSlotLevels.map((slotLevel: number) =>
              slotLevel > 0 ? (
                <MenuItem
                  key={slotLevel}
                  onClick={() => {
                    handleCastSpell(spell, slotLevel);
                    setMenuAnchor(null);
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography>Level {slotLevel}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({availableSlots?.[slotLevel.toString()] || 0} available)
                    </Typography>
                    {slotLevel > spell.level && (
                      <Typography variant="caption" color="primary">
                        (Upcast)
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ) : (
                <MenuItem
                  key="ritual"
                  onClick={() => {
                    handleCastSpell(spell, 'ritual');
                    setMenuAnchor(null);
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography>Ritual Cast</Typography>
                    <Typography variant="caption" color="primary">
                      (+10 minutes - no slot)
                    </Typography>
                  </Box>
                </MenuItem>
              )
            )}
        </Menu>
      )}
    </Fragment>
  ) : null;
}
