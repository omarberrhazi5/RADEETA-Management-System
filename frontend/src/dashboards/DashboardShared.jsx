/* eslint-disable react-refresh/only-export-components */
import { useCallback, useMemo } from 'react';
import { AlertTriangle, Banknote, Gauge, Receipt, Users, Wrench, Zap } from 'lucide-react';
import { endpoints } from '../api/resources';
import DashboardCharts from '../components/DashboardCharts';
import PanneMap from '../components/PanneMap';
import { ErrorState, SkeletonGrid } from '../components/PageState';
import StatCard from '../components/ui/StatCard';
import useResource from '../hooks/useResource';

export function useDashboardData({ includeStats = true } = {}) {
  const fetchStats = useCallback(() => endpoints.stats(), []);

  const pannes = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 });
  const stats = useResource(fetchStats, {}, { enabled: includeStats });
  const releves = useResource(endpoints.releves, { limit: 500 }, { enabled: includeStats });
  const factures = useResource(endpoints.factures, { limit: 500 }, { enabled: includeStats });
  const reparations = useResource(endpoints.reparations, { limit: 500 }, { enabled: includeStats });

  return { factures, pannes, releves, reparations, secteurs, stats };
}

export function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Clients" value={stats?.total_clients ?? '-'} sub="registered customers" icon={Users} color="blue" />
      <StatCard label="Compteurs" value={stats?.total_compteurs ?? '-'} sub="active meters" icon={Gauge} color="green" />
      <StatCard label="Open Pannes" value={stats?.pannes_ouvertes ?? stats?.active_pannes ?? '-'} sub="pending operations" icon={AlertTriangle} color="red" />
      <StatCard label="Monthly Repairs" value={stats?.reparations_mois ?? '-'} sub="current month" icon={Wrench} color="amber" />
      <StatCard label="Invoices" value={stats?.total_invoices ?? '-'} sub={`${stats?.unpaid_invoices ?? '-'} unpaid`} icon={Receipt} color="blue" />
      <StatCard label="Consumption" value={stats?.total_consumption ?? '-'} sub="total recorded units" icon={Zap} color="green" />
      <StatCard label="Monthly Revenue" value={stats?.monthly_revenue ?? '-'} sub="paid invoices" icon={Banknote} color="amber" />
      <StatCard label="Active Meters" value={stats?.active_meters ?? stats?.total_compteurs ?? '-'} sub="billing eligible" icon={Gauge} color="blue" />
    </div>
  );
}

export function RecentPannes({ pannes, title = 'Recent pannes' }) {
  const rows = useMemo(() => pannes.slice(0, 6), [pannes]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">No pannes found.</div>
        ) : rows.map((panne) => (
          <div key={panne.id_panne ?? panne.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium text-gray-900">#{panne.id_panne ?? panne.id} - {panne.anomalie ?? 'Fault'}</div>
              <div className="truncate text-xs text-gray-500">{panne.compteur?.cadran ?? 'No meter'} / {panne.compteur?.secteur?.nom_secteur ?? 'No sector'}</div>
            </div>
            <div className="text-xs text-gray-500">{panne.date_panne ?? '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardFrame({ title, subtitle, stats, pannes, secteurs, releves = [], factures = [], reparations = [], loading, error, mapTitle = 'Operational map', showCharts = true }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      {error && <ErrorState message={error} />}
      {loading ? <SkeletonGrid cards={6} /> : stats && <StatsGrid stats={stats} />}
      {!loading && showCharts && (
        <DashboardCharts pannes={pannes} releves={releves} factures={factures} reparations={reparations} />
      )}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">{mapTitle}</h3>
        <PanneMap pannes={pannes} sectors={secteurs} height="460px" />
      </section>
      <RecentPannes pannes={pannes} />
    </div>
  );
}
