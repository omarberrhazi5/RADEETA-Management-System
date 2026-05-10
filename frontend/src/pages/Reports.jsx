import { BarChart3, CalendarDays, FileSpreadsheet, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadFile } from '../api/download';
import Button from '../components/ui/Button';

const reportContents = ['anomalies', 'interventions', 'global'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 8 }, (_, index) => currentYear - index);
const months = Array.from({ length: 12 }, (_, index) => index + 1);

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100"
      >
        {children}
      </select>
    </label>
  );
}

function ContentPicker({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {reportContents.map((content) => {
        const active = value === content;

        return (
          <button
            key={content}
            type="button"
            onClick={() => onChange(content)}
            className={`rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-0.5 ${
              active
                ? 'border-[var(--srm-green)] bg-[var(--srm-green-soft)] shadow-sm'
                : 'border-slate-100 bg-white hover:border-green-100 hover:bg-slate-50'
            }`}
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-white text-[var(--srm-green)]' : 'bg-slate-50 text-slate-500'}`}>
              <BarChart3 size={18} />
            </div>
            <div className="text-sm font-bold text-slate-800">{t(`reports.content.${content}.title`)}</div>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{t(`reports.content.${content}.description`)}</p>
          </button>
        );
      })}
    </div>
  );
}

function ReportSection({
  title,
  description,
  icon: Icon,
  type,
  month,
  year,
  content,
  loadingKey,
  onMonthChange,
  onYearChange,
  onContentChange,
  onExport,
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-white/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--srm-green-soft)] text-[var(--srm-green)]">
            <Icon size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-800">{title}</h3>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {type === 'monthly' && (
          <SelectField label={t('reports.month')} value={month} onChange={onMonthChange}>
            {months.map((value) => <option key={value} value={value}>{t(`months.${value}`)}</option>)}
          </SelectField>
        )}
        <SelectField label={t('reports.year')} value={year} onChange={onYearChange}>
          {years.map((value) => <option key={value} value={value}>{value}</option>)}
        </SelectField>
      </div>

      <div className="mt-5">
        <div className="mb-3 text-sm font-semibold text-slate-700">{t('reports.exportContent')}</div>
        <ContentPicker value={content} onChange={onContentChange} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          loading={loadingKey === `${type}-pdf`}
          onClick={() => onExport(type, 'pdf')}
          className="flex-1 justify-center"
        >
          <FileText size={16} className="text-[var(--srm-red-soft)]" />
          {t('common.download_pdf')}
        </Button>
        <Button
          variant="primary"
          loading={loadingKey === `${type}-excel`}
          onClick={() => onExport(type, 'excel')}
          className="flex-1 justify-center"
        >
          <FileSpreadsheet size={16} />
          {t('common.download_excel')}
        </Button>
      </div>
    </section>
  );
}

export default function Reports() {
  const { t } = useTranslation();
  const [monthly, setMonthly] = useState({
    month: new Date().getMonth() + 1,
    year: currentYear,
    content: 'anomalies',
  });
  const [annual, setAnnual] = useState({
    year: currentYear,
    content: 'global',
  });
  const [loadingKey, setLoadingKey] = useState('');

  const selectedState = useMemo(() => ({
    monthly,
    annual,
  }), [annual, monthly]);

  async function exportReport(type, format) {
    const state = selectedState[type];
    const params = new URLSearchParams({
      type,
      format,
      content: state.content,
      year: String(state.year),
    });

    if (type === 'monthly') {
      params.set('month', String(state.month));
    }

    const datePart = type === 'monthly' ? `${state.year}-${String(state.month).padStart(2, '0')}` : String(state.year);
    const extension = format === 'excel' ? 'xlsx' : 'pdf';
    const filename = `srm-fm-${state.content}-${type}-${datePart}.${extension}`;

    try {
      setLoadingKey(`${type}-${format}`);
      await downloadFile(`/reports/export?${params.toString()}`, filename);
    } finally {
      setLoadingKey('');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">{t('reports.title')}</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">{t('reports.subtitle')}</p>
      </div>

      <ReportSection
        title={t('reports.monthlyTitle')}
        description={t('reports.monthlyDescription')}
        icon={CalendarDays}
        type="monthly"
        month={monthly.month}
        year={monthly.year}
        content={monthly.content}
        loadingKey={loadingKey}
        onMonthChange={(month) => setMonthly((current) => ({ ...current, month: Number(month) }))}
        onYearChange={(year) => setMonthly((current) => ({ ...current, year: Number(year) }))}
        onContentChange={(content) => setMonthly((current) => ({ ...current, content }))}
        onExport={exportReport}
      />

      <ReportSection
        title={t('reports.annualTitle')}
        description={t('reports.annualDescription')}
        icon={BarChart3}
        type="annual"
        year={annual.year}
        content={annual.content}
        loadingKey={loadingKey}
        onYearChange={(year) => setAnnual((current) => ({ ...current, year: Number(year) }))}
        onContentChange={(content) => setAnnual((current) => ({ ...current, content }))}
        onExport={exportReport}
      />
    </div>
  );
}
