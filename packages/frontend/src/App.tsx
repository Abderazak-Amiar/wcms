import { Route, Routes } from 'react-router-dom';
import Consumers from './components/pages/consumer/Consumer';
import Counter from './components/pages/counter/Counter';
import Debt from './components/pages/Debt';
import InvoiceList from './components/pages/invoice/InvoiceList';
import Layout from './components/pages/Layout';
import Login from './components/pages/Login';
import Logout from './components/pages/Logout';
import Payment from './components/pages/Payment';
import Protected from './components/pages/Protected';
import AddRecord from './components/pages/record/AddRecord';
import Settings from './components/pages/Settings';
import Welcome from './components/pages/Welcome';
import Reports from './components/pages/Reports';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Sidebar stays persistent inside Layout */}
      <Route path="/" element={<Layout />}>
        <Route element={<Protected />}>
          <Route path="consumer" element={<Consumers />} />
          <Route path="welcome" element={<Welcome />} />
          <Route path="logout" element={<Logout />} />
          <Route path="counter" element={<Counter />} />
          <Route path="invoice" element={<InvoiceList />} />
          <Route path="payment" element={<Payment />} />
          <Route path="debt" element={<Debt />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="record" element={<AddRecord />} />
        </Route>
        <Route path="*" element={<h1>Page not found</h1>} />
      </Route>
    </Routes>
  );
}

export default App;
