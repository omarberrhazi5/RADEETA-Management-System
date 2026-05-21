import { useState } from 'react';
import { Mail, Shield, UserRound } from 'lucide-react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { translateRole } from '../utils/i18nLabels';
import { useTranslation } from 'react-i18next';

const initialPasswords = {
  current_password: '',
  password: '',
  password_confirmation: '',
};

export default function Profile() {
  const { t } = useTranslation();
  const { role, user } = useAuth();
  const [passwords, setPasswords] = useState(initialPasswords);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fullName = user?.name || `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || '-';

  function updatePassword(name, value) {
    setPasswords((current) => ({ ...current, [name]: value }));
    setMessage('');
    setError('');
  }

  async function submitPassword(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');
      const response = await api.post('/user/change-password', passwords);
      setPasswords(initialPasswords);
      setMessage(response.data?.message ?? 'Mot de passe mis à jour avec succès !');
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(
        errors?.current_password?.[0]
          ?? errors?.password?.[0]
          ?? requestError.response?.data?.message
          ?? 'Impossible de mettre à jour le mot de passe.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Mon Profil</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Informations du compte et sécurité.</p>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoItem icon={UserRound} label="Name" value={fullName} />
          <InfoItem icon={Mail} label="Email" value={user?.email ?? '-'} />
          <InfoItem icon={Shield} label="Role" value={translateRole(t, role)} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Gestion du mot de passe</h2>

        {message && <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{message}</div>}
        {error && <div className="mt-4 rounded-xl border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm font-semibold text-[var(--srm-red)]">{error}</div>}

        <form onSubmit={submitPassword} className="mt-4 space-y-4">
          <PasswordInput
            label="Current Password"
            value={passwords.current_password}
            onChange={(value) => updatePassword('current_password', value)}
          />
          <PasswordInput
            label="New Password"
            value={passwords.password}
            onChange={(value) => updatePassword('password', value)}
          />
          <PasswordInput
            label="Confirm New Password"
            value={passwords.password_confirmation}
            onChange={(value) => updatePassword('password_confirmation', value)}
          />

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="submit" variant="primary" loading={saving}>Mettre à jour</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <Icon size={15} strokeWidth={1.5} />
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function PasswordInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={8}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}
