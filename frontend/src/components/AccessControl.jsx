import { useAuth } from '../hooks/useAuth';
import { hasRole } from '../utils/rbac';

export default function AccessControl({ roles, children, fallback = null }) {
  const { role } = useAuth();
  return hasRole(role, roles) ? children : fallback;
}
