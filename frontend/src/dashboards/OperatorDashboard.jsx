import { Bell, ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { endpoints } from '../api/resources';
import PanneMap from '../components/PanneMap';
import { ErrorState, LoadingState } from '../components/PageState';
import StatCard from '../components/ui/StatCard';
import useResource from '../hooks/useResource';
import { translateNotificationMessage, translateNotificationTitle } from '../utils/i18nLabels';
import { RecentPannes } from './DashboardShared';

export default function OperatorDashboard() {
  const { t } = useTranslation();
  const pannes = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const interventions = useResource(endpoints.interventions, { limit: 500 });
  const notifications = useResource(endpoints.notifications, { limit: 5 });

  if (pannes.loading || interventions.loading || notifications.loading) return <LoadingState label={t('common.loadingTasks')} />;
  if (pannes.error || interventions.error || notifications.error) return <ErrorState message={pannes.error || interventions.error || notifications.error} />;

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
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('dashboard.assignedPannesMap')}</h3>
        <PanneMap pannes={pannes.items} height="520px" />
      </section>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <RecentPannes pannes={pannes.items} title={t('dashboard.myAssignedPannes')} />
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell size={16} className="text-blue-700" />
            <h3 className="text-sm font-semibold text-gray-900">{t('dashboard.recentNotifications')}</h3>
          </div>
          <div className="space-y-3">
            {notifications.items.length === 0 ? (
              <p className="text-sm text-gray-500">{t('dashboard.noOperationalNotifications')}</p>
            ) : notifications.items.map((item) => (
              <div key={item.id} className="rounded-md border border-gray-100 p-3">
                <div className="text-sm font-semibold text-gray-900">{translateNotificationTitle(t, item)}</div>
                <div className="mt-1 text-xs text-gray-600">{translateNotificationMessage(t, item)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
