import { useTranslation } from 'react-i18next';

export default function ConsumptionChart({ releves = [] }) {
  const { t } = useTranslation();
  const rows = releves.slice(0, 8).reverse();
  const max = Math.max(1, ...rows.map((row) => Number(row.consommation ?? 0)));

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
      <div className="mb-4">
        <h3 className="text-sm font-bold tracking-tight text-slate-800">{t('charts.consumptionHistory')}</h3>
        <p className="text-xs font-medium text-slate-500">{t('charts.latestReadingsByPeriod')}</p>
      </div>
      <div className="flex h-52 items-end gap-3">
        {rows.length === 0 ? (
          <div className="flex h-full flex-1 items-center justify-center text-sm font-medium text-slate-500">{t('charts.noReadingsYet')}</div>
        ) : rows.map((row) => {
          const value = Number(row.consommation ?? 0);
          return (
            <div key={row.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end rounded-xl bg-slate-50">
                <div
                  className="w-full rounded-xl bg-[var(--srm-green)]"
                  style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
                  title={t('charts.units', { value })}
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-800">{value}</div>
                <div className="truncate text-[10px] font-medium text-slate-500">{row.periode_fin ?? '-'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
