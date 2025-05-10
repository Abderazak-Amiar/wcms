import { Box, Typography } from '@mui/material';

function Welcome() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #CCCCCC, #FFFFFF)',
        color: '#333',
        padding: '20px',
      }}
    >
      <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
        Bienvenue sur WCMS
      </Typography>
      <Typography variant="h6" sx={{ mb: 4 }}>
        Gérez facilement et efficacement votre consommation d'eau.
      </Typography>
    </Box>
  );
}

export default Welcome;
