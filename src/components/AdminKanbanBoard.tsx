import React from 'react';
import { AdminKanbanColumn } from './AdminKanbanColumn';
import { Admin, Project, ProjectStatus, ProjectType } from '../types';
import { UserPlus } from 'lucide-react';

interface AdminKanbanBoardProps {
  admins: Admin[];
  projects: Project[];
  projectType?: ProjectType;
  onEditAdmin: (admin: Admin) => void;
  onDeleteAdmin: (adminId: string) => void;
  onAddProjectForAdmin: (adminId: string, projectType?: ProjectType) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onQuickStatusChange: (projectId: string, status: ProjectStatus) => void;
  onOpenAddAdmin: () => void;
}

export const AdminKanbanBoard: React.FC<AdminKanbanBoardProps> = ({
  admins,
  projects,
  projectType = 'social_media',
  onEditAdmin,
  onDeleteAdmin,
  onAddProjectForAdmin,
  onEditProject,
  onDeleteProject,
  onQuickStatusChange,
  onOpenAddAdmin,
}) => {
  return (
    <div className="w-full">
      {/* Kanban Board Horizontal Scrolling Column Layout */}
      <div 
        id={`admin-kanban-board-container-${projectType}`}
        className="flex items-start gap-4 overflow-x-auto pb-6 min-h-[380px] scrollbar-thin scrollbar-thumb-zinc-300"
      >
        {admins.map((admin) => {
          const adminProjects = projects.filter((p) => p.adminId === admin.id);

          return (
            <AdminKanbanColumn
              key={`${admin.id}-${projectType}`}
              admin={admin}
              projects={adminProjects}
              onEditAdmin={onEditAdmin}
              onDeleteAdmin={onDeleteAdmin}
              onAddProjectForAdmin={(adminId) => onAddProjectForAdmin(adminId, projectType)}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
              onQuickStatusChange={onQuickStatusChange}
            />
          );
        })}

        {/* Add New Admin Column Card */}
        <div className="w-[260px] sm:w-[275px] shrink-0">
          <button
            id={`add-admin-column-btn-${projectType}`}
            onClick={onOpenAddAdmin}
            className="w-full bg-zinc-50 hover:bg-orange-50/70 border border-dashed border-zinc-300 hover:border-orange-500 rounded-2xl p-3 text-zinc-700 hover:text-orange-700 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer h-12 shadow-2xs"
          >
            <UserPlus className="w-4 h-4 text-orange-600" />
            <span>+ Add Admin Column</span>
          </button>
        </div>
      </div>
    </div>
  );
};
