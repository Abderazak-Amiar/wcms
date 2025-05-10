import CountertopsIcon from '@mui/icons-material/Countertops';
import GasMeterIcon from '@mui/icons-material/GasMeter';
import LogoutIcon from '@mui/icons-material/Logout';
import PaidIcon from '@mui/icons-material/Paid';
import PeopleIcon from '@mui/icons-material/People';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Link, Outlet } from 'react-router-dom';
function Home() {
  const icons = [
    <CountertopsIcon />,
    <PeopleIcon />,
    <GasMeterIcon />,
    <ReceiptIcon />,
    <PaidIcon />,
    <PointOfSaleIcon />,
    <SettingsIcon />,
    <LogoutIcon />,
  ];
  const menuFr = [
    'Recensement',
    'Consomateur',
    'Compteur',
    'Facture',
    'Paiement',
    'Dette',
    'Paramètres',
    'Déconnexion',
  ];
  const menu = [
    'record',
    'consumer',
    'counter',
    'invoice',
    'payment',
    'debt',
    'settings',
    'logout',
  ];
  const theme = useTheme();
  return (
    <Grid
      container
      sx={{
        display: 'flex',
        alignItems: 'start',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
      }}
    >
      <Grid id="zak" size={2} spacing={1}>
        <Paper sx={{ height: '100vh' }}>
          {menuFr.map((item, index) => (
            <Link
              key={menu[index]}
              to={menu[index]}
              style={{
                textDecoration: 'none',
                color: theme.palette.text.primary,
              }}
            >
              <List>
                <ListItem>
                  <ListItemButton>
                    <ListItemIcon>{icons[index]}</ListItemIcon>

                    <ListItemText primary={item} />
                  </ListItemButton>
                </ListItem>
              </List>
            </Link>
          ))}
        </Paper>
      </Grid>
      <Grid size={10}>
        <Outlet />
      </Grid>
    </Grid>
  );
}

export default Home;
