import { useMemo, useState } from 'react';
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
import { canCreate } from '../utils/rbac';

function statusColor(status) {
  const value = String(status ?? '').toLowerCase();
  if (['repare', 'réparé', 'resolu', 'résolue', 'resolved'].includes(value)) return 'green';
  if (['en cours', 'in_progress'].includes(value)) return 'amber';
  return 'red';
}

export default function Pannes() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 });
  const operators = useResource(endpoints.operators, { limit: 500 }, { enabled: role !== 'operator' });
  const canCreateRepair = canCreate(role, 'reparations');
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ status: '', secteur: '', assigned: '' });

  const fields = useMemo(() => [
    ...(role === 'operator' ? [] : [
    { name: 'id_compteur', label: 'Meter ID', type: 'number', required: true },
    { name: 'anomalie', label: 'Anomaly', required: true },
    { name: 'date_panne', label: 'Fault date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    ]),
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'ouvert',
      options: [
        { value: 'ouvert', label: 'Open' },
        { value: 'repare', label: 'Repaired' },
      ],
    },
    ...(role === 'operator' ? [] : [{ name: 'assigned_to', label: 'Assigned operator ID', type: 'number', help: 'Optional for admin/manager. Operators are assigned automatically by the backend.' }]),
  ], [role]);

  async function savePanne(values) {
    const payload = {
      ...values,
      assigned_to: values.assigned_to === '' ? null : values.assigned_to,
    };

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

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      <DataTable
        title="Pannes"
        subtitle="Operators only receive assigned pannes from the API."
        resource="pannes"
        role={role}
        loading={loading}
        rows={filteredItems}
        filters={(
          <>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={filters.secteur} onChange={(event) => setFilters((current) => ({ ...current, secteur: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
              <option value="">All sectors</option>
              {secteurs.items.map((secteur) => <option key={secteur.id} value={secteur.id}>{secteur.nom_secteur}</option>)}
            </select>
            {role !== 'operator' && (
              <select value={filters.assigned} onChange={(event) => setFilters((current) => ({ ...current, assigned: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
                <option value="">All operators</option>
                {operators.items.map((operator) => <option key={operator.id} value={operator.id}>{operator.prenom} {operator.nom}</option>)}
              </select>
            )}
          </>
        )}
        emptyMessage="No pannes found for the selected filters."
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'id_panne', header: 'Panne', render: (row) => `#${row.id_panne ?? row.id}` },
          { key: 'meter', header: 'Meter', render: (row) => row.compteur?.cadran ?? '-' },
          { key: 'anomalie', header: 'Anomaly' },
          { key: 'sector', header: 'Sector', render: (row) => row.compteur?.secteur?.nom_secteur ?? '-' },
          { key: 'date_panne', header: 'Date' },
          { key: 'assigned', header: 'Assigned', render: (row) => row.assigned_operator ? `${row.assigned_operator.nom ?? ''} ${row.assigned_operator.prenom ?? ''}`.trim() : '-' },
          { key: 'status', header: 'Status', render: (row) => <Badge label={row.statut ?? row.status ?? 'open'} color={statusColor(row.status ?? row.statut)} /> },
          ...(canCreateRepair ? [{
            key: 'repair',
            header: 'Repair',
            render: (row) => (
              <button type="button" onClick={() => navigate('../reparations', { state: { panne: row } })} className="text-xs font-semibold text-blue-700 hover:underline">
                Create repair
              </button>
            ),
          }] : []),
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? 'Edit Panne' : 'Add Panne'}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? 'Save changes' : 'Create panne'}
          onClose={() => setFormState(null)}
          onSubmit={savePanne}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete panne #${deleteTarget.id_panne ?? deleteTarget.id}? This action cannot be undone.`}
          onConfirm={() => deletePanne(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
