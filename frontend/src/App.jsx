import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './routes/RoleRedirect';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import AccessDenied from './pages/AccessDenied';
import AdminDashboard from './dashboards/AdminDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import OperatorDashboard from './dashboards/OperatorDashboard';
import ViewerDashboard from './dashboards/ViewerDashboard';
import Clients from './pages/Clients';
import Compteurs from './pages/Compteurs';
import Secteurs from './pages/Secteurs';
import Pannes from './pages/Pannes';
import Reparations from './pages/Reparations';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Releves from './pages/Releves';
import Factures from './pages/Factures';
import Paiements from './pages/Paiements';
import TariffSettings from './pages/TariffSettings';
import MyTasks from './pages/MyTasks';
import { ROLES } from './utils/rbac';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<RoleRedirect />} />
              <Route path="dashboard" element={<RoleRedirect />} />

              <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/users" element={<Users />} />
                <Route path="admin/clients" element={<Clients />} />
                <Route path="admin/compteurs" element={<Compteurs />} />
                <Route path="admin/secteurs" element={<Secteurs />} />
                <Route path="admin/pannes" element={<Pannes />} />
                <Route path="admin/reparations" element={<Reparations />} />
                <Route path="admin/releves" element={<Releves />} />
                <Route path="admin/factures" element={<Factures />} />
                <Route path="admin/paiements" element={<Paiements />} />
                <Route path="admin/tariffs" element={<TariffSettings />} />
                <Route path="admin/reports" element={<Reports />} />
              </Route>

              <Route element={<ProtectedRoute roles={[ROLES.MANAGER]} />}>
                <Route path="manager/dashboard" element={<ManagerDashboard />} />
                <Route path="manager/pannes" element={<Pannes />} />
                <Route path="manager/reparations" element={<Reparations />} />
                <Route path="manager/releves" element={<Releves />} />
                <Route path="manager/factures" element={<Factures />} />
                <Route path="manager/paiements" element={<Paiements />} />
                <Route path="manager/tariffs" element={<TariffSettings />} />
                <Route path="manager/reports" element={<Reports />} />
              </Route>

              <Route element={<ProtectedRoute roles={[ROLES.OPERATOR]} />}>
                <Route path="operator/dashboard" element={<OperatorDashboard />} />
                <Route path="operator/tasks" element={<MyTasks />} />
                <Route path="operator/pannes" element={<Pannes />} />
                <Route path="operator/reparations" element={<Reparations />} />
                <Route path="operator/releves" element={<Releves />} />
              </Route>

              <Route element={<ProtectedRoute roles={[ROLES.VIEWER]} />}>
                <Route path="viewer/dashboard" element={<ViewerDashboard />} />
                <Route path="viewer/clients" element={<Clients />} />
                <Route path="viewer/compteurs" element={<Compteurs />} />
                <Route path="viewer/secteurs" element={<Secteurs />} />
                <Route path="viewer/pannes" element={<Pannes />} />
                <Route path="viewer/reparations" element={<Reparations />} />
                <Route path="viewer/releves" element={<Releves />} />
                <Route path="viewer/factures" element={<Factures />} />
                <Route path="viewer/paiements" element={<Paiements />} />
                <Route path="viewer/reports" element={<Reports />} />
              </Route>

              <Route path="*" element={<Navigate to="/access-denied" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
