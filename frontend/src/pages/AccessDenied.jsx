import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { dashboardPathFor } from '../utils/rbac';

export default function AccessDenied() {
  const { t } = useTranslation();
  const { role } = useAuth();

  return (
    <div className="srm-app flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_8px_30px_rgb(0_0_0_/_0.06)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--srm-red-soft)] text-[var(--srm-red)]">
          <ShieldAlert size={24} strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">{t('accessDenied.title')}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">{t('accessDenied.message')}</p>
        <Link to={dashboardPathFor(role)} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--srm-green)] px-4 text-sm font-bold text-white shadow-[0_12px_26px_rgb(112_184_48_/_0.20)] transition duration-300 hover:scale-[1.02] hover:bg-[var(--srm-green-dark)]">
          {t('buttons.backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
