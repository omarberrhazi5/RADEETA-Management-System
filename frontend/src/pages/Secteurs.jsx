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

const sectorNumberOptions = Array.from({ length: 30 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: value };
});

export default function Secteurs() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.secteurs, { limit: 500 });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fields = useMemo(() => [
    {
      name: 'num_torne',
      label: 'Numéro de secteur',
      type: 'select',
      required: true,
      options: sectorNumberOptions,
      getValue: (item) => String(item.numero_secteur ?? item.num_torne ?? '').replace(/\D/g, '').replace(/^0+/, '') || '',
    },
    {
      name: 'nom_secteur',
      label: 'Adresse',
      required: true,
      placeholder: 'e.g., Province, Ahrache, or EL Moustakbal...',
      getValue: (item) => item.adresse ?? item.nom_secteur ?? '',
    },
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
    { name: 'agence', label: 'Agency', required: true, defaultValue: 'SRM-FM Taza', disabled: true },
  ], []);

  async function saveSector(values) {
    const payload = {
      ...values,
      numero_secteur: values.num_torne,
      adresse: values.nom_secteur,
      location: values.emplacement,
      agency: values.agence,
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
          { key: 'num_torne', header: 'Numéro de secteur' },
          { key: 'nom_secteur', header: 'Adresse' },
          { key: 'emplacement', header: t('tables.location') },
          { key: 'agence', header: t('tables.agency') },
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
