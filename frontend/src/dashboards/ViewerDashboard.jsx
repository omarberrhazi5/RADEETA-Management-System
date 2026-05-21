import { DashboardFrame, useDashboardData } from './DashboardShared';
import { useTranslation } from 'react-i18next';

export default function ViewerDashboard() {
  const { t } = useTranslation();
  const { pannes } = useDashboardData({ includeStats: false });

  return (
    <DashboardFrame
      title={t('dashboard.viewer')}
      subtitle={t('dashboard.viewerSubtitle')}
      pannes={pannes.items}
      loading={pannes.loading}
      error={pannes.error}
      showCharts={false}
    />
  );
}
