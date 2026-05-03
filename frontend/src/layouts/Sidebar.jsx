import { NavLink } from 'react-router-dom';
import { BarChart3, ClipboardList, CreditCard, FileText, Gauge, LayoutDashboard, LogOut, Map, Receipt, Settings, Shield, Users, Wrench } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS, ROLES, hasRole } from '../utils/rbac';

const nav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: [ROLES.ADMIN] },
  { label: 'Users', path: '/admin/users', icon: Shield, roles: [ROLES.ADMIN] },
  { label: 'Clients', path: '/admin/clients', icon: Users, roles: [ROLES.ADMIN] },
  { label: 'Meters', path: '/admin/compteurs', icon: Gauge, roles: [ROLES.ADMIN] },
  { label: 'Sectors', path: '/admin/secteurs', icon: Map, roles: [ROLES.ADMIN] },
  { label: 'Pannes', path: '/admin/pannes', icon: ClipboardList, roles: [ROLES.ADMIN] },
  { label: 'Repairs', path: '/admin/reparations', icon: Wrench, roles: [ROLES.ADMIN] },
  { label: 'Readings', path: '/admin/releves', icon: BarChart3, roles: [ROLES.ADMIN] },
  { label: 'Invoices', path: '/admin/factures', icon: Receipt, roles: [ROLES.ADMIN] },
  { label: 'Payments', path: '/admin/paiements', icon: CreditCard, roles: [ROLES.ADMIN] },
  { label: 'Tariffs', path: '/admin/tariffs', icon: Settings, roles: [ROLES.ADMIN] },
  { label: 'Reports', path: '/admin/reports', icon: FileText, roles: [ROLES.ADMIN] },

  { label: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard, roles: [ROLES.MANAGER] },
  { label: 'Pannes', path: '/manager/pannes', icon: ClipboardList, roles: [ROLES.MANAGER] },
  { label: 'Repairs', path: '/manager/reparations', icon: Wrench, roles: [ROLES.MANAGER] },
  { label: 'Readings', path: '/manager/releves', icon: BarChart3, roles: [ROLES.MANAGER] },
  { label: 'Invoices', path: '/manager/factures', icon: Receipt, roles: [ROLES.MANAGER] },
  { label: 'Payments', path: '/manager/paiements', icon: CreditCard, roles: [ROLES.MANAGER] },
  { label: 'Tariffs', path: '/manager/tariffs', icon: Settings, roles: [ROLES.MANAGER] },
  { label: 'Reports', path: '/manager/reports', icon: BarChart3, roles: [ROLES.MANAGER] },

  { label: 'My Tasks', path: '/operator/dashboard', icon: LayoutDashboard, roles: [ROLES.OPERATOR] },
  { label: 'Tasks', path: '/operator/tasks', icon: ClipboardList, roles: [ROLES.OPERATOR] },
  { label: 'Pannes', path: '/operator/pannes', icon: ClipboardList, roles: [ROLES.OPERATOR] },
  { label: 'Repairs', path: '/operator/reparations', icon: Wrench, roles: [ROLES.OPERATOR] },
  { label: 'Readings', path: '/operator/releves', icon: BarChart3, roles: [ROLES.OPERATOR] },

  { label: 'Dashboard', path: '/viewer/dashboard', icon: LayoutDashboard, roles: [ROLES.VIEWER] },
  { label: 'Clients', path: '/viewer/clients', icon: Users, roles: [ROLES.VIEWER] },
  { label: 'Meters', path: '/viewer/compteurs', icon: Gauge, roles: [ROLES.VIEWER] },
  { label: 'Sectors', path: '/viewer/secteurs', icon: Map, roles: [ROLES.VIEWER] },
  { label: 'Pannes', path: '/viewer/pannes', icon: ClipboardList, roles: [ROLES.VIEWER] },
  { label: 'Repairs', path: '/viewer/reparations', icon: Wrench, roles: [ROLES.VIEWER] },
  { label: 'Readings', path: '/viewer/releves', icon: BarChart3, roles: [ROLES.VIEWER] },
  { label: 'Invoices', path: '/viewer/factures', icon: Receipt, roles: [ROLES.VIEWER] },
  { label: 'Payments', path: '/viewer/paiements', icon: CreditCard, roles: [ROLES.VIEWER] },
  { label: 'Reports', path: '/viewer/reports', icon: FileText, roles: [ROLES.VIEWER] },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout, role, user } = useAuth();
  const effectiveRole = role === ROLES.SUPER_ADMIN || role === ROLES.DEVELOPER ? ROLES.ADMIN : role;
  const items = nav.filter((item) => hasRole(effectiveRole, item.roles));
  const initials = `${user?.nom?.[0] ?? ''}${user?.prenom?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="border-b border-gray-100 px-5 py-5">
        <div className="text-sm font-bold text-blue-700">SRM Taza/Region</div>
        <div className="mt-1 text-xs text-gray-500">Operations Console</div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">{user?.nom ?? 'User'} {user?.prenom ?? ''}</div>
            <div className="text-xs text-gray-500">{ROLE_LABELS[role] ?? role}</div>
          </div>
        </div>
        <button type="button" onClick={logout} className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-700">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
