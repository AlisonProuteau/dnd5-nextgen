import type { CSSObject } from '@emotion/react';

export const linkButton = {
  display: 'flex',
  color: 'inherit'
};

export const fab = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  backgroundColor: 'rgba(255, 255, 255, 0.2)'
};

export const button = {
  padding: '12px',
  borderRadius: '50%',
  backgroundColor: 'transparent',
  transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
  ':hover,:focus,:active': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  color: 'white'
};

export const shine: CSSObject = {
  '::before': {
    content: "''",
    position: 'absolute',
    background: 'rgba(200, 200, 200, 0.5)',
    width: '30px',
    height: '100%',
    top: '0',
    filter: 'blur(30px)',
    transform: 'translateX(-100px) skewX(-15deg)',
    '&:hover': {}
  },

  '::after': {
    content: "''",
    position: 'absolute',
    background: 'rgba(200, 200, 200, 0.2)',
    width: '30px',
    height: '100%',
    top: '0',
    filter: 'blur(5px)',
    transform: 'translateX(-100px) skewX(-15deg)'
  },
  '&:hover': {
    '&::before': {
      transform: 'translateX(300px) skewX(-15deg)',
      transition: '2s'
    }
  }
};
