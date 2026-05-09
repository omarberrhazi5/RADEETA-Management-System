import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          type="button"
          aria-label={t('common.closeNavigation')}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-gray-900/35 md:hidden"
        />
      )}

      <div className="min-h-screen min-w-0 overflow-x-hidden md:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="w-full min-w-0 p-3 sm:p-5 lg:p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
