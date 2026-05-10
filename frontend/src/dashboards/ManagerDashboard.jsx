import { DashboardFrame, useDashboardData } from './DashboardShared';
import { useTranslation } from 'react-i18next';

export default function ManagerDashboard() {
  const { t } = useTranslation();
  const { stats, pannes, secteurs } = useDashboardData({ includeInterventions: false });

  return (
    <DashboardFrame
      title={t('dashboard.manager')}
      subtitle={t('dashboard.managerSubtitle')}
      stats={stats.data}
      pannes={pannes.items}
      interventions={[]}
      secteurs={secteurs.items}
      loading={stats.loading || pannes.loading || secteurs.loading}
      error={stats.error || pannes.error || secteurs.error}
      mapTitle={t('dashboard.supervisionMap')}
      showCharts={false}
    />
  );
}
