import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './routes/RoleRedirect';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import AccessDenied from './pages/AccessDenied';
import AdminDashboard from './dashboards/AdminDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import ViewerDashboard from './dashboards/ViewerDashboard';
import Clients from './pages/Clients';
import Compteurs from './pages/Compteurs';
import Secteurs from './pages/Secteurs';
import Pannes from './pages/Pannes';
import Interventions from './pages/Interventions';
import Reparations from './pages/Reparations';
import Administration from './pages/Administration';
import Reports from './pages/Reports';
import MyTasks from './pages/MyTasks.jsx';
import Profile from './pages/Profile.jsx';
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
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<Navigate to="/access-denied" replace />} />

              <Route element={<ProtectedRoute roles={[ROLES.DIRECTEUR]} />}>
                <Route path="administration" element={<Administration />} />
                <Route path="users" element={<Navigate to="/administration" replace />} />
                <Route path="clients" element={<Clients />} />
                <Route path="compteurs" element={<Compteurs />} />
                <Route path="secteurs" element={<Secteurs />} />
                <Route path="anomalies" element={<Pannes />} />
                <Route path="pannes" element={<Pannes />} />
                <Route path="repairs" element={<Reparations />} />
                <Route path="reparations" element={<Reparations />} />
                <Route path="interventions" element={<Interventions />} />
                <Route path="reports" element={<Reports />} />
                <Route path="admin/administration" element={<Administration />} />
                <Route path="admin/users" element={<Navigate to="/admin/administration" replace />} />
              </Route>

              <Route element={<ProtectedRoute roles={[ROLES.RESPONSABLE]} />}>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/clients" element={<Clients />} />
                <Route path="admin/compteurs" element={<Compteurs />} />
                <Route path="admin/secteurs" element={<Secteurs />} />
                <Route path="admin/pannes" element={<Pannes />} />
                <Route path="admin/repairs" element={<Reparations />} />
                <Route path="admin/interventions" element={<Interventions />} />
                <Route path="admin/reports" element={<Reports />} />
              </Route>

              <Route element={<ProtectedRoute roles={[ROLES.MANAGER]} />}>
                <Route path="manager/dashboard" element={<ManagerDashboard />} />
                <Route path="manager/clients" element={<Clients />} />
                <Route path="manager/compteurs" element={<Compteurs />} />
                <Route path="manager/secteurs" element={<Secteurs />} />
                <Route path="manager/pannes" element={<Pannes />} />
                <Route path="manager/repairs" element={<Reparations />} />
                <Route path="manager/interventions" element={<Interventions />} />
                <Route element={<ProtectedRoute permission="reports" />}>
                  <Route path="manager/reports" element={<Reports />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute roles={[ROLES.TECHNICIAN]} />}>
                <Route path="technician/dashboard" element={<Navigate to="/technician/tasks" replace />} />
                <Route path="technician/tasks" element={<MyTasks />} />
                <Route path="technician/pannes" element={<Navigate to="/access-denied" replace />} />
                <Route path="technician/repairs" element={<Navigate to="/access-denied" replace />} />
                <Route path="technician/interventions" element={<Interventions />} />
                <Route path="operator/dashboard" element={<Navigate to="/technician/tasks" replace />} />
                <Route path="operator/tasks" element={<Navigate to="/technician/tasks" replace />} />
                <Route path="operator/pannes" element={<Navigate to="/access-denied" replace />} />
                <Route path="operator/repairs" element={<Navigate to="/access-denied" replace />} />
              </Route>

              <Route element={<ProtectedRoute roles={[ROLES.VIEWER]} />}>
                <Route path="viewer/dashboard" element={<ViewerDashboard />} />
                <Route path="viewer/clients" element={<Clients />} />
                <Route path="viewer/compteurs" element={<Compteurs />} />
                <Route path="viewer/secteurs" element={<Secteurs />} />
                <Route path="viewer/pannes" element={<Pannes />} />
                <Route path="viewer/interventions" element={<Interventions />} />
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
