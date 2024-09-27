import GasMeterIcon from '@mui/icons-material/GasMeter';
import PaidIcon from '@mui/icons-material/Paid';
import PeopleIcon from '@mui/icons-material/People';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptIcon from '@mui/icons-material/Receipt';
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
    <PeopleIcon />,
    <GasMeterIcon />,
    <ReceiptIcon />,
    <PaidIcon />,
    <PointOfSaleIcon />,
  ];
  const menuFr = [
    'Consomateur',
    'Compteur',
    'Facture',
    'Paiement',
    'Dette',
    'Paramètres',
  ];
  const menu = [
    'consumer',
    'counter',
    'invoice',
    'payment',
    'debt',
    'settings',
  ];
  const theme = useTheme();
  return (
    <Grid container>
      <Grid size={2} spacing={1}>
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
      <Grid size={10} sx={{ background: '#ccc' }}>
        <Outlet />
      </Grid>
    </Grid>
  );
}

export default Home;
