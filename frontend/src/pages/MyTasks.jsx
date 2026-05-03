import { CalendarClock, CheckCircle2, Gauge, Wrench } from 'lucide-react';
import { endpoints } from '../api/resources';
import { ErrorState, LoadingState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import useResource from '../hooks/useResource';

function taskFromPanne(panne) {
  const status = String(panne.status ?? panne.statut ?? 'open').toLowerCase();
  const urgent = ['fuite_avant_compteur', 'fuite_apres_compteur', 'branchement_illicite'].includes(panne.anomalie);

  return {
    id: `panne-${panne.id}`,
    type: 'Panne',
    title: `Panne #${panne.id_panne ?? panne.id}`,
    subtitle: `${panne.anomalie ?? 'Anomaly'} - ${panne.compteur?.cadran ?? 'meter'}`,
    client: panne.compteur?.client ? `${panne.compteur.client.prenom ?? ''} ${panne.compteur.client.nom ?? ''}`.trim() : '-',
    sector: panne.compteur?.secteur?.nom_secteur ?? '-',
    due: panne.date_panne,
    priority: urgent ? 'High' : 'Normal',
    status: ['resolved', 'repare', 'reparee', 'resolue'].includes(status) ? 'Completed' : 'Active',
    icon: Wrench,
  };
}

function taskFromReading(releve) {
  return {
    id: `releve-${releve.id}`,
    type: 'Reading',
    title: `Reading #${releve.id}`,
    subtitle: `${releve.compteur?.cadran ?? releve.compteur_id} - ${releve.consommation ?? 0} m3`,
    client: releve.compteur?.client ? `${releve.compteur.client.prenom ?? ''} ${releve.compteur.client.nom ?? ''}`.trim() : '-',
    sector: releve.compteur?.secteur?.nom_secteur ?? '-',
    due: releve.periode_fin,
    priority: 'Normal',
    status: releve.facture ? 'Billed' : 'Pending invoice',
    icon: Gauge,
  };
}

export default function MyTasks() {
  const pannes = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const releves = useResource(endpoints.releves, { limit: 500 });

  if (pannes.loading || releves.loading) {
    return <LoadingState label="Loading my tasks..." />;
  }

  const error = pannes.error || releves.error;
  const tasks = [
    ...pannes.items.map(taskFromPanne),
    ...releves.items.slice(0, 20).map(taskFromReading),
  ].sort((a, b) => String(b.due ?? '').localeCompare(String(a.due ?? '')));

  return (
    <div className="space-y-5">
      {error && <ErrorState message={error} />}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">My Tasks</h1>
        <p className="mt-1 text-sm text-gray-500">Assigned pannes, repair operations, and operational reading work linked to your account.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">Active tasks</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{tasks.filter((task) => task.status === 'Active').length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">High priority</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">{tasks.filter((task) => task.priority === 'High').length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">Completed</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">{tasks.filter((task) => task.status === 'Completed').length}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {tasks.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">No assigned operational tasks.</div>
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
                  <Badge label={task.priority} color={task.priority === 'High' ? 'red' : 'amber'} />
                  <Badge label={task.status} color={task.status === 'Completed' ? 'green' : 'amber'} />
                </div>
                <p className="mt-1 text-sm text-gray-600">{task.subtitle}</p>
                <p className="mt-1 text-xs text-gray-500">{task.client} - {task.sector}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {task.status === 'Completed' ? <CheckCircle2 size={16} /> : <CalendarClock size={16} />}
                {task.due || '-'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
