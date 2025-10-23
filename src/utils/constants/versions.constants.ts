export const VERSIONS = ['Legacy', '2024'] as const;
export type Version = (typeof VERSIONS)[number];
