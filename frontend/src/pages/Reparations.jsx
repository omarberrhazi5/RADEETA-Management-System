import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';

export default function Reparations() {
  const location = useLocation();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.reparations, { limit: 500 });
  const operators = useResource(endpoints.operators, { limit: 500 }, { enabled: role !== 'operator' });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ month: '', operator: '' });

  const fields = useMemo(() => [
    { name: 'id_panne', label: 'Panne ID', type: 'number', required: true },
    ...(role === 'operator' ? [] : [{ name: 'id_plombier', label: 'Operator ID', type: 'number', required: true }]),
    { name: 'date_reparation', label: 'Repair date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    { name: 'description', label: 'Description', type: 'textarea', defaultValue: 'Intervention completed' },
  ], [role]);

  const createRepair = useCallback((panne = null) => {
    setFormState({
      item: {
        id_panne: panne?.id_panne ?? panne?.id ?? '',
        date_reparation: new Date().toISOString().slice(0, 10),
        description: 'Intervention completed',
      },
      isCreate: true,
    });
  }, []);

  async function saveRepair(values) {
    const payload = {
      ...values,
      ...(role === 'operator' ? {} : { id_plombier: values.id_plombier }),
    };

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

  async function updateRepair(repair) {
    setFormState({ item: repair, isCreate: false });
  }

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
        title="Repairs"
        subtitle="Repair interventions and operator activity."
        resource="reparations"
        role={role}
        loading={loading}
        rows={filteredItems}
        filters={(
          <>
            <input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm" />
            {role !== 'operator' && (
              <select value={filters.operator} onChange={(event) => setFilters((current) => ({ ...current, operator: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
                <option value="">All operators</option>
                {operators.items.map((operator) => <option key={operator.id} value={operator.id}>{operator.prenom} {operator.nom}</option>)}
              </select>
            )}
          </>
        )}
        emptyMessage="No repairs found for the selected filters."
        onCreate={() => createRepair()}
        onEdit={updateRepair}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'id_reparation', header: 'Repair', render: (row) => `#${row.id_reparation ?? row.id}` },
          { key: 'panne', header: 'Panne', render: (row) => row.panne ? `#${row.panne.id_panne ?? row.panne.id}` : '-' },
          { key: 'meter', header: 'Meter', render: (row) => row.panne?.compteur?.cadran ?? '-' },
          { key: 'operator', header: 'Operator', render: (row) => row.plombier ? `${row.plombier.nom ?? ''} ${row.plombier.prenom ?? ''}`.trim() : '-' },
          { key: 'date_reparation', header: 'Date' },
          { key: 'description', header: 'Description' },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.isCreate ? 'Create Repair' : 'Edit Repair'}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.isCreate ? 'Create repair' : 'Save changes'}
          onClose={() => setFormState(null)}
          onSubmit={saveRepair}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete repair #${deleteTarget.id_reparation ?? deleteTarget.id}? This action cannot be undone.`}
          onConfirm={() => deleteRepair(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
