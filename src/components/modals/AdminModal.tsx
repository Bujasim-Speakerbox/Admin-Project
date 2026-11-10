import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { Admin } from '../../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adminData: Omit<Admin, 'id'> & { id?: string }) => void;
  initialAdmin?: Admin | null;
}

const PRESET_COLORS = [
  '#f97316', // Orange
  '#db2777', // Dark Pink
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ef4444', // Red
];

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAdmin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [color, setColor] = useState('#f97316');

  useEffect(() => {
    if (initialAdmin) {
      setName(initialAdmin.name);
      setEmail(initialAdmin.email);
      setDepartment(initialAdmin.department);
      setColor(initialAdmin.color);
    } else {
      setName('');
      setEmail('');
      setDepartment('');
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    }
  }, [initialAdmin, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialAdmin?.id,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@company.com`,
      department: department.trim() || 'General Operations',
      color,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div id="admin-modal-container" className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-base font-bold text-black flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            <span>{initialAdmin ? 'Edit Admin Details' : 'Add New Admin'}</span>
          </h3>
          <button
            id="close-admin-modal-btn"
            onClick={onClose}
            className="text-zinc-500 hover:text-black p-1 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Admin Name *
            </label>
            <input
              id="admin-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nuha"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              id="admin-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. nuha@company.com"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Department / Role
            </label>
            <input
              id="admin-department-input"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Digital Media & Operations"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
              Badge / Accent Color
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  id={`color-option-${c.replace('#', '')}`}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer shadow-xs ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-orange-500 ring-offset-white' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-zinc-200">
            <button
              id="cancel-admin-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer border border-zinc-300"
            >
              Cancel
            </button>
            <button
              id="submit-admin-modal-btn"
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialAdmin ? 'Save Changes' : 'Create Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
