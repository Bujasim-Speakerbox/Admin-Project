import React, { useState } from 'react';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  FolderPlus, 
  ChevronDown, 
  ChevronUp,
  Tag,
  LayoutList,
  LayoutGrid,
  Clock
} from 'lucide-react';
import { Admin, Project, ProjectStatus, ProjectPriority } from '../types';

interface AdminCardProps {
  admin: Admin;
  projects: Project[];
  onEditAdmin: (admin: Admin) => void;
  onDeleteAdmin: (adminId: string) => void;
  onAddProjectForAdmin: (adminId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  admin,
  projects,
  onEditAdmin,
  onDeleteAdmin,
  onAddProjectForAdmin,
  onEditProject,
  onDeleteProject,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const formatDateBadge = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatProjectDates = (project: Project) => {
    if (project.billingCycle) {
      return project.billingCycle;
    }
    const start = formatDateBadge(project.startDate || project.createdAt);
    const end = formatDateBadge(project.endDate || project.dueDate);

    if (start && end) {
      return `${start} - ${end}`;
    }
    return start || end || '1 to 30 or 31';
  };

  // Status Badge Helper for Light Theme
  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'Active':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">Active</span>;
      case 'In Progress':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-pink-50 text-pink-800 border border-pink-300">In Progress</span>;
      case 'On Hold':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-300">On Hold</span>;
      case 'Completed':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-zinc-100 text-zinc-700 border border-zinc-300">Completed</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: ProjectPriority) => {
    switch (priority) {
      case 'High':
        return <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">High</span>;
      case 'Medium':
        return <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Med</span>;
      case 'Low':
        return <span className="text-[10px] uppercase font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">Low</span>;
    }
  };

  return (
    <div id={`admin-card-${admin.id}`} className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all overflow-hidden">
      {/* Admin Card Header */}
      <div 
        className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
        style={{ borderLeft: `6px solid ${admin.color}` }}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm shrink-0"
            style={{ backgroundColor: admin.color }}
          >
            {admin.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-black">{admin.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 font-bold">
                Admin
              </span>
            </div>
            <p className="text-xs text-zinc-600 font-semibold">{admin.department} • {admin.email}</p>
          </div>
        </div>

        {/* Counts & Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center space-x-2 mr-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
              {projects.length} Projects
            </span>
          </div>

          <button
            id={`add-project-btn-admin-${admin.id}`}
            onClick={() => onAddProjectForAdmin(admin.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
            title="Add Project to this Admin"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>

          {/* Admin Menu Dropdown */}
          <div className="relative">
            <button
              id={`admin-menu-btn-${admin.id}`}
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className="p-1.5 text-zinc-500 hover:text-black rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showAdminMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-zinc-200 py-1.5 z-20 animate-fadeIn">
                <button
                  id={`edit-admin-btn-${admin.id}`}
                  onClick={() => {
                    setShowAdminMenu(false);
                    onEditAdmin(admin);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-zinc-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>Edit Admin Info</span>
                </button>
                <button
                  id={`delete-admin-btn-${admin.id}`}
                  onClick={() => {
                    setShowAdminMenu(false);
                    onDeleteAdmin(admin.id);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-pink-700 hover:bg-pink-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Admin</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle Expand/Collapse */}
          <button
            id={`toggle-expand-admin-${admin.id}`}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-zinc-500 hover:text-black rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Admin Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 bg-zinc-50/60">
          {/* Assigned Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                <span>Assigned Projects</span>
                <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {projects.length}
                </span>
              </h3>

              {/* View Toggle Mode */}
              <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                <button
                  id={`view-list-btn-${admin.id}`}
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                    viewMode === 'list' 
                      ? 'bg-orange-600 text-white shadow-xs' 
                      : 'text-zinc-500 hover:text-black'
                  }`}
                  title="List View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  id={`view-grid-btn-${admin.id}`}
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'bg-orange-600 text-white shadow-xs' 
                      : 'text-zinc-500 hover:text-black'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-zinc-300 p-6 text-center shadow-2xs">
                <p className="text-xs font-semibold text-zinc-600 mb-2">No projects assigned to {admin.name} currently.</p>
                <button
                  id={`empty-add-project-${admin.id}`}
                  onClick={() => onAddProjectForAdmin(admin.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Add First Project</span>
                </button>
              </div>
            ) : viewMode === 'list' ? (
              /* LIST VIEW FORMAT FOR PROJECTS */
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    id={`project-item-${project.id}`}
                    className="bg-white border border-zinc-200 hover:border-orange-300 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group hover:bg-orange-50/20 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-black group-hover:text-orange-600 transition-colors truncate">
                            {project.name}
                          </h4>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 shrink-0">
                            <Clock className="w-2.5 h-2.5 text-zinc-500" />
                            <span>{formatProjectDates(project)}</span>
                          </span>
                        </div>
                        {project.category && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 mt-0.5">
                            <Tag className="w-3 h-3 text-zinc-400" />
                            {project.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                      {getPriorityBadge(project.priority)}

                      <div className="flex items-center gap-1 border-l border-zinc-200 pl-2 ml-1">
                        <button
                          id={`edit-project-${project.id}`}
                          onClick={() => onEditProject(project)}
                          className="p-1.5 text-zinc-400 hover:text-orange-600 rounded-md hover:bg-orange-50 transition-colors cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-project-${project.id}`}
                          onClick={() => onDeleteProject(project.id)}
                          className="p-1.5 text-zinc-400 hover:text-pink-600 rounded-md hover:bg-pink-50 transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* GRID VIEW FORMAT FOR PROJECTS */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    id={`project-card-${project.id}`}
                    className="bg-white rounded-xl border border-zinc-200 p-3.5 flex flex-col justify-between hover:border-orange-300 hover:bg-orange-50/20 transition-all group shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <h4 className="text-sm font-black text-black group-hover:text-orange-600 transition-colors truncate">
                            {project.name}
                          </h4>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 shrink-0">
                            <Clock className="w-2.5 h-2.5 text-zinc-500" />
                            <span>{formatProjectDates(project)}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {getPriorityBadge(project.priority)}
                          <button
                            id={`edit-project-${project.id}`}
                            onClick={() => onEditProject(project)}
                            className="p-1 text-zinc-400 hover:text-orange-600 rounded hover:bg-orange-50 transition-colors cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-project-${project.id}`}
                            onClick={() => onDeleteProject(project.id)}
                            className="p-1 text-zinc-400 hover:text-pink-600 rounded hover:bg-pink-50 transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {project.category && (
                          <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded flex items-center gap-1 border border-zinc-200">
                            <Tag className="w-3 h-3 text-zinc-400" />
                            {project.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
