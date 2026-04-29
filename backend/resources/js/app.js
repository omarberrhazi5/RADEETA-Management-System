import {
    Activity,
    Bell,
    CircleGauge,
    Droplets,
    Gauge,
    Menu,
    ShieldCheck,
    UserRound,
    Wrench,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Sidebar from './components/Sidebar';

const storedUser = () => {
    try {
        return JSON.parse(localStorage.getItem('srm_user'));
    } catch {
        return null;
    }
};

function useAuth() {
    const [token, setToken] = useState(() => localStorage.getItem('srm_token'));
    const [user, setUser] = useState(() => storedUser());

    const login = ({ token: nextToken, user: nextUser }) => {
        localStorage.setItem('srm_token', nextToken);
        localStorage.setItem('srm_user', JSON.stringify(nextUser));
        axios.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
        setToken(nextToken);
        setUser(nextUser);
    };

    const logout = async () => {
        if (token) {
            try {
                await axios.post('/api/logout');
            } catch {
                // Local logout still clears the expired or invalid token.
            }
        }

        localStorage.removeItem('srm_token');
        localStorage.removeItem('srm_user');
        delete axios.defaults.headers.common.Authorization;
        setToken(null);
        setUser(null);
    };

    return { isAuthenticated: Boolean(token), login, logout, token, user };
}

function ProtectedRoute({ isAuthenticated, children }) {
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate replace state={{ from: location }} to="/login" />;
    }

    return children;
}

function Navbar({ onMenuClick, onLogout, user }) {
    const displayName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.name || 'Utilisateur';

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <button
                        aria-label="Ouvrir le menu"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
                        type="button"
                        onClick={onMenuClick}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">SRM-FM Taza</p>
                        <h1 className="text-lg font-bold text-slate-950">Gestion de Secteur</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 shadow-sm transition hover:bg-slate-50 md:inline-flex">
                        <Bell className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                            <UserRound className="h-5 w-5" />
                        </div>
                        <div className="hidden min-w-0 sm:block">
                            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                            <p className="text-xs capitalize text-slate-500">{user?.role || 'role'}</p>
                        </div>
                    </div>
                    <button
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                        type="button"
                        onClick={onLogout}
                    >
                        Sortir
                    </button>
                </div>
            </div>
        </header>
    );
}

function DashboardCard({ icon: Icon, label, value, trend }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-34px_rgba(37,99,235,0.5)]">
            <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{trend}</span>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
        </div>
    );
}

function Dashboard() {
    return (
        <div className="animate-[fadeIn_0.35s_ease-out] space-y-6">
            <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-[0_25px_80px_-40px_rgba(15,23,42,0.9)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">Pilotage opérationnel</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-normal">Gestion de Secteur - SRM-FM Taza</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                            Supervision des secteurs, abonnés, compteurs et interventions avec accès sécurisé par rôle.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                        <ShieldCheck className="h-5 w-5 text-blue-300" />
                        <span className="text-sm font-semibold">Sanctum protégé</span>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DashboardCard icon={Droplets} label="Secteurs actifs" trend="+3" value="12" />
                <DashboardCard icon={UserRound} label="Clients abonnés" trend="+18%" value="1 284" />
                <DashboardCard icon={Gauge} label="Compteurs suivis" trend="+42" value="1 097" />
                <DashboardCard icon={Wrench} label="Pannes ouvertes" trend="-7" value="23" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-950">Activité récente</h3>
                            <p className="text-sm text-slate-500">Interventions et anomalies à traiter</p>
                        </div>
                        <CircleGauge className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="mt-5 divide-y divide-slate-100">
                        {['Fuite avant compteur - Qods 1', 'Compteur bloqué - Medina', 'Réparation validée - Taza Bas'].map((item) => (
                            <div className="flex items-center justify-between py-4" key={item}>
                                <div className="flex items-center gap-3">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                    <span className="text-sm font-medium text-slate-700">{item}</span>
                                </div>
                                <span className="text-xs text-slate-400">Aujourd'hui</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-950">Performance réseau</h3>
                            <p className="text-sm text-slate-500">Disponibilité globale</p>
                        </div>
                    </div>
                    <div className="mt-6 h-3 rounded-full bg-slate-100">
                        <div className="h-3 w-[87%] rounded-full bg-blue-600 shadow-[0_8px_24px_-8px_rgba(37,99,235,0.9)]" />
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-slate-950">87%</p>
                </div>
            </section>
        </div>
    );
}

function PlaceholderPage({ title }) {
    return (
        <div className="animate-[fadeIn_0.35s_ease-out] rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">Module prêt pour les tableaux, formulaires et actions API.</p>
        </div>
    );
}

function MasterLayout({ onLogout, user }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="lg:pl-72">
                <Navbar onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} user={user} />
                <main className="px-4 py-6 sm:px-6 lg:px-8">
                    <Routes>
                        <Route element={<Dashboard />} path="/" />
                        <Route element={<PlaceholderPage title="Secteurs" />} path="/secteurs" />
                        <Route element={<PlaceholderPage title="Clients" />} path="/clients" />
                        <Route element={<PlaceholderPage title="Compteurs" />} path="/compteurs" />
                        <Route element={<PlaceholderPage title="Pannes" />} path="/pannes" />
                        <Route element={<PlaceholderPage title="Réparations" />} path="/reparations" />
                    </Routes>
                </main>
            </div>

            {sidebarOpen && (
                <button
                    aria-label="Fermer le menu"
                    className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                >
                    <X className="sr-only" />
                </button>
            )}
        </div>
    );
}

export default function App() {
    const auth = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    element={auth.isAuthenticated ? <Navigate replace to="/" /> : <Login onLogin={auth.login} />}
                    path="/login"
                />
                <Route
                    element={
                        <ProtectedRoute isAuthenticated={auth.isAuthenticated}>
                            <MasterLayout onLogout={auth.logout} user={auth.user} />
                        </ProtectedRoute>
                    }
                    path="/*"
                />
            </Routes>
        </BrowserRouter>
    );
}
