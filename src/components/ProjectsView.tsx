import React, { useState } from 'react';
import { 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Filter, 
  ArrowUpDown,
  Plus,
  Clock,
  Calendar,
  Layers
} from 'lucide-react';
import { Admin, Project, ProjectStatus, ProjectPriority, BillingCycle } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  admins: Admin[];
  searchQuery: string;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onQuickStatusChange: (projectId: string, status: ProjectStatus) => void;
}

export const BILLING_CYCLE_ORDER: Record<string, number> = {
  '1 to 30 or 31': 1,
  '5 to 5': 2,
  '10 to 10': 3,
  '15 to 15': 4,
  '20 to 20': 5,
  '25 to 25': 6,
};

export const getProjectCycle = (p: Project): BillingCycle => {
  if (p.billingCycle) {
    if (p.billingCycle.includes('30') || p.billingCycle.includes('31')) return '1 to 30 or 31';
    if (p.billingCycle.includes('5 to 5')) return '5 to 5';
    if (p.billingCycle.includes('10 to 10')) return '10 to 10';
    if (p.billingCycle.includes('15 to 15')) return '15 to 15';
    if (p.billingCycle.includes('20 to 20')) return '20 to 20';
    if (p.billingCycle.includes('25 to 25')) return '25 to 25';
    return p.billingCycle;
  }
  // Fallback inferred from start date day of month
  const dateStr = p.startDate || p.createdAt || '';
  if (dateStr) {
    const day = parseInt(dateStr.split('-')[2] || '1', 10);
    if (day <= 3 || day >= 28) return '1 to 30 or 31';
    if (day <= 7) return '5 to 5';
    if (day <= 12) return '10 to 10';
    if (day <= 17) return '15 to 15';
    if (day <= 22) return '20 to 20';
    return '25 to 25';
  }
  return '1 to 30 or 31';
};

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  admins,
  searchQuery,
  onAddProject,
  onEditProject,
  onDeleteProject,
}) => {
  const [selectedAdminId, setSelectedAdminId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  // Default to 'billing_cycle' order as requested
  const [sortBy, setSortBy] = useState<'billing_cycle' | 'name' | 'admin' | 'status' | 'priority'>('billing_cycle');

  const formatDateBadge = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatProjectDates = (project: Project) => {
    const start = formatDateBadge(project.startDate || project.createdAt);
    const end = formatDateBadge(project.endDate || project.dueDate);

    if (start && end) {
      return `${start} - ${end}`;
    }
    return start || end || '-';
  };

  const getCycleBadgeColor = (cycle: BillingCycle) => {
    switch (cycle) {
      case '1 to 30 or 31':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case '5 to 5':
        return 'bg-pink-50 text-pink-800 border-pink-200';
      case '10 to 10':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case '15 to 15':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case '20 to 20':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case '25 to 25':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  // Filtering projects
  const filteredProjects = projects.filter((project) => {
    const admin = admins.find((a) => a.id === project.adminId);
    const cycle = getProjectCycle(project);

    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.category && project.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (admin && admin.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cycle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAdmin = selectedAdminId === 'all' || project.adminId === selectedAdminId;
    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'social_media'
        ? project.projectType !== 'branding'
        : project.projectType === 'branding');
    const matchesCycle = selectedCycle === 'all' || cycle === selectedCycle;
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || project.priority === selectedPriority;

    return matchesSearch && matchesAdmin && matchesType && matchesCycle && matchesStatus && matchesPriority;
  });

  // Sorting: Default and strictly in billing cycle order (1 to 30/31, 5 to 5, 10 to 10, 15 to 15, 20 to 20, 25 to 25)
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'billing_cycle') {
      const cycleA = getProjectCycle(a);
      const cycleB = getProjectCycle(b);
      const orderA = BILLING_CYCLE_ORDER[cycleA] || 99;
      const orderB = BILLING_CYCLE_ORDER[cycleB] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    if (sortBy === 'priority') return a.priority.localeCompare(b.priority);
    if (sortBy === 'admin') {
      const adminA = admins.find((ad) => ad.id === a.adminId)?.name || '';
      const adminB = admins.find((ad) => ad.id === b.adminId)?.name || '';
      return adminA.localeCompare(adminB);
    }
    return 0;
  });

  // Unique billing cycle counts for quick overview
  const cycleCounts = {
    '1 to 30 or 31': projects.filter((p) => getProjectCycle(p) === '1 to 30 or 31').length,
    '5 to 5': projects.filter((p) => getProjectCycle(p) === '5 to 5').length,
    '10 to 10': projects.filter((p) => getProjectCycle(p) === '10 to 10').length,
    '15 to 15': projects.filter((p) => getProjectCycle(p) === '15 to 15').length,
    '20 to 20': projects.filter((p) => getProjectCycle(p) === '20 to 20').length,
    '25 to 25': projects.filter((p) => getProjectCycle(p) === '25 to 25').length,
  };

  return (
    <div id="projects-view-container" className="space-y-6">
      {/* Quick Billing Cycle Summary Tabs / Strip */}
      <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-2 pr-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-600" />
            <span>Billing Cycles:</span>
          </span>
          <button
            onClick={() => setSelectedCycle('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCycle === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            All Cycles ({projects.length})
          </button>
          {(['1 to 30 or 31', '5 to 5', '10 to 10', '15 to 15', '20 to 20', '25 to 25'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setSelectedCycle(selectedCycle === cycle ? 'all' : cycle)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedCycle === cycle
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                  : 'bg-white text-zinc-800 border-zinc-200 hover:border-orange-300'
              }`}
            >
              <span>{cycle}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedCycle === cycle ? 'bg-orange-700 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {cycleCounts[cycle]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Directory Filters & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-orange-500" />
            <span>Filters:</span>
          </div>

          {/* Admin Filter */}
          <select
            id="filter-admin-select"
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
          >
            <option value="all">All Admins ({admins.length})</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>

          {/* Billing Cycle Filter */}
          <select
            id="filter-cycle-select"
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
          >
            <option value="all">All Billing Cycles</option>
            <option value="1 to 30 or 31">1 to 30 or 31 ({cycleCounts['1 to 30 or 31']})</option>
            <option value="5 to 5">5 to 5 ({cycleCounts['5 to 5']})</option>
            <option value="10 to 10">10 to 10 ({cycleCounts['10 to 10']})</option>
            <option value="15 to 15">15 to 15 ({cycleCounts['15 to 15']})</option>
            <option value="20 to 20">20 to 20 ({cycleCounts['20 to 20']})</option>
            <option value="25 to 25">25 to 25 ({cycleCounts['25 to 25']})</option>
          </select>

          {/* Project Type Filter */}
          <select
            id="filter-type-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
          >
            <option value="all">All Project Types</option>
            <option value="social_media">Social Media Projects</option>
            <option value="branding">Branding / One-time</option>
          </select>

          {/* Status Filter */}
          <select
            id="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            id="filter-priority-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        {/* Sorting & Add Project */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-600 font-medium">Sort:</span>
            <select
              id="sort-projects-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-black font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="billing_cycle">Billing Cycle Order (1-30/31, 5-5, 10-10, 15-15, 20-20, 25-25)</option>
              <option value="name">Project Name</option>
              <option value="admin">Assigned Admin</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          <button
            id="projects-directory-add-btn"
            onClick={onAddProject}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Counter & Sort notice */}
      <div className="flex items-center justify-between text-xs text-zinc-600 px-1 font-medium flex-wrap gap-2">
        <p>
          Showing <span className="font-bold text-black">{sortedProjects.length}</span> of{' '}
          <span className="font-bold text-black">{projects.length}</span> total projects
          {selectedCycle !== 'all' && (
            <span className="ml-1 text-orange-600 font-bold">({selectedCycle} cycle)</span>
          )}
        </p>
        {sortBy === 'billing_cycle' && (
          <p className="text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Layers className="w-3 h-3 text-orange-600" />
            <span>Sorted in Billing Cycle Order: 1 to 30/31 → 5 to 5 → 10 to 10 → 15 to 15 → 20 to 20 → 25 to 25</span>
          </p>
        )}
      </div>

      {/* Projects Table / List */}
      {sortedProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-sm">
          <FolderPlus className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-black mb-1">No Projects Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4 font-normal">
            No projects match your current filters or search query. Try clearing filters or adding a new project.
          </p>
          <button
            id="reset-filter-btn"
            onClick={() => {
              setSelectedAdminId('all');
              setSelectedCycle('all');
              setSelectedStatus('all');
              setSelectedPriority('all');
              setSelectedType('all');
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                  <th className="py-3 px-4">Project Name & Category</th>
                  <th className="py-3 px-4">Billing Cycle</th>
                  <th className="py-3 px-4">Assigned Admin</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {sortedProjects.map((project, index) => {
                  const admin = admins.find((a) => a.id === project.adminId);
                  const cycle = getProjectCycle(project);
                  
                  // When sorted by billing_cycle, render a separator header when moving to next cycle group
                  const prevProject = index > 0 ? sortedProjects[index - 1] : null;
                  const isNewCycleGroup = sortBy === 'billing_cycle' && (!prevProject || getProjectCycle(prevProject) !== cycle);

                  return (
                    <React.Fragment key={project.id}>
                      {isNewCycleGroup && (
                        <tr className="bg-zinc-100/80 border-t-2 border-b border-zinc-200">
                          <td colSpan={5} className="py-2 px-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                <span>{cycle} Billing Cycle Projects</span>
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700">
                                {sortedProjects.filter((p) => getProjectCycle(p) === cycle).length} projects
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-orange-50/20 transition-colors">
                        {/* Project Name & Category with Date */}
                        <td className="py-3.5 px-4 font-bold text-black">
                          <div className="flex items-center justify-between gap-3 max-w-lg">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-bold text-black">{project.name}</span>
                                {project.projectType === 'branding' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-pink-50 text-pink-700 border border-pink-200 shrink-0">
                                    Branding
                                  </span>
                                )}
                              </div>
                              {project.category && (
                                <span className="text-[11px] text-zinc-500 font-normal truncate mt-0.5">{project.category}</span>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 shrink-0">
                              <Clock className="w-2.5 h-2.5 text-zinc-400" />
                              <span>{formatProjectDates(project)}</span>
                            </span>
                          </div>
                        </td>

                        {/* Billing Cycle Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border font-mono ${getCycleBadgeColor(
                              cycle
                            )}`}
                          >
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{cycle}</span>
                          </span>
                        </td>

                        {/* Admin Tag */}
                        <td className="py-3.5 px-4">
                          {admin ? (
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: admin.color }}
                              />
                              <span className="font-bold text-black">{admin.name}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Unassigned</span>
                          )}
                        </td>

                        {/* Priority Tag */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                              project.priority === 'High'
                                ? 'bg-pink-50 text-pink-700 border-pink-200'
                                : project.priority === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            {project.priority}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            id={`edit-proj-btn-${project.id}`}
                            onClick={() => onEditProject(project)}
                            className="p-1.5 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-proj-btn-${project.id}`}
                            onClick={() => onDeleteProject(project.id)}
                            className="p-1.5 text-zinc-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Project (Removes from both Admins & Assignments and Projects Directory)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
