import { DashboardFrame, useDashboardData } from './DashboardShared';

export default function ViewerDashboard() {
  const { pannes, secteurs } = useDashboardData({ includeStats: false });

  return (
    <DashboardFrame
      title="Viewer Dashboard"
      subtitle="Read-only access to operational data and reports."
      pannes={pannes.items}
      secteurs={secteurs.items}
      loading={pannes.loading || secteurs.loading}
      error={pannes.error || secteurs.error}
      mapTitle="Read-only operations map"
      showCharts={false}
    />
  );
}
