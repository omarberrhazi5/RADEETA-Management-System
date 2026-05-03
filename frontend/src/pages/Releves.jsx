import { useMemo, useState } from 'react';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import ConsumptionChart from '../components/ConsumptionChart';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';

export default function Releves() {
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.releves, { limit: 500 });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 });
  const operators = useResource(endpoints.operators, { limit: 500 }, { enabled: role !== 'operator' });
  const [formState, setFormState] = useState(null);
  const [filters, setFilters] = useState({ secteur: '', month: '', operator: '' });

  const fields = useMemo(() => [
    { name: 'compteur_id', label: 'Meter ID', type: 'number', required: true },
    { name: 'ancien_index', label: 'Old index', type: 'number', min: '0', step: '0.01', help: 'Leave empty to use the last meter index.' },
    { name: 'nouvel_index', label: 'New index', type: 'number', min: '0', step: '0.01', required: true },
    { name: 'periode_debut', label: 'Period start', type: 'date', required: true },
    { name: 'periode_fin', label: 'Period end', type: 'date', required: true },
  ], []);

  async function saveReleve(values) {
    const payload = {
      ...values,
      ancien_index: values.ancien_index === '' ? null : values.ancien_index,
    };

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
        title="Releves"
        subtitle="Meter readings. Consumption is calculated automatically by Laravel."
        resource="releves"
        role={role}
        loading={loading}
        rows={filteredItems}
        filters={(
          <>
            <select value={filters.secteur} onChange={(event) => setFilters((current) => ({ ...current, secteur: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
              <option value="">All sectors</option>
              {secteurs.items.map((secteur) => <option key={secteur.id} value={secteur.id}>{secteur.nom_secteur}</option>)}
            </select>
            <input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm" />
            {role !== 'operator' && (
              <select value={filters.operator} onChange={(event) => setFilters((current) => ({ ...current, operator: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
                <option value="">All operators</option>
                {operators.items.map((operator) => <option key={operator.id} value={operator.id}>{operator.prenom} {operator.nom}</option>)}
              </select>
            )}
          </>
        )}
        emptyMessage="No readings available for the selected filters."
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        columns={[
          { key: 'id', header: 'Reading', render: (row) => `#${row.id}` },
          { key: 'meter', header: 'Meter', render: (row) => row.compteur?.cadran ?? row.compteur_id },
          { key: 'client', header: 'Client', render: (row) => row.compteur?.client ? `${row.compteur.client.nom ?? ''} ${row.compteur.client.prenom ?? ''}`.trim() : '-' },
          { key: 'ancien_index', header: 'Old index' },
          { key: 'nouvel_index', header: 'New index' },
          { key: 'consommation', header: 'Consumption' },
          { key: 'periode', header: 'Period', render: (row) => `${row.periode_debut} - ${row.periode_fin}` },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? 'Edit Reading' : 'Create Reading'}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? 'Save changes' : 'Save reading'}
          onClose={() => setFormState(null)}
          onSubmit={saveReleve}
        />
      )}
    </div>
  );
}
