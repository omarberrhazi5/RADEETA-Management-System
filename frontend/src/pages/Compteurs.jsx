import { useMemo, useState } from 'react';
import { FileText, IdCard, MapPinned, Phone, Tags } from 'lucide-react';
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

const waterCalibreOptions = ['15', '20', '30', '40', '50', '60'].map((value) => ({ value, label: value }));
const electricityCalibreOptions = ['2 fils', '4 fils'].map((value) => ({ value, label: value }));
const waterTechnicalOptions = [{ value: 'Mécanique', label: 'Mécanique' }];
const electricityTechnicalOptions = [
  { value: 'Mécanique', label: 'Mécanique' },
  { value: 'Numérique', label: 'Numérique' },
];

function calibreType(serviceType) {
  return ['water', 'electricity'].includes(serviceType) ? 'select' : 'text';
}

function calibreOptions(serviceType) {
  if (serviceType === 'electricity') return electricityCalibreOptions;
  if (serviceType === 'water') return waterCalibreOptions;
  return undefined;
}

function technicalOptions(serviceType) {
  if (serviceType === 'electricity') return electricityTechnicalOptions;
  if (serviceType === 'water') return waterTechnicalOptions;
  return undefined;
}

function defaultCalibre(serviceType) {
  return calibreOptions(serviceType)?.[0]?.value ?? '';
}

function defaultTechnicalType(serviceType) {
  return technicalOptions(serviceType)?.[0]?.value ?? '';
}

function ClientPreview({ client }) {
  if (!client) return null;

  const subscriptionType = client.type_abonnement ?? client.subscription_type ?? client.type_client ?? '-';
  const items = [
    { icon: FileText, label: 'N° Contrat', value: client.police ?? '-' },
    { icon: IdCard, label: 'CIN', value: client.cin ?? '-' },
    { icon: Phone, label: 'Téléphone', value: client.telephone ?? '-' },
    { icon: MapPinned, label: 'Secteur', value: client.secteur?.nom_secteur ?? '-' },
    { icon: Tags, label: "Type d'abonnement", value: subscriptionType },
  ];

  return (
    <div className="my-2 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 text-sm text-gray-700">
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon size={15} className="shrink-0 text-emerald-700" />
            <span><strong>{label}:</strong> {value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Compteurs() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { error, items, loading, refresh } = useResource(endpoints.compteurs, { limit: 500 });
  const clients = useResource(endpoints.clients, { limit: 500 });
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

  const selectedInitialClient = useMemo(
    () => clients.items.find((client) => String(client.id_client ?? client.id) === String(hiddenContext.clientId)),
    [clients.items, hiddenContext.clientId],
  );

  const fields = useMemo(() => [
    { name: 'cadran', label: 'Numéro de série de compteur', required: true },
    {
      name: 'id_client',
      label: t('forms.client'),
      type: 'select',
      required: true,
      defaultValue: hiddenContext.clientId,
      options: clients.items.map((client) => {
        const id = String(client.id_client ?? client.id);
        const name = `${client.nom ?? ''} ${client.prenom ?? ''}`.trim() || client.police;

        return { value: id, label: `${name} - ${client.police}` };
      }),
      getValue: (item) => String(item.id_client ?? item.client_id ?? item.client?.id_client ?? item.client?.id ?? hiddenContext.clientId),
      populateOnChange: (value) => {
        const client = clients.items.find((item) => String(item.id_client ?? item.id) === String(value));
        const serviceType = client?.service_type ?? 'water';

        return client ? {
          num_contrat: client.police ?? '',
          id_secteur: String(client.id_secteur ?? client.secteur?.id_secteur ?? client.secteur?.id ?? ''),
          service_type: serviceType,
          usage: client.type_abonnement ?? 'Domestique',
          calibre: defaultCalibre(serviceType),
          technical_type: defaultTechnicalType(serviceType),
        } : {
          num_contrat: '',
          id_secteur: '',
        };
      },
      renderAfter: (values) => {
        const selectedClient = clients.items.find((item) => String(item.id_client ?? item.id) === String(values.id_client));

        return <ClientPreview client={selectedClient} />;
      },
    },
    {
      name: 'num_contrat',
      label: t('forms.contractNumber'),
      placeholder: t('common.autoGenerated'),
      defaultValue: selectedInitialClient?.police ?? '',
      getValue: (item) => item.num_contrat && item.num_contrat !== 'N/A' ? item.num_contrat : item.client?.police ?? selectedInitialClient?.police ?? '',
      inputMode: 'numeric',
      pattern: '[0-9]{9}',
      patternMessage: t('forms.contractNumberRequired', { defaultValue: t('forms.required') }),
      maxLength: 9,
      numericOnly: true,
      required: true,
      disabled: true,
    },
    { name: 'num_tournee', label: t('forms.routeNumber'), placeholder: 'N/A' },
    {
      name: 'usage',
      label: t('forms.subscriptionType'),
      type: 'select',
      defaultValue: 'Domestique',
      options: [
        { value: 'Domestique', label: t('subscriptions.Domestique') },
        { value: 'Patente', label: t('subscriptions.Patente') },
        { value: 'Administration', label: t('subscriptions.Administration') },
      ],
    },
    {
      name: 'id_secteur',
      type: 'hidden',
      required: true,
      defaultValue: selectedInitialClient?.id_secteur ?? hiddenContext.secteurId,
      getValue: (item) => String(item.id_secteur ?? item.secteur_id ?? item.secteur?.id_secteur ?? item.secteur?.id ?? selectedInitialClient?.id_secteur ?? hiddenContext.secteurId),
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
      populateOnChange: (value) => ({
        calibre: defaultCalibre(value),
        technical_type: defaultTechnicalType(value),
      }),
    },
    {
      name: 'calibre',
      label: t('forms.calibre'),
      getType: (values) => calibreType(values.service_type),
      required: true,
      defaultValue: '15',
      getOptions: (values) => calibreOptions(values.service_type),
    },
    {
      name: 'technical_type',
      label: t('forms.technicalType'),
      getType: (values) => calibreType(values.service_type),
      required: true,
      defaultValue: 'Mécanique',
      getOptions: (values) => technicalOptions(values.service_type),
    },
    { name: 'index_releve', label: t('forms.currentIndex'), type: 'number', min: '0', step: '0.01', required: true, defaultValue: '0' },
    { name: 'marque', label: t('forms.brand') },
  ], [clients.items, hiddenContext.clientId, hiddenContext.secteurId, selectedInitialClient, t]);

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
      technical_type: values.technical_type?.trim() || null,
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
        loading={loading || clients.loading}
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
