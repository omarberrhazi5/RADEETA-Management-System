import { useMemo, useState } from 'react';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';

export default function Secteurs() {
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.secteurs, { limit: 500 });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fields = useMemo(() => [
    { name: 'nom_secteur', label: 'Sector name', required: true, placeholder: 'Qods 1' },
    {
      name: 'emplacement',
      label: 'Location',
      type: 'select',
      required: true,
      defaultValue: 'Taza Haut',
      options: [
        { value: 'Taza Haut', label: 'Taza Haut' },
        { value: 'Taza Bas', label: 'Taza Bas' },
      ],
    },
    { name: 'num_torne', label: 'Route number', required: true, placeholder: 'T-001' },
    { name: 'latitude', label: 'Latitude', type: 'number', step: '0.000001' },
    { name: 'longitude', label: 'Longitude', type: 'number', step: '0.000001' },
  ], []);

  async function saveSector(values) {
    const payload = {
      ...values,
      latitude: values.latitude === '' ? null : values.latitude,
      longitude: values.longitude === '' ? null : values.longitude,
    };

    if (formState?.item) {
      await api.put(`/secteurs/${formState.item.id_secteur ?? formState.item.id}`, payload);
    } else {
      await api.post('/secteurs', payload);
    }
    refresh();
  }

  async function deleteSector(sector) {
    try {
      setDeleting(true);
      await api.delete(`/secteurs/${sector.id_secteur ?? sector.id}`);
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
        title="Sectors"
        subtitle="Regional sectors, routes, and coordinates."
        resource="secteurs"
        role={role}
        loading={loading}
        rows={items}
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'nom_secteur', header: 'Sector' },
          { key: 'emplacement', header: 'Location' },
          { key: 'num_torne', header: 'Tour' },
          { key: 'latitude', header: 'Latitude' },
          { key: 'longitude', header: 'Longitude' },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? 'Edit Sector' : 'Add Sector'}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? 'Save changes' : 'Create sector'}
          onClose={() => setFormState(null)}
          onSubmit={saveSector}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete sector "${deleteTarget.nom_secteur}"? This action cannot be undone.`}
          onConfirm={() => deleteSector(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
