/* eslint-disable react-refresh/only-export-components */
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, AlertTriangle, ClipboardCheck, Droplets, Map, ShieldAlert, Users, Zap } from 'lucide-react';
import { endpoints } from '../api/resources';
import DashboardCharts from '../components/DashboardCharts';
import PanneMap from '../components/PanneMap';
import { ErrorState, SkeletonGrid } from '../components/PageState';
import StatCard from '../components/ui/StatCard';
import useResource from '../hooks/useResource';
import { translateAnomaly } from '../utils/i18nLabels';

export function useDashboardData({ includeStats = true } = {}) {
  const fetchStats = useCallback(() => endpoints.stats(), []);

  const pannes = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const secteurs = useResource(endpoints.secteurs, { limit: 500 });
  const stats = useResource(fetchStats, {}, { enabled: includeStats });
  const interventions = useResource(endpoints.interventions, { limit: 500 }, { enabled: includeStats });

  return { interventions, pannes, secteurs, stats };
}

export function StatsGrid({ stats }) {
  const { t } = useTranslation();

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={t('dashboard.totalClients')} value={stats?.total_clients ?? '-'} sub={t('dashboard.registeredCustomers')} icon={Users} color="blue" />
      <StatCard label={t('dashboard.openClaims')} value={stats?.pannes_ouvertes ?? stats?.active_pannes ?? '-'} sub={t('dashboard.pendingPannes')} icon={AlertTriangle} color="red" />
      <StatCard label={t('dashboard.interventions')} value={stats?.total_interventions ?? '-'} sub={`${stats?.interventions_mois ?? '-'} ${t('dashboard.thisMonth')}`} icon={ClipboardCheck} color="green" />
      <StatCard label={t('dashboard.activeInterventions')} value={stats?.active_interventions ?? '-'} sub={`${stats?.completed_interventions ?? '-'} ${t('dashboard.completed')}`} icon={Activity} color="amber" />
      <StatCard label={t('dashboard.urgentInterventions')} value={stats?.urgent_interventions ?? '-'} sub={t('dashboard.highPriorityFieldWork')} icon={ShieldAlert} color="red" />
      <StatCard label={t('dashboard.waterClaims')} value={stats?.water_pannes ?? '-'} sub={`${stats?.water_clients ?? '-'} ${t('dashboard.waterClients')}`} icon={Droplets} color="blue" />
      <StatCard label={t('dashboard.electricityClaims')} value={stats?.electricity_pannes ?? '-'} sub={`${stats?.electricity_clients ?? '-'} ${t('dashboard.electricityClients')}`} icon={Zap} color="amber" />
      <StatCard label={t('dashboard.sectors')} value={stats?.total_secteurs ?? '-'} sub={t('dashboard.agencyCoverage')} icon={Map} color="blue" />
    </div>
  );
}

export function RecentPannes({ pannes, title }) {
  const { t } = useTranslation();
  const heading = title ?? t('dashboard.recentPannes');
  const rows = useMemo(() => pannes.slice(0, 6), [pannes]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{heading}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">{t('common.noData')}</div>
        ) : rows.map((panne) => (
          <div key={panne.id_panne ?? panne.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium text-gray-900">{translateAnomaly(t, panne.anomalie)}</div>
              <div className="truncate text-xs text-gray-500">{panne.compteur?.cadran ?? t('common.noMeter')} / {panne.compteur?.secteur?.nom_secteur ?? t('common.noSector')}</div>
            </div>
            <div className="text-xs text-gray-500">{panne.date_panne ?? '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardFrame({ title, subtitle, stats, pannes, secteurs, interventions = [], loading, error, mapTitle, showCharts = true }) {
  const { t } = useTranslation();
  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      {error && <ErrorState message={error} />}
      {loading ? <SkeletonGrid cards={6} /> : stats && <StatsGrid stats={stats} />}
      {showCharts && (
        <DashboardCharts pannes={pannes} interventions={interventions} loading={loading} />
      )}
      <section className="min-w-0 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">{mapTitle ?? t('dashboard.operationalMap')}</h3>
        <PanneMap pannes={pannes} sectors={secteurs} height="460px" />
      </section>
      <RecentPannes pannes={pannes} />
    </div>
  );
}
