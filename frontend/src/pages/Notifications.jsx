import { CheckCheck } from 'lucide-react';
import { endpoints } from '../api/resources';
import { ErrorState, LoadingState } from '../components/PageState';
import Button from '../components/ui/Button';
import useResource from '../hooks/useResource';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('fr-MA', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Notifications() {
  const { error, items, loading, meta, refresh } = useResource(endpoints.notifications, { limit: 50 });

  async function markAllRead() {
    await endpoints.markNotificationsRead();
    refresh();
  }

  if (loading) {
    return <LoadingState label="Loading notifications..." />;
  }

  return (
    <div className="space-y-5">
      {error && <ErrorState message={error} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">{meta?.unread_count ?? 0} unread operational notifications.</p>
        </div>
        <Button variant="secondary" onClick={markAllRead} disabled={(meta?.unread_count ?? 0) === 0}>
          <CheckCheck size={15} />
          Mark all read
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">No notifications.</div>
        ) : items.map((item) => (
          <div key={item.id} className={`border-b border-gray-100 p-4 last:border-0 ${item.is_read ? 'bg-white' : 'bg-blue-50/50'}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                <p className="mt-2 text-xs text-gray-400">{item.type}</p>
              </div>
              <div className="text-xs text-gray-500">{formatDate(item.created_at ?? item.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
