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
import { EmptyState } from './PageState';

const palette = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

function monthKey(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('fr-MA', { month: 'short', year: '2-digit' });
}

function ChartCard({ title, subtitle, children, empty }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="h-72">
        {empty ? <EmptyState message={empty} /> : children}
      </div>
    </section>
  );
}

function groupByMonth(rows, dateKey, valueGetter = () => 1) {
  const map = new Map();
  rows.forEach((row) => {
    const key = monthKey(row[dateKey]);
    map.set(key, (map.get(key) ?? 0) + valueGetter(row));
  });

  return Array.from(map.entries()).slice(-8).map(([month, value]) => ({ month, value: Number(value.toFixed?.(2) ?? value) }));
}

export default function DashboardCharts({ pannes = [], releves = [], factures = [], reparations = [] }) {
  const pannesBySector = Object.values(pannes.reduce((acc, panne) => {
    const sector = panne.compteur?.secteur?.nom_secteur ?? 'Unassigned';
    acc[sector] ??= { sector, count: 0 };
    acc[sector].count += 1;
    return acc;
  }, {})).slice(0, 10);
  const consumptionTrend = groupByMonth(releves, 'periode_fin', (row) => Number(row.consommation ?? 0));
  const revenueTrend = groupByMonth(factures, 'generated_at', (row) => String(row.statut) === 'payee' ? Number(row.total_ttc ?? 0) : 0);
  const repairsTrend = groupByMonth(reparations, 'date_reparation');
  const paid = factures.filter((facture) => facture.statut === 'payee').length;
  const unpaid = factures.length - paid;
  const invoiceStatus = [
    { name: 'Paid', value: paid },
    { name: 'Unpaid / partial', value: unpaid },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard title="Pannes by sector" subtitle="Operational incident distribution" empty={pannesBySector.length === 0 ? 'No pannes found for the current scope.' : ''}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pannesBySector}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="sector" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly consumption trend" subtitle="Recorded consumption from meter readings" empty={consumptionTrend.length === 0 ? 'No readings available.' : ''}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={consumptionTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" name="Consumption" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Paid vs unpaid invoices" subtitle="Billing collection status" empty={invoiceStatus.length === 0 ? 'No invoices available.' : ''}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={invoiceStatus} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={4}>
              {invoiceStatus.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly revenue trend" subtitle="Paid invoices by month" empty={revenueTrend.length === 0 ? 'No paid invoice revenue yet.' : ''}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" name="Revenue" stroke="#d97706" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Repairs completed per month" subtitle="Closed interventions trend" empty={repairsTrend.length === 0 ? 'No repairs completed yet.' : ''}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={repairsTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" name="Repairs" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
