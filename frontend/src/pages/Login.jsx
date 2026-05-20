import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fieldError } from '../utils/formValidation';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const formRef = useRef(null);
  const [form, setForm] = useState({ identifiant: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  function validate(nextForm = form) {
    const next = {
      identifiant: fieldError(nextForm.identifiant, { required: true }, t),
      password: fieldError(nextForm.password, { required: true, minLength: 8 }, t),
    };

    return Object.fromEntries(Object.entries(next).filter(([, value]) => value));
  }

  function update(name, value) {
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    setErrors(validate(nextForm));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    const nextErrors = validate();

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      window.setTimeout(() => formRef.current?.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus(), 0);
      return;
    }

    const payload = {
      identifiant: form.identifiant.trim(),
      password: form.password,
    };

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
    <div className="srm-app login-premium relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="login-mesh absolute inset-0" aria-hidden="true" />
      <div className="absolute left-[8%] top-[12%] h-48 w-48 rounded-full bg-[var(--srm-green)]/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-[12%] right-[10%] h-56 w-56 rounded-full bg-sky-100/80 blur-3xl" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:26px_26px] opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-md items-center justify-center">
        <section className="login-card-entrance mx-auto w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex justify-center">
              <img
                src="/srm-logo.jpeg"
                alt="SRM-FM"
                className="h-20 w-auto max-w-56 object-contain drop-shadow-[0_14px_24px_rgba(15,23,42,0.14)]"
              />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--srm-green)]">{t('login.eyebrow')}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{t('common.appName')}</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-slate-500">{t('login.subtitle')}</p>
          </div>

          <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
            {error && <div className="rounded-xl border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm font-medium text-[var(--srm-red)]">{error}</div>}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t('forms.emailOrIdentifier')}</label>
              <input
                name="identifiant"
                value={form.identifiant}
                onChange={(event) => update('identifiant', event.target.value)}
                autoComplete="username"
                className={`h-14 w-full rounded-xl border bg-white px-4 text-sm font-medium text-slate-800 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[var(--srm-green)] focus:bg-white focus:ring-2 focus:ring-[rgb(112_184_48_/_0.22)] ${errors.identifiant ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200'}`}
                placeholder={t('login.identifierPlaceholder')}
              />
              {errors.identifiant && <p className="mt-1 text-xs font-medium text-red-500 transition-opacity duration-300">{errors.identifiant}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t('forms.password')}</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                  autoComplete="current-password"
                  className={`h-14 w-full rounded-xl border bg-white px-4 pr-12 text-sm font-medium text-slate-800 outline-none transition duration-300 placeholder:text-slate-400 focus:border-[var(--srm-green)] focus:bg-white focus:ring-2 focus:ring-[rgb(112_184_48_/_0.22)] ${errors.password ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200'}`}
                  placeholder={t('login.passwordPlaceholder')}
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition duration-300 hover:bg-[var(--srm-green-soft)] hover:text-[var(--srm-green)]" aria-label={t('buttons.togglePassword')}>
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs font-medium text-red-500 transition-opacity duration-300">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--srm-green)_0%,#63a62b_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgb(112_184_48_/_0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgb(112_184_48_/_0.28)] active:scale-95 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none">
              <LogIn size={16} strokeWidth={1.5} />
              {loading ? t('buttons.signingIn') : t('buttons.signIn')}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
