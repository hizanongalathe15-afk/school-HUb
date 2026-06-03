// client/src/components/roles/teacher/TeacherDashboardHome.tsx
import React from 'react';
import { BarChart3, Users, CheckSquare, Clock, AlertCircle, TrendingUp } from 'lucide-react';

/**
 * TeacherDashboardHome
 * Main dashboard view showing quick stats and recent activities
 */
export default function TeacherDashboardHome() {
  const stats = [
    {
      label: 'My Classes',
      value: '4',
      icon: <Users size={24} className="text-blue-500" />,
      color: 'bg-blue-50'
    },
    {
      label: 'Total Students',
      value: '124',
      icon: <Users size={24} className="text-green-500" />,
      color: 'bg-green-50'
    },
    {
      label: 'Pending Homework',
      value: '8',
      icon: <Clock size={24} className="text-orange-500" />,
      color: 'bg-orange-50'
    },
    {
      label: 'Attendance Today',
      value: '95%',
      icon: <CheckSquare size={24} className="text-purple-500" />,
      color: 'bg-purple-50'
    },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, Teacher!</h1>
        <p className="text-slate-600 mt-1">Here's your teaching dashboard overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              {stat.icon}
            </div>
            <p className="text-sm text-slate-600">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Recent Activities
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-start p-3 bg-slate-50 rounded">
              <div>
                <p className="font-medium text-slate-900">Homework Assigned</p>
                <p className="text-sm text-slate-600">Form 3A - Mathematics</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Today</span>
            </div>
            <div className="flex justify-between items-start p-3 bg-slate-50 rounded">
              <div>
                <p className="font-medium text-slate-900">Grades Submitted</p>
                <p className="text-sm text-slate-600">CAT 1 Scores - Form 2B</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Yesterday</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-orange-500" />
            Alerts
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="font-medium text-orange-900">5 Students at Risk</p>
              <p className="text-sm text-orange-700">Consistently low performance in recent assessments</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="font-medium text-blue-900">Pending Submissions</p>
              <p className="text-sm text-blue-700">3 students haven't submitted homework</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
