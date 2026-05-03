import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardPathFor } from '../utils/rbac';

export default function RoleRedirect() {
  const { role } = useAuth();
  return <Navigate to={dashboardPathFor(role)} replace />;
}
