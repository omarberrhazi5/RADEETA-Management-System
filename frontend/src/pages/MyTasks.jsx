import { CalendarClock, CheckCircle2, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import { ErrorState, LoadingState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { translateAnomaly, translateStatus } from '../utils/i18nLabels';

function normalizeStatus(status) {
  if (status === 'terminee') return 'completed';
  if (status === 'annulee' || status === 'echouee') return 'cancelled';
  return 'active';
}

function clientName(client) {
  return `${client?.prenom ?? ''} ${client?.nom ?? ''}`.trim() || client?.police || '-';
}

function taskFromIntervention(intervention, t) {
  const panne = intervention.panne;
  const meter = intervention.meter ?? panne?.compteur;
  const urgent = ['urgent', 'high'].includes(intervention.priority);

  return {
    id: intervention.id,
    type: t('tasks.typePanne'),
    title: translateAnomaly(t, panne?.anomalie) || intervention.work_type || '-',
    subtitle: meter?.cadran ?? t('tables.meter'),
    client: clientName(intervention.client ?? meter?.client),
    sector: meter?.secteur?.nom_secteur ?? panne?.compteur?.secteur?.nom_secteur ?? '-',
    due: intervention.started_at ?? intervention.intervention_at,
    priority: urgent ? 'high' : 'normal',
    status: normalizeStatus(intervention.status),
    rawStatus: intervention.status,
    technicianId: intervention.technician_id,
    icon: Wrench,
  };
}

function TaskRow({ task, action }) {
  const { t } = useTranslation();
  const Icon = task.icon;

  return (
    <div className="grid gap-3 border-b border-slate-100 p-4 transition duration-300 last:border-0 hover:bg-green-50/30 md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--srm-green-soft)] text-[var(--srm-green)]">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-bold tracking-tight text-slate-800">{task.title}</h2>
          <Badge label={task.type} color="blue" />
          <Badge label={t(`statuses.${task.priority}`)} color={task.priority === 'high' ? 'red' : 'amber'} />
          <Badge label={translateStatus(t, task.rawStatus ?? task.status)} color={task.status === 'completed' ? 'green' : 'amber'} />
        </div>
        <p className="mt-1 text-sm font-medium text-slate-600">{task.subtitle}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{task.client} - {task.sector}</p>
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          {task.status === 'completed' ? <CheckCircle2 size={16} /> : <CalendarClock size={16} />}
          {task.due || '-'}
        </div>
        {action}
      </div>
    </div>
  );
}

export default function MyTasks() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const interventions = useResource(endpoints.interventions, { limit: 500, sort: 'recent' });
  const [assigningId, setAssigningId] = useState(null);
  const [assignError, setAssignError] = useState('');
  const targetPanneId = location.state?.targetPanneId ?? null;

  const tasks = useMemo(() => interventions.items
    .filter((intervention) => !targetPanneId || String(intervention.panne_id ?? intervention.id_panne) === String(targetPanneId))
    .map((intervention) => taskFromIntervention(intervention, t))
    .sort((a, b) => String(b.due ?? '').localeCompare(String(a.due ?? ''))), [interventions.items, t, targetPanneId]);

  const activeTasks = tasks.filter((task) => task.status === 'active' && String(task.technicianId ?? '') === String(user?.id ?? ''));
  const poolTasks = tasks.filter((task) => task.status === 'active' && task.technicianId === null);
  const personalTasks = activeTasks;

  async function assignSelf(taskId) {
    try {
      setAssigningId(taskId);
      setAssignError('');
      await api.patch(`/interventions/${taskId}/assign-self`);
      await interventions.refresh();
    } catch (error) {
      setAssignError(error.response?.data?.message ?? 'Impossible de prendre en charge ce ticket.');
      await interventions.refresh();
    } finally {
      setAssigningId(null);
    }
  }

  if (interventions.loading) {
    return <LoadingState label={t('common.loadingTasks')} />;
  }

  return (
    <div className="space-y-5">
      {interventions.error && <ErrorState message={interventions.error} />}
      {assignError && <ErrorState message={assignError} />}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{t('tasks.title')}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">{t('tasks.subtitle')}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)] transition duration-300 hover:scale-[1.02]">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('tasks.activeTasks')}</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{activeTasks.length}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)] transition duration-300 hover:scale-[1.02]">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('tasks.highPriority')}</div>
          <div className="mt-1 text-2xl font-bold text-[var(--srm-red)]">{tasks.filter((task) => task.priority === 'high').length}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0_/_0.04)] transition duration-300 hover:scale-[1.02]">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Pool</div>
          <div className="mt-1 text-2xl font-bold text-[var(--srm-green)]">{poolTasks.length}</div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{t('tasks.activeTasks')}</h2>
        </div>
        {personalTasks.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm font-medium text-slate-500">{t('tasks.none')}</div>
        ) : personalTasks.map((task) => <TaskRow key={task.id} task={task} />)}
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Tickets Disponibles (Pool)</h2>
        </div>
        {poolTasks.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm font-medium text-slate-500">Aucun ticket disponible.</div>
        ) : poolTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            action={(
              <Button variant="primary" onClick={() => assignSelf(task.id)} loading={assigningId === task.id}>
                Prendre en charge
              </Button>
            )}
          />
        ))}
      </section>
    </div>
  );
}
