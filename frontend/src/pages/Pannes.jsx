import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
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

function statusColor(status) {
  const value = String(status ?? '').toLowerCase();
  if (['repare', 'reparee', 'resolu', 'resolue', 'resolved'].includes(value)) return 'green';
  if (['en cours', 'in_progress'].includes(value)) return 'amber';
  return 'red';
}

const anomalyCategories = [
  { value: 'blocked_meter', label: 'Blocked Meter', anomalie: 'compteur_bloque' },
  { value: 'leakage', label: 'Leakage', anomalie: 'fuite_apres_compteur' },
  { value: 'technical_damage', label: 'Technical Damage', anomalie: 'compteur_casse' },
  { value: 'illegal_connection', label: 'Illegal Connection', anomalie: 'branchement_illicite' },
  { value: 'other', label: 'Other', anomalie: 'robinet_defectueux' },
];

export default function Pannes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const compteurs = useResource(endpoints.compteurs, { limit: 500 }, { enabled: ![ROLES.TECHNICIAN, ROLES.MANAGER].includes(role) });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const technicians = useResource(endpoints.technicians, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const canCreateRepair = canCreate(role, 'reparations');
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ status: '', secteur: '', assigned: '' });

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
    return matchesStatus && matchesSector && matchesAssigned;
  });

  function repairsPathForRole() {
    if (role === ROLES.DIRECTEUR || role === ROLES.RESPONSABLE) return '/admin/repairs';
    if (role === ROLES.MANAGER) return '/manager/repairs';
    if (role === ROLES.TECHNICIAN) return '/technician/repairs';
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
        onCreate={() => setFormState({ item: null, mode: 'create' })}
        onEdit={(item) => setFormState({ item })}
        onDelete={setDeleteTarget}
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
          ...(canCreateRepair ? [{
            key: 'repair',
            header: t('tables.intervention'),
            render: (row) => (
              <button type="button" onClick={() => navigate(repairsPathForRole(), { state: { panne: row } })} className="text-xs font-semibold text-emerald-700 hover:underline">
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

function AnomalyCreateModal({ compteurs, technicians, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [values, setValues] = useState({
    id_compteur: '',
    date_panne: new Date().toISOString().slice(0, 10),
    anomaly_category: 'blocked_meter',
    description: '',
    assigned_to: '',
    status: 'open',
  });
  const [meterQuery, setMeterQuery] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const selectedMeter = compteurs.find((meter) => String(meter.id_compteur ?? meter.id) === String(values.id_compteur));
  const filteredMeters = useMemo(() => {
    const query = meterQuery.trim().toLowerCase();
    if (!query) return compteurs.slice(0, 8);

    return compteurs
      .filter((meter) => [
        meter.cadran,
        meter.num_contrat,
        meter.num_tournee,
        meterClientName(meter),
      ].join(' ').toLowerCase().includes(query))
      .slice(0, 8);
  }, [compteurs, meterQuery]);

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '', general: '' }));
  }

  function selectMeter(meter) {
    update('id_compteur', String(meter.id_compteur ?? meter.id));
    setMeterQuery(meter.cadran ?? '');
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!values.id_compteur) nextErrors.id_compteur = t('forms.required');
    if (!values.date_panne) nextErrors.date_panne = t('forms.required');
    if (values.anomaly_category === 'other' && !values.description.trim()) {
      nextErrors.description = t('forms.required');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const category = anomalyCategories.find((item) => item.value === values.anomaly_category) ?? anomalyCategories[0];
    const payload = {
      id_compteur: values.id_compteur,
      date_panne: values.date_panne,
      anomalie: category.anomalie,
      status: values.status,
      assigned_to: values.assigned_to || null,
      description: values.anomaly_category === 'other' ? values.description.trim() : null,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
      onClose();
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      setErrors(apiErrors ? Object.fromEntries(Object.entries(apiErrors).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages])) : { general: error.response?.data?.message ?? t('forms.unableToSave') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t('pannes.add')} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        {errors.general && <div className="rounded-xl border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm font-medium text-[var(--srm-red)]">{errors.general}</div>}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            {t('forms.meterId')} <span className="text-[var(--srm-red)]">*</span>
          </label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={meterQuery}
              onChange={(event) => {
                setMeterQuery(event.target.value);
                update('id_compteur', '');
              }}
              placeholder="SRM26..."
              className={`w-full rounded-xl border bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors.id_compteur ? 'border-[var(--srm-red)]' : 'border-slate-200'}`}
            />
          </div>
          {meterQuery && !selectedMeter && (
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0_0_0_/_0.05)]">
              {filteredMeters.length === 0 ? (
                <div className="px-3 py-3 text-sm font-medium text-slate-500">{t('common.noData')}</div>
              ) : filteredMeters.map((meter) => (
                <button
                  key={meter.id_compteur ?? meter.id}
                  type="button"
                  onClick={() => selectMeter(meter)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition duration-300 hover:bg-[var(--srm-green-soft)]"
                >
                  <span className="font-semibold text-slate-800">{meter.cadran}</span>
                  <span className="truncate text-xs font-medium text-slate-500">{meterClientName(meter) || t('tables.client')}</span>
                </button>
              ))}
            </div>
          )}
          {selectedMeter && (
            <div className="rounded-xl border border-green-100 bg-[var(--srm-green-soft)] px-3 py-2 text-xs font-semibold text-[var(--srm-green)]">
              {selectedMeter.cadran} - {meterClientName(selectedMeter) || t('tables.client')}
            </div>
          )}
          {errors.id_compteur && <p className="text-xs font-medium text-[var(--srm-red)]">{errors.id_compteur}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t('forms.anomaly')} <span className="text-[var(--srm-red)]">*</span></span>
            <select value={values.anomaly_category} onChange={(event) => update('anomaly_category', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100">
              {anomalyCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t('forms.faultDate')} <span className="text-[var(--srm-red)]">*</span></span>
            <input type="date" value={values.date_panne} onChange={(event) => update('date_panne', event.target.value)} className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors.date_panne ? 'border-[var(--srm-red)]' : 'border-slate-200'}`} />
            {errors.date_panne && <p className="mt-1 text-xs font-medium text-[var(--srm-red)]">{errors.date_panne}</p>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t('forms.status')}</span>
            <select value={values.status} onChange={(event) => update('status', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100">
              <option value="open">{t('statuses.open')}</option>
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

        {values.anomaly_category === 'other' && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Description <span className="text-[var(--srm-red)]">*</span></span>
            <input value={values.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe the anomaly" className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors.description ? 'border-[var(--srm-red)]' : 'border-slate-200'}`} />
            {errors.description && <p className="mt-1 text-xs font-medium text-[var(--srm-red)]">{errors.description}</p>}
          </label>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>{t('buttons.cancel')}</Button>
          <Button variant="primary" type="submit" loading={saving}>{t('pannes.create')}</Button>
        </div>
      </form>
    </Modal>
  );
}
