import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2, Menu, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../hooks/useAuth';
import { translateRole } from '../utils/i18nLabels';

const titles = {
  '/admin/dashboard': 'dashboard.responsable',
  '/administration': 'sidebar.administration',
  '/admin/administration': 'sidebar.administration',
  '/admin/users': 'sidebar.administration',
  '/admin/clients': 'sidebar.clients',
  '/admin/compteurs': 'sidebar.compteurs',
  '/admin/secteurs': 'sidebar.secteurs',
  '/admin/pannes': 'sidebar.anomalies',
  '/admin/repairs': 'sidebar.repairs',
  '/admin/interventions': 'sidebar.interventions',
  '/admin/reports': 'sidebar.reports',
  '/manager/dashboard': 'dashboard.manager',
  '/manager/pannes': 'sidebar.anomalies',
  '/manager/repairs': 'sidebar.repairs',
  '/manager/interventions': 'sidebar.interventions',
  '/manager/reports': 'sidebar.reports',
  '/technician/dashboard': 'dashboard.technician',
  '/technician/tasks': 'sidebar.myTasks',
  '/technician/pannes': 'sidebar.anomalies',
  '/technician/repairs': 'sidebar.repairs',
  '/technician/interventions': 'sidebar.interventions',
  '/viewer/dashboard': 'dashboard.viewer',
  '/viewer/clients': 'sidebar.clients',
  '/viewer/compteurs': 'sidebar.compteurs',
  '/viewer/secteurs': 'sidebar.secteurs',
  '/viewer/pannes': 'sidebar.anomalies',
  '/viewer/repairs': 'sidebar.repairs',
  '/viewer/interventions': 'sidebar.interventions',
  '/viewer/reports': 'sidebar.reports',
};

export default function Topbar({ onMenuClick }) {
  const { i18n, t } = useTranslation();
  const { role } = useAuth();
  const { pathname } = useLocation();
  const [languageOpen, setLanguageOpen] = useState(false);
  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'fr';

  function changeLanguage(language) {
    i18n.changeLanguage(language);
    setLanguageOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onMenuClick} className="inline-flex h-11 w-11 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 md:hidden" aria-label={t('common.openNavigation')}>
        <Menu size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-gray-900">{t(titles[pathname] ?? 'dashboard.workspace')}</h1>
        <p className="text-xs text-gray-500">{t('dashboard.subtitle')}</p>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setLanguageOpen((open) => !open)}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold uppercase text-gray-600 transition hover:bg-gray-50"
          aria-label={t('common.language')}
        >
          <Globe2 size={15} className="text-blue-600" />
          {currentLanguage.startsWith('en') ? 'EN' : 'FR'}
        </button>
        {languageOpen && (
          <div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
            {[
              ['fr', 'FR', t('common.french')],
              ['en', 'EN', t('common.english')],
            ].map(([language, code, label]) => (
              <button
                key={language}
                type="button"
                onClick={() => changeLanguage(language)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left transition hover:bg-gray-50 ${currentLanguage.startsWith(language) ? 'font-semibold text-blue-700' : 'text-gray-600'}`}
              >
                <span>{label}</span>
                <span className="text-xs">{code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="hidden items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 sm:flex">
        <ShieldCheck size={15} className="text-blue-600" />
        {translateRole(t, role)}
      </div>
      <NotificationBell />
    </header>
  );
}
