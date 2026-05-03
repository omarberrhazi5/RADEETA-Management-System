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

export default function Compteurs() {
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.compteurs, { limit: 500 });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fields = useMemo(() => [
    { name: 'cadran', label: 'Cadran', required: true },
    { name: 'id_client', label: 'Client ID', type: 'number', required: true },
    { name: 'id_secteur', label: 'Sector ID', type: 'number', required: true },
    {
      name: 'calibre',
      label: 'Calibre',
      type: 'select',
      required: true,
      defaultValue: '15',
      options: [
        { value: '15', label: '15' },
        { value: '20', label: '20' },
      ],
    },
    { name: 'index_releve', label: 'Current index', type: 'number', min: '0', step: '0.01', required: true, defaultValue: '0' },
    { name: 'marque', label: 'Brand' },
  ], []);

  async function saveMeter(values) {
    const payload = {
      ...values,
      index_releve: Number(values.index_releve),
    };

    if (formState?.item) {
      await api.put(`/compteurs/${formState.item.id_compteur ?? formState.item.id}`, payload);
    } else {
      await api.post('/compteurs', payload);
    }
    refresh();
  }

  async function deleteMeter(meter) {
    try {
      setDeleting(true);
      await api.delete(`/compteurs/${meter.id_compteur ?? meter.id}`);
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      <DataTable
        title="Meters"
        subtitle="Meter inventory and SRM service data."
        resource="compteurs"
        role={role}
        loading={loading}
        rows={items}
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'cadran', header: 'Cadran' },
          { key: 'type_produit', header: 'Type', render: (row) => <Badge label={row.type_produit ?? 'N/A'} color={row.type_produit === 'ELEC' ? 'amber' : 'blue'} /> },
          { key: 'num_contrat', header: 'N Contrat' },
          { key: 'num_tournee', header: 'Tournee' },
          { key: 'usage', header: 'Usage' },
          { key: 'client', header: 'Client', render: (row) => row.client ? `${row.client.nom ?? ''} ${row.client.prenom ?? ''}`.trim() : '-' },
          { key: 'secteur', header: 'Sector', render: (row) => row.secteur?.nom_secteur ?? '-' },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? 'Edit Meter' : 'Add Meter'}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? 'Save changes' : 'Create meter'}
          onClose={() => setFormState(null)}
          onSubmit={saveMeter}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete meter "${deleteTarget.cadran}"? This action cannot be undone.`}
          onConfirm={() => deleteMeter(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
