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
  '/manager/clients': 'sidebar.clients',
  '/manager/compteurs': 'sidebar.compteurs',
  '/manager/secteurs': 'sidebar.secteurs',
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
  '/viewer/interventions': 'sidebar.interventions',
};

export default function Topbar({ onMenuClick, scrolled = false }) {
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
    <header className={`z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/70 px-4 backdrop-blur-md transition-shadow duration-300 sm:px-6 ${scrolled ? 'shadow-[0_8px_30px_rgb(0_0_0_/_0.055)]' : 'shadow-[0_8px_30px_rgb(0_0_0_/_0.025)]'}`}>
      <button type="button" onClick={onMenuClick} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition duration-300 hover:bg-slate-100 md:hidden" aria-label={t('common.openNavigation')}>
        <Menu size={20} strokeWidth={1.5} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold tracking-tight text-slate-800">{t(titles[pathname] ?? 'dashboard.workspace')}</h1>
        <p className="text-xs font-medium text-slate-500">{t('dashboard.subtitle')}</p>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setLanguageOpen((open) => !open)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 text-xs font-bold uppercase text-slate-600 shadow-sm transition duration-300 hover:scale-[1.02] hover:bg-white"
          aria-label={t('common.language')}
        >
          <Globe2 size={15} strokeWidth={1.5} className="text-[var(--srm-green)]" />
          {currentLanguage.startsWith('en') ? 'EN' : 'FR'}
        </button>
        {languageOpen && (
          <div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 py-1 text-sm shadow-[0_8px_30px_rgb(0_0_0_/_0.08)] backdrop-blur-md">
            {[
              ['fr', 'FR', t('common.french')],
              ['en', 'EN', t('common.english')],
            ].map(([language, code, label]) => (
              <button
                key={language}
                type="button"
                onClick={() => changeLanguage(language)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left transition duration-300 hover:bg-slate-50 ${currentLanguage.startsWith(language) ? 'font-bold text-[var(--srm-green)]' : 'text-slate-600'}`}
              >
                <span>{label}</span>
                <span className="text-xs">{code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 sm:flex">
        <ShieldCheck size={15} strokeWidth={1.5} className="text-[var(--srm-green)]" />
        {translateRole(t, role)}
      </div>
      <NotificationBell />
    </header>
  );
}
