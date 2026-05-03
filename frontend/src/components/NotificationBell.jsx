import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { endpoints, unwrapCollection } from '../api/resources';

function formatTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;

  return date.toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeColor(type) {
  if (String(type).includes('paiement')) return 'bg-green-500';
  if (String(type).includes('facture')) return 'bg-blue-500';
  if (String(type).includes('repair')) return 'bg-amber-500';
  if (String(type).includes('panne')) return 'bg-red-500';
  return 'bg-gray-400';
}

export default function NotificationBell() {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await endpoints.notifications({ limit: 10 });
      const normalized = unwrapCollection(response.data);
      setItems(normalized.items);
      setUnreadCount(response.data?.meta?.unread_count ?? normalized.items.filter((item) => !item.is_read).length);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to load notifications.');
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, [load]);

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
      setError(err.response?.data?.message ?? 'Unable to update notifications.');
    } finally {
      setMarking(false);
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          if (!open) load();
        }}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 text-center text-[10px] font-bold leading-5 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={() => markAsRead()}
              disabled={marking || unreadCount === 0}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              {marking ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              Mark read
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm text-red-600">{error}</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-gray-800">No notifications</p>
                <p className="mt-1 text-xs text-gray-500">New operational updates will appear here.</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.is_read && markAsRead([item.id])}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${item.is_read ? 'bg-white' : 'bg-blue-50/50'}`}
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${typeColor(item.type)}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">{item.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-gray-600">{item.message}</span>
                    <span className="mt-1 block text-[11px] text-gray-400">{formatTime(item.created_at ?? item.timestamp)}</span>
                  </span>
                  {!item.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
