/**
 * components/layout/ProtectedRoute.jsx
 * Redirects unauthenticated users to /login.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Loader from '../ui/Loader';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <Loader fullPage text="Loading Revision OS..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedRoute;
