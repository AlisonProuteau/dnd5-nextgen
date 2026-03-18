import type { Timestamp } from 'firebase/firestore';
import { groupBy } from 'lodash';

export function formatDate(raw: Date | Timestamp, precision: 'day' | 'minute' = 'day'): string {
  const date = raw instanceof Date ? raw : (raw as unknown as Timestamp).toDate();
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
    const aDate =
      a.createdAt instanceof Date ? a.createdAt : (a.createdAt as unknown as Timestamp).toDate();
    const bDate =
      b.createdAt instanceof Date ? b.createdAt : (b.createdAt as unknown as Timestamp).toDate();
    return bDate.getTime() - aDate.getTime();
  });

  const grouped = groupBy(sorted, (r) => formatDate(r.createdAt));
  return Object.entries(grouped);
}
