import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

import Consumers from './components/pages/consumer/Consumer';
import Counter from './components/pages/counter/Counter';
import Debt from './components/pages/Debt';
import InvoiceList from './components/pages/invoice/InvoiceList';
import Layout from './components/pages/Layout';
import LayoutUser from './components/pages/LayoutUser';
import Login from './components/pages/Login';
import Logout from './components/pages/Logout';
import Payment from './components/pages/Payment';
import Protected from './components/pages/Protected';
import AddRecord from './components/pages/record/AddRecord';
import Reports from './components/pages/Reports';
import Settings from './components/pages/settings/Settings';
import Welcome from './components/pages/Welcome';

function App() {
  const { loadRoleFromLocalStorage, role, hasHydrated } = useAuthStore();

  useEffect(() => {
    loadRoleFromLocalStorage();
  }, []);

  if (!hasHydrated) {
    return <div>Loading...</div>; // Or a spinner if you want
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Shared protected route */}
      <Route
        element={
          <Protected
            allowedRoles={['administrateur', 'utilisateur', 'admin']}
          />
        }
      >
        <Route
          path="/"
          element={role === 'administrateur' ? <Layout /> : <LayoutUser />}
        >
          {/* Common to both roles */}
          <Route path="record" element={<AddRecord />} />
          <Route path="invoice" element={<InvoiceList />} />
          <Route path="payment" element={<Payment />} />
          <Route path="debt" element={<Debt />} />
          <Route path="welcome" element={<Welcome />} />
          <Route path="logout" element={<Logout />} />

          {/* Admin-only */}
          {role === 'administrateur' && (
            <>
              <Route path="consumer" element={<Consumers />} />
              <Route path="counter" element={<Counter />} />
              <Route path="settings" element={<Settings />} />
              <Route path="reports" element={<Reports />} />
            </>
          )}
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
