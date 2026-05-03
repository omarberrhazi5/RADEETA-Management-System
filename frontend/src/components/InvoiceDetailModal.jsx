import { Download, FileText, X } from 'lucide-react';
import { downloadFile } from '../api/download';
import Button from './ui/Button';

const money = (value) => `${Number(value ?? 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const number = (value) => Number(value ?? 0).toLocaleString('fr-MA', { maximumFractionDigits: 2 });

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value || '-'}</div>
    </div>
  );
}

function BreakdownTable({ title, rows = [] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-50 text-xs uppercase text-blue-700">
            <tr>
              <th className="px-3 py-2 text-left">Rubrique</th>
              <th className="px-3 py-2 text-right">Quantite</th>
              <th className="px-3 py-2 text-right">PU HT</th>
              <th className="px-3 py-2 text-right">HT</th>
              <th className="px-3 py-2 text-right">TVA</th>
              <th className="px-3 py-2 text-right">TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length === 0 ? (
              <tr><td colSpan="6" className="px-3 py-4 text-center text-gray-500">No billing lines available.</td></tr>
            ) : rows.map((row, index) => (
              <tr key={`${row.label}-${index}`}>
                <td className="px-3 py-2 font-medium text-gray-900">{row.label}</td>
                <td className="px-3 py-2 text-right text-gray-600">{number(row.quantity)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{money(row.unit_price_ht)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{money(row.montant_ht)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{money(row.tva_amount)}</td>
                <td className="px-3 py-2 text-right font-semibold text-gray-900">{money(row.total_ttc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InvoiceDetailModal({ facture, onClose, onPreviewPdf }) {
  const sections = facture?.detail_snapshot?.sections ?? {};
  const groupedLines = {
    water: facture?.line_items?.filter((line) => line.section === 'water') ?? [],
    sanitation: facture?.line_items?.filter((line) => line.section === 'sanitation') ?? [],
    taxes: facture?.line_items?.filter((line) => line.section === 'taxes') ?? [],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 bg-blue-700 px-6 py-4 text-white">
          <div>
            <div className="text-xs uppercase tracking-wide text-blue-100">SRM Taza/Region</div>
            <h2 className="text-lg font-bold">Facture Eau et Assainissement</h2>
            <p className="text-sm text-blue-100">{facture.numero_facture_eau_assainissement || facture.reference}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-blue-50 hover:bg-blue-600">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-76px)] space-y-5 overflow-y-auto p-6">
          <div className="grid gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-4">
            <Info label="Client" value={facture.client_name || (facture.client ? `${facture.client.prenom ?? ''} ${facture.client.nom ?? ''}`.trim() : '-')} />
            <Info label="N client" value={facture.numero_client} />
            <Info label="N contrat" value={facture.numero_contrat} />
            <Info label="Tournee" value={facture.tournee} />
            <Info label="Usage" value={facture.usage_type} />
            <Info label="Agence" value={facture.agence} />
            <Info label="Periode" value={`${facture.periode_debut ?? '-'} / ${facture.periode_fin ?? '-'}`} />
            <Info label="Adresse" value={facture.client_address || facture.address} />
          </div>

          <div className="grid gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-5">
            <Info label="Compteur" value={facture.compteur_number || facture.compteur?.cadran} />
            <Info label="Diametre" value={facture.diametre_compteur} />
            <Info label="Coefficient" value={number(facture.coefficient)} />
            <Info label="Ancien index" value={number(facture.ancien_index)} />
            <Info label="Nouvel index" value={number(facture.nouvel_index)} />
            <Info label="Ancienne lecture" value={facture.ancienne_date_lecture} />
            <Info label="Nouvelle lecture" value={facture.nouvelle_date_lecture} />
            <Info label="Consommation m3" value={number(facture.consommation_m3)} />
            <Info label="Statut" value={facture.statut} />
            <Info label="Echeance" value={facture.due_date} />
          </div>

          <BreakdownTable title="Consommation eau" rows={groupedLines.water} />
          <BreakdownTable title="Assainissement" rows={groupedLines.sanitation} />
          <BreakdownTable title="Taxes" rows={groupedLines.taxes} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Synthese Eau et Assainissement</h3>
              {['water', 'sanitation', 'taxes'].map((key) => (
                <div key={key} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0">
                  <span className="capitalize text-gray-600">{sections[key]?.label ?? key}</span>
                  <span className="font-semibold text-gray-900">{money(sections[key]?.total_ttc)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Total</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Montant HT</span><strong>{money(facture.montant_ht)}</strong></div>
                <div className="flex justify-between"><span>Taxes et frais</span><strong>{money(facture.taxes)}</strong></div>
                <div className="flex justify-between"><span>TVA</span><strong>{money(facture.tva)}</strong></div>
                <div className="flex justify-between border-t border-blue-200 pt-2 text-base"><span>Total TTC</span><strong>{money(facture.total_ttc)}</strong></div>
                <div className="flex justify-between"><span>Especes</span><strong>{money(facture.montant_especes || facture.total_ttc)}</strong></div>
                <div className="flex justify-between"><span>Autre mode</span><strong>{money(facture.montant_autre_mode || facture.total_ttc)}</strong></div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={onPreviewPdf}><FileText size={15} /> Print preview</Button>
            <Button onClick={() => downloadFile(`/factures/${facture.id}/pdf`, `${facture.reference}.pdf`)}><Download size={15} /> Download PDF</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
