import { DashboardFrame, useDashboardData } from './DashboardShared';
import { useTranslation } from 'react-i18next';

export default function ManagerDashboard() {
  const { t } = useTranslation();
  const { stats, pannes } = useDashboardData({ includeInterventions: false });

  return (
    <DashboardFrame
      title={t('dashboard.manager')}
      subtitle={t('dashboard.managerSubtitle')}
      stats={stats.data}
      pannes={pannes.items}
      interventions={[]}
      loading={stats.loading || pannes.loading}
      error={stats.error || pannes.error}
      showCharts={false}
    />
  );
}
