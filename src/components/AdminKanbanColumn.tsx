import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Plus, 
  Clock, 
  Edit2, 
  Trash2, 
  Tag, 
  AlertCircle,
  ArrowRightLeft,
  ChevronRight
} from 'lucide-react';
import { Admin, Project, ProjectStatus } from '../types';

interface AdminKanbanColumnProps {
  admin: Admin;
  projects: Project[];
  onEditAdmin: (admin: Admin) => void;
  onDeleteAdmin: (adminId: string) => void;
  onAddProjectForAdmin: (adminId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onQuickStatusChange: (projectId: string, status: ProjectStatus) => void;
}

export const AdminKanbanColumn: React.FC<AdminKanbanColumnProps> = ({
  admin,
  projects,
  onEditAdmin,
  onDeleteAdmin,
  onAddProjectForAdmin,
  onEditProject,
  onDeleteProject,
  onQuickStatusChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Format date helper (e.g., Jul 30)
  const formatDateBadge = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
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

  // Status color helper for date badge
  const getDateBadgeClass = (status: ProjectStatus) => {
    switch (status) {
      case 'Active':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'In Progress':
        return 'bg-pink-50 text-pink-800 border-pink-200';
      case 'On Hold':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-300';
    }
  };

  const getAdminInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div 
      id={`kanban-column-${admin.id}`}
      className="w-[260px] sm:w-[275px] shrink-0 bg-zinc-100/80 rounded-2xl border border-zinc-300 flex flex-col max-h-[calc(100vh-170px)] shadow-xs overflow-hidden group/col"
    >
      {/* Column Header */}
      <div 
        className="px-3 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-white"
        style={{ borderTop: `3px solid ${admin.color}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-black text-black tracking-wider uppercase truncate">
            {admin.name}
          </h3>
          <span className="px-2 py-0.5 text-[10px] font-bold text-zinc-800 bg-zinc-100 border border-zinc-200 rounded-full shrink-0">
            {projects.length}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button 
            type="button"
            className="p-1 text-zinc-400 hover:text-black rounded hover:bg-zinc-100 transition-colors"
            title="Column Options"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              id={`column-menu-btn-${admin.id}`}
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-zinc-400 hover:text-black rounded hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-zinc-200 py-1 z-30 animate-fadeIn">
                <button
                  id={`edit-admin-col-${admin.id}`}
                  onClick={() => {
                    setShowMenu(false);
                    onEditAdmin(admin);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-zinc-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3 text-orange-600" />
                  <span>Edit Admin</span>
                </button>
                <button
                  id={`delete-admin-col-${admin.id}`}
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteAdmin(admin.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-pink-700 hover:bg-pink-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards Scrollable Body */}
      <div className="p-2 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
        {projects.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-zinc-300 rounded-xl bg-white shadow-2xs">
            <p className="text-[11px] font-semibold text-zinc-500 mb-2">No cards assigned</p>
            <button
              onClick={() => onAddProjectForAdmin(admin.id)}
              className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Card</span>
            </button>
          </div>
        ) : (
          projects.map((project) => {
            const isHovered = hoveredCardId === project.id;

            return (
              <div
                key={project.id}
                id={`kanban-card-${project.id}`}
                onMouseEnter={() => setHoveredCardId(project.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                className="bg-white hover:bg-orange-50/40 border border-zinc-200 hover:border-orange-400 rounded-xl p-3 shadow-xs transition-all group relative cursor-pointer"
              >
                {/* Category Banner / Header Tag with Date on Right */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[9px] font-bold uppercase tracking-wider text-zinc-800 min-w-0 max-w-[calc(100%-80px)] truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span className="truncate">{project.category || 'General'}</span>
                  </div>

                  <span 
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${getDateBadgeClass(
                      project.status
                    )}`}
                    title={project.startDate && project.endDate ? `Start: ${project.startDate} | End: ${project.endDate}` : undefined}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatProjectDates(project)}</span>
                  </span>
                </div>

                {/* Main Card Title */}
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h4 className="text-xs font-black text-black uppercase tracking-tight leading-snug group-hover:text-orange-600 transition-colors truncate">
                      {project.name}
                    </h4>
                  </div>

                  {/* Card Quick Actions */}
                  {isHovered && (
                    <div className="flex items-center gap-0.5 bg-white rounded p-0.5 border border-zinc-300 shadow-md absolute top-1.5 right-1.5 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProject(project);
                        }}
                        className="p-1 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                        className="p-1 text-zinc-500 hover:text-pink-600 hover:bg-pink-50 rounded transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Column Footer: + Add a card */}
      <div className="p-2 border-t border-zinc-200 bg-white">
        <button
          id={`add-card-footer-${admin.id}`}
          onClick={() => onAddProjectForAdmin(admin.id)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-zinc-700 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-all group/btn cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-orange-600 transition-colors" />
            <span>Add a card</span>
          </div>
          <ChevronRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 text-orange-600 transition-all" />
        </button>
      </div>
    </div>
  );
};
