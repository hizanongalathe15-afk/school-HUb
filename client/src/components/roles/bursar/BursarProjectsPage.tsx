import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import bursarService from '../../../services/bursarService';
import type { Project, ProjectForm, ProjectFinance, TransactionForm } from '../../../types/bursar';

const BursarProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFinances, setProjectFinances] = useState<ProjectFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ProjectForm>({
    name: '',
    description: '',
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'planning',
    department: '',
  });
  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    amount: 0,
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'finance'>('create');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await bursarService.projects.getProjects();
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectFinances = async (projectId: string) => {
    try {
      const response = await bursarService.projects.getProjectFinances(projectId);
      if (response.success && response.data) {
        setProjectFinances(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch project finances:', error);
      toast.error('Failed to load project finances');
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      if (modalType === 'create') {
        response = await bursarService.projects.createProject(formData);
      } else {
        response = await bursarService.projects.updateProject(selectedProject!.id, formData);
      }
      if (response.success) {
        toast.success(response.message || 'Project saved successfully');
        setModalOpen(false);
        resetProjectForm();
        await fetchProjects();
      } else {
        toast.error(response.message || 'Failed to save project');
      }
    } catch (error) {
      console.error('Project save error:', error);
      toast.error('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      setLoading(true);
      const response = await bursarService.projects.recordProjectTransaction(selectedProject.id, {
        amount: transactionForm.amount,
        type: transactionForm.type,
        description: transactionForm.description,
        date: transactionForm.date,
        reference: transactionForm.reference,
      });
      if (response.success) {
        toast.success('Transaction recorded successfully');
        setModalOpen(false);
        resetTransactionForm();
        await fetchProjectFinances(selectedProject.id);
      } else {
        toast.error(response.message || 'Failed to record transaction');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await bursarService.projects.deleteProject(projectId);
        if (response.success) {
          toast.success('Project deleted successfully');
          await fetchProjects();
          setSelectedProject(null);
          setProjectFinances(null);
        } else {
          toast.error(response.message || 'Failed to delete project');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete project');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      budget: project.budget,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      department: project.department,
    });
    setModalType('create');
    setModalOpen(true);
  };

  const handleViewFinances = (project: Project) => {
    setSelectedProject(project);
    setModalType('finance');
    setModalOpen(true);
    fetchProjectFinances(project.id);
  };

  const resetProjectForm = () => {
    setFormData({
      name: '',
      description: '',
      budget: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'planning',
      department: '',
    });
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      amount: 0,
      type: 'expense',
      description: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      planning: { bg: 'bg-amber-100', text: 'text-amber-800' },
      active: { bg: 'bg-blue-100', text: 'text-blue-800' },
      on_hold: { bg: 'bg-amber-100', text: 'text-amber-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    return config[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  if (loading) {
    return (
      <div className="bursar-page min-h-screen p-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full border-4 border-amber-300 border-t-transparent h-12 w-12"></div>
          <span className="ml-4 text-amber-800 font-medium">Loading projects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bursar-page min-h-screen p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Project Financing</h1>
        <p className="text-amber-600">Manage school projects and their financials</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-amber-200 mb-6">
        <div className="flex flex-wrap items-center p-4 border-b border-amber-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-amber-800">Projects</h2>
            <p className="text-sm text-amber-500 mt-1">
              Total projects: {projects.length}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => {
                resetProjectForm();
                setModalType('create');
                setModalOpen(true);
              }}
              className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
            >
              New Project
            </button>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full divide-y divide-amber-100">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Budget (KES)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-amber-100">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-amber-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {project.department || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-800">
                    {formatCurrency(project.budget)}
                    {project.actualSpend !== undefined && (
                      <div className="text-xs text-amber-500 mt-1">
                        Spent: {formatCurrency(project.actualSpend)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(
                      project.status
                    ).bg} ${statusBadge(project.status).text}`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {new Date(project.startDate).toLocaleDateString('en-KE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-800">
                    {new Date(project.endDate).toLocaleDateString('en-KE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleViewFinances(project)}
                      className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-3 py-1"
                    >
                      View Finances
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-amber-500">
                    No projects found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProject && (
        <>
          <div className="bg-white rounded-xl shadow-md border border-amber-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-amber-800 mb-4">
                {modalType === 'create' ? 'Project Details' : 'Project Finances'}
              </h2>
              {modalType === 'create' && (
                <div className="mb-4">
                  <p className="text-sm text-amber-600">
                    <strong>Project:</strong> {selectedProject.name}
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Department:</strong> {selectedProject.department || '—'}
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Budget:</strong> {formatCurrency(selectedProject.budget)}
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Status:</strong>
                    <span className={`
                      px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(
                        selectedProject.status
                      ).bg} ${statusBadge(selectedProject.status).text}
                    `}>
                      {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                    </span>
                  </p>
                  <p className="text-sm text-amber-600">
                    <strong>Timeline:</strong> {new Date(selectedProject.startDate).toLocaleDateString('en-KE')} to {new Date(selectedProject.endDate).toLocaleDateString('en-KE')}
                  </p>
                </div>
              )}
              {modalType === 'finance' && projectFinances && (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-amber-800">Financial Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <p className="text-sm font-medium text-amber-600">Total Budget</p>
                        <p className="text-2xl font-bold text-amber-800 mt-2">
                          {formatCurrency(projectFinances.budget)}
                        </p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <p className="text-sm font-medium text-amber-600">Total Income</p>
                        <p className="text-2xl font-bold text-amber-800 mt-2">
                          {formatCurrency(projectFinances.totalIncome)}
                        </p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <p className="text-sm font-medium text-amber-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-amber-800 mt-2">
                          {formatCurrency(projectFinances.totalExpenses)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-amber-800">Net Position</h3>
                      <p className={`
                        text-2xl font-bold ${
                          projectFinances.netPosition >= 0 ? 'text-green-800' : 'text-red-800'
                        }
                      `}>
                        {formatCurrency(projectFinances.netPosition)}
                      </p>
                      <p className="text-sm text-amber-500 mt-1">
                        {projectFinances.netPosition >= 0 ? 'Surplus' : 'Deficit'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-amber-800">Add Transaction</h3>
                    <form onSubmit={handleTransactionSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-amber-700 mb-1">
                            Amount (KES)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={transactionForm.amount || 0}
                            onChange={(e) => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-amber-700 mb-1">
                            Type
                          </label>
                          <select
                            value={transactionForm.type}
                            onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as 'income' | 'expense' })}
                            className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                          >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-amber-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={transactionForm.description}
                          onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-amber-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={transactionForm.date}
                            onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                            className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-amber-700 mb-1">
                            Reference (optional)
                          </label>
                          <input
                            type="text"
                            value={transactionForm.reference || ''}
                            onChange={(e) => setTransactionForm({ ...transactionForm, reference: e.target.value })}
                            className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setModalOpen(false)}
                          className="btn btn-outline bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                          disabled={loading || !transactionForm.amount || !transactionForm.type}
                        >
                          Record Transaction
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BursarProjectsPage;