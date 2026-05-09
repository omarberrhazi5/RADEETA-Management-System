import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = useState({ identifiant: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');

    const payload = {
      identifiant: form.identifiant.trim(),
      password: form.password,
    };

    if (!payload.identifiant || !payload.password) {
      setError(t('login.missingCredentials'));
      return;
    }

    try {
      setLoading(true);
      const target = await login(payload);
      navigate(location.state?.from?.pathname ?? target, { replace: true });
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null;

      setError(firstValidationError ?? err.response?.data?.message ?? t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-700 text-lg font-bold text-white">
            SRM
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('common.appName')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('forms.emailOrIdentifier')}</label>
            <input
              name="identifiant"
              value={form.identifiant}
              onChange={(event) => setForm((current) => ({ ...current, identifiant: event.target.value }))}
              autoComplete="username"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={t('login.identifierPlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('forms.password')}</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                autoComplete="current-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder={t('login.passwordPlaceholder')}
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100" aria-label={t('buttons.togglePassword')}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
            <LogIn size={16} />
            {loading ? t('buttons.signingIn') : t('buttons.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
