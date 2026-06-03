// client/src/components/roles/teacher/TeacherDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import TeacherSidebar from './TeacherSidebar';
import TeacherDashboardHome from './TeacherDashboardHome';
import { Spinner } from '../../ui/Spinner';
import './teacher.css';

/**
 * TeacherDashboard
 * Main layout component for teacher portal with sidebar and nested routing
 */
export default function TeacherDashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Redirect to dashboard home if at root teacher path
    if (location.pathname === '/teacher' || 
        location.pathname === '/dashboard/teacher' ||
        location.pathname === '/dashboard/teacher/') {
      navigate('/teacher/dashboard');
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
    <div className="teacher-portal-layout flex min-h-screen bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          className="teacher-portal-overlay"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <TeacherSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="teacher-portal-main flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="teacher-portal-topbar">
          <button
            type="button"
            className="teacher-portal-menu-btn"
            aria-label="Open navigation menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="teacher-portal-topbar__eyebrow">Teacher Portal</p>
            <h1 className="teacher-portal-topbar__title">
              {isMainDashboard ? 'Dashboard' : 'Workspace'}
            </h1>
          </div>
        </header>

        <main className="teacher-portal-content flex-1 overflow-auto">
          {isMainDashboard ? <TeacherDashboardHome /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
