/**
 * Scroll behavior utility for UI interactions
 */
export const scrollOnOpen = (
  { currentTarget }: { currentTarget: EventTarget & Element },
  expanded: boolean
): void => {
  expanded && setTimeout(() => currentTarget.scrollIntoView({ behavior: 'smooth' }), 100);
};
