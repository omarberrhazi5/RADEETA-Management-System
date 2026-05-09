import { CalendarClock, CheckCircle2, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { endpoints } from '../api/resources';
import { ErrorState, LoadingState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import useResource from '../hooks/useResource';
import { translateAnomaly } from '../utils/i18nLabels';

function taskFromPanne(panne, t) {
  const status = String(panne.status ?? panne.statut ?? 'open').toLowerCase();
  const urgent = ['fuite_avant_compteur', 'fuite_apres_compteur', 'branchement_illicite'].includes(panne.anomalie);

  return {
    id: `panne-${panne.id}`,
    type: t('tasks.typePanne'),
    title: `${t('tables.panne')} #${panne.id_panne ?? panne.id}`,
    subtitle: `${translateAnomaly(t, panne.anomalie)} - ${panne.compteur?.cadran ?? t('tables.meter')}`,
    client: panne.compteur?.client ? `${panne.compteur.client.prenom ?? ''} ${panne.compteur.client.nom ?? ''}`.trim() : '-',
    sector: panne.compteur?.secteur?.nom_secteur ?? '-',
    due: panne.date_panne,
    priority: urgent ? 'high' : 'normal',
    status: ['resolved', 'repare', 'reparee', 'resolue'].includes(status) ? 'completed' : 'active',
    icon: Wrench,
  };
}

export default function MyTasks() {
  const { t } = useTranslation();
  const pannes = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });

  if (pannes.loading) {
    return <LoadingState label={t('common.loadingTasks')} />;
  }

  const error = pannes.error;
  const tasks = pannes.items.map((panne) => taskFromPanne(panne, t)).sort((a, b) => String(b.due ?? '').localeCompare(String(a.due ?? '')));

  return (
    <div className="space-y-5">
      {error && <ErrorState message={error} />}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{t('tasks.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('tasks.subtitle')}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">{t('tasks.activeTasks')}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{tasks.filter((task) => task.status === 'active').length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">{t('tasks.highPriority')}</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">{tasks.filter((task) => task.priority === 'high').length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">{t('tasks.completed')}</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">{tasks.filter((task) => task.status === 'completed').length}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {tasks.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">{t('tasks.none')}</div>
        ) : tasks.map((task) => {
          const Icon = task.icon;
          return (
            <div key={task.id} className="grid gap-3 border-b border-gray-100 p-4 last:border-0 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{task.title}</h2>
                  <Badge label={task.type} color="blue" />
                  <Badge label={t(`statuses.${task.priority}`)} color={task.priority === 'high' ? 'red' : 'amber'} />
                  <Badge label={t(`statuses.${task.status}`)} color={task.status === 'completed' ? 'green' : 'amber'} />
                </div>
                <p className="mt-1 text-sm text-gray-600">{task.subtitle}</p>
                <p className="mt-1 text-xs text-gray-500">{task.client} - {task.sector}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {task.status === 'completed' ? <CheckCircle2 size={16} /> : <CalendarClock size={16} />}
                {task.due || '-'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
