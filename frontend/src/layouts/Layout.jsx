import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contentScrolled, setContentScrolled] = useState(false);

  return (
    <div className="srm-app h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          type="button"
          aria-label={t('common.closeNavigation')}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-sm md:hidden"
        />
      )}

      <div className="flex h-full min-w-0 flex-col overflow-hidden md:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} scrolled={contentScrolled} />
        <main
          onScroll={(event) => setContentScrolled(event.currentTarget.scrollTop > 0)}
          className="w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
