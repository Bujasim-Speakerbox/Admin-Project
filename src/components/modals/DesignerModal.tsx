import React, { useState, useEffect } from 'react';
import { X, User, Mail, Briefcase, Shield } from 'lucide-react';
import { Admin, Designer } from '../../types';

interface DesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (designerData: Omit<Designer, 'id'> & { id?: string }) => void;
  initialDesigner: Designer | null;
  admins: Admin[];
  defaultAdminId?: string;
}

export function DesignerModal({
  isOpen,
  onClose,
  onSave,
  initialDesigner,
  admins,
  defaultAdminId,
}: DesignerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialDesigner) {
      setName(initialDesigner.name);
      setEmail(initialDesigner.email);
      setRole(initialDesigner.role);
      setSelectedAdminIds(initialDesigner.allocatedAdminIds || []);
    } else {
      setName('');
      setEmail('');
      setRole('UI/UX Designer');
      setSelectedAdminIds(defaultAdminId ? [defaultAdminId] : (admins[0] ? [admins[0].id] : []));
    }
  }, [initialDesigner, defaultAdminId, admins, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(initialDesigner?.id ? { id: initialDesigner.id } : {}),
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@design.com`,
      role: role.trim() || 'Visual Designer',
      status: 'Available',
      allocatedAdminIds: selectedAdminIds,
    });

    onClose();
  };

  const toggleAdmin = (adminId: string) => {
    setSelectedAdminIds((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-bold text-black">
              {initialDesigner ? 'Edit Designer' : 'Add New Designer'}
            </h3>
          </div>
          <button
            id="close-designer-modal-btn"
            onClick={onClose}
            className="text-zinc-500 hover:text-black p-1 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Designer Name *
            </label>
            <div className="relative">
              <input
                id="designer-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-semibold"
              />
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Role / Title
            </label>
            <div className="relative">
              <input
                id="designer-role-input"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. UI/UX Designer"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-medium"
              />
              <Briefcase className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="designer-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@design.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-medium"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Add to Admin Section */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Add To Admin(s)</span>
              <span className="text-[10px] text-zinc-500 font-normal">Select admin column(s)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-zinc-50 border border-zinc-200 rounded-xl">
              {admins.map((admin) => {
                const isSelected = selectedAdminIds.includes(admin.id);
                return (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => toggleAdmin(admin.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:border-orange-300'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: admin.color }}
                    />
                    <span className="truncate">{admin.name}</span>
                    {isSelected && (
                      <Shield className="w-3.5 h-3.5 text-orange-600 ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-zinc-200">
            <button
              id="cancel-designer-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer border border-zinc-300"
            >
              Cancel
            </button>
            <button
              id="save-designer-modal-btn"
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {initialDesigner ? 'Update Designer' : 'Add Designer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
