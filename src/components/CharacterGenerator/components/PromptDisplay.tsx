import { Box, Paper, Typography } from '@mui/material';

export default function PromptDisplay({ prompt }: { prompt: string }) {
  return (
    <Box mt={4}>
      <Paper elevation={2} sx={{ p: 2 }} data-testid="prompt-display">
        <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
          Generated Prompt:
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {prompt}
        </Typography>
      </Paper>
    </Box>
  );
}
