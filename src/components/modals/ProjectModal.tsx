import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Save, Calendar } from 'lucide-react';
import { Admin, Project, ProjectPriority, ProjectStatus, ProjectType, BillingCycle } from '../../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string }) => void;
  initialProject?: Project | null;
  admins: Admin[];
  defaultAdminId?: string;
  defaultProjectType?: ProjectType;
}

export const BILLING_CYCLES: BillingCycle[] = [
  '1 to 30 or 31',
  '5 to 5',
  '10 to 10',
  '15 to 15',
  '20 to 20',
  '25 to 25',
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  admins,
  defaultAdminId,
  defaultProjectType = 'social_media',
}) => {
  const [name, setName] = useState('');
  const [adminId, setAdminId] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Active');
  const [priority, setPriority] = useState<ProjectPriority>('Medium');
  const [category, setCategory] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('social_media');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('1 to 30 or 31');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setAdminId(initialProject.adminId);
      setStatus(initialProject.status);
      setPriority(initialProject.priority);
      setCategory(initialProject.category || '');
      setProjectType(initialProject.projectType || 'social_media');
      setBillingCycle(initialProject.billingCycle || '1 to 30 or 31');
      setStartDate(initialProject.startDate || initialProject.createdAt || '');
      setEndDate(initialProject.endDate || initialProject.dueDate || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setName('');
      setAdminId(defaultAdminId || (admins[0] ? admins[0].id : ''));
      setStatus('Active');
      setPriority('Medium');
      setCategory('');
      setProjectType(defaultProjectType);
      setBillingCycle('1 to 30 or 31');
      setStartDate(today);
      setEndDate('');
    }
  }, [initialProject, defaultAdminId, defaultProjectType, admins, isOpen]);

  if (!isOpen) return null;

  const handleCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    // Optionally update start/end day of month based on selected cycle
    const yearMonth = (startDate || new Date().toISOString().split('T')[0]).substring(0, 7);
    if (cycle === '1 to 30 or 31') {
      setStartDate(`${yearMonth}-01`);
      setEndDate(`${yearMonth}-31`);
    } else if (cycle === '5 to 5') {
      setStartDate(`${yearMonth}-05`);
    } else if (cycle === '10 to 10') {
      setStartDate(`${yearMonth}-10`);
    } else if (cycle === '15 to 15') {
      setStartDate(`${yearMonth}-15`);
    } else if (cycle === '20 to 20') {
      setStartDate(`${yearMonth}-20`);
    } else if (cycle === '25 to 25') {
      setStartDate(`${yearMonth}-25`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminId) return;

    onSave({
      id: initialProject?.id,
      name: name.trim(),
      adminId,
      status,
      priority,
      category: category.trim() || (projectType === 'branding' ? 'Branding' : 'Social Media'),
      projectType,
      billingCycle,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div id="project-modal-container" className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-base font-bold text-black flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-orange-600" />
            <span>{initialProject ? 'Edit Project' : 'Add New Project'}</span>
          </h3>
          <button
            id="close-project-modal-btn"
            onClick={onClose}
            className="text-zinc-500 hover:text-black p-1 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Project Name *
            </label>
            <input
              id="project-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Green Wave Solar"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Project Type *
              </label>
              <select
                id="project-type-select"
                required
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
              >
                <option value="social_media" className="bg-white text-black">
                  Social Media
                </option>
                <option value="branding" className="bg-white text-black">
                  Branding / One-time
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>Billing Cycle *</span>
              </label>
              <select
                id="project-billing-cycle-select"
                required
                value={billingCycle}
                onChange={(e) => handleCycleChange(e.target.value as BillingCycle)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-bold cursor-pointer"
              >
                <option value="1 to 30 or 31">1 to 30 or 31</option>
                <option value="5 to 5">5 to 5</option>
                <option value="10 to 10">10 to 10</option>
                <option value="15 to 15">15 to 15</option>
                <option value="20 to 20">20 to 20</option>
                <option value="25 to 25">25 to 25</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Assigned Admin *
            </label>
            <select
              id="project-admin-select"
              required
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
            >
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id} className="bg-white text-black">
                  {admin.name} ({admin.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                id="project-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                id="project-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Category / Industry
            </label>
            <input
              id="project-category-input"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Branding, UI/UX, Packaging, Retail"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                id="project-start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Ending Date
              </label>
              <input
                id="project-end-date-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-medium"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-zinc-200">
            <button
              id="cancel-project-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer border border-zinc-300"
            >
              Cancel
            </button>
            <button
              id="submit-project-modal-btn"
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialProject ? 'Save Changes' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
