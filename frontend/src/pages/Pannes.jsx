import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Droplets, Home, MapPinned, Phone, Tags, Zap } from 'lucide-react';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { translateAnomaly, translateStatus } from '../utils/i18nLabels';
import { ROLES, canCreate } from '../utils/rbac';
import { errorText, fieldError, focusFirstInvalid, normalizeApiErrors } from '../utils/formValidation';

function statusColor(status) {
  const value = String(status ?? '').toLowerCase();
  if (['repare', 'reparee', 'resolu', 'resolue', 'resolved'].includes(value)) return 'green';
  if (['assigned', 'assignee', 'assignée'].includes(value)) return 'blue';
  if (['en cours', 'in_progress'].includes(value)) return 'amber';
  return 'red';
}

const anomalyCategories = [
  { value: 'water_leak', serviceType: 'water', label: 'Fuite', anomalie: 'fuite_avant_compteur' },
  { value: 'water_after_meter_leak', serviceType: 'water', label: 'Fuite après compteur', anomalie: 'fuite_apres_compteur' },
  { value: 'water_blocked_meter', serviceType: 'water', label: 'Blocage', anomalie: 'compteur_bloque' },
  { value: 'water_pressure', serviceType: 'water', label: 'Pression', anomalie: 'pression_faible' },
  { value: 'electricity_outage', serviceType: 'electricity', label: 'Coupure', anomalie: 'coupure_electricite' },
  { value: 'electricity_voltage', serviceType: 'electricity', label: 'Tension', anomalie: 'tension_instable' },
  { value: 'electricity_damaged_meter', serviceType: 'electricity', label: 'Compteur endommagé', anomalie: 'compteur_casse' },
  { value: 'electricity_illegal_connection', serviceType: 'electricity', label: 'Branchement illicite', anomalie: 'branchement_illicite' },
];

const otherAnomalyValue = 'other';

const meterTypeOptions = [
  { value: 'water', label: "Compteur d'eau", icon: Droplets, color: 'blue' },
  { value: 'electricity', label: "Compteur d'électricité", icon: Zap, color: 'amber' },
];

function expectedMeterPrefix(serviceType) {
  if (serviceType === 'water') return 'SN-EAU-';
  if (serviceType === 'electricity') return 'SN-ELE-';
  return '';
}

function meterMatchesService(meter, serviceType) {
  if (!serviceType) return false;

  const serial = String(meter.cadran ?? '').toUpperCase();
  const prefix = expectedMeterPrefix(serviceType);

  return meter.service_type === serviceType || (prefix && serial.startsWith(prefix));
}

export default function Pannes() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const compteurs = useResource(endpoints.compteurs, { limit: 500 }, { enabled: ![ROLES.TECHNICIAN, ROLES.MANAGER].includes(role) });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const technicians = useResource(endpoints.technicians, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const isMonitoringRole = [ROLES.RESPONSABLE, ROLES.MANAGER].includes(role);
  const canCreateAnomaly = role === ROLES.RESPONSABLE || canCreate(role, 'pannes');
  const canDispatchIntervention = isMonitoringRole || canCreate(role, 'interventions');
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ status: '', secteur: '', assigned: '' });
  const targetPanneId = location.state?.targetPanneId ?? location.state?.targetAnomalyId ?? null;

  const fields = useMemo(() => [
    ...([ROLES.TECHNICIAN, ROLES.MANAGER].includes(role) ? [] : [
      {
        name: 'id_compteur',
        label: t('forms.meterId'),
        type: 'select',
        required: true,
        options: compteurs.items.map((compteur) => ({
          value: String(compteur.id_compteur ?? compteur.id),
          label: `${compteur.cadran ?? '-'} - ${compteur.client ? `${compteur.client.nom ?? ''} ${compteur.client.prenom ?? ''}`.trim() : t('tables.client')}`,
        })),
      },
      {
        name: 'anomalie',
        label: t('forms.anomaly'),
        type: 'select',
        required: true,
        defaultValue: 'compteur_bloque',
        options: [
          'fuite_avant_compteur',
          'fuite_apres_compteur',
          'compteur_bloque',
          'compteur_casse',
          'compteur_inverse',
          'cadran_illisible',
          'absence_compteur',
          'branchement_illicite',
          'plomb_rompu',
          'robinet_defectueux',
        ].map((value) => ({ value, label: t(`anomalies.${value}`) })),
      },
      { name: 'date_panne', label: t('forms.faultDate'), type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    ]),
    {
      name: 'status',
      label: t('forms.status'),
      type: 'select',
      defaultValue: 'open',
      options: [
        { value: 'open', label: t('statuses.open') },
        { value: 'resolved', label: t('statuses.resolved') },
      ],
    },
    ...(role === ROLES.TECHNICIAN ? [] : [{
      name: 'assigned_to',
      label: t('forms.assignedTechnicianId'),
      type: 'select',
      help: t('forms.assignedTechnicianHelp'),
      options: technicians.items.map((technician) => ({
        value: String(technician.id),
        label: `${technician.prenom ?? ''} ${technician.nom ?? ''}`.trim() || technician.identifiant,
      })),
    }]),
  ], [compteurs.items, role, t, technicians.items]);

  async function savePanne(values) {
    const payload = { ...values, assigned_to: values.assigned_to === '' ? null : values.assigned_to };

    if (formState?.item) {
      await api.put(`/pannes/${formState.item.id_panne ?? formState.item.id}`, payload);
    } else {
      await api.post('/pannes', payload);
    }
    refresh();
  }

  async function deletePanne(panne) {
    try {
      setDeleting(true);
      await api.delete(`/pannes/${panne.id_panne ?? panne.id}`);
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  }

  const filteredItems = items.filter((item) => {
    const status = String(item.status ?? item.statut ?? '').toLowerCase();
    const matchesStatus = !filters.status || status.includes(filters.status);
    const matchesSector = !filters.secteur || String(item.compteur?.secteur?.id ?? item.compteur?.secteur?.id_secteur ?? '') === filters.secteur;
    const matchesAssigned = !filters.assigned || String(item.assigned_to ?? '') === filters.assigned;
    const matchesTarget = !targetPanneId || String(item.id_panne ?? item.id) === String(targetPanneId);
    return matchesStatus && matchesSector && matchesAssigned && matchesTarget;
  });

  function interventionsPathForRole() {
    if (role === ROLES.DIRECTEUR || role === ROLES.RESPONSABLE) return '/admin/interventions';
    if (role === ROLES.MANAGER) return '/manager/interventions';
    if (role === ROLES.TECHNICIAN) return '/technician/interventions';
    return '/access-denied';
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      <DataTable
        title={t('pannes.title')}
        subtitle={t('pannes.subtitle')}
        resource="pannes"
        role={role}
        loading={loading}
        rows={filteredItems}
        filters={(
          <>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
              <option value="">{t('common.allStatuses')}</option>
              <option value="open">{t('statuses.open')}</option>
              <option value="assigned">{t('statuses.assigned')}</option>
              <option value="in_progress">{t('statuses.in_progress')}</option>
              <option value="resolved">{t('statuses.resolved')}</option>
            </select>
            {role !== ROLES.TECHNICIAN && (
              <select value={filters.secteur} onChange={(event) => setFilters((current) => ({ ...current, secteur: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
                <option value="">{t('common.allSectors')}</option>
                {secteurs.items.map((secteur) => <option key={secteur.id} value={secteur.id}>{secteur.nom_secteur}</option>)}
              </select>
            )}
            {role !== ROLES.TECHNICIAN && (
              <select value={filters.assigned} onChange={(event) => setFilters((current) => ({ ...current, assigned: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
                <option value="">{t('common.allTechnicians')}</option>
                {technicians.items.map((technician) => <option key={technician.id} value={technician.id}>{technician.prenom} {technician.nom}</option>)}
              </select>
            )}
          </>
        )}
        emptyMessage={t('pannes.empty')}
        onCreate={canCreateAnomaly ? () => setFormState({ item: null, mode: 'create' }) : undefined}
        onEdit={isMonitoringRole ? undefined : (item) => setFormState({ item })}
        onDelete={isMonitoringRole ? undefined : setDeleteTarget}
        allowCreate={canCreateAnomaly}
        allowEdit={isMonitoringRole ? false : undefined}
        allowDelete={isMonitoringRole ? false : undefined}
        columns={[
          { key: 'service_type', header: t('tables.service'), render: (row) => {
            const serviceType = row.compteur?.service_type ?? row.service_type ?? 'water';
            return <Badge label={t(`services.${serviceType}`)} color={serviceType === 'electricity' ? 'amber' : 'blue'} />;
          } },
          { key: 'meter', header: t('tables.meter'), render: (row) => row.compteur?.cadran ?? '-' },
          { key: 'anomalie', header: t('tables.anomaly'), render: (row) => translateAnomaly(t, row.anomalie) },
          { key: 'sector', header: t('tables.sector'), render: (row) => row.compteur?.secteur?.nom_secteur ?? '-' },
          { key: 'date_panne', header: t('tables.date') },
          { key: 'assigned', header: t('tables.technician'), render: (row) => {
            const technician = row.assigned_technician ?? row.assigned_operator;
            return technician ? `${technician.nom ?? ''} ${technician.prenom ?? ''}`.trim() : '-';
          } },
          { key: 'status', header: t('tables.status'), render: (row) => {
            const value = String(row.statut ?? row.status ?? 'open').toLowerCase();
            return <Badge label={translateStatus(t, value)} color={statusColor(value)} />;
          } },
          ...(canDispatchIntervention ? [{
            key: 'repair',
            header: t('tables.intervention'),
            render: (row) => (
              <button type="button" onClick={() => navigate(interventionsPathForRole(), { state: { panne: row } })} className="text-xs font-semibold text-emerald-700 hover:underline">
                {t('tables.intervention')}
              </button>
            ),
          }] : []),
        ]}
      />
      {formState?.mode === 'create' && (
        <AnomalyCreateModal
          compteurs={compteurs.items}
          technicians={technicians.items}
          onClose={() => setFormState(null)}
          onSubmit={savePanne}
        />
      )}
      {formState && formState.mode !== 'create' && (
        <EntityFormModal
          title={formState.item ? t('pannes.edit') : t('pannes.add')}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? t('buttons.saveChanges') : t('pannes.create')}
          onClose={() => setFormState(null)}
          onSubmit={savePanne}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={t('pannes.deleteConfirm', { id: deleteTarget.id_panne ?? deleteTarget.id })}
          onConfirm={() => deletePanne(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

function meterClientName(meter) {
  return meter?.client ? `${meter.client.nom ?? ''} ${meter.client.prenom ?? ''}`.trim() : '';
}

function MeterContextPreview({ meter }) {
  if (!meter) return null;

  const client = meter.client ?? {};
  const sectorName = meter.secteur?.nom_secteur ?? client.secteur?.nom_secteur ?? '-';
  const subscriptionType = client.type_abonnement ?? client.subscription_type ?? client.type_client ?? meter.usage ?? '-';
  const items = [
    { icon: MapPinned, label: 'Secteur', value: sectorName },
    { icon: Phone, label: 'T\u00e9l\u00e9phone', value: client.telephone ?? client.phone ?? '-' },
    { icon: Home, label: 'Adresse', value: client.adresse ?? client.address ?? '-' },
    { icon: Tags, label: 'Abonnement', value: subscriptionType },
  ];

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-sm text-gray-700">
      <div className="mb-2 font-semibold text-emerald-800">
        {meter.cadran} - {meterClientName(meter) || '-'}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex min-w-0 items-center gap-2">
            <Icon size={15} className="shrink-0 text-emerald-700" />
            <span className="min-w-0 truncate"><strong>{label}:</strong> {value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnomalyCreateModal({ compteurs, technicians, onClose, onSubmit }) {
  const { t } = useTranslation();
  const formRef = useRef(null);
  const [values, setValues] = useState({
    service_type: '',
    id_compteur: '',
    date_panne: new Date().toISOString().slice(0, 10),
    anomaly_category: '',
    custom_anomalie: '',
    description: '',
    assigned_to: '',
    status: 'open',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const selectedMeter = compteurs.find((meter) => String(meter.id_compteur ?? meter.id) === String(values.id_compteur));
  const availableAnomalies = useMemo(
    () => anomalyCategories.filter((item) => item.serviceType === values.service_type),
    [values.service_type],
  );
  const availableMeters = useMemo(
    () => compteurs.filter((meter) => meterMatchesService(meter, values.service_type)),
    [compteurs, values.service_type],
  );
  const stepsReady = Boolean(
    values.service_type
    && values.anomaly_category
    && values.id_compteur
    && (values.anomaly_category !== otherAnomalyValue || values.custom_anomalie.trim()),
  );

  function update(name, value) {
    const nextValues = {
      ...values,
      [name]: value,
    };

    if (name === 'service_type') {
      nextValues.anomaly_category = '';
      nextValues.id_compteur = '';
      nextValues.custom_anomalie = '';
      nextValues.description = '';
    }

    if (name === 'anomaly_category') {
      nextValues.custom_anomalie = '';
      nextValues.description = '';
    }

    setValues(nextValues);
    setErrors((current) => ({ ...current, [name]: validateField(name, value), general: '' }));
  }

  function validateField(name, value = values[name]) {
    if (name === 'service_type') return fieldError(value, { required: true, requiredMessage: 'Sélectionner le type de compteur.' }, t);
    if (name === 'anomaly_category') return fieldError(value, { required: true, requiredMessage: "Sélectionner le type d'anomalie." }, t);
    if (name === 'custom_anomalie') return fieldError(String(value ?? '').trim(), { required: values.anomaly_category === otherAnomalyValue, requiredMessage: "Spécifier l'anomalie." }, t);
    if (name === 'id_compteur') return fieldError(value, { required: true }, t);
    if (name === 'date_panne') return fieldError(value, { required: true, type: 'date' }, t);
    return '';
  }

  function selectMeter(meter) {
    update('id_compteur', String(meter.id_compteur ?? meter.id));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    ['service_type', 'anomaly_category', 'custom_anomalie', 'id_compteur', 'date_panne'].forEach((field) => {
      const error = validateField(field);
      if (error) nextErrors[field] = error;
    });

    const selectedCategory = anomalyCategories.find((item) => item.value === values.anomaly_category);
    if (values.anomaly_category !== otherAnomalyValue && selectedCategory && selectedCategory.serviceType !== values.service_type) {
      nextErrors.anomaly_category = "Ce type d'anomalie ne correspond pas au type de compteur.";
    }

    if (selectedMeter && !meterMatchesService(selectedMeter, values.service_type)) {
      nextErrors.id_compteur = 'Ce compteur ne correspond pas au type sélectionné.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalid(formRef, nextErrors);
      return;
    }

    const anomalyValue = values.anomaly_category === otherAnomalyValue
      ? values.custom_anomalie.trim()
      : selectedCategory?.anomalie;

    const payload = {
      id_compteur: values.id_compteur,
      date_panne: values.date_panne,
      anomalie: anomalyValue,
      status: values.status,
      assigned_to: values.assigned_to || null,
      description: values.description.trim() || null,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
      onClose();
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      setErrors(normalizeApiErrors(apiErrors, error.response?.data?.message ?? t('forms.unableToSave')));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t('pannes.add')} onClose={onClose} maxWidth="max-w-2xl">
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
        {errors.general && <div className="rounded-xl border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm font-medium text-[var(--srm-red)]">{errors.general}</div>}

        <div className="space-y-2">
          <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">ÉTAPE 1</div>
          <label className="block text-sm font-semibold text-slate-700">
            Type de compteur <span className="text-[var(--srm-red)]">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {meterTypeOptions.map((option) => {
              const Icon = option.icon;
              const selected = values.service_type === option.value;
              const colorClasses = option.color === 'amber'
                ? 'border-amber-300 bg-amber-50 text-amber-700 ring-2 ring-amber-100'
                : 'border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-100';

              return (
                <button
                  key={option.value}
                  type="button"
                  name="service_type"
                  onClick={() => update('service_type', option.value)}
                  className={`flex min-h-20 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${selected ? colorClasses : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${option.color === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Icon size={22} />
                  </span>
                  <span>
                    <span className="block text-sm font-black">{option.label}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">{expectedMeterPrefix(option.value)}XXXX</span>
                  </span>
                </button>
              );
            })}
          </div>
          {errors.service_type && <p className="text-xs font-medium text-red-500 transition-opacity duration-300">{errorText(errors.service_type)}</p>}
        </div>

        <div className="space-y-2">
          <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">ÉTAPE 2</div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t('forms.anomaly')} <span className="text-[var(--srm-red)]">*</span></span>
            <select
              name="anomaly_category"
              value={values.anomaly_category}
              disabled={!values.service_type}
              onChange={(event) => update('anomaly_category', event.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${errors.anomaly_category ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200 bg-slate-50/80 text-slate-800'}`}
            >
              <option value="">{values.service_type ? "Choisir le type d'anomalie" : "⚠️ Choisir d'abord le type de compteur"}</option>
              {availableAnomalies.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              {values.service_type && <option value={otherAnomalyValue}>Autre</option>}
            </select>
            {errors.anomaly_category && <p className="mt-1 text-xs font-medium text-red-500 transition-opacity duration-300">{errorText(errors.anomaly_category)}</p>}
          </label>
          {values.anomaly_category === otherAnomalyValue && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Spécifier l'anomalie <span className="text-[var(--srm-red)]">*</span></span>
              <input
                name="custom_anomalie"
                value={values.custom_anomalie}
                onChange={(event) => update('custom_anomalie', event.target.value)}
                placeholder="Saisir le type d'anomalie..."
                className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors.custom_anomalie ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200'}`}
                required
              />
              {errors.custom_anomalie && <p className="mt-1 text-xs font-medium text-red-500 transition-opacity duration-300">{errorText(errors.custom_anomalie)}</p>}
            </label>
          )}
        </div>

        <div className="space-y-2">
          <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">ÉTAPE 3</div>
          <label className="block text-sm font-semibold text-slate-700">
            Compteur concerné (N° Série) <span className="text-[var(--srm-red)]">*</span>
          </label>
          <select
            name="id_compteur"
            value={values.id_compteur}
            disabled={!values.service_type}
            onChange={(event) => {
              const meter = availableMeters.find((item) => String(item.id_compteur ?? item.id) === event.target.value);
              if (meter) {
                selectMeter(meter);
              } else {
                update('id_compteur', '');
              }
            }}
            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${errors.id_compteur ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200 bg-slate-50/80 text-slate-800'}`}
          >
            <option value="">{values.service_type ? `Choisir un compteur ${expectedMeterPrefix(values.service_type)}XXXX` : "⚠️ Choisir d'abord le type de compteur"}</option>
            {availableMeters.map((meter) => (
              <option key={meter.id_compteur ?? meter.id} value={String(meter.id_compteur ?? meter.id)}>
                {meter.cadran} - {meterClientName(meter) || t('tables.client')}
              </option>
            ))}
          </select>
          <MeterContextPreview meter={selectedMeter} />
          {errors.id_compteur && <p className="text-xs font-medium text-red-500 transition-opacity duration-300">{errorText(errors.id_compteur)}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t('forms.faultDate')} <span className="text-[var(--srm-red)]">*</span></span>
            <input name="date_panne" type="date" value={values.date_panne} onChange={(event) => update('date_panne', event.target.value)} className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors.date_panne ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200'}`} />
            {errors.date_panne && <p className="mt-1 text-xs font-medium text-red-500 transition-opacity duration-300">{errorText(errors.date_panne)}</p>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t('forms.status')}</span>
            <select value={values.status} onChange={(event) => update('status', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100">
              <option value="open">{t('statuses.open')}</option>
              <option value="assigned">{t('statuses.assigned')}</option>
              <option value="in_progress">{t('statuses.in_progress')}</option>
              <option value="resolved">{t('statuses.resolved')}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t('forms.assignedTechnicianId')}</span>
            <select value={values.assigned_to} onChange={(event) => update('assigned_to', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100">
              <option value="">{t('common.selectOption')}</option>
              {technicians.map((technician) => <option key={technician.id} value={technician.id}>{`${technician.prenom ?? ''} ${technician.nom ?? ''}`.trim() || technician.identifiant}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Description</span>
          <input name="description" value={values.description} onChange={(event) => update('description', event.target.value)} placeholder="Décrire l'anomalie" className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100" />
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>{t('buttons.cancel')}</Button>
          <Button variant="primary" type="submit" loading={saving} disabled={!stepsReady}>{t('pannes.create')}</Button>
        </div>
      </form>
    </Modal>
  );
}
