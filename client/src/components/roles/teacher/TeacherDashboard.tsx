// client/src/components/roles/teacher/TeacherDashboard.tsx
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import TeacherSidebar from './TeacherSidebar';
import TeacherDashboardHome from './TeacherDashboardHome';
import { Spinner } from '../../ui/Spinner';

/**
 * TeacherDashboard
 * Main layout component for teacher portal with sidebar and nested routing
 */
export default function TeacherDashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to dashboard home if at root teacher path
    if (location.pathname === '/teacher' || 
        location.pathname === '/dashboard/teacher' ||
        location.pathname === '/dashboard/teacher/') {
      navigate('/teacher/dashboard');
    }
  }, [location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Spinner />
      </div>
    );
  }

  if (!user || user.role !== 'TEACHER') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Unauthorized</h1>
          <p className="text-slate-600">You do not have access to the teacher portal.</p>
        </div>
      </div>
    );
  }

  // Check if we're on the main dashboard path
  const isMainDashboard = location.pathname === '/teacher/dashboard' || 
                          location.pathname === '/teacher' ||
                          location.pathname === '/teacher/';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <TeacherSidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-72 overflow-auto">
        {isMainDashboard ? <TeacherDashboardHome /> : <Outlet />}
      </main>
    </div>
  );
}
