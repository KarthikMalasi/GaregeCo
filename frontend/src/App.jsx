import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyVehicles from './pages/owner/MyVehicles';
import ExploreGarages from './pages/owner/ExploreGarages';
import BookService from './pages/owner/BookService';
import MyBookings from './pages/owner/MyBookings';
import TrackService from './pages/owner/TrackService';

import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManageBookings from './pages/manager/ManageBookings';
import JobCards from './pages/manager/JobCards';
import Reports from './pages/manager/Reports';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageGarages from './pages/admin/ManageGarages';
import AllBookings from './pages/admin/AllBookings';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/owner" replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Vehicle Owner Routes */}
          <Route element={<RoleRoute allowedRoles={['owner']} />}>
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/owner/vehicles" element={<MyVehicles />} />
            <Route path="/owner/garages" element={<ExploreGarages />} />
            <Route path="/owner/book" element={<BookService />} />
            <Route path="/owner/bookings" element={<MyBookings />} />
            <Route path="/owner/track" element={<TrackService />} />
          </Route>

          {/* Garage Manager Routes */}
          <Route element={<RoleRoute allowedRoles={['manager']} />}>
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/manager/bookings" element={<ManageBookings />} />
            <Route path="/manager/job-cards" element={<JobCards />} />
            <Route path="/manager/reports" element={<Reports />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/garages" element={<ManageGarages />} />
            <Route path="/admin/bookings" element={<AllBookings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
