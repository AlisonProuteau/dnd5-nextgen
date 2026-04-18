import { Fragment, useMemo, useState } from 'react';
import { Box, Button, List, Typography } from '@mui/material';
import { Dayjs } from 'dayjs';
import { Loader } from '@shared/Loader';
import { ScrollableContainer } from '@shared/ScrollableContainer';
import { groupByDay } from '@utils/date.utils';
import type { ActionRecord, ActionRecordType } from '@representations/user.representation';
import { RecordItem } from './RecordItem';

type FilterType = ActionRecordType | 'all';

interface ActionRecordListProps {
  records: ActionRecord[];
  onDelete: (id: string, invalidate?: boolean) => Promise<boolean>;
  onEditDescription: (id: string, description: string) => Promise<boolean>;
  filter: FilterType;
  dateFrom: Dayjs | null;
  dateTo: Dayjs | null;
  isLoading?: boolean;
}

export function ActionRecordList({
  records,
  onDelete,
  onEditDescription,
  filter,
  dateFrom,
  dateTo,
  isLoading
}: ActionRecordListProps) {
  const [isClearing, setIsClearing] = useState(false);

  const filteredRecords = useMemo(() => {
    const from = dateFrom?.isValid() ? dateFrom?.startOf('day').toDate() : undefined;
    const to = dateTo?.isValid() ? dateTo?.endOf('day').toDate() : undefined;

    return records.filter((r) => {
      if (from && r.createdAt < from) return false;
      if (to && r.createdAt > to) return false;
      if (filter !== 'all' && r.type !== filter) return false;

      return true;
    });
  }, [records, dateFrom, dateTo, filter]);

  const clearAll = async () => {
    if (!filteredRecords) return;
    setIsClearing(true);
    for (const record of filteredRecords)
      await onDelete(
        record.id,
        filteredRecords.findIndex(({ id }) => id === record.id) === filteredRecords.length - 1
      );
    setIsClearing(false);
  };

  return isLoading || isClearing ? (
    <Loader />
  ) : filteredRecords.length === 0 ? (
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
    <Fragment>
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={-1.5}>
        <Typography variant="subtitle2" color="text.secondary">
          {filteredRecords.length} record{filteredRecords.length > 1 ? 's' : ''}
        </Typography>
        <Button
          data-testid="clear-all-records"
          color="error"
          onClick={clearAll}
          disabled={!filteredRecords?.length}
          size="small"
        >
          Clear All
        </Button>
      </Box>

      <ScrollableContainer>
        {groupByDay(filteredRecords).map(([day, dayRecords]) => (
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
    </Fragment>
  );
}
