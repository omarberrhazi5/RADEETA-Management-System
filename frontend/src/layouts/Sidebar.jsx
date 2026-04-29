import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Map,
  Gauge,
  AlertTriangle,
  Wrench,
  LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager'] },
  { label: 'Clients', path: '/clients', icon: Users, roles: ['admin', 'manager'] },
  { label: 'Secteurs', path: '/secteurs', icon: Map, roles: ['admin', 'manager'] },
  { label: 'Compteurs', path: '/compteurs', icon: Gauge, roles: ['admin', 'manager'] },
  { label: 'Pannes', path: '/pannes', icon: AlertTriangle, roles: ['admin', 'manager', 'technician'] },
  { label: 'Réparations', path: '/reparations', icon: Wrench, roles: ['admin', 'manager', 'technician'] },
];

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('auth_user') ?? 'null');
  } catch {
    return null;
  }
}

function getRoleLabel(role) {
  if (role === 'admin') return 'Administrateur';
  if (role === 'manager') return 'Responsable';
  if (role === 'technician') return 'Technicien';
  return 'Utilisateur';
}

export default function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const role = localStorage.getItem('user_role');
  const user = getStoredUser();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));
  const initials = `${user?.nom?.[0] ?? ''}${user?.prenom?.[0] ?? ''}`.toUpperCase() || 'U';

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('auth_user');
    navigate('/login');
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-100 bg-white shadow-xl transition-transform duration-200 md:static md:z-auto md:min-h-screen md:w-56 md:translate-x-0 md:shadow-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800 tracking-tight">RADEE-TA</p>
        <p className="text-xs text-gray-400 mt-0.5">Gestion de Secteur</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-2">
          Menu
        </p>

        {visibleItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {user ? `${user.nom} ${user.prenom ?? ''}` : 'Utilisateur'}
            </p>
            <p className="text-[10px] text-gray-400">{getRoleLabel(role)}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex min-h-11 items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors w-full px-1"
        >
          <LogOut size={13} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
