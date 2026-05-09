import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translateRole } from '../utils/i18nLabels';
import { ROLES, hasRole } from '../utils/rbac';

const nav = [
  { labelKey: 'sidebar.dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: [ROLES.RESPONSABLE] },
  { labelKey: 'sidebar.administration', path: '/administration', icon: Shield, roles: [ROLES.DIRECTEUR] },
  { labelKey: 'sidebar.clients', path: '/admin/clients', icon: Users, roles: [ROLES.RESPONSABLE] },
  { labelKey: 'sidebar.compteurs', path: '/admin/compteurs', icon: Gauge, roles: [ROLES.RESPONSABLE] },
  { labelKey: 'sidebar.secteurs', path: '/admin/secteurs', icon: Map, roles: [ROLES.RESPONSABLE] },
  { labelKey: 'sidebar.anomalies', path: '/admin/pannes', icon: ClipboardList, roles: [ROLES.RESPONSABLE] },
  { labelKey: 'sidebar.interventions', path: '/admin/interventions', icon: ClipboardCheck, roles: [ROLES.RESPONSABLE] },
  { labelKey: 'sidebar.repairs', path: '/admin/repairs', icon: Wrench, roles: [ROLES.RESPONSABLE] },
  { labelKey: 'sidebar.reports', path: '/admin/reports', icon: FileBarChart, roles: [ROLES.RESPONSABLE] },

  { labelKey: 'sidebar.dashboard', path: '/manager/dashboard', icon: LayoutDashboard, roles: [ROLES.MANAGER] },
  { labelKey: 'sidebar.anomalies', path: '/manager/pannes', icon: ClipboardList, roles: [ROLES.MANAGER] },
  { labelKey: 'sidebar.interventions', path: '/manager/interventions', icon: ClipboardCheck, roles: [ROLES.MANAGER] },
  { labelKey: 'sidebar.repairs', path: '/manager/repairs', icon: Wrench, roles: [ROLES.MANAGER] },

  { labelKey: 'sidebar.dashboard', path: '/technician/dashboard', icon: LayoutDashboard, roles: [ROLES.TECHNICIAN] },
  { labelKey: 'sidebar.myTasks', path: '/technician/tasks', icon: ListChecks, roles: [ROLES.TECHNICIAN] },
  { labelKey: 'sidebar.anomalies', path: '/technician/pannes', icon: ClipboardList, roles: [ROLES.TECHNICIAN] },
  { labelKey: 'sidebar.interventions', path: '/technician/interventions', icon: ClipboardCheck, roles: [ROLES.TECHNICIAN] },
  { labelKey: 'sidebar.repairs', path: '/technician/repairs', icon: Wrench, roles: [ROLES.TECHNICIAN] },

  { labelKey: 'sidebar.dashboard', path: '/viewer/dashboard', icon: LayoutDashboard, roles: [ROLES.VIEWER] },
  { labelKey: 'sidebar.clients', path: '/viewer/clients', icon: Users, roles: [ROLES.VIEWER] },
  { labelKey: 'sidebar.anomalies', path: '/viewer/pannes', icon: ClipboardList, roles: [ROLES.VIEWER] },
  { labelKey: 'sidebar.interventions', path: '/viewer/interventions', icon: ClipboardCheck, roles: [ROLES.VIEWER] },
  { labelKey: 'sidebar.repairs', path: '/viewer/repairs', icon: Wrench, roles: [ROLES.VIEWER] },
];

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { logout, role, user } = useAuth();
  const effectiveRole = role === ROLES.DIRECTEUR || role === ROLES.DEVELOPER ? ROLES.RESPONSABLE : role;
  const items = nav.filter((item) => {
    if (item.path === '/administration') {
      return role === ROLES.DIRECTEUR;
    }

    return hasRole(effectiveRole, item.roles);
  });
  const initials = `${user?.nom?.[0] ?? ''}${user?.prenom?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="border-b border-gray-100 px-5 py-5">
        <div className="text-sm font-bold text-blue-700">SRM-FM</div>
        <div className="mt-1 text-xs text-gray-500">{t('sidebar.brandSubtitle')}</div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map(({ labelKey, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Icon size={17} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">{user?.nom ?? t('tables.user')} {user?.prenom ?? ''}</div>
            <div className="text-xs text-gray-500">{translateRole(t, role)}</div>
          </div>
        </div>
        <button type="button" onClick={logout} className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-700">
          <LogOut size={16} />
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );
}
