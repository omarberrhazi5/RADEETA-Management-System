import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, CheckCheck, Menu, Search } from 'lucide-react';
import api from '../api/axios';

const pageTitles = {
  '/dashboard': 'Tableau de bord',
  '/clients': 'Gestion des clients',
  '/secteurs': 'Gestion des secteurs',
  '/compteurs': 'Gestion des compteurs',
  '/pannes': 'Pannes',
  '/reparations': 'Réparations',
};

function normalizeNotifications(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatNotificationTime(value) {
  if (!value) return '';

  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return '';

  const diffSeconds = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 1000));

  if (diffSeconds < 60) return "À l'instant";
  if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)} min`;
  if (diffSeconds < 86400) return `Il y a ${Math.floor(diffSeconds / 3600)} h`;

  return createdAt.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'RADEE-TA';
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(normalizeNotifications(response.data));
    } catch (error) {
      console.error('Could not load notifications', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  const handleMarkAllAsRead = async () => {
    if (isMarkingRead || unreadCount === 0) return;

    setIsMarkingRead(true);
    try {
      await api.put('/notifications/mark-as-read');
      setNotifications([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Could not mark notifications as read', error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 flex-shrink-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 md:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">
        {title}
      </h1>

      <div className="relative hidden sm:block">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Recherche..."
          className="pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-48"
        />
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Notifications"
          aria-expanded={isOpen}
        >
          <Bell size={18} className="text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] font-semibold leading-4 text-white text-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              </div>
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingRead || unreadCount === 0}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
              >
                <CheckCheck size={14} />
                Tout lire
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto py-1">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium text-gray-700">Aucune notification</p>
                  <p className="mt-1 text-xs text-gray-500">Les nouvelles alertes apparaitront ici.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                          {notification.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
