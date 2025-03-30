import CountertopsIcon from '@mui/icons-material/Countertops';
import GasMeterIcon from '@mui/icons-material/GasMeter';
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
} from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Link, Outlet } from 'react-router-dom';

function Layout() {
  const icons = [
    <CountertopsIcon />,
    <PeopleIcon />,
    <GasMeterIcon />,
    <ReceiptIcon />,
    <PaidIcon />,
    <PointOfSaleIcon />,
    <SettingsIcon />,
  ];
  const menuFr = [
    'Recensement',
    'Consomateur',
    'Compteur',
    'Facture',
    'Paiement',
    'Dette',
    'Paramètres',
  ];
  const menu = [
    'record',
    'consumer',
    'counter',
    'invoice',
    'payment',
    'debt',
    'settings',
  ];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Paper
        sx={{
          width: '240px',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          overflowY: 'auto',
          boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        }}
      >
        <List>
          {menuFr.map((item, index) => (
            <ListItem key={menu[index]} disablePadding>
              <ListItemButton component={Link} to={menu[index]}>
                <ListItemIcon>{icons[index]}</ListItemIcon>
                <ListItemText primary={item} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Content */}
      <div
        style={{
          marginLeft: '240px',
          padding: '20px',
          flexGrow: 1,
          background: '#ccc',
        }}
      >
        <Outlet /> {/* Dynamic content appears here */}
      </div>
      <SnackbarProvider />
    </div>
  );
}

export default Layout;
