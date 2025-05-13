import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const Protected = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const location = useLocation();
  const { role } = useAuthStore(); // <-- Zustand role
  console.log('==>>role', role);
  console.log('==>>allowedRoles', allowedRoles);
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return allowedRoles.includes(role) ? (
    <Outlet />
  ) : (
    <Navigate to="/unauthorized" replace state={{ from: location }} />
  );
};

export default Protected;
