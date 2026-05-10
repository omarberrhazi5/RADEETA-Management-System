import { CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { endpoints } from '../api/resources';
import { ErrorState, LoadingState } from '../components/PageState';
import Button from '../components/ui/Button';
import useResource from '../hooks/useResource';
import { currentLocale, translateNotificationMessage, translateNotificationTitle } from '../utils/i18nLabels';

function formatDate(value, locale) {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Notifications() {
  const { i18n, t } = useTranslation();
  const { error, items, loading, meta, refresh } = useResource(endpoints.notifications, { limit: 50 });

  async function markAllRead() {
    await endpoints.markNotificationsRead();
    refresh();
  }

  if (loading) {
    return <LoadingState label={t('common.loadingNotifications')} />;
  }

  return (
    <div className="space-y-5">
      {error && <ErrorState message={error} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">{t('notifications.title')}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">{t('notifications.unreadOperational', { count: meta?.unread_count ?? 0 })}</p>
        </div>
        <Button variant="secondary" onClick={markAllRead} disabled={(meta?.unread_count ?? 0) === 0}>
          <CheckCheck size={15} />
          {t('buttons.markAllRead')}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]">
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm font-medium text-slate-500">{t('notifications.none')}</div>
        ) : items.map((item) => (
          <div key={item.id} className={`border-b border-slate-100 p-4 transition duration-300 last:border-0 hover:bg-green-50/30 ${item.is_read ? 'bg-white' : 'bg-green-50/40'}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-800">{translateNotificationTitle(t, item)}</h2>
                <p className="mt-1 text-sm font-medium text-slate-600">{translateNotificationMessage(t, item)}</p>
                <p className="mt-2 text-xs font-medium text-slate-400">{t(`notificationTypes.${item.type}.label`, { defaultValue: t('notifications.title') })}</p>
              </div>
              <div className="text-xs font-medium text-slate-500">{formatDate(item.created_at ?? item.timestamp, currentLocale(i18n))}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
