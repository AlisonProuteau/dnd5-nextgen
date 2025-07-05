import { Box, Card, CardMedia, CircularProgress, Typography } from '@mui/material';

export default function PortraitDisplay({
  imageUrl,
  isLoading
}: {
  imageUrl: string;
  isLoading: boolean;
}) {
  return (
    <Box mt={4} mb={2} display="flex" justifyContent="center">
      {isLoading ? (
        <CircularProgress />
      ) : imageUrl ? (
        <Card sx={{ maxWidth: 400, boxShadow: 3, borderRadius: 2 }}>
          <CardMedia
            component="img"
            image={imageUrl}
            alt="Generated Portrait"
            sx={{ objectFit: 'contain', borderRadius: 2 }}
          />
        </Card>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Your generated portrait will appear here.
        </Typography>
      )}
    </Box>
  );
}
