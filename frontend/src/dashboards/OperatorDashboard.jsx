import { ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { endpoints } from '../api/resources';
import { ErrorState, LoadingState } from '../components/PageState';
import StatCard from '../components/ui/StatCard';
import useResource from '../hooks/useResource';
import { RecentPannes } from './DashboardShared';

export default function OperatorDashboard() {
  const { t } = useTranslation();
  const pannes = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const interventions = useResource(endpoints.interventions, { limit: 500 });

  if (pannes.loading || interventions.loading) return <LoadingState label={t('common.loadingTasks')} />;
  if (pannes.error || interventions.error) return <ErrorState message={pannes.error || interventions.error} />;

  const open = pannes.items.filter((item) => ['ouvert', 'ouverte', 'open'].includes(String(item.status ?? item.statut).toLowerCase()));
  const completedInterventions = interventions.items.filter((item) => item.status === 'terminee');
  const interventionsInProgress = interventions.items.filter((item) => item.status === 'en_cours');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.technician')}</h2>
        <p className="mt-1 text-sm text-gray-500">{t('dashboard.technicianSubtitle')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboard.assignedTasks')} value={pannes.items.length} sub={t('dashboard.pannesAndFieldTasks')} icon={ClipboardCheck} color="blue" />
        <StatCard label={t('dashboard.activePannes')} value={open.length} sub={t('dashboard.needsAction')} icon={ClipboardCheck} color="red" />
        <StatCard label={t('dashboard.interventionsInProgress')} value={interventionsInProgress.length} sub={t('dashboard.activeReports')} icon={ClipboardCheck} color="amber" />
        <StatCard label={t('dashboard.completedInterventions')} value={completedInterventions.length} sub={t('dashboard.yourTechnicalReports')} icon={ClipboardCheck} color="green" />
      </div>
      <RecentPannes pannes={pannes.items} title={t('dashboard.myAssignedPannes')} />
    </div>
  );
}
