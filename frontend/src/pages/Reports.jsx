import { FileSpreadsheet, FileText, Receipt, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { downloadFile } from '../api/download';
import Button from '../components/ui/Button';

function ReportCard({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon size={22} />
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 min-h-10 text-sm text-gray-500">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const query = useMemo(() => {
    const [year, monthValue] = month.split('-');
    return `?year=${year}&month=${Number(monthValue)}`;
  }, [month]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
          <p className="mt-1 text-sm text-gray-500">Export operational and billing reports with period filters.</p>
        </div>
        <label className="text-sm font-medium text-gray-700">
          Reporting month
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 block h-11 rounded-md border border-gray-300 px-3 text-sm" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <ReportCard icon={FileText} title="Pannes PDF" description="Monthly operational incident register with client, meter, sector, and repair status.">
          <Button variant="danger" onClick={() => downloadFile(`/reports/pannes/pdf${query}`, `pannes-${month}.pdf`)}>
            Download PDF
          </Button>
        </ReportCard>

        <ReportCard icon={Receipt} title="Invoices PDF" description="Monthly invoice summary for management review and billing reconciliation.">
          <Button variant="secondary" onClick={() => downloadFile(`/reports/invoices/pdf${query}`, `factures-${month}.pdf`)}>
            Download PDF
          </Button>
        </ReportCard>

        <ReportCard icon={WalletCards} title="Payments Excel" description="Payments summary by reference, invoice, customer, amount, mode, and collection date.">
          <Button variant="success" onClick={() => downloadFile(`/reports/payments/excel${query}`, `paiements-${month}.xlsx`)}>
            Download Excel
          </Button>
        </ReportCard>

        <ReportCard icon={FileSpreadsheet} title="Clients & meters Excel" description="Customer and meter master data export for operational back-office controls.">
          <Button variant="success" onClick={() => downloadFile('/reports/clients/excel', 'clients-compteurs.xlsx')}>
            Download Excel
          </Button>
        </ReportCard>
      </div>
    </div>
  );
}
