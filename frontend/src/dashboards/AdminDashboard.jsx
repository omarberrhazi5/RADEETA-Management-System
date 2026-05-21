import { DashboardFrame, useDashboardData } from './DashboardShared';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { interventions, stats, pannes } = useDashboardData();

  return (
    <DashboardFrame
      title={t('dashboard.responsable')}
      subtitle={t('dashboard.adminSubtitle')}
      stats={stats.data}
      pannes={pannes.items}
      interventions={interventions.items}
      loading={stats.loading || pannes.loading || interventions.loading}
      error={stats.error || pannes.error || interventions.error}
    />
  );
}
