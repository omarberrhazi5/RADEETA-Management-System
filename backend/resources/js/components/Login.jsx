import axios from 'axios';
import { Droplets, LockKeyhole, UserRound } from 'lucide-react';
import { useState } from 'react';

export default function Login({ onLogin }) {
    const [form, setForm] = useState({ identifiant: '', password: '', device_name: 'dashboard-web' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const updateField = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await axios.post('/api/login', form);
            const user = data.user?.data || data.user;
            onLogin({ token: data.token, user });
        } catch (requestError) {
            const message =
                requestError.response?.data?.message ||
                requestError.response?.data?.errors?.identifiant?.[0] ||
                'Connexion impossible. Vérifiez vos accès.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8fafc] px-4 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_32%)]" />
            <div className="absolute left-1/2 top-10 h-44 w-44 -translate-x-1/2 rounded-full border border-blue-200/60 bg-white/40 blur-3xl" />

            <section className="relative w-full max-w-md animate-[fadeIn_0.45s_ease-out]">
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_20px_45px_-18px_rgba(37,99,235,0.9)]">
                        <Droplets className="h-7 w-7" />
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-normal text-slate-950">Gestion de Reclamation</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">SRM-FM Taza</p>
                </div>

                <form
                    className="rounded-2xl border border-white/70 bg-white/78 p-6 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.65)] backdrop-blur-2xl"
                    onSubmit={submit}
                >
                    <div>
                        <label className="text-sm font-semibold text-slate-700" htmlFor="identifiant">
                            Identifiant
                        </label>
                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                            <UserRound className="h-5 w-5 text-slate-400" />
                            <input
                                className="h-12 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                id="identifiant"
                                name="identifiant"
                                placeholder="nabil.hammoch"
                                type="text"
                                value={form.identifiant}
                                onChange={updateField}
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                            Mot de passe
                        </label>
                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                            <LockKeyhole className="h-5 w-5 text-slate-400" />
                            <input
                                className="h-12 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                type="password"
                                value={form.password}
                                onChange={updateField}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        className="mt-6 h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white shadow-[0_18px_35px_-18px_rgba(37,99,235,0.9)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={loading}
                        type="submit"
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>
            </section>
        </main>
    );
}
