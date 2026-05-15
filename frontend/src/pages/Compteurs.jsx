import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';

function generateContractNumber() {
  const timestampPart = String(Date.now() % 1000000).padStart(6, '0');
  const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return `0${timestampPart}${randomPart}`;
}

export default function Compteurs() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { error, items, loading, refresh } = useResource(endpoints.compteurs, { limit: 500 });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const hiddenContext = useMemo(() => ({
    clientId: searchParams.get('client_id')
      ?? searchParams.get('id_client')
      ?? location.state?.client_id
      ?? location.state?.id_client
      ?? location.state?.client?.id_client
      ?? location.state?.client?.id
      ?? '',
    secteurId: searchParams.get('secteur_id')
      ?? searchParams.get('id_secteur')
      ?? location.state?.secteur_id
      ?? location.state?.id_secteur
      ?? location.state?.secteur?.id_secteur
      ?? location.state?.secteur?.id
      ?? '',
  }), [location.state, searchParams]);

  const fields = useMemo(() => [
    { name: 'cadran', label: 'Numéro de série de compteur', required: true },
    {
      name: 'num_contrat',
      label: t('forms.contractNumber'),
      placeholder: '000-000-000',
      generateDefaultValue: generateContractNumber,
      inputMode: 'numeric',
      pattern: '[0-9]{9,10}',
      maxLength: 10,
      numericOnly: true,
    },
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
    {
      name: 'id_client',
      type: 'hidden',
      defaultValue: hiddenContext.clientId,
      getValue: (item) => String(item.id_client ?? item.client_id ?? item.client?.id_client ?? item.client?.id ?? hiddenContext.clientId),
    },
    {
      name: 'id_secteur',
      type: 'hidden',
      defaultValue: hiddenContext.secteurId,
      getValue: (item) => String(item.id_secteur ?? item.secteur_id ?? item.secteur?.id_secteur ?? item.secteur?.id ?? hiddenContext.secteurId),
    },
    {
      name: 'service_type',
      label: 'Type de compteur',
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
  ], [hiddenContext.clientId, hiddenContext.secteurId, t]);

  async function saveMeter(values) {
    const clientId = values.id_client || hiddenContext.clientId;
    const secteurId = values.id_secteur || hiddenContext.secteurId;

    if (!clientId || !secteurId) {
      throw new Error(t('forms.unableToSave'));
    }

    const payload = {
      ...values,
      id_client: clientId,
      id_secteur: secteurId,
      client_id: clientId,
      secteur_id: secteurId,
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
