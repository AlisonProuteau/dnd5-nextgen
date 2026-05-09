import { type ReactNode, useRef, useState } from 'react';
import { KeyboardArrowUp } from '@mui/icons-material';
import { Box, type BoxProps, Fade, IconButton } from '@mui/material';
import { button } from '@utils/ui/style.utils';

interface ScrollableContainerProps extends BoxProps {
  children: ReactNode;
  hideScrollTop?: boolean;
}

export function ScrollableContainer({
  children,
  hideScrollTop = false,
  ...boxProps
}: ScrollableContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = () => setShowScrollTop((scrollRef.current?.scrollTop ?? 0) > 100);
  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <Box position="relative" flex={1} overflow="hidden" height="100%">
      <Box
        ref={scrollRef}
        height="100%"
        overflow="auto"
        onScroll={handleScroll}
        pb={showScrollTop && !hideScrollTop ? 5 : 0}
        {...boxProps}
      >
        {children}
      </Box>

      <Fade in={showScrollTop && !hideScrollTop}>
        <IconButton
          aria-label="scroll back to top"
          onClick={scrollToTop}
          size="small"
          sx={{ position: 'absolute', bottom: 8, right: 8, ...button, padding: '4px' }}
        >
          <KeyboardArrowUp />
        </IconButton>
      </Fade>
    </Box>
  );
}
