import { Fragment, type ReactNode } from 'react';
import { Accordion, type AccordionProps } from '@mui/material';

interface ConditionalAccordionProps {
  condition: boolean;
  children: ReactNode;
}

export function ConditionalAccordion({
  condition,
  children,
  ...props
}: ConditionalAccordionProps & AccordionProps) {
  return condition && children ? (
    <Accordion {...props}>{children}</Accordion>
  ) : (
    <Fragment>{children}</Fragment>
  );
}
