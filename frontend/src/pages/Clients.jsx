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

function sectorPrefix(secteur) {
  const tourDigits = String(secteur?.num_torne ?? '').replace(/\D/g, '');
  const source = tourDigits || String(secteur?.id_secteur ?? secteur?.id ?? '').replace(/\D/g, '');

  return source.slice(-3).padStart(3, '0');
}

function randomSixDigits() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateContractNumber(secteur, existingClients = []) {
  const prefix = sectorPrefix(secteur);
  const existing = new Set(existingClients.map((client) => String(client.police ?? '')));

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const contractNumber = `${prefix}${randomSixDigits()}`;
    if (!existing.has(contractNumber)) return contractNumber;
  }

  return `${prefix}${randomSixDigits()}`;
}

function sectorNumber(secteur) {
  return String(secteur?.numero_secteur ?? secteur?.num_torne ?? '')
    .replace(/\D/g, '')
    .replace(/^0+/, '') || '';
}

export default function Clients() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.clients, { limit: 500 });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState('');
  const sectorNumbers = useMemo(() => Array.from(new Set(
    secteurs.items
      .map(sectorNumber)
      .filter((value) => Number(value) >= 1 && Number(value) <= 30),
  )).sort((a, b) => Number(a) - Number(b)), [secteurs.items]);

  const fields = useMemo(() => [
    {
      name: 'police',
      label: t('forms.contractNumber'),
      required: true,
      inputMode: 'numeric',
      pattern: '[0-9]{9}',
      patternMessage: t('forms.contractNumberRequired', { defaultValue: t('forms.required') }),
      maxLength: 9,
      numericOnly: true,
      readOnly: true,
      disabled: true,
      generateDefaultValue: () => '',
      getValue: (item) => item.police ?? '',
    },
    { name: 'nom', label: t('forms.lastName'), required: true },
    { name: 'prenom', label: t('forms.firstName') },
    { name: 'cin', label: t('forms.cin'), required: true },
    { name: 'telephone', label: t('forms.phone') },
    {
      name: 'numero_secteur',
      label: 'Numéro de secteur',
      type: 'select',
      required: true,
      options: sectorNumbers.map((value) => ({ value, label: value })),
      getValue: (item) => sectorNumber(item.secteur),
      populateOnChange: () => ({ id_secteur: '', adresse: '', ...(formState?.item ? {} : { police: '' }) }),
    },
    {
      name: 'id_secteur',
      label: 'Adresse',
      type: 'select',
      required: true,
      placeholder: "Choisir d'abord le numéro de secteur",
      disabled: (values) => !values.numero_secteur,
      getOptions: (values) => secteurs.items
        .filter((secteur) => sectorNumber(secteur) === String(values.numero_secteur ?? ''))
        .map((secteur) => ({
          value: String(secteur.id_secteur ?? secteur.id),
          label: secteur.adresse ?? secteur.nom_secteur,
        })),
      getValue: (item) => String(item.id_secteur ?? item.secteur?.id_secteur ?? item.secteur?.id ?? ''),
      populateOnChange: (value) => {
        const selectedSecteur = secteurs.items.find((secteur) => String(secteur.id_secteur ?? secteur.id) === String(value));
        const nextValues = {
          adresse: selectedSecteur?.adresse ?? selectedSecteur?.nom_secteur ?? '',
        };

        if (!formState?.item) {
          nextValues.police = generateContractNumber(selectedSecteur, items);
        }

        return nextValues;
      },
    },
    {
      name: 'adresse',
      type: 'hidden',
      getValue: (item) => item.adresse ?? item.secteur?.adresse ?? item.secteur?.nom_secteur ?? '',
    },
    {
      name: 'type_abonnement',
      label: t('forms.subscriptionType'),
      type: 'select',
      required: true,
      defaultValue: 'Domestique',
      options: [
        { value: 'Domestique', label: t('subscriptions.Domestique') },
        { value: 'Patente', label: t('subscriptions.Patente') },
        { value: 'Administration', label: t('subscriptions.Administration') },
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
  ], [formState?.item, items, sectorNumbers, secteurs.items, t]);

  async function saveClient(values) {
    const selectedSecteur = secteurs.items.find((secteur) => String(secteur.id_secteur ?? secteur.id) === String(values.id_secteur));
    const payload = {
      ...values,
      adresse: selectedSecteur?.adresse ?? selectedSecteur?.nom_secteur ?? values.adresse,
    };
    delete payload.numero_secteur;

    if (formState?.item) {
      await api.put(`/clients/${formState.item.id_client ?? formState.item.id}`, payload);
    } else {
      await api.post('/clients', payload);
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
