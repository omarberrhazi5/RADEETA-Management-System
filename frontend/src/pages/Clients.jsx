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
import { translateStatus } from '../utils/i18nLabels';

export default function Clients() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.clients, { limit: 500 });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState('');

  const fields = useMemo(() => [
    { name: 'police', label: t('forms.contractNumber'), required: true },
    { name: 'nom', label: t('forms.lastName'), required: true },
    { name: 'prenom', label: t('forms.firstName') },
    { name: 'cin', label: t('forms.cin') },
    { name: 'telephone', label: t('forms.phone') },
    {
      name: 'adresse',
      label: t('forms.address'),
      type: 'select',
      required: true,
      options: [
        'Avenue Hassan II',
        'Rue Allal El Fassi',
        'Boulevard Mohammed V',
        'Lotissement Al Qods',
        'Rue Ibn Khaldoun',
        'Avenue des FAR',
        'Quartier Al Amal',
        'Rue Moulay Rachid',
        'Hay Ennahda',
        'Sidi Azouz',
        'Gare Taza',
        'Zone Industrielle',
      ].map((value) => ({ value, label: value })),
    },
    {
      name: 'type_abonnement',
      label: t('forms.subscriptionType'),
      type: 'select',
      required: true,
      defaultValue: 'domestic',
      options: [
        { value: 'domestic', label: t('subscriptions.domestic') },
        { value: 'commercial', label: t('subscriptions.commercial') },
        { value: 'industrial', label: t('subscriptions.industrial') },
      ],
    },
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
      name: 'id_secteur',
      label: t('forms.sector'),
      type: 'select',
      required: true,
      options: secteurs.items.map((secteur) => ({
        value: String(secteur.id_secteur ?? secteur.id),
        label: `${secteur.nom_secteur} - ${secteur.agence ?? 'SRM-FM'}`,
      })),
      getValue: (item) => String(item.id_secteur ?? item.secteur?.id_secteur ?? item.secteur?.id ?? ''),
    },
  ], [secteurs.items, t]);

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
        title={t('clients.title')}
        subtitle={t('clients.subtitle')}
        resource="clients"
        role={role}
        loading={loading || secteurs.loading}
        rows={filteredItems}
        filters={(
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
            <option value="">{t('common.allStatuses')}</option>
            <option value="active">{t('statuses.active')}</option>
            <option value="inactive">{t('statuses.inactive')}</option>
          </select>
        )}
        emptyMessage={t('clients.empty')}
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'name', header: t('tables.client'), render: (row) => `${row.nom ?? ''} ${row.prenom ?? ''}`.trim() || '-' },
          { key: 'police', header: t('tables.contractNumber') },
          { key: 'cin', header: t('forms.cin') },
          { key: 'type_abonnement', header: t('tables.subscriptionType'), render: (row) => t(`subscriptions.${row.type_abonnement}`, { defaultValue: row.type_abonnement ?? '-' }) },
          { key: 'service_type', header: t('tables.service'), render: (row) => <Badge label={t(`services.${row.service_type ?? 'water'}`)} color={row.service_type === 'electricity' ? 'amber' : 'blue'} /> },
          { key: 'telephone', header: t('tables.phone') },
          { key: 'adresse', header: t('tables.address') },
          { key: 'secteur', header: t('tables.sector'), render: (row) => row.secteur?.nom_secteur ?? '-' },
          { key: 'abonne', header: t('tables.status'), render: (row) => <Badge label={translateStatus(t, row.abonne === false ? 'inactive' : 'active')} color={row.abonne === false ? 'gray' : 'green'} /> },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? t('clients.edit') : t('clients.add')}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? t('buttons.saveChanges') : t('clients.create')}
          onClose={() => setFormState(null)}
          onSubmit={saveClient}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={t('clients.deleteConfirm', { name: deleteTarget.nom })}
          onConfirm={() => deleteClient(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
