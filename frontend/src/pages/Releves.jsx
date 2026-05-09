import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import ConsumptionChart from '../components/ConsumptionChart';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { ROLES } from '../utils/rbac';

export default function Releves() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.releves, { limit: 500 });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 });
  const technicians = useResource(endpoints.technicians, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const [formState, setFormState] = useState(null);
  const [filters, setFilters] = useState({ secteur: '', month: '', operator: '' });

  const fields = useMemo(() => [
    { name: 'compteur_id', label: t('forms.meterId'), type: 'number', required: true },
    { name: 'ancien_index', label: t('forms.oldIndex'), type: 'number', min: '0', step: '0.01', help: t('forms.oldIndexHelp') },
    { name: 'nouvel_index', label: t('forms.newIndex'), type: 'number', min: '0', step: '0.01', required: true },
    { name: 'periode_debut', label: t('forms.periodStart'), type: 'date', required: true },
    { name: 'periode_fin', label: t('forms.periodEnd'), type: 'date', required: true },
  ], [t]);

  async function saveReleve(values) {
    const payload = { ...values, ancien_index: values.ancien_index === '' ? null : values.ancien_index };

    if (formState?.item) {
      await api.put(`/releves/${formState.item.id}`, payload);
    } else {
      await api.post('/releves', payload);
    }
    refresh();
  }

  const filteredItems = items.filter((item) => {
    const matchesSector = !filters.secteur || String(item.compteur?.secteur?.id ?? '') === filters.secteur;
    const matchesMonth = !filters.month || String(item.periode_fin ?? '').startsWith(filters.month);
    const matchesOperator = !filters.operator || String(item.created_by ?? '') === filters.operator;
    return matchesSector && matchesMonth && matchesOperator;
  });

  return (
    <div className="space-y-6">
      {error && <ErrorState message={error} />}
      <ConsumptionChart releves={items} />
      <DataTable
        title={t('releves.title')}
        subtitle={t('releves.subtitle')}
        resource="releves"
        role={role}
        loading={loading}
        rows={filteredItems}
        filters={(
          <>
            <select value={filters.secteur} onChange={(event) => setFilters((current) => ({ ...current, secteur: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
              <option value="">{t('common.allSectors')}</option>
              {secteurs.items.map((secteur) => <option key={secteur.id} value={secteur.id}>{secteur.nom_secteur}</option>)}
            </select>
            <input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm" />
            {role !== ROLES.TECHNICIAN && (
              <select value={filters.operator} onChange={(event) => setFilters((current) => ({ ...current, operator: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
                <option value="">{t('common.allTechnicians')}</option>
                {technicians.items.map((technician) => <option key={technician.id} value={technician.id}>{technician.prenom} {technician.nom}</option>)}
              </select>
            )}
          </>
        )}
        emptyMessage={t('releves.empty')}
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        columns={[
          { key: 'meter', header: t('tables.meter'), render: (row) => row.compteur?.cadran ?? row.compteur_id },
          { key: 'client', header: t('tables.client'), render: (row) => row.compteur?.client ? `${row.compteur.client.nom ?? ''} ${row.compteur.client.prenom ?? ''}`.trim() : '-' },
          { key: 'ancien_index', header: t('tables.oldIndex') },
          { key: 'nouvel_index', header: t('tables.newIndex') },
          { key: 'consommation', header: t('tables.consumption') },
          { key: 'periode', header: t('tables.period'), render: (row) => `${row.periode_debut} - ${row.periode_fin}` },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? t('releves.edit') : t('releves.add')}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? t('buttons.saveChanges') : t('releves.save')}
          onClose={() => setFormState(null)}
          onSubmit={saveReleve}
        />
      )}
    </div>
  );
}
