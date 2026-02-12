import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Combines useQueries results by extracting data and filtering out null/undefined values with a provided formatter function
 * @param results Array of query results
 * @param dataFormatter Function to format the extracted data
 * @returns Combined data and fetching state
 */
function combineQueryResults<T, U = T[]>(
  results: UseQueryResult<T | null, Error>[],
  dataFormatter: (data: T[]) => U
) {
  return {
    data: dataFormatter(results.map(({ data }) => data).filter(Boolean) as T[]),
    isFetching: results.some((result) => result.isFetching)
  };
}

/**
 * Creates a combine callback for useQueries that extracts and filters data and optionally formats it with a provided formatter function
 * @param dataFormatter Optional function to format the extracted data
 * @returns A memoized combine function
 */
export function createQueryCombiner<T, U = T[]>(
  dataFormatter: (data: T[]) => U = (data) => data as U
) {
  return (results: UseQueryResult<T | null, Error>[]) =>
    combineQueryResults<T, U>(results, dataFormatter);
}
