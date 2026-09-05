import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { cloneElement, type ReactElement } from 'react';
import type { Role, User } from './types';
import { getCurrentUser } from './lib/auth';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RetailerDashboard } from './pages/RetailerDashboard';
import { DispatcherDashboard } from './pages/DispatcherDashboard';
import { RiderApp } from './pages/RiderApp';

const LANDING: Record<Role, string> = {
  retailer: '/retailer',
  dispatcher: '/dispatcher',
  rider: '/rider',
};

function ProtectedRoute({
  role,
  children,
}: {
  role: Role;
  children: ReactElement<{ user?: User }>;
}) {
  // Read fresh on every match — this component is (re)rendered whenever
  // Routes matches its path, so this is never stale.
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    return <Navigate to={LANDING[user.role]} replace />;
  }

  // Inject the just-verified, fresh user into the child — do NOT rely on
  // a `user` prop that was baked into the element elsewhere.
  return cloneElement(children, { user });
}

// A tiny component (not an inline value) so getCurrentUser() runs at the
// moment this route is actually matched, not once at App's initial render.
function RootRedirect() {
  const user = getCurrentUser();
  return <Navigate to={user ? LANDING[user.role] : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/retailer"
          element={
            <ProtectedRoute role="retailer">
              <RetailerDashboard user={undefined as unknown as User} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dispatcher"
          element={
            <ProtectedRoute role="dispatcher">
              <DispatcherDashboard user={undefined as unknown as User} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider"
          element={
            <ProtectedRoute role="rider">
              <RiderApp user={undefined as unknown as User} />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}