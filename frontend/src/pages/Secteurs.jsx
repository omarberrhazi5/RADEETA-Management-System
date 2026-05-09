import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';

export default function Secteurs() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.secteurs, { limit: 500 });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fields = useMemo(() => [
    { name: 'nom_secteur', label: t('forms.sectorName'), required: true, placeholder: 'Qods 1' },
    {
      name: 'emplacement',
      label: t('forms.location'),
      type: 'select',
      required: true,
      defaultValue: 'Taza Haut',
      options: [
        { value: 'Taza Haut', label: 'Taza Haut' },
        { value: 'Taza Bas', label: 'Taza Bas' },
      ],
    },
    { name: 'agence', label: t('forms.agency'), required: true, defaultValue: 'SRM-FM Taza' },
    { name: 'num_torne', label: t('forms.routeNumber'), required: true, placeholder: 'T-001' },
    { name: 'latitude', label: t('forms.latitude'), type: 'number', step: '0.000001' },
    { name: 'longitude', label: t('forms.longitude'), type: 'number', step: '0.000001' },
  ], [t]);

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
        title={t('secteurs.title')}
        subtitle={t('secteurs.subtitle')}
        resource="secteurs"
        role={role}
        loading={loading}
        rows={items}
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'nom_secteur', header: t('tables.sector') },
          { key: 'emplacement', header: t('tables.location') },
          { key: 'agence', header: t('tables.agency') },
          { key: 'num_torne', header: t('tables.tour') },
          { key: 'latitude', header: t('tables.latitude') },
          { key: 'longitude', header: t('tables.longitude') },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? t('secteurs.edit') : t('secteurs.add')}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? t('buttons.saveChanges') : t('secteurs.create')}
          onClose={() => setFormState(null)}
          onSubmit={saveSector}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={t('secteurs.deleteConfirm', { name: deleteTarget.nom_secteur })}
          onConfirm={() => deleteSector(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
