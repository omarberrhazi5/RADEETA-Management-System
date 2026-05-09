import { DashboardFrame, useDashboardData } from './DashboardShared';
import { useTranslation } from 'react-i18next';

export default function ViewerDashboard() {
  const { t } = useTranslation();
  const { pannes, secteurs } = useDashboardData({ includeStats: false });

  return (
    <DashboardFrame
      title={t('dashboard.viewer')}
      subtitle={t('dashboard.viewerSubtitle')}
      pannes={pannes.items}
      secteurs={secteurs.items}
      loading={pannes.loading || secteurs.loading}
      error={pannes.error || secteurs.error}
      mapTitle={t('dashboard.readOnlyOperationsMap')}
      showCharts={false}
    />
  );
}
