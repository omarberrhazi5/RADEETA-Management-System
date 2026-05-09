import { AlertTriangle, Gauge, LayoutDashboard, Map, PlugZap, UsersRound, Wrench } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navigation = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Secteurs', to: '/secteurs', icon: Map },
    { label: 'Clients', to: '/clients', icon: UsersRound },
    { label: 'Compteurs', to: '/compteurs', icon: Gauge },
    { label: 'Pannes', to: '/pannes', icon: AlertTriangle },
    { label: 'Réparations', to: '/reparations', icon: Wrench },
];

function BrandLogo() {
    return (
        <div className="flex items-center gap-3">
            <svg aria-hidden="true" className="h-11 w-11 shrink-0" viewBox="0 0 48 48">
                <defs>
                    <linearGradient id="srmLogo" x1="8" x2="40" y1="6" y2="42">
                        <stop stopColor="#38bdf8" />
                        <stop offset="0.52" stopColor="#2563eb" />
                        <stop offset="1" stopColor="#0f172a" />
                    </linearGradient>
                </defs>
                <rect fill="url(#srmLogo)" height="42" rx="12" width="42" x="3" y="3" />
                <path
                    d="M24 10c4.7 5.2 8 9.6 8 14.1a8 8 0 1 1-16 0C16 19.6 19.3 15.2 24 10Z"
                    fill="white"
                    opacity="0.94"
                />
                <path d="M29.5 14.5 22 25.2h6.2L20 37l2.3-9.1h-5.8l13-13.4Z" fill="#facc15" />
                <path d="M9 34c5-2.1 9.7-2.1 14.2 0 5.3 2.5 10.5 2.5 15.8 0" fill="none" stroke="#bfdbfe" strokeLinecap="round" strokeWidth="2" />
            </svg>
            <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-white">Gestion de Reclamation</p>
                <p className="truncate text-xs font-semibold text-slate-400">SRM-FM Taza</p>
            </div>
        </div>
    );
}

export default function Sidebar({ isOpen, onClose }) {
    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col bg-[#1e293b] shadow-[25px_0_70px_-45px_rgba(15,23,42,0.95)] transition duration-300 lg:translate-x-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            <div className="flex h-20 items-center border-b border-white/10 px-6">
                <BrandLogo />
            </div>

            <nav className="flex-1 space-y-1 px-4 py-5">
                {navigation.map((item) => (
                    <NavLink
                        end={item.to === '/'}
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            [
                                'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition duration-200',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-[0_16px_35px_-20px_rgba(37,99,235,0.95)]'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white',
                            ].join(' ')
                        }
                    >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="m-4 rounded-xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-200">
                        <PlugZap className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Réseau supervisé</p>
                        <p className="text-xs text-slate-400">Eau, électricité, secteurs</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
