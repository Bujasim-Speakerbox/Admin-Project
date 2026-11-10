import React, { useState } from 'react';
import { 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Filter, 
  ArrowUpDown,
  Plus,
  Clock
} from 'lucide-react';
import { Admin, Project, ProjectStatus, ProjectPriority } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  admins: Admin[];
  searchQuery: string;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onQuickStatusChange: (projectId: string, status: ProjectStatus) => void;
}

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
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'admin' | 'status' | 'priority'>('name');

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

  // Filtering projects
  const filteredProjects = projects.filter((project) => {
    const admin = admins.find((a) => a.id === project.adminId);

    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.category && project.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (admin && admin.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAdmin = selectedAdminId === 'all' || project.adminId === selectedAdminId;
    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'social_media'
        ? project.projectType !== 'branding'
        : project.projectType === 'branding');
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || project.priority === selectedPriority;

    return matchesSearch && matchesAdmin && matchesType && matchesStatus && matchesPriority;
  });

  // Sorting
  const sortedProjects = [...filteredProjects].sort((a, b) => {
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

  return (
    <div id="projects-view-container" className="space-y-6">
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
              className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
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

      {/* Projects Counter */}
      <div className="flex items-center justify-between text-xs text-zinc-600 px-1 font-medium">
        <p>
          Showing <span className="font-bold text-black">{sortedProjects.length}</span> of{' '}
          <span className="font-bold text-black">{projects.length}</span> total projects
        </p>
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
                  <th className="py-3 px-4">Assigned Admin</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {sortedProjects.map((project) => {
                  const admin = admins.find((a) => a.id === project.adminId);

                  return (
                    <tr key={project.id} className="hover:bg-orange-50/20 transition-colors">
                      {/* Project Name & Category with Date on the Right */}
                      <td className="py-3.5 px-4 font-bold text-black">
                        <div className="flex items-center justify-between gap-3 max-w-lg">
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm font-bold text-black">{project.name}</span>
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
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
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
