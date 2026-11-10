import React from 'react';
import {
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  Users
} from 'lucide-react';
import { Admin, Designer } from '../types';

interface AdminDesignerAllotmentProps {
  admins: Admin[];
  designers: Designer[];
  onAddDesignerForAdmin: (adminId?: string) => void;
  onEditDesigner: (designer: Designer) => void;
  onDeleteDesigner: (designerId: string) => void;
}

export function AdminDesignerAllotment({
  admins,
  designers,
  onAddDesignerForAdmin,
  onEditDesigner,
  onDeleteDesigner,
}: AdminDesignerAllotmentProps) {
  return (
    <div id="admin-designer-allotment-section" className="mt-10 bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-4 border-b border-zinc-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-black">Allotted Designers per Admin</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                {designers.length} Designers
              </span>
            </div>
            <p className="text-xs font-medium text-zinc-600 mt-0.5">
              Manage, allot, edit, and delete designers assigned to each Admin.
            </p>
          </div>
        </div>

        <button
          id="add-designer-main-btn"
          onClick={() => onAddDesignerForAdmin()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Designer</span>
        </button>
      </div>

      {/* Admin Designer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {admins.map((admin) => {
          // Find designers allotted to this admin
          const adminDesigners = designers.filter((d) =>
            d.allocatedAdminIds.includes(admin.id)
          );

          return (
            <div
              key={admin.id}
              className="bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col hover:border-zinc-300 transition-all shadow-xs group"
            >
              {/* Admin Header Banner */}
              <div
                className="p-3.5 border-b border-zinc-200 flex items-center justify-between gap-2 bg-zinc-50"
                style={{
                  borderLeft: `4px solid ${admin.color}`,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white"
                    style={{ backgroundColor: admin.color }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-black truncate">
                      {admin.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-zinc-600 truncate">
                      {admin.department}
                    </p>
                  </div>
                </div>

                <button
                  id={`add-designer-to-${admin.id}-btn`}
                  onClick={() => onAddDesignerForAdmin(admin.id)}
                  title={`Add designer to ${admin.name}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

              {/* Designers List for this Admin */}
              <div className="p-3.5 flex-1 flex flex-col gap-3 bg-white">
                {adminDesigners.length === 0 ? (
                  <div className="py-6 px-3 border border-dashed border-zinc-300 rounded-xl text-center my-auto bg-zinc-50/60 shadow-2xs">
                    <Users className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-zinc-800">No Designer Allotted</p>
                    <p className="text-[11px] font-medium text-zinc-500 mb-2">Assign a designer to handle {admin.name}'s projects</p>
                    <button
                      onClick={() => onAddDesignerForAdmin(admin.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Designer</span>
                    </button>
                  </div>
                ) : (
                  adminDesigners.map((designer) => (
                    <div
                      key={designer.id}
                      className="bg-zinc-50/80 border border-zinc-200 hover:border-orange-300 hover:bg-orange-50/20 rounded-xl p-3 transition-all flex flex-col gap-2 relative group/item"
                    >
                      {/* Top Row: Designer Info + Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Avatar Initials */}
                          <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 shadow-2xs flex items-center justify-center font-black text-xs text-orange-600 shrink-0">
                            {designer.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-black truncate">
                              {designer.name}
                            </h5>
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-600">
                              <Briefcase className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{designer.role}</span>
                            </div>
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            id={`edit-designer-${designer.id}-btn`}
                            onClick={() => onEditDesigner(designer)}
                            title="Edit Designer"
                            className="p-1.5 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-designer-${designer.id}-btn`}
                            onClick={() => onDeleteDesigner(designer.id)}
                            title="Delete / Unallot Designer"
                            className="p-1.5 text-zinc-400 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
