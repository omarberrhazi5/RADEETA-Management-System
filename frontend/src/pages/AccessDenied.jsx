import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { dashboardPathFor } from '../utils/rbac';

export default function AccessDenied() {
  const { t } = useTranslation();
  const { role } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-red-50 text-red-700">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{t('accessDenied.title')}</h1>
        <p className="mt-2 text-sm text-gray-600">{t('accessDenied.message')}</p>
        <Link to={dashboardPathFor(role)} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">
          {t('buttons.backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
