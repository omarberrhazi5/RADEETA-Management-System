import { useMemo, useState } from 'react';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';

export default function Clients() {
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.clients, { limit: 500 });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState('');

  const fields = useMemo(() => [
    { name: 'police', label: 'Police number', required: true },
    { name: 'nom', label: 'Last name', required: true },
    { name: 'prenom', label: 'First name' },
    { name: 'telephone', label: 'Phone' },
    { name: 'adresse', label: 'Address' },
  ], []);

  async function saveClient(values) {
    if (formState?.item) {
      await api.put(`/clients/${formState.item.id_client ?? formState.item.id}`, values);
    } else {
      await api.post('/clients', values);
    }
    refresh();
  }

  async function deleteClient(client) {
    try {
      setDeleting(true);
      await api.delete(`/clients/${client.id_client ?? client.id}`);
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  }

  const filteredItems = items.filter((item) => {
    if (!status) return true;
    return status === 'active' ? item.abonne !== false : item.abonne === false;
  });

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      <DataTable
        title="Clients"
        subtitle="Customer records. Viewers see this table read-only."
        resource="clients"
        role={role}
        loading={loading}
        rows={filteredItems}
        filters={(
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        )}
        emptyMessage="No clients found for the selected filters."
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'name', header: 'Client', render: (row) => `${row.nom ?? ''} ${row.prenom ?? ''}`.trim() || '-' },
          { key: 'police', header: 'Police' },
          { key: 'telephone', header: 'Phone' },
          { key: 'adresse', header: 'Address' },
          { key: 'abonne', header: 'Status', render: (row) => <Badge label={row.abonne === false ? 'Inactive' : 'Active'} color={row.abonne === false ? 'gray' : 'green'} /> },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? 'Edit Client' : 'Add Client'}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? 'Save changes' : 'Create client'}
          onClose={() => setFormState(null)}
          onSubmit={saveClient}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete client "${deleteTarget.nom}"? This action cannot be undone.`}
          onConfirm={() => deleteClient(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
