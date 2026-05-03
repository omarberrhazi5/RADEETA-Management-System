import { useMemo, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import api from '../api/axios';
import { downloadFile } from '../api/download';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import { ErrorState } from '../components/PageState';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';

function releveLabel(releve) {
  const client = releve.compteur?.client;
  const clientName = client ? `${client.nom ?? ''} ${client.prenom ?? ''}`.trim() : 'Unknown client';
  return `[${releve.id}] - ${clientName || 'Unknown client'} - ${releve.nouvel_index}`;
}

export default function Factures() {
  const { role } = useAuth();
  const [filters, setFilters] = useState({ statut: '', client_id: '', secteur_id: '', from: '', to: '', month: '' });
  const { error, items, loading, refresh } = useResource(endpoints.factures, { limit: 500, ...filters });
  const availableReleves = useResource(endpoints.releves, { limit: 500, unbilled: true });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 });
  const [formOpen, setFormOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);

  const fields = useMemo(() => [
    {
      name: 'releve_id',
      label: 'Reading',
      type: 'select',
      required: true,
      placeholder: availableReleves.loading ? 'Loading readings...' : 'Select an unbilled reading',
      disabled: availableReleves.loading || availableReleves.items.length === 0,
      options: availableReleves.items.map((releve) => ({
        value: String(releve.id),
        label: releveLabel(releve),
      })),
      help: availableReleves.error || (availableReleves.items.length === 0 ? 'No available readings without invoices.' : 'Only readings without an invoice are listed.'),
    },
    { name: 'due_date', label: 'Due date', type: 'date' },
  ], [availableReleves.error, availableReleves.items, availableReleves.loading]);

  async function generateFacture(values) {
    await api.post('/factures', values);
    availableReleves.refresh();
    refresh();
  }

  async function previewFacture(row) {
    const response = await api.get(`/factures/${row.id}/preview`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => window.URL.revokeObjectURL(url), 30000);
  }

  return (
    <div className="space-y-5">
      {error && <ErrorState message={error} />}

      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <select
          value={filters.statut}
          onChange={(event) => setFilters((current) => ({ ...current, statut: event.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="impayee">Impayee</option>
          <option value="partielle">Partielle</option>
          <option value="payee">Payee</option>
        </select>
        <input
          value={filters.client_id}
          onChange={(event) => setFilters((current) => ({ ...current, client_id: event.target.value }))}
          placeholder="Client ID"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={filters.secteur_id}
          onChange={(event) => setFilters((current) => ({ ...current, secteur_id: event.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All sectors</option>
          {secteurs.items.map((secteur) => (
            <option key={secteur.id} value={secteur.id}>{secteur.nom_secteur}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="month"
          value={filters.month}
          onChange={(event) => {
            const month = event.target.value;
            setFilters((current) => ({
              ...current,
              month,
              from: month ? `${month}-01` : '',
              to: month ? `${month}-31` : '',
            }));
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <DataTable
        title="Factures"
        subtitle="Invoice history and PDF generation."
        resource="factures"
        role={role}
        loading={loading}
        rows={items}
        onCreate={() => setFormOpen(true)}
        emptyMessage={filters.statut === 'impayee' ? 'No unpaid invoices.' : 'No invoices found for the selected filters.'}
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'client', header: 'Client', render: (row) => row.client ? `${row.client.nom ?? ''} ${row.client.prenom ?? ''}`.trim() : '-' },
          { key: 'meter', header: 'Meter', render: (row) => row.compteur_number ?? row.compteur?.cadran ?? '-' },
          { key: 'period', header: 'Period', render: (row) => `${row.periode_debut ?? '-'} / ${row.periode_fin ?? '-'}` },
          { key: 'consumption', header: 'Consumption', render: (row) => `${row.consommation_m3 ?? row.releve?.consommation ?? '-'} m3` },
          { key: 'total_ttc', header: 'Total TTC', render: (row) => `${Number(row.total_ttc ?? 0).toLocaleString('fr-MA')} MAD` },
          { key: 'remaining_amount', header: 'Remaining', render: (row) => `${Number(row.remaining_amount ?? 0).toLocaleString('fr-MA')} MAD` },
          { key: 'statut', header: 'Status', render: (row) => <StatusBadge status={row.statut} /> },
          { key: 'due_date', header: 'Due date' },
          { key: 'pdf', header: 'Actions', render: (row) => (
            <div className="flex gap-1">
              <Button variant="secondary" onClick={() => setSelectedFacture(row)}>
                <Eye size={14} />
              </Button>
              <Button variant="secondary" onClick={() => previewFacture(row)}>
                <FileText size={14} />
              </Button>
              <Button variant="secondary" onClick={() => downloadFile(`/factures/${row.id}/pdf`, `${row.reference}.pdf`)}>
                <Download size={14} />
              </Button>
            </div>
          ) },
        ]}
      />

      {formOpen && (
        <EntityFormModal
          title="Generate Invoice"
          fields={fields}
          submitLabel="Generate invoice"
          onClose={() => setFormOpen(false)}
          onSubmit={generateFacture}
        />
      )}

      {selectedFacture && (
        <InvoiceDetailModal
          facture={selectedFacture}
          onClose={() => setSelectedFacture(null)}
          onPreviewPdf={() => previewFacture(selectedFacture)}
        />
      )}
    </div>
  );
}
