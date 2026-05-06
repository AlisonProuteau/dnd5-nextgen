import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { Spell } from '@representations/abilities/magic.representation';

interface SpellRowProps {
  spell: Partial<Pick<Spell, 'index' | 'name' | 'level' | 'school' | 'ritual' | 'concentration'>>;
  showMeta: boolean;
  isFirst: boolean;
  icon: 'add' | 'remove';
  onAction: () => void;
  testId: string;
}

export function SpellSearchRow({
  spell,
  showMeta,
  isFirst,
  icon,
  onAction,
  testId
}: SpellRowProps) {
  return (
    <Box
      key={`spell-search-row-${spell.index}`}
      display="flex"
      alignItems="center"
      sx={{ borderTop: !isFirst ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
    >
      <IconButton onClick={onAction} data-testid={testId}>
        {icon === 'remove' ? (
          <RemoveCircleOutline color="info" fontSize="small" />
        ) : (
          <AddCircleOutline color="info" fontSize="small" />
        )}
      </IconButton>
      <Box display="flex" alignItems="baseline" columnGap={0.75} flexWrap="wrap">
        <Typography variant="body2">{spell.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {spell.level === 0 ? 'Cantrip' : `Lv ${spell.level}`}
          {showMeta && spell.school?.name ? ` · ${spell.school.name}` : ''}
          {showMeta && spell.ritual ? ' · Ritual' : ''}
          {showMeta && spell.concentration ? ' · Con' : ''}
        </Typography>
      </Box>
    </Box>
  );
}
