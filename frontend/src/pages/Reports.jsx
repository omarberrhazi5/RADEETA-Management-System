import { FileSpreadsheet, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const query = useMemo(() => {
    const [year, monthValue] = month.split('-');
    return `?year=${year}&month=${Number(monthValue)}`;
  }, [month]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('reports.title')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('reports.subtitle')}</p>
        </div>
        <label className="text-sm font-medium text-gray-700">
          {t('reports.reportingMonth')}
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 block h-11 rounded-md border border-gray-300 px-3 text-sm" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ReportCard icon={FileText} title={t('reports.pannesPdf')} description={t('reports.pannesPdfDescription')}>
          <Button variant="danger" onClick={() => downloadFile(`/reports/pannes/pdf${query}`, `pannes-${month}.pdf`)}>
            {t('buttons.downloadPdf')}
          </Button>
        </ReportCard>

        <ReportCard icon={FileSpreadsheet} title={t('reports.clientsMetersExcel')} description={t('reports.clientsMetersDescription')}>
          <Button variant="success" onClick={() => downloadFile('/reports/clients/excel', 'clients-compteurs.xlsx')}>
            {t('buttons.downloadExcel')}
          </Button>
        </ReportCard>
      </div>
    </div>
  );
}
