import { useEffect, useState } from 'react';
import { ListChecks, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { teacherService } from '../../../services/teacherService';

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await teacherService.dashboard.getPendingTasks();
      setTasks(response.data || []);
    } catch (error) {
      console.error('Failed to load teacher tasks', error);
      toast.error('Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  return (
    <div className="teacher-page min-h-screen p-6 bg-slate-50">
      <div className="page-header mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ListChecks size={24} />
            Teacher Tasks
          </div>
          <p className="mt-2 text-sm text-slate-600">Review and manage your pending tasks from the teacher dashboard.</p>
        </div>
        <button className="btn btn-secondary inline-flex items-center gap-2" onClick={loadTasks}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="loader mx-auto mb-4" />
            <p className="text-slate-700">Loading teacher tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-700">No pending tasks found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id ?? task.taskId ?? JSON.stringify(task)} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{task.title || task.name || 'Untitled task'}</p>
                    <p className="text-sm text-slate-600">{task.description || task.summary || 'No description available.'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    {task.status && <span className="badge badge-muted">{task.status}</span>}
                    {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
