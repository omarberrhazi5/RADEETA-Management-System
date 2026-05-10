import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  KeyRound,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import { ErrorState, EmptyState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { translateActivityAction, translateModule, translateRole } from '../utils/i18nLabels';
import { ROLES } from '../utils/rbac';

const tabs = [
  { key: 'users', labelKey: 'administration.tabs.users', icon: Users },
  { key: 'roles', labelKey: 'administration.tabs.roles', icon: KeyRound },
  { key: 'settings', labelKey: 'administration.tabs.settings', icon: Settings },
  { key: 'logs', labelKey: 'administration.tabs.logs', icon: ClipboardList },
];

const managedRoles = [ROLES.DIRECTEUR, ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.VIEWER];
const roleColors = {
  [ROLES.DIRECTEUR]: 'purple',
  [ROLES.RESPONSABLE]: 'green',
  [ROLES.MANAGER]: 'indigo',
  [ROLES.TECHNICIAN]: 'green',
  [ROLES.VIEWER]: 'gray',
};
const modules = ['Administration', 'Clients', 'Compteurs', 'Secteurs', 'Anomalies', 'Reparations', 'Interventions', 'Dashboard', 'Reports'];
const permissions = {
  [ROLES.DIRECTEUR]: modules,
  [ROLES.RESPONSABLE]: ['Clients', 'Compteurs', 'Secteurs', 'Anomalies', 'Reparations', 'Interventions', 'Dashboard'],
  [ROLES.MANAGER]: ['Clients', 'Compteurs', 'Secteurs', 'Anomalies', 'Dashboard', 'Reports'],
  [ROLES.TECHNICIAN]: ['Anomalies', 'Reparations', 'Interventions', 'Dashboard'],
  [ROLES.VIEWER]: ['Clients', 'Compteurs', 'Dashboard'],
};
const actionColors = {
  'Nouvel utilisateur créé': 'green',
  'Connexion utilisateur': 'green',
  'Status modifié': 'amber',
  'Modification des paramètres': 'purple',
  'Intervention assignée': 'green',
  'Intervention modifiée': 'amber',
  'Utilisateur modifié': 'amber',
};

function userName(user) {
  if (typeof user === 'string') return user;
  return `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || user?.identifiant || '-';
}

function activityUserName(t, log) {
  const name = log.user_name || userName(log.user_details ?? log.user);
  return name === 'System' ? t('common.system') : name;
}

function sortable(row, key) {
  const value = row[key];
  if (value === null || value === undefined) return '';
  return String(value);
}

function SkeletonRows({ columns = 7 }) {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={index} className="animate-pulse">
      {Array.from({ length: columns }).map((__, cell) => (
        <td key={cell} className="px-4 py-4"><div className="h-4 rounded bg-gray-100" /></td>
      ))}
    </tr>
  ));
}

export default function Administration() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const users = useResource(endpoints.users, { limit: 500 });
  const logs = useResource(endpoints.logs, { limit: 500 });
  const [activeTab, setActiveTab] = useState('users');
  const [toast, setToast] = useState(null);

  function notify(type, message) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.type === 'success' ? 'border-green-100 bg-[var(--srm-green-soft)] text-[var(--srm-green)]' : 'border-red-100 bg-[var(--srm-red-soft)] text-[var(--srm-red)]'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('sidebar.administration')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('administration.subtitle')}</p>
        </div>
        <Badge label={translateRole(t, role)} color={roleColors[role] ?? 'gray'} />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          {tabs.map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border-l-4 px-3 text-sm font-semibold transition duration-300 ${activeTab === key ? 'border-l-[var(--srm-green)] bg-[var(--srm-green-soft)] text-[var(--srm-green)] shadow-sm' : 'border-l-transparent text-gray-600 hover:bg-[var(--srm-green-soft)] hover:text-[var(--srm-green)]'}`}
            >
              <Icon size={16} />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'users' && <UsersTab users={users} notify={notify} />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'settings' && <SettingsTab notify={notify} />}
      {activeTab === 'logs' && <LogsTab logs={logs} />}
    </div>
  );
}

function UsersTab({ users, notify }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sort, setSort] = useState({ key: 'identifiant', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const pageSize = 10;

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return users.items
      .filter((user) => (!roleFilter || user.role === roleFilter))
      .filter((user) => !search || [user.identifiant, user.nom, user.prenom, user.email, user.role].join(' ').toLowerCase().includes(search))
      .sort((a, b) => {
        const left = sortable(a, sort.key);
        const right = sortable(b, sort.key);
        return sort.direction === 'asc' ? left.localeCompare(right, undefined, { numeric: true }) : right.localeCompare(left, undefined, { numeric: true });
      });
  }, [query, roleFilter, sort, users.items]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const columns = [
    ['identifiant', t('tables.identifier')],
    ['nom', t('tables.name')],
    ['prenom', t('tables.firstName')],
    ['email', t('tables.email')],
    ['role', t('tables.role')],
    ['status', t('tables.status')],
  ];

  function toggleSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
      {users.error && <ErrorState message={users.error} />}
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{t('administration.usersTitle')}</h2>
          <p className="mt-1 text-xs text-gray-500">{t('common.records', { count: rows.length })}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={t('forms.searchPlaceholder')} className="h-11 rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100" />
          </div>
          <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100">
            <option value="">{t('common.allRoles')}</option>
            {managedRoles.map((value) => <option key={value} value={value}>{translateRole(t, value)}</option>)}
          </select>
          <Button variant="primary" onClick={() => setModalOpen(true)}><Plus size={16} />{t('buttons.create')}</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(([key, label]) => (
                <th key={key} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-gray-900">
                    {label}
                    {sort.key === key ? (sort.direction === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.loading ? <SkeletonRows /> : pagedRows.map((user) => (
              <tr key={user.id} className="transition duration-300 hover:bg-[var(--srm-green-soft)]">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{user.identifiant}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{user.nom ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{user.prenom ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{user.email ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3"><Badge label={translateRole(t, user.role)} color={roleColors[user.role] ?? 'gray'} /></td>
                <td className="whitespace-nowrap px-4 py-3"><Badge label={t('statuses.active')} color="green" /></td>
                <td className="px-4 py-3 text-right text-xs text-gray-400">{t('tables.rbacManagement')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!users.loading && rows.length === 0 && <EmptyState message={t('common.emptyFiltered')} />}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPage={setPage} />
      {modalOpen && <UserModal onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); users.refresh(); notify('success', t('administration.created')); }} notify={notify} />}
    </section>
  );
}

function UserModal({ onClose, onCreated, notify }) {
  const { t } = useTranslation();
  const [values, setValues] = useState({ identifiant: '', prenom: '', nom: '', email: '', password: '', role: ROLES.VIEWER, agence: 'SRM-FM Taza' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '', general: '' }));
  }

  function validate() {
    const next = {};
    ['identifiant', 'nom', 'password', 'role'].forEach((field) => {
      if (!String(values[field] ?? '').trim()) next[field] = t('forms.required');
    });
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = t('forms.invalidEmail');
    if (values.password && values.password.length < 8) next.password = t('forms.minPassword');
    return next;
  }

  async function submit(event) {
    event.preventDefault();
    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    try {
      setSaving(true);
      await api.post('/users', values);
      onCreated();
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      setErrors(apiErrors ? Object.fromEntries(Object.entries(apiErrors).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages])) : { general: error.response?.data?.message ?? t('administration.creationImpossible') });
      notify('error', t('administration.createFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t('buttons.create')} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        {errors.general && <div className="rounded-lg border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm text-[var(--srm-red)]">{errors.general}</div>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t('forms.identifier')} name="identifiant" value={values.identifiant} error={errors.identifiant} onChange={update} required />
          <Field label={t('forms.firstName')} name="prenom" value={values.prenom} error={errors.prenom} onChange={update} />
          <Field label={t('forms.lastName')} name="nom" value={values.nom} error={errors.nom} onChange={update} required />
          <Field label={t('forms.email')} name="email" type="email" value={values.email} error={errors.email} onChange={update} />
          <Field label={t('forms.password')} name="password" type="password" value={values.password} error={errors.password} onChange={update} required />
          <Select label={t('forms.role')} name="role" value={values.role} error={errors.role} onChange={update} options={managedRoles.map((value) => [value, translateRole(t, value)])} required />
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose}>{t('buttons.cancel')}</Button>
          <Button variant="primary" type="submit" loading={saving}>{t('buttons.create')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function RolesTab() {
  const { t } = useTranslation();

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      {managedRoles.map((role) => (
        <div key={role} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Badge label={translateRole(t, role)} color={roleColors[role]} />
            <Shield size={18} className="text-gray-400" />
          </div>
          <div className="space-y-2">
            {modules.map((module) => {
              const allowed = permissions[role].includes(module);
              return (
                <div key={module} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                  <span className="text-gray-700">{translateModule(t, module)}</span>
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${allowed ? 'bg-[var(--srm-green-soft)] text-[var(--srm-green)]' : 'bg-gray-50 text-gray-300'}`}>
                    {allowed ? <Check size={14} /> : <X size={14} />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function SettingsTab({ notify }) {
  const { t } = useTranslation();
  const settings = useResource(endpoints.settings);
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (settings.data) {
      setValues({
        agency_name: settings.data.agency_name ?? 'SRM-FM Taza',
        application_name: settings.data.application_name ?? 'SRM-FM',
        default_language: settings.data.default_language ?? 'fr',
        notification_preferences: settings.data.notification_preferences ?? { email: true, in_app: true, daily_digest: false },
        dashboard_preferences: settings.data.dashboard_preferences ?? { show_maps: true, show_charts: true, compact_cards: false },
      });
    }
  }, [settings.data]);

  function update(path, value) {
    setValues((current) => {
      if (!path.includes('.')) return { ...current, [path]: value };
      const [group, key] = path.split('.');
      return { ...current, [group]: { ...current[group], [key]: value } };
    });
  }

  async function save(event) {
    event.preventDefault();
    setErrors({});
    try {
      setSaving(true);
      const response = await api.put('/settings', values);
      setValues(response.data);
      notify('success', t('administration.settingsSaved'));
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      setErrors(apiErrors ?? { general: error.response?.data?.message ?? t('administration.saveImpossible') });
      notify('error', t('administration.saveSettingsFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (settings.loading || !values) return <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><SkeletonRows columns={2} /></section>;
  if (settings.error) return <ErrorState message={settings.error} />;

  return (
    <form onSubmit={save} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><SlidersHorizontal size={17} />{t('administration.generalSettings')}</div>
        {errors.general && <div className="mb-3 rounded-lg border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm text-[var(--srm-red)]">{errors.general}</div>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t('forms.agencyName')} name="agency_name" value={values.agency_name} onChange={update} error={errors.agency_name} />
          <Field label={t('forms.applicationName')} name="application_name" value={values.application_name} onChange={update} error={errors.application_name} />
          <Select label={t('forms.defaultLanguage')} name="default_language" value={values.default_language} onChange={update} options={[['fr', t('common.french')], ['en', t('common.english')]]} error={errors.default_language} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><Bell size={17} />{t('administration.preferences')}</div>
        <Toggle label={t('administration.emailNotifications')} checked={values.notification_preferences.email} onChange={(checked) => update('notification_preferences.email', checked)} />
        <Toggle label={t('administration.inAppNotifications')} checked={values.notification_preferences.in_app} onChange={(checked) => update('notification_preferences.in_app', checked)} />
        <Toggle label={t('administration.dailyDigest')} checked={values.notification_preferences.daily_digest} onChange={(checked) => update('notification_preferences.daily_digest', checked)} />
        <div className="my-4 border-t border-gray-100" />
        <Toggle label={t('administration.dashboardMap')} checked={values.dashboard_preferences.show_maps} onChange={(checked) => update('dashboard_preferences.show_maps', checked)} />
        <Toggle label={t('administration.dashboardCharts')} checked={values.dashboard_preferences.show_charts} onChange={(checked) => update('dashboard_preferences.show_charts', checked)} />
        <Toggle label={t('administration.compactCards')} checked={values.dashboard_preferences.compact_cards} onChange={(checked) => update('dashboard_preferences.compact_cards', checked)} />
        <Button variant="primary" type="submit" loading={saving} className="mt-5 w-full"><Save size={16} />{t('buttons.save')}</Button>
      </div>
    </form>
  );
}

function LogsTab({ logs }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return logs.items
      .filter((log) => !moduleFilter || log.module === moduleFilter)
      .filter((log) => !search || [activityUserName(t, log), log.action, log.module, log.ip_address].join(' ').toLowerCase().includes(search));
  }, [logs.items, moduleFilter, query, t]);
  const modulesList = [...new Set(logs.items.map((log) => log.module).filter(Boolean))];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
      {logs.error && <ErrorState message={logs.error} />}
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{t('administration.tabs.logs')}</h2>
          <p className="mt-1 text-xs text-gray-500">{t('common.events', { count: rows.length })}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={t('forms.searchPlaceholder')} className="h-11 rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100" />
          </div>
          <select value={moduleFilter} onChange={(event) => { setModuleFilter(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100">
            <option value="">{t('common.allModules')}</option>
            {modulesList.map((module) => <option key={module} value={module}>{translateModule(t, module)}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[t('tables.user'), t('tables.action'), t('tables.module'), t('tables.dateTime'), t('tables.ipAddress')].map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.loading ? <SkeletonRows columns={5} /> : pagedRows.map((log) => (
              <tr key={log.id} className="transition duration-300 hover:bg-[var(--srm-green-soft)]">
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{activityUserName(t, log)}</td>
                <td className="whitespace-nowrap px-4 py-3"><Badge label={translateActivityAction(t, log.action)} color={actionColors[log.action] ?? 'gray'} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{translateModule(t, log.module)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{log.created_at?.replace('T', ' ') ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{log.ip_address ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!logs.loading && rows.length === 0 && <EmptyState message={t('administration.logsEmpty')} />}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPage={setPage} />
    </section>
  );
}

function Pagination({ currentPage, totalPages, onPage }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
      <div>{t('common.pageOf', { current: currentPage, total: totalPages })}</div>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={currentPage === 1} onClick={() => onPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} />{t('buttons.previous')}</Button>
        <Button variant="secondary" disabled={currentPage === totalPages} onClick={() => onPage((value) => Math.min(totalPages, value + 1))}>{t('buttons.next')}<ChevronRight size={15} /></Button>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[var(--srm-red)]"> *</span>}</span>
      <input type={type} value={value ?? ''} onChange={(event) => onChange(name, event.target.value)} className={`h-11 w-full rounded-lg border px-3 text-sm text-gray-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${error ? 'border-[var(--srm-red)]' : 'border-gray-200'}`} />
      {error && <span className="mt-1 block text-xs text-[var(--srm-red)]">{Array.isArray(error) ? error[0] : error}</span>}
    </label>
  );
}

function Select({ label, name, value, options, onChange, error, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[var(--srm-red)]"> *</span>}</span>
      <select value={value ?? ''} onChange={(event) => onChange(name, event.target.value)} className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-gray-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${error ? 'border-[var(--srm-red)]' : 'border-gray-200'}`}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
      {error && <span className="mt-1 block text-xs text-[var(--srm-red)]">{Array.isArray(error) ? error[0] : error}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg px-1 py-2 text-sm text-gray-700">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-gray-300 accent-[var(--srm-green)] focus:ring-[var(--srm-green)]" />
    </label>
  );
}
