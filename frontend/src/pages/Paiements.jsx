import { useMemo, useState } from 'react';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';

export default function Paiements() {
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.paiements, { limit: 500 });
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState({ mode: '', month: '' });

  const fields = useMemo(() => [
    { name: 'facture_id', label: 'Invoice ID', type: 'number', required: true },
    { name: 'montant', label: 'Amount', type: 'number', min: '0.01', step: '0.01', required: true },
    {
      name: 'mode',
      label: 'Payment mode',
      type: 'select',
      required: true,
      defaultValue: 'cash',
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Card' },
        { value: 'bank_transfer', label: 'Bank transfer' },
        { value: 'mobile', label: 'Mobile' },
        { value: 'cheque', label: 'Cheque' },
      ],
    },
    { name: 'reference', label: 'Payment reference' },
    { name: 'paid_at', label: 'Paid at', type: 'datetime-local' },
  ], []);

  async function createPaiement(values) {
    const { facture_id, ...payload } = values;
    await api.post(`/factures/${facture_id}/paiements`, payload);
    refresh();
  }

  const filteredItems = items.filter((item) => {
    const matchesMode = !filters.mode || item.mode === filters.mode;
    const matchesMonth = !filters.month || String(item.paid_at ?? '').startsWith(filters.month);
    return matchesMode && matchesMonth;
  });

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      <DataTable
        title="Paiements"
        subtitle="Register and review customer payments."
        resource="paiements"
        role={role}
        loading={loading}
        rows={filteredItems}
        filters={(
          <>
            <select value={filters.mode} onChange={(event) => setFilters((current) => ({ ...current, mode: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
              <option value="">All modes</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="mobile">Mobile</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
            </select>
            <input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm" />
          </>
        )}
        emptyMessage="No payments found for the selected filters."
        onCreate={() => setFormOpen(true)}
        columns={[
          { key: 'id', header: 'Payment', render: (row) => `#${row.id}` },
          { key: 'facture', header: 'Invoice', render: (row) => row.facture?.reference ?? row.facture_id },
          { key: 'client', header: 'Client', render: (row) => row.facture?.client ? `${row.facture.client.nom ?? ''} ${row.facture.client.prenom ?? ''}`.trim() : '-' },
          { key: 'montant', header: 'Amount', render: (row) => `${Number(row.montant ?? 0).toLocaleString('fr-MA')} MAD` },
          { key: 'mode', header: 'Mode' },
          { key: 'reference', header: 'Reference' },
          { key: 'paid_at', header: 'Paid at', render: (row) => row.paid_at ? new Date(row.paid_at).toLocaleString('fr-MA') : '-' },
        ]}
      />
      {formOpen && (
        <EntityFormModal
          title="Register Payment"
          fields={fields}
          submitLabel="Register payment"
          onClose={() => setFormOpen(false)}
          onSubmit={createPaiement}
        />
      )}
    </div>
  );
}
