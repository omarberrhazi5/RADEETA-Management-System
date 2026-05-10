import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { hasPermission, hasRole, isDirecteur, isKnownRole, ROLES } from '../utils/rbac';

export default function ProtectedRoute({ roles, permission }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { booting, isAuthenticated, role } = useAuth();

  if (booting) {
    return (
      <div className="srm-app flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        {t('common.loadingSession')}
      </div>
    );
  }

  if (!isAuthenticated || !isKnownRole(role)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.includes(ROLES.DIRECTEUR) && roles.length === 1 && !isDirecteur(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  if (roles && !hasRole(role, roles)) {
    return <Navigate to="/access-denied" replace />;
  }

  if (permission && !hasPermission(role, permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}
