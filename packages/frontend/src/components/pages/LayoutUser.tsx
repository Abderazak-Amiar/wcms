import CountertopsIcon from '@mui/icons-material/Countertops';
import LogoutIcon from '@mui/icons-material/Logout';
import PaidIcon from '@mui/icons-material/Paid';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptIcon from '@mui/icons-material/Receipt';
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

function LayoutUser() {
  const icons = [
    <CountertopsIcon />,
    <ReceiptIcon />,
    <PaidIcon />,
    <PointOfSaleIcon />,
    <LogoutIcon />,
  ];
  const menuFr = ['Recensement', 'Facture', 'Paiement'];
  const menu = ['record', 'invoice', 'payment'];

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
          <ListItem key="5454" disablePadding>
            <ListItemButton component={Link} to="/logout">
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </ListItemButton>
          </ListItem>
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

export default LayoutUser;
