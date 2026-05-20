import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Droplets,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  UserRound,
  Zap,
} from 'lucide-react';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import { ErrorState, EmptyState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { translateAnomaly, translateStatus } from '../utils/i18nLabels';
import { ROLES, canCreate, canUpdate } from '../utils/rbac';
import { errorText, fieldError, focusFirstInvalid, normalizeApiErrors } from '../utils/formValidation';

const statusKeys = ['en_attente', 'en_cours', 'terminee', 'annulee'];
const priorityKeys = ['low', 'normal', 'high', 'urgent'];
const statusColors = { en_attente: 'amber', en_cours: 'green', terminee: 'green', annulee: 'gray' };
const priorityColors = { low: 'gray', normal: 'green', high: 'amber', urgent: 'red' };
const WORKSPACE_GPS_FALLBACK = {
  latitude: '34.2111',
  longitude: '-4.0111',
};
const GEOLOCATION_ERROR_MESSAGE = 'Veuillez activer la géolocalisation sur votre appareil.';

function normalizeStatus(status) {
  if (status === 'echouee') return 'annulee';
  if (status === 'open') return 'en_attente';
  return status || 'en_attente';
}

function technicianName(technician) {
  return `${technician?.prenom ?? ''} ${technician?.nom ?? ''}`.trim() || technician?.identifiant || '-';
}

function clientName(client) {
  return `${client?.prenom ?? ''} ${client?.nom ?? ''}`.trim() || client?.police || '-';
}

function formatDate(value) {
  return value ? value.replace('T', ' ') : '-';
}

function sortableValue(row, key) {
  if (key === 'anomalie') return row.panne?.anomalie ?? '';
  if (key === 'technician') return technicianName(row.technician);
  const value = row[key];
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function searchable(row) {
  return [
    row.intervention_number,
    row.service_type,
    row.panne?.anomalie,
    technicianName(row.technician),
    row.priority,
    row.status,
    row.work_type,
    row.observations,
    clientName(row.client ?? row.panne?.compteur?.client),
    row.meter?.cadran ?? row.panne?.compteur?.cadran,
  ].join(' ').toLowerCase();
}

function sectorFromRecord(record) {
  return record?.panne?.compteur?.secteur ?? record?.meter?.secteur ?? record?.compteur?.secteur ?? null;
}

function sectorCoordinates(record) {
  const secteur = sectorFromRecord(record);
  const latitude = Number(secteur?.latitude);
  const longitude = Number(secteur?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    sectorName: secteur?.nom_secteur,
  };
}

function StatTile({ label, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-[var(--srm-green-soft)] text-[var(--srm-green)] border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    green: 'bg-[var(--srm-green-soft)] text-[var(--srm-green)] border-green-100',
    red: 'bg-[var(--srm-red-soft)] text-[var(--srm-red)] border-red-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={index} className="animate-pulse">
      {Array.from({ length: 7 }).map((__, cell) => (
        <td key={cell} className="px-4 py-4">
          <div className="h-4 rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  ));
}

export default function Interventions() {
  const { t } = useTranslation();
  const location = useLocation();
  const { role, user } = useAuth();
  const formRef = useRef(null);
  const { error, items, loading, refresh } = useResource(endpoints.interventions, { limit: 500 });
  const pannes = useResource(endpoints.pannes, { limit: 500 });
  const technicians = useResource(endpoints.technicians, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN && role !== ROLES.VIEWER });
  const [query, setQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [sort, setSort] = useState({ key: 'started_at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const pageSize = 10;
  const isMonitoringRole = [ROLES.RESPONSABLE, ROLES.MANAGER].includes(role);
  const canCreateIntervention = canCreate(role, 'interventions') || role === ROLES.MANAGER;
  const canEditIntervention = canUpdate(role, 'interventions') && !isMonitoringRole;
  const managerEdit = formState?.mode === 'edit' && role === ROLES.MANAGER;
  const technicianEdit = formState?.mode === 'edit' && role === ROLES.TECHNICIAN;
  const fullEdit = !managerEdit && !technicianEdit;
  const targetInterventionId = location.state?.targetInterventionId ?? null;
  const targetPanneId = location.state?.targetPanneId ?? null;

  const stats = useMemo(() => ({
    water: items.filter((item) => item.service_type === 'water').length,
    electricity: items.filter((item) => item.service_type === 'electricity').length,
    inProgress: items.filter((item) => normalizeStatus(item.status) === 'en_cours').length,
    completed: items.filter((item) => normalizeStatus(item.status) === 'terminee').length,
    pending: items.filter((item) => normalizeStatus(item.status) === 'en_attente').length,
    cancelled: items.filter((item) => normalizeStatus(item.status) === 'annulee').length,
  }), [items]);

  const visibleRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesSearch = !search || searchable(item).includes(search);
      const matchesService = !serviceFilter || item.service_type === serviceFilter;
      const matchesTargetIntervention = !targetInterventionId || String(item.id) === String(targetInterventionId);
      const matchesTargetPanne = !targetPanneId || String(item.panne_id ?? item.id_panne) === String(targetPanneId);
      return matchesSearch && matchesService && matchesTargetIntervention && matchesTargetPanne;
    });

    return [...filtered].sort((left, right) => {
      const a = sortableValue(left, sort.key);
      const b = sortableValue(right, sort.key);
      return sort.direction === 'asc' ? a.localeCompare(b, undefined, { numeric: true }) : b.localeCompare(a, undefined, { numeric: true });
    });
  }, [items, query, serviceFilter, sort, targetInterventionId, targetPanneId]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openCreate = useCallback((panne = null) => {
    const compteur = panne?.compteur;
    const coordinates = sectorCoordinates(panne);
    setFormState({ mode: 'create' });
    setErrors({});
    setForm({
      intervention_number: t('common.autoGenerated'),
      started_at: new Date().toISOString().slice(0, 16),
      service_type: compteur?.service_type ?? 'water',
      technician_id: role === ROLES.TECHNICIAN ? user?.id : panne?.assigned_to ?? '',
      client_id: compteur?.client?.id ?? compteur?.id_client ?? '',
      meter_id: compteur?.id ?? compteur?.id_compteur ?? panne?.id_compteur ?? '',
      panne_id: panne?.id_panne ?? panne?.id ?? '',
      work_type: t('interventions.defaultWorkType'),
      materials_used: '',
      priority: 'normal',
      observations: '',
      latitude: coordinates?.latitude ?? WORKSPACE_GPS_FALLBACK.latitude,
      longitude: coordinates?.longitude ?? WORKSPACE_GPS_FALLBACK.longitude,
      location_note: '',
      status: 'en_attente',
      completed_at: '',
    });
  }, [role, t, user?.id]);

  useEffect(() => {
    if (location.state?.panne) {
      openCreate(location.state.panne);
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.panne, openCreate]);

  function openEdit(item) {
    const coordinates = sectorCoordinates(item);
    setFormState({ mode: 'edit', item });
    setErrors({});
    setForm({
      intervention_number: item.intervention_number ?? item.numero_intervention ?? '',
      started_at: item.started_at ?? item.intervention_at ?? '',
      service_type: item.service_type ?? 'water',
      technician_id: item.technician_id ?? '',
      client_id: item.client_id ?? item.panne?.compteur?.client?.id ?? '',
      meter_id: item.meter_id ?? item.panne?.id_compteur ?? '',
      panne_id: item.panne_id ?? item.id_panne ?? '',
      work_type: item.work_type ?? '',
      materials_used: Array.isArray(item.materials_used ?? item.material_used) ? (item.materials_used ?? item.material_used).join('\n') : item.materials_used ?? '',
      priority: item.priority ?? 'normal',
      observations: item.observations ?? '',
      latitude: item.latitude ?? coordinates?.latitude ?? WORKSPACE_GPS_FALLBACK.latitude,
      longitude: item.longitude ?? coordinates?.longitude ?? WORKSPACE_GPS_FALLBACK.longitude,
      location_note: item.location_note ?? '',
      status: normalizeStatus(item.status),
      completed_at: item.completed_at ?? '',
    });
  }

  function update(name, value) {
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    setErrors((current) => ({ ...current, [name]: validateField(name, nextForm), general: '' }));

    if (name === 'panne_id') {
      const panne = pannes.items.find((item) => String(item.id_panne ?? item.id) === String(value));
      if (panne?.compteur) {
        setForm((current) => ({
          ...current,
          service_type: panne.compteur.service_type ?? current.service_type,
          client_id: panne.compteur.client?.id ?? panne.compteur.id_client ?? current.client_id,
          meter_id: panne.compteur.id ?? panne.compteur.id_compteur ?? panne.id_compteur ?? current.meter_id,
        }));
      }
    }
  }

  function validate() {
    const next = {};
    const requiredFields = managerEdit
      ? ['status']
      : technicianEdit
        ? ['status']
        : ['started_at', 'service_type', 'panne_id', 'work_type', 'priority', 'status'];

    requiredFields.forEach((field) => {
      const error = validateField(field);
      if (error) next[field] = error;
    });
    return next;
  }

  function validateField(field, nextForm = form) {
    const dateFields = ['started_at', 'completed_at'];
    if (dateFields.includes(field) && nextForm[field]) return fieldError(nextForm[field], { type: 'date' }, t);

    const requiredFields = managerEdit
      ? ['status']
      : technicianEdit
        ? ['status']
        : ['started_at', 'service_type', 'panne_id', 'work_type', 'priority', 'status'];

    return fieldError(nextForm[field], {
      required: requiredFields.includes(field),
      type: dateFields.includes(field) ? 'date' : undefined,
    }, t);
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(formRef, nextErrors);
      return;
    }

    const payload = {
      started_at: form.started_at,
      service_type: form.service_type,
      technician_id: form.technician_id || null,
      client_id: form.client_id || null,
      meter_id: form.meter_id || null,
      panne_id: form.panne_id,
      work_type: form.work_type,
      materials_used: form.materials_used,
      priority: form.priority,
      observations: form.observations,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
      location_note: form.location_note || null,
      status: form.status,
      completed_at: form.completed_at || null,
    };

    try {
      setSaving(true);
      if (formState.mode === 'create') {
        await api.post('/interventions', payload);
      } else {
        await api.put(`/interventions/${formState.item.id}`, payload);
        if (role === ROLES.TECHNICIAN && payload.status === 'terminee') {
          setToast({ message: 'Intervention terminée et enregistrée dans les réparations', type: 'success' });
          window.setTimeout(() => setToast(null), 3500);
        }
      }
      setFormState(null);
      refresh();
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      setErrors(normalizeApiErrors(apiErrors, error.response?.data?.message ?? t('interventions.unableToSave')));
    } finally {
      setSaving(false);
    }
  }

  function toggleSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  }

  function saveGpsCoordinates(latitude, longitude) {
    setForm((current) => ({
      ...current,
      latitude,
      longitude,
    }));
    setToast({ message: 'Localisation enregistrée avec succès', type: 'success' });
    window.setTimeout(() => setToast(null), 2500);
  }

  function saveWorkspaceGpsFallback() {
    setForm((current) => ({
      ...current,
      latitude: WORKSPACE_GPS_FALLBACK.latitude,
      longitude: WORKSPACE_GPS_FALLBACK.longitude,
    }));

    setToast({ message: GEOLOCATION_ERROR_MESSAGE, type: 'error' });
    window.setTimeout(() => setToast(null), 3500);
  }

  function captureGps() {
    if (!navigator.geolocation) {
      saveWorkspaceGpsFallback();
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveGpsCoordinates(position.coords.latitude.toFixed(6), position.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      () => {
        saveWorkspaceGpsFallback();
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  const columns = [
    { key: 'service_type', header: t('tables.type') },
    { key: 'anomalie', header: t('tables.anomaly') },
    { key: 'technician', header: t('tables.technician') },
    { key: 'priority', header: t('tables.priority') },
    { key: 'status', header: t('forms.status') },
    { key: 'started_at', header: t('tables.startedAt') },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
          (toast.type ?? 'success') === 'error'
            ? 'border-red-100 bg-[var(--srm-red-soft)] text-[var(--srm-red)]'
            : 'border-green-100 bg-[var(--srm-green-soft)] text-[var(--srm-green)]'
        }`}>
          {toast.message ?? toast}
        </div>
      )}
      {error && <ErrorState message={error} />}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('interventions.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('interventions.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={t('common.searchPlaceholder')}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 sm:w-72"
            />
          </div>
          <select
            value={serviceFilter}
            onChange={(event) => {
              setServiceFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100"
          >
            <option value="">{t('buttons.filter')}</option>
            <option value="water">{t('services.water')}</option>
            <option value="electricity">{t('services.electricity')}</option>
          </select>
          {canCreateIntervention && (
            <Button variant="primary" onClick={() => openCreate()}>
              <Plus size={16} />
              {t('interventions.new')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatTile label={t('interventions.water')} value={stats.water} icon={Droplets} color="blue" />
        <StatTile label={t('interventions.electricity')} value={stats.electricity} icon={Zap} color="amber" />
        <StatTile label={t('interventions.inProgress')} value={stats.inProgress} icon={Activity} color="blue" />
        <StatTile label={t('interventions.completed')} value={stats.completed} icon={ClipboardCheck} color="green" />
        <StatTile label={t('interventions.pending')} value={stats.pending} icon={CalendarClock} color="amber" />
        <StatTile label={t('interventions.cancelled')} value={stats.cancelled} icon={ShieldAlert} color="gray" />
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{t('interventions.title')}</h2>
            <p className="mt-1 text-xs text-gray-500">{t('common.showing', { visible: visibleRows.length, total: items.length })}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 hover:text-gray-900">
                      {column.header}
                      {sort.key === column.key ? (sort.direction === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null}
                    </button>
                  </th>
                ))}
                {canEditIntervention && <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <LoadingRows /> : pagedRows.map((row) => {
                const status = normalizeStatus(row.status);
                return (
                  <tr key={row.id} className="transition duration-300 hover:bg-[var(--srm-green-soft)]">
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge label={t(`services.${row.service_type ?? 'water'}`)} color={row.service_type === 'electricity' ? 'amber' : 'blue'} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{translateAnomaly(t, row.panne?.anomalie)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      <span className="inline-flex items-center gap-2">
                        <UserRound size={15} className="text-gray-400" />
                        {technicianName(row.technician)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge label={translateStatus(t, row.priority)} color={priorityColors[row.priority] ?? 'gray'} /></td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge label={translateStatus(t, status)} color={statusColors[status] ?? 'gray'} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDate(row.started_at ?? row.intervention_at)}</td>
                    {canEditIntervention && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button type="button" onClick={() => openEdit(row)} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 transition duration-300 hover:bg-[var(--srm-green-soft)] hover:text-[var(--srm-green)]" title={t('buttons.edit')}>
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && visibleRows.length === 0 && <EmptyState message={t('common.emptyFiltered')} />}
        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>{t('common.pageOf', { current: currentPage, total: totalPages })}</div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronLeft size={15} />
              {t('buttons.previous')}
            </Button>
            <Button variant="secondary" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              {t('buttons.next')}
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      </section>

      {formState && (
        <Modal title={formState.mode === 'create' ? t('interventions.new') : "Mettre à jour l'intervention"} onClose={() => setFormState(null)} maxWidth="max-w-4xl">
          <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
            {errors.general && <div className="rounded-lg border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm text-[var(--srm-red)]">{errors.general}</div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t('forms.interventionNumber')} name="intervention_number" value={form.intervention_number} disabled />
              {fullEdit && <Field label={t('forms.dateTime')} name="started_at" type="datetime-local" value={form.started_at} error={errors.started_at} onChange={update} required />}
              {fullEdit && <Select label={t('forms.serviceType')} name="service_type" value={form.service_type} error={errors.service_type} onChange={update} options={[['water', t('services.water')], ['electricity', t('services.electricity')]]} required />}
              {technicianEdit ? (
                <Field label={t('forms.technician')} name="technician_id" value={technicianName(user)} disabled />
              ) : (fullEdit || managerEdit) ? (
                <Select label={t('forms.technician')} name="technician_id" value={form.technician_id} error={errors.technician_id} onChange={update} options={technicians.items.map((technician) => [technician.id, technicianName(technician)])} />
              ) : null}
              {fullEdit && <Field label={t('forms.client')} name="client_id" value={form.client_id} error={errors.client_id} onChange={update} />}
              {fullEdit && <Field label={t('forms.meter')} name="meter_id" value={form.meter_id} error={errors.meter_id} onChange={update} />}
              {fullEdit && <Select label={t('forms.relatedPanne')} name="panne_id" value={form.panne_id} error={errors.panne_id} onChange={update} options={pannes.items.map((panne) => [panne.id_panne ?? panne.id, `${translateAnomaly(t, panne.anomalie)} - ${panne.compteur?.cadran ?? t('tables.meter')}`])} required />}
              {fullEdit && <Field label={t('forms.workType')} name="work_type" value={form.work_type} error={errors.work_type} onChange={update} required />}
              {fullEdit && <Select label={t('forms.priority')} name="priority" value={form.priority} error={errors.priority} onChange={update} options={priorityKeys.map((key) => [key, t(`statuses.${key}`)])} required />}
              <Select label={t('forms.status')} name="status" value={form.status} error={errors.status} onChange={update} options={statusKeys.map((key) => [key, t(`statuses.${key}`)])} required />
              {(fullEdit || technicianEdit) && <Field label={t('forms.completedAt')} name="completed_at" type="datetime-local" value={form.completed_at} error={errors.completed_at} onChange={update} />}
            </div>
            {technicianEdit && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Preuve de présence</h3>
                    <p className="mt-1 text-xs text-gray-500">Coordonnées GPS capturées depuis l'appareil du technicien.</p>
                  </div>
                  <Button variant="secondary" onClick={captureGps} loading={gpsLoading}>
                    {gpsLoading ? 'Chargement...' : 'Capturer GPS'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Latitude" name="latitude" value={form.latitude} error={errors.latitude} onChange={update} readOnly />
                  <Field label="Longitude" name="longitude" value={form.longitude} error={errors.longitude} onChange={update} readOnly />
                  <Textarea label="Repère / précisions" name="location_note" value={form.location_note} error={errors.location_note} onChange={update} className="md:col-span-2" />
                </div>
              </div>
            )}
            {(fullEdit || technicianEdit) && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Textarea label={t('forms.materialsUsed')} name="materials_used" value={form.materials_used} error={errors.materials_used} onChange={update} />
                <Textarea label={t('forms.observations')} name="observations" value={form.observations} error={errors.observations} onChange={update} />
              </div>
            )}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button variant="secondary" onClick={() => setFormState(null)}>{t('buttons.cancel')}</Button>
              <Button variant="primary" type="submit" loading={saving}>{formState.mode === 'create' ? t('buttons.create') : t('buttons.save')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', disabled = false, readOnly = false, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[var(--srm-red)]"> *</span>}</span>
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={(event) => onChange?.(name, event.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        className={`h-11 w-full rounded-xl border px-3 text-sm text-gray-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 disabled:bg-gray-50 disabled:text-gray-500 ${readOnly ? 'bg-gray-50 text-gray-600' : ''} ${error ? 'border-red-500 ring-2 ring-red-400/40' : 'border-gray-200'}`}
      />
      {error && <span className="mt-1 block text-xs text-red-500 transition-opacity duration-300">{errorText(error)}</span>}
    </label>
  );
}

function Select({ label, name, value, options, onChange, error, required = false }) {
  const { t } = useTranslation();

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[var(--srm-red)]"> *</span>}</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(name, event.target.value)}
        className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${error ? 'border-red-500 ring-2 ring-red-400/40' : 'border-gray-200'}`}
      >
        <option value="">{t('common.selectOption')}</option>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
      {error && <span className="mt-1 block text-xs text-red-500 transition-opacity duration-300">{errorText(error)}</span>}
    </label>
  );
}

function Textarea({ label, name, value, onChange, error, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <textarea
        rows={4}
        name={name}
        value={value ?? ''}
        onChange={(event) => onChange(name, event.target.value)}
        className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${error ? 'border-red-500 ring-2 ring-red-400/40' : 'border-gray-200'}`}
      />
      {error && <span className="mt-1 block text-xs text-red-500 transition-opacity duration-300">{errorText(error)}</span>}
    </label>
  );
}
