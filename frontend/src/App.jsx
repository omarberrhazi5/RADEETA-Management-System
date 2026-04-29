import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Secteurs from './pages/Secteurs';
import Compteurs from './pages/Compteurs';
import Pannes from './pages/Pannes';
import Reparations from './pages/Reparations';

const ROLE_HOME = {
  technician: '/pannes',
  admin: '/dashboard',
  manager: '/dashboard',
};

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('user_role');

  if (!token || !role) {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('auth_user');
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleRoute({ children, allowedRoles }) {
  const role = localStorage.getItem('user_role');

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] ?? '/login'} replace />;
  }

  return children;
}

function HomeRedirect() {
  const role = localStorage.getItem('user_role');
  return <Navigate to={ROLE_HOME[role] ?? '/dashboard'} replace />;
}

function FallbackRedirect() {
  const role = localStorage.getItem('user_role');
  return <Navigate to={role === 'technician' ? '/pannes' : '/dashboard'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<HomeRedirect />} />
          <Route
            path="dashboard"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <Dashboard />
              </RoleRoute>
            }
          />
          <Route
            path="clients"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <Clients />
              </RoleRoute>
            }
          />
          <Route
            path="secteurs"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <Secteurs />
              </RoleRoute>
            }
          />
          <Route
            path="compteurs"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <Compteurs />
              </RoleRoute>
            }
          />
          <Route path="pannes" element={<Pannes />} />
          <Route path="reparations" element={<Reparations />} />
        </Route>

        <Route path="*" element={<FallbackRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
