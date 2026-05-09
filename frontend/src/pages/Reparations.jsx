import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { translateRepairDescription } from '../utils/i18nLabels';
import { ROLES } from '../utils/rbac';

export default function Reparations() {
  const { t } = useTranslation();
  const location = useLocation();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.reparations, { limit: 500 });
  const technicians = useResource(endpoints.technicians, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ month: '', operator: '' });

  const fields = useMemo(() => [
    { name: 'id_panne', label: t('forms.panneId'), type: 'number', required: true },
    ...(role === ROLES.TECHNICIAN ? [] : [{ name: 'id_plombier', label: t('forms.technicianId'), type: 'number', required: true }]),
    { name: 'date_reparation', label: t('forms.repairDate'), type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    { name: 'description', label: t('forms.description'), type: 'textarea', defaultValue: t('reparations.defaultDescription') },
  ], [role, t]);

  const createRepair = useCallback((panne = null) => {
    setFormState({
      item: {
        id_panne: panne?.id_panne ?? panne?.id ?? '',
        id_plombier: panne?.assigned_to ?? '',
        date_reparation: new Date().toISOString().slice(0, 10),
        description: t('reparations.defaultDescription'),
      },
      isCreate: true,
    });
  }, [t]);

  async function saveRepair(values) {
    const payload = { ...values, ...(role === ROLES.TECHNICIAN ? {} : { id_plombier: values.id_plombier }) };

    if (formState?.isCreate) {
      await api.post('/reparations', payload);
    } else {
      await api.put(`/reparations/${formState.item.id_reparation ?? formState.item.id}`, payload);
    }
    refresh();
  }

  useEffect(() => {
    if (location.state?.panne) {
      createRepair(location.state.panne);
      window.history.replaceState({}, document.title);
    }
  }, [createRepair, location.state?.panne]);

  async function deleteRepair(repair) {
    try {
      setDeleting(true);
      await api.delete(`/reparations/${repair.id_reparation ?? repair.id}`);
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesMonth = !filters.month || String(item.date_reparation ?? '').startsWith(filters.month);
    const matchesOperator = !filters.operator || String(item.id_plombier ?? '') === filters.operator;
    return matchesMonth && matchesOperator;
  });

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      <DataTable
        title={t('reparations.title')}
        subtitle={t('reparations.subtitle')}
        resource="reparations"
        role={role}
        loading={loading}
        rows={filteredItems}
        filters={(
          <>
            <input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm" />
            {role !== ROLES.TECHNICIAN && (
              <select value={filters.operator} onChange={(event) => setFilters((current) => ({ ...current, operator: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
                <option value="">{t('common.allTechnicians')}</option>
                {technicians.items.map((technician) => <option key={technician.id} value={technician.id}>{technician.prenom} {technician.nom}</option>)}
              </select>
            )}
          </>
        )}
        emptyMessage={t('reparations.empty')}
        onCreate={() => createRepair()}
        onEdit={(repair) => setFormState({ item: repair, isCreate: false })}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'service_type', header: t('tables.service'), render: (row) => {
            const serviceType = row.panne?.compteur?.service_type ?? row.service_type ?? 'water';
            return <Badge label={t(`services.${serviceType}`)} color={serviceType === 'electricity' ? 'amber' : 'blue'} />;
          } },
          { key: 'meter', header: t('tables.meter'), render: (row) => row.panne?.compteur?.cadran ?? '-' },
          { key: 'operator', header: t('tables.technician'), render: (row) => row.plombier ? `${row.plombier.nom ?? ''} ${row.plombier.prenom ?? ''}`.trim() : '-' },
          { key: 'date_reparation', header: t('tables.date') },
          { key: 'description', header: t('forms.description'), render: (row) => translateRepairDescription(t, row.description) },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.isCreate ? t('reparations.add') : t('reparations.edit')}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.isCreate ? t('reparations.create') : t('buttons.saveChanges')}
          onClose={() => setFormState(null)}
          onSubmit={saveRepair}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={t('reparations.deleteConfirm', { id: deleteTarget.id_reparation ?? deleteTarget.id })}
          onConfirm={() => deleteRepair(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
