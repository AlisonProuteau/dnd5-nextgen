import { Box, Paper, Typography } from '@mui/material';

export default function PromptDisplay({ prompt }: { prompt: string }) {
  return (
    <Box mt={4}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Generated Prompt:
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {prompt}
        </Typography>
      </Paper>
    </Box>
  );
}
