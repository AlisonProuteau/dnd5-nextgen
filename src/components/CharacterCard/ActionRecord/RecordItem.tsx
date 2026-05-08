import { Fragment, ReactNode, useMemo, useState } from 'react';
import {
  AutoAwesome,
  Build,
  CheckCircle,
  Delete,
  Edit,
  Favorite,
  Payments,
  Psychology,
  Star
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { ControledInput } from '@shared/ControledInput';
import { Loader } from '@shared/Loader';
import { formatDateDisplay } from '@utils/date.utils';
import type { ActionRecord, ActionRecordType } from '@representations/user.representation';

export const TYPE_CONFIG_ICON: Record<ActionRecordType, ReactNode> = {
  spell: <AutoAwesome fontSize="small" color="secondary" />,
  feature: <Star fontSize="small" color="secondary" />,
  trait: <Psychology fontSize="small" color="secondary" />,
  health: <Favorite fontSize="small" color="secondary" />,
  money: <Payments fontSize="small" color="secondary" />,
  custom: <Build fontSize="small" color="secondary" />
};

interface RecordItemProps {
  record: ActionRecord;
  onEditDescription: (id: string, description: string) => Promise<boolean>;
  onDelete: (record: ActionRecord, invalidate?: boolean) => Promise<boolean>;
  showDivider: boolean;
}

export function RecordItem({ record, onDelete, onEditDescription, showDivider }: RecordItemProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [description, setDescription] = useState(record.description ?? '');

  const onEditSave = async (id: string) => {
    setIsSaving(true);
    if (record.description !== description) await onEditDescription(id, description);
    setEditing(false);
    setIsSaving(false);
  };

  const onActionDelete = async (record: ActionRecord) => {
    setIsSaving(true);
    await onDelete(record, true);
    setIsSaving(false);
  };

  const onEditCancel = () => {
    setDescription(record.description ?? '');
    setEditing(false);
  };

  const valueColor = useMemo(() => {
    if (record.value === undefined) return undefined;

    switch (record.valueUnit) {
      case 'success':
        return 'success';
      case 'failure':
        return 'error';
      default:
        return record.value > 0 ? 'success' : record.value < 0 ? 'error' : undefined;
    }
  }, [record.value, record.valueUnit]);

  return (
    <Fragment>
      <ListItem
        alignItems="flex-start"
        data-testid={`record-item-${record.id}`}
        slotProps={{ root: { style: { paddingRight: !record.auto ? '72px' : '48px' } } }}
        secondaryAction={
          <Box display="flex" gap={0.25}>
            {isSaving && isEditing ? (
              <Loader />
            ) : (
              <IconButton
                size="small"
                edge="end"
                data-testid={`record-${isEditing ? 'save' : 'edit'}`}
                onClick={() => (isEditing ? onEditSave(record.id) : setEditing(true))}
                disabled={isSaving}
              >
                {isEditing ? (
                  <CheckCircle fontSize="small" color="primary" />
                ) : (
                  <Edit fontSize="small" />
                )}
              </IconButton>
            )}

            {isSaving && !isEditing ? (
              <Loader />
            ) : (
              <IconButton
                size="small"
                edge="end"
                data-testid="record-delete"
                onClick={async () => await onActionDelete(record)}
                disabled={isSaving}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
      >
        <ListItemIcon>{TYPE_CONFIG_ICON[record.type]}</ListItemIcon>

        <ListItemText
          slotProps={{ secondary: { component: 'div' as const } }}
          primary={
            <Box display="flex" alignItems="baseline" gap={1} flexWrap="wrap">
              <Typography variant="body2" fontWeight={600}>
                {record.name}
              </Typography>
              {record.value !== undefined && (
                <Chip
                  label={`${record.value > 0 ? '+' : ''}${record.value}${record.valueUnit ? ` ${record.valueUnit}` : ''}`}
                  size="small"
                  color={valueColor}
                />
              )}
              {record.auto && <Chip label="auto" size="small" sx={{ opacity: 0.6 }} />}
            </Box>
          }
          secondary={
            <Box display="flex" flexDirection="column" gap={0.25}>
              {isEditing ? (
                <ControledInput
                  fullWidth
                  autoFocus
                  multiline
                  minRows={1}
                  maxRows={5}
                  size="small"
                  value={description ?? ''}
                  onChange={(_, v) => typeof v === 'string' && setDescription(v ?? '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onEditSave(record.id);
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      onEditCancel();
                    }
                  }}
                />
              ) : (
                record.description && (
                  <Typography
                    variant="caption"
                    textAlign="justify"
                    color="text.secondary"
                    whiteSpace="pre-wrap"
                    noWrap
                  >
                    {record.description}
                  </Typography>
                )
              )}
              {record.equipment && (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {record.equipment.name}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled">
                {formatDateDisplay(record.createdAt, 'minute')}
              </Typography>
            </Box>
          }
        />
      </ListItem>

      {showDivider && <Divider component="li" variant="inset" />}
    </Fragment>
  );
}
