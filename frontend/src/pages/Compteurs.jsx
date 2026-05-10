import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.compteurs, { limit: 500 });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fields = useMemo(() => [
    { name: 'cadran', label: t('forms.cadran'), required: true },
    { name: 'num_contrat', label: t('forms.contractNumber'), placeholder: 'N/A' },
    { name: 'num_tournee', label: t('forms.routeNumber'), placeholder: 'N/A' },
    {
      name: 'usage',
      label: t('forms.subscriptionType'),
      type: 'select',
      defaultValue: 'domestic',
      options: [
        { value: 'domestic', label: t('subscriptions.domestic') },
        { value: 'commercial', label: t('subscriptions.commercial') },
        { value: 'industrial', label: t('subscriptions.industrial') },
      ],
    },
    { name: 'id_client', label: t('forms.clientId'), type: 'number', required: true },
    { name: 'id_secteur', label: t('forms.sectorId'), type: 'number', required: true },
    {
      name: 'service_type',
      label: t('forms.serviceType'),
      type: 'select',
      required: true,
      defaultValue: 'water',
      options: [
        { value: 'water', label: t('services.water') },
        { value: 'electricity', label: t('services.electricity') },
      ],
    },
    {
      name: 'calibre',
      label: t('forms.calibre'),
      type: 'select',
      required: true,
      defaultValue: '15',
      options: [
        { value: '15', label: '15' },
        { value: '20', label: '20' },
      ],
    },
    { name: 'index_releve', label: t('forms.currentIndex'), type: 'number', min: '0', step: '0.01', required: true, defaultValue: '0' },
    { name: 'marque', label: t('forms.brand') },
  ], [t]);

  async function saveMeter(values) {
    const payload = {
      ...values,
      num_contrat: values.num_contrat?.trim() || null,
      num_tournee: values.num_tournee?.trim() || null,
      usage: values.usage?.trim() || null,
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
        title={t('compteurs.title')}
        subtitle={t('compteurs.subtitle')}
        resource="compteurs"
        role={role}
        loading={loading}
        rows={items}
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'cadran', header: t('tables.cadran') },
          { key: 'type_produit', header: t('tables.service'), render: (row) => <Badge label={t(`services.${row.service_type ?? 'water'}`)} color={row.service_type === 'electricity' ? 'amber' : 'blue'} /> },
          { key: 'num_contrat', header: t('tables.contractNumber'), render: (row) => row.num_contrat || 'N/A' },
          { key: 'num_tournee', header: t('tables.tournee'), render: (row) => row.num_tournee || 'N/A' },
          { key: 'usage', header: t('tables.usage'), render: (row) => row.usage && row.usage !== 'N/A' ? t(`subscriptions.${row.usage}`, { defaultValue: row.usage }) : 'N/A' },
          { key: 'client', header: t('tables.client'), render: (row) => row.client ? `${row.client.nom ?? ''} ${row.client.prenom ?? ''}`.trim() : '-' },
          { key: 'secteur', header: t('tables.sector'), render: (row) => row.secteur?.nom_secteur ?? '-' },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? t('compteurs.edit') : t('compteurs.add')}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? t('buttons.saveChanges') : t('compteurs.create')}
          onClose={() => setFormState(null)}
          onSubmit={saveMeter}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={t('compteurs.deleteConfirm', { name: deleteTarget.cadran })}
          onConfirm={() => deleteMeter(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
