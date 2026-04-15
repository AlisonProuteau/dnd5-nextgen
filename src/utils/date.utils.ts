import { Timestamp } from 'firebase/firestore';
import { groupBy } from 'lodash';

export const formatDateType = (raw: Date | Timestamp | number | string) => {
  let formattedDate: Date | undefined;

  if (raw instanceof Date) formattedDate = raw;
  else if (raw instanceof Timestamp) formattedDate = raw.toDate();
  else {
    const parsed = Date.parse(typeof raw === 'number' ? raw.toString() : raw);
    if (!isNaN(parsed)) formattedDate = new Date(parsed);
  }

  return formattedDate;
};

export function formatDateDisplay(
  raw: Date | Timestamp,
  precision: 'day' | 'minute' = 'day'
): string {
  const date = formatDateType(raw);
  if (!date) return '';

  if (precision === 'minute')
    return date.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return `Today`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday`;

  return date.toLocaleDateString(navigator.language, { month: 'short', day: '2-digit' });
}

export function groupByDay<T extends { createdAt: Date | Timestamp }>(
  records: T[]
): [string, T[]][] {
  const sorted = [...records].sort((a, b) => {
    const aDate = formatDateType(a.createdAt) || new Date();
    const bDate = formatDateType(b.createdAt) || new Date();

    return bDate.getTime() - aDate.getTime();
  });

  const grouped = groupBy(sorted, (r) => formatDateDisplay(r.createdAt));
  return Object.entries(grouped);
}
