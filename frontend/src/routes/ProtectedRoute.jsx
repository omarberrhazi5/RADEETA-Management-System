import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { hasRole, isKnownRole } from '../utils/rbac';

export default function ProtectedRoute({ roles }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { booting, isAuthenticated, role } = useAuth();

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        {t('common.loadingSession')}
      </div>
    );
  }

  if (!isAuthenticated || !isKnownRole(role)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !hasRole(role, roles)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}
