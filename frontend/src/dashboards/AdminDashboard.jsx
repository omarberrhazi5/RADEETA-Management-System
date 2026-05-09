import { DashboardFrame, useDashboardData } from './DashboardShared';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { interventions, stats, pannes, secteurs } = useDashboardData();

  return (
    <DashboardFrame
      title={t('dashboard.responsable')}
      subtitle={t('dashboard.adminSubtitle')}
      stats={stats.data}
      pannes={pannes.items}
      interventions={interventions.items}
      secteurs={secteurs.items}
      loading={stats.loading || pannes.loading || secteurs.loading || interventions.loading}
      error={stats.error || pannes.error || secteurs.error || interventions.error}
      mapTitle={t('dashboard.globalPannesMap')}
    />
  );
}
