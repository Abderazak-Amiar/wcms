import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import AddConsumer from './components/pages/consumer/AddConsumer';
import Consumer from './components/pages/consumer/Consumer';
import ConsumerList from './components/pages/consumer/ConsumerList';
import Counter from './components/pages/counter/Counter';
import Debt from './components/pages/Debt';
import Home from './components/pages/Home';
import Invoice from './components/pages/Invoice';
import Login from './components/pages/Login';
import Payment from './components/pages/Payment';
import Protected from './components/pages/Protected';
import Settings from './components/pages/Settings';
import isAuthenticated from './helpers';

const theme = createTheme({
  palette: {
    primary: {
      light: '#42a5f5',
      main: '#1976d2',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ba68c8',
      main: '#9c27b0',
      dark: '#7b1fa2',
      contrastText: '#000',
    },
    error: {
      light: '#ef5350',
      main: '#d32f2f',
      dark: '#c62828',
      contrastText: '#fff',
    },
    warning: {
      light: '#ff9800',
      main: '#ed6c02',
      dark: '#e65100',
      contrastText: '#fff',
    },
    info: {
      light: '#03a9f4',
      main: '#0288d1',
      dark: '#01579b',
      contrastText: '#fff',
    },
    success: {
      light: '#4caf50',
      main: '#2e7d32',
      dark: '#1b5e20',
      contrastText: '#fff',
    },
    grey: {
      A100: '#f5f5f5',
      A200: '#eeeeee',
      A400: '#A400',
      A700: '#A700',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Routes>
        <Route
          path="/"
          element={<Login />}
          loader={async () => await isAuthenticated()}
        />
        <Route element={<Protected />}>
          <Route path="/home" element={<Home />}>
            <Route path="consumer" element={<Consumer />}>
              <Route path="add" element={<AddConsumer />} />
              <Route path="list" element={<ConsumerList />} />
            </Route>
            <Route path="counter" element={<Counter />} />
            <Route path="invoice" element={<Invoice />} />
            <Route path="payment" element={<Payment />} />
            <Route path="debt" element={<Debt />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<h1>Page not found</h1>} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
