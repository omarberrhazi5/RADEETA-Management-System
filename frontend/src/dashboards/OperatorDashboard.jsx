import { Bell, ClipboardCheck, Gauge, Wrench } from 'lucide-react';
import { endpoints } from '../api/resources';
import PanneMap from '../components/PanneMap';
import { ErrorState, LoadingState } from '../components/PageState';
import StatCard from '../components/ui/StatCard';
import useResource from '../hooks/useResource';
import { RecentPannes } from './DashboardShared';

export default function OperatorDashboard() {
  const pannes = useResource(endpoints.pannes, { limit: 500, sort: 'recent' });
  const repairs = useResource(endpoints.reparations, { limit: 500 });
  const readings = useResource(endpoints.releves, { limit: 500 });
  const notifications = useResource(endpoints.notifications, { limit: 5 });

  if (pannes.loading || repairs.loading || readings.loading || notifications.loading) return <LoadingState label="Loading assigned tasks..." />;
  if (pannes.error || repairs.error || readings.error || notifications.error) return <ErrorState message={pannes.error || repairs.error || readings.error || notifications.error} />;

  const open = pannes.items.filter((item) => ['ouvert', 'ouverte', 'open'].includes(String(item.status ?? item.statut).toLowerCase()));
  const today = new Date().toISOString().slice(0, 10);
  const todaysReadings = readings.items.filter((item) => String(item.created_at ?? item.periode_fin ?? '').startsWith(today));
  const completedRepairs = repairs.items.filter((item) => item.date_reparation);
  const repairsInProgress = open.filter((panne) => !panne.reparations || panne.reparations.length === 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Operator Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">Daily operational work assigned to your account only.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Assigned Tasks" value={pannes.items.length} sub="pannes and field tasks" icon={ClipboardCheck} color="blue" />
        <StatCard label="Active Pannes" value={open.length} sub="needs action" icon={ClipboardCheck} color="red" />
        <StatCard label="Repairs In Progress" value={repairsInProgress.length} sub="not completed yet" icon={Wrench} color="amber" />
        <StatCard label="Completed Repairs" value={completedRepairs.length} sub="your repair history" icon={Wrench} color="green" />
        <StatCard label="Today's Readings" value={todaysReadings.length} sub="entered today" icon={Gauge} color="blue" />
      </div>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Assigned pannes map</h3>
        <PanneMap pannes={pannes.items} height="520px" />
      </section>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <RecentPannes pannes={pannes.items} title="My assigned pannes" />
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell size={16} className="text-blue-700" />
            <h3 className="text-sm font-semibold text-gray-900">Recent notifications</h3>
          </div>
          <div className="space-y-3">
            {notifications.items.length === 0 ? (
              <p className="text-sm text-gray-500">No operational notifications.</p>
            ) : notifications.items.map((item) => (
              <div key={item.id} className="rounded-md border border-gray-100 p-3">
                <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                <div className="mt-1 text-xs text-gray-600">{item.message}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
