import { Menu, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/rbac';

const titles = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'Users',
  '/admin/clients': 'Clients',
  '/admin/compteurs': 'Meters',
  '/admin/secteurs': 'Sectors',
  '/admin/pannes': 'Pannes',
  '/admin/reparations': 'Repairs',
  '/admin/releves': 'Readings',
  '/admin/factures': 'Invoices',
  '/admin/paiements': 'Payments',
  '/admin/tariffs': 'Tariffs',
  '/admin/reports': 'Reports',
  '/manager/dashboard': 'Manager Dashboard',
  '/manager/releves': 'Readings',
  '/manager/factures': 'Invoices',
  '/manager/paiements': 'Payments',
  '/manager/tariffs': 'Tariffs',
  '/operator/dashboard': 'Operator Dashboard',
  '/operator/tasks': 'Tasks',
  '/operator/pannes': 'Pannes',
  '/operator/reparations': 'Repairs',
  '/operator/releves': 'Readings',
  '/viewer/dashboard': 'Viewer Dashboard',
  '/viewer/releves': 'Readings',
  '/viewer/factures': 'Invoices',
  '/viewer/paiements': 'Payments',
};

export default function Topbar({ onMenuClick }) {
  const { role } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onMenuClick} className="inline-flex h-11 w-11 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 md:hidden" aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-gray-900">{titles[pathname] ?? 'Workspace'}</h1>
        <p className="text-xs text-gray-500">Backend-enforced RBAC, frontend role-aware workspace</p>
      </div>
      <div className="hidden items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 sm:flex">
        <ShieldCheck size={15} className="text-blue-600" />
        {ROLE_LABELS[role] ?? role}
      </div>
      <NotificationBell />
    </header>
  );
}
