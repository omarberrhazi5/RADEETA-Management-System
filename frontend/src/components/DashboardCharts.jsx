import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './PageState';
import { currentLocale } from '../utils/i18nLabels';

function monthKey(value, fallback, locale) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
}

function ChartSkeleton() {
  return (
    <div className="flex h-full items-end gap-3 px-2 pb-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-1 flex-col justify-end">
          <div
            className="animate-pulse rounded-t-md bg-slate-100"
            style={{ height: `${34 + ((index * 17) % 58)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, children, empty, loading = false }) {
  return (
    <section className="min-w-0 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
      <div className="mb-3">
        <h3 className="text-sm font-bold tracking-tight text-slate-800">{title}</h3>
        {subtitle && <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>}
      </div>
      <div className="h-[300px] w-full min-w-0 overflow-hidden">
        {loading ? <ChartSkeleton /> : empty ? <EmptyState message={empty} /> : children}
      </div>
    </section>
  );
}

function groupByMonth(rows, dateKey, fallback, locale, valueGetter = () => 1) {
  const map = new Map();
  rows.forEach((row) => {
    const key = monthKey(row[dateKey], fallback, locale);
    map.set(key, (map.get(key) ?? 0) + valueGetter(row));
  });

  return Array.from(map.entries()).slice(-8).map(([month, value]) => ({ month, value: Number(value.toFixed?.(2) ?? value) }));
}

const serviceColors = {
<<<<<<< HEAD
  water: '#70b830',
  electricity: '#c01818',
=======
  water: '#092e69',
  electricity: '#f59e0b',
>>>>>>> b16ed97 (Ajout des comptes de demonstration dans la page login)
};

export default function DashboardCharts({ pannes = [], interventions = [], loading = false }) {
  const { i18n, t } = useTranslation();
  const pannesBySector = Object.values(pannes.reduce((acc, panne) => {
    const sector = panne.compteur?.secteur?.nom_secteur ?? t('common.notAssigned');
    acc[sector] ??= { sector, count: 0 };
    acc[sector].count += 1;
    return acc;
  }, {})).slice(0, 10);
  const interventionsTrend = groupByMonth(interventions, 'intervention_at', t('charts.unknown'), currentLocale(i18n));
  const pannesByService = Object.values(pannes.reduce((acc, panne) => {
    const service = panne.compteur?.service_type ?? 'water';
    acc[service] ??= { service, label: t(`services.${service}`, { defaultValue: service }), count: 0 };
    acc[service].count += 1;
    return acc;
  }, {}));

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard title={t('charts.pannesBySector')} subtitle={t('charts.incidentDistribution')} empty={pannesBySector.length === 0 ? t('charts.noPannesScope') : ''} loading={loading}>
        <ResponsiveContainer width="99%" height={300}>
          <BarChart data={pannesBySector}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="sector" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#70b830" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('charts.interventionsPerMonth')} subtitle={t('charts.technicalReportsCreated')} loading={loading}>
        <ResponsiveContainer width="99%" height={300}>
          <LineChart data={interventionsTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" name={t('interventions.title')} stroke="#70b830" strokeWidth={3} dot={{ r: 3, fill: '#c01818', stroke: '#ffffff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('charts.claimsByService')} subtitle={t('charts.waterElectricityPannes')} empty={pannesByService.length === 0 ? t('charts.noServiceData') : ''} loading={loading}>
        <ResponsiveContainer width="99%" height={300}>
          <PieChart>
            <Pie data={pannesByService} dataKey="count" nameKey="label" innerRadius={62} outerRadius={96} paddingAngle={4}>
              {pannesByService.map((entry) => <Cell key={entry.service} fill={serviceColors[entry.service] ?? '#64748b'} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
