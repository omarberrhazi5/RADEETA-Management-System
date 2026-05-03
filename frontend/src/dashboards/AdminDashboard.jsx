import { DashboardFrame, useDashboardData } from './DashboardShared';

export default function AdminDashboard() {
  const { factures, stats, pannes, releves, reparations, secteurs } = useDashboardData();

  return (
    <DashboardFrame
      title="Admin Dashboard"
      subtitle="Full system overview, users, business data, reports, and global operations map."
      stats={stats.data}
      pannes={pannes.items}
      releves={releves.items}
      factures={factures.items}
      reparations={reparations.items}
      secteurs={secteurs.items}
      loading={stats.loading || pannes.loading || secteurs.loading || releves.loading || factures.loading || reparations.loading}
      error={stats.error || pannes.error || secteurs.error || releves.error || factures.error || reparations.error}
      mapTitle="Global pannes map"
    />
  );
}
