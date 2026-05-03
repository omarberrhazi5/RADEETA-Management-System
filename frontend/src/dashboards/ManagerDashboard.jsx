import { DashboardFrame, useDashboardData } from './DashboardShared';

export default function ManagerDashboard() {
  const { factures, stats, pannes, releves, reparations, secteurs } = useDashboardData();

  return (
    <DashboardFrame
      title="Manager Dashboard"
      subtitle="Supervise active operations, approve progress, and monitor service quality."
      stats={stats.data}
      pannes={pannes.items}
      releves={releves.items}
      factures={factures.items}
      reparations={reparations.items}
      secteurs={secteurs.items}
      loading={stats.loading || pannes.loading || secteurs.loading || releves.loading || factures.loading || reparations.loading}
      error={stats.error || pannes.error || secteurs.error || releves.error || factures.error || reparations.error}
      mapTitle="Supervision map"
    />
  );
}
