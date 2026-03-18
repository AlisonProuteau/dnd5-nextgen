import { useMemo } from 'react';
import { Box, List, Typography } from '@mui/material';
import { Loader } from '@shared/Loader';
import { ScrollableContainer } from '@shared/ScrollableContainer';
import { groupByDay } from '@utils/date.utils';
import type { ActionRecord, ActionRecordType } from '@representations/user.representation';
import { RecordItem } from './RecordItem';

type FilterType = ActionRecordType | 'all';

interface ActionRecordListProps {
  records: ActionRecord[];
  onDelete: (id: string) => void;
  onEditDescription: (id: string, description: string) => Promise<boolean>;
  filter: FilterType;
  isLoading?: boolean;
}

export function ActionRecordList({
  records,
  onDelete,
  onEditDescription,
  filter,
  isLoading
}: ActionRecordListProps) {
  const recordsByDay = useMemo(
    () => groupByDay(filter === 'all' ? records : records.filter((r) => r.type === filter)),
    [filter, records]
  );

  return isLoading ? (
    <Loader />
  ) : recordsByDay.length === 0 ? (
    <Typography
      variant="body2"
      color="text.secondary"
      textAlign="center"
      height="100%"
      alignContent="center"
    >
      Nothing to show yet.
      <br />
      Your actions will be tracked here as you play, or log your own at any time.
    </Typography>
  ) : (
    <ScrollableContainer>
      {recordsByDay.map(([day, dayRecords]) => (
        <Box key={day}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {day}
            </Typography>
          </Box>

          <List disablePadding dense>
            {dayRecords.map((record, i) => (
              <RecordItem
                key={record.id}
                record={record}
                onDelete={onDelete}
                onEditDescription={onEditDescription}
                showDivider={i < dayRecords.length - 1}
              />
            ))}
          </List>
        </Box>
      ))}
    </ScrollableContainer>
  );
}
