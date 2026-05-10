import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
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

export default function Pannes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const technicians = useResource(endpoints.technicians, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const canCreateRepair = canCreate(role, 'reparations');
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ status: '', secteur: '', assigned: '' });

  const fields = useMemo(() => [
    ...([ROLES.TECHNICIAN, ROLES.MANAGER].includes(role) ? [] : [
      { name: 'id_compteur', label: t('forms.meterId'), type: 'number', required: true },
      { name: 'anomalie', label: t('forms.anomaly'), required: true },
      { name: 'date_panne', label: t('forms.faultDate'), type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    ]),
    {
      name: 'status',
      label: t('forms.status'),
      type: 'select',
      defaultValue: 'ouvert',
      options: [
        { value: 'ouvert', label: t('statuses.open') },
        { value: 'repare', label: t('statuses.repare') },
      ],
    },
    ...(role === ROLES.TECHNICIAN ? [] : [{ name: 'assigned_to', label: t('forms.assignedTechnicianId'), type: 'number', help: t('forms.assignedTechnicianHelp') }]),
  ], [role, t]);

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
        onCreate={() => setFormState({ item: null })}
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
      {formState && (
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
