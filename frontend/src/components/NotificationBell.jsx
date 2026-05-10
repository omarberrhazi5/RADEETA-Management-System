import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { endpoints, unwrapCollection } from '../api/resources';
import { currentLocale, translateNotificationMessage, translateNotificationTitle } from '../utils/i18nLabels';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/rbac';

function formatTime(value, t, locale) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return t('common.justNow');
  if (seconds < 3600) return t('common.minutesAgo', { count: Math.floor(seconds / 60) });
  if (seconds < 86400) return t('common.hoursAgo', { count: Math.floor(seconds / 3600) });

  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeColor(type) {
  if (String(type).includes('repair')) return 'bg-amber-500';
  if (String(type).includes('panne')) return 'bg-[var(--srm-red)]';
  return 'bg-slate-400';
}

export default function NotificationBell() {
  const { i18n, t } = useTranslation();
  const { role } = useAuth();
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const canUseNotifications = hasPermission(role, 'notifications');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await endpoints.notifications({ limit: 10 });
      const normalized = unwrapCollection(response.data);
      setItems(normalized.items);
      setUnreadCount(response.data?.meta?.unread_count ?? normalized.items.filter((item) => !item.is_read).length);
    } catch (err) {
      setError(err.response?.data?.message ?? t('notifications.loadFailed'));
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!canUseNotifications) return undefined;

    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, [canUseNotifications, load]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  async function markAsRead(ids = []) {
    try {
      setMarking(true);
      const response = await endpoints.markNotificationsRead(ids.length > 0 ? { ids } : {});
      setUnreadCount(response.data?.unread_count ?? 0);
      setItems((current) => current.map((item) => ids.length === 0 || ids.includes(item.id) ? { ...item, is_read: true } : item));
    } catch (err) {
      setError(err.response?.data?.message ?? t('notifications.updateFailed'));
    } finally {
      setMarking(false);
    }
  }

  return canUseNotifications ? (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          if (!open) load();
        }}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition duration-300 hover:bg-slate-100"
        aria-label={t('notifications.title')}
      >
        <Bell size={19} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--srm-red)] px-1.5 text-center text-[10px] font-bold leading-5 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_8px_30px_rgb(0_0_0_/_0.10)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-800">{t('notifications.title')}</h3>
              <p className="text-xs font-medium text-slate-500">{t('common.unread', { count: unreadCount })}</p>
            </div>
            <button
              type="button"
              onClick={() => markAsRead()}
              disabled={marking || unreadCount === 0}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-[var(--srm-green)] transition duration-300 hover:bg-[var(--srm-green-soft)] disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              {marking ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : <CheckCheck size={14} strokeWidth={1.5} />}
              {t('buttons.markRead')}
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-medium text-slate-500">
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin text-[var(--srm-green)]" />
                {t('common.loadingNotifications')}
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm font-medium text-[var(--srm-red)]">{error}</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-bold text-slate-800">{t('notifications.emptyTitle')}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{t('notifications.emptySubtitle')}</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.is_read && markAsRead([item.id])}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition duration-300 hover:bg-green-50/30 ${item.is_read ? 'bg-white/60' : 'bg-green-50/40'}`}
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${typeColor(item.type)}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold tracking-tight text-slate-800">{translateNotificationTitle(t, item)}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs font-medium text-slate-600">{translateNotificationMessage(t, item)}</span>
                    <span className="mt-1 block text-[11px] font-medium text-slate-400">{formatTime(item.created_at ?? item.timestamp, t, currentLocale(i18n))}</span>
                  </span>
                  {!item.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-[var(--srm-green)]" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  ) : null;
}
