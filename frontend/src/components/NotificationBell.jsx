import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCheck,
  ClipboardCheck,
  Inbox,
  Loader2,
  UserPlus,
  Wrench,
} from 'lucide-react';
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

const typeStyles = {
  anomaly_created: {
    icon: AlertTriangle,
    avatar: 'bg-red-50 text-[var(--srm-red)] border-red-100',
  },
  panne_assigned: {
    icon: AlertTriangle,
    avatar: 'bg-red-50 text-[var(--srm-red)] border-red-100',
  },
  intervention_assigned: {
    icon: ClipboardCheck,
    avatar: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  repair_completed: {
    icon: Wrench,
    avatar: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  status_changed: {
    icon: Activity,
    avatar: 'bg-emerald-50 text-[var(--srm-green)] border-green-100',
  },
  user_created: {
    icon: UserPlus,
    avatar: 'bg-violet-50 text-violet-700 border-violet-100',
  },
};

function typeMeta(type) {
  return typeStyles[String(type ?? '')] ?? {
    icon: Bell,
    avatar: 'bg-slate-50 text-slate-600 border-slate-100',
  };
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
      const response = ids.length > 0
        ? await endpoints.markNotificationRead(ids[0])
        : await endpoints.markAllNotificationsRead();
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
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/85 text-slate-600 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[var(--srm-green)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
        aria-label={t('notifications.title')}
      >
        <Bell size={19} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[var(--srm-red)] px-1.5 text-center text-[10px] font-bold leading-5 text-white shadow-[0_6px_16px_rgba(220,38,38,0.35)] ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[3.25rem] z-50 w-[calc(100vw-2rem)] max-w-[26rem] animate-[notificationEnter_180ms_ease-out] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">{t('notifications.title')}</h3>
              <p className="text-xs font-medium text-slate-500">{t('common.unread', { count: unreadCount })}</p>
            </div>
            <button
              type="button"
              onClick={() => markAsRead()}
              disabled={marking || unreadCount === 0}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[var(--srm-green)] transition duration-300 hover:bg-[var(--srm-green-soft)] disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              {marking ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : <CheckCheck size={14} strokeWidth={1.5} />}
              {t('buttons.markAllRead')}
            </button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-medium text-slate-500">
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin text-[var(--srm-green)]" />
                {t('common.loadingNotifications')}
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm font-medium text-[var(--srm-red)]">{error}</div>
            ) : items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
                  <Inbox size={24} strokeWidth={1.5} />
                </div>
                <p className="text-sm font-bold text-slate-800">{t('notifications.emptyTitle')}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{t('notifications.emptySubtitle')}</p>
              </div>
            ) : (
              items.slice(0, 10).map((item) => {
                const meta = typeMeta(item.type);
                const Icon = meta.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => !item.is_read && markAsRead([item.id])}
                    className={`group flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm ${item.is_read ? 'bg-white' : 'bg-[var(--srm-green-soft)]'}`}
                  >
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${meta.avatar}`}>
                      <Icon size={18} strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm tracking-tight text-slate-900 ${item.is_read ? 'font-semibold' : 'font-extrabold'}`}>{translateNotificationTitle(t, item)}</span>
                      <span className={`mt-0.5 line-clamp-2 block text-xs leading-5 ${item.is_read ? 'font-medium text-slate-600' : 'font-semibold text-slate-700'}`}>{translateNotificationMessage(t, item)}</span>
                      <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">{formatTime(item.created_at ?? item.timestamp, t, currentLocale(i18n))}</span>
                    </span>
                    {!item.is_read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--srm-green)] shadow-[0_0_0_4px_rgba(15,118,110,0.10)]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  ) : null;
}
