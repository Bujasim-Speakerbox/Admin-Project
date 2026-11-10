import React, { useState, useEffect } from 'react';
import { X, UserCheck, UserMinus, Sparkles, AlertCircle } from 'lucide-react';
import { Admin, Project, ClientMovement, ClientMovementType, ProjectType } from '../../types';

interface ClientMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movementData: Omit<ClientMovement, 'id' | 'createdAt'> & { id?: string }) => void;
  initialMovement?: ClientMovement | null;
  admins: Admin[];
  projects: Project[];
  defaultClientType?: ClientMovementType;
  defaultMonth?: string;
}

const BRAND_TYPE_SUGGESTIONS = [
  'Luxury Fashion & Apparel',
  'Specialty Food & Beverage',
  'D2C Clean Skincare',
  'Tech & SaaS Platform',
  'Clean Energy & EV Mobility',
  'High-End Real Estate',
  'Fitness & Activewear',
  'Hospitality & Gourmet Dining',
  'FinTech & Banking',
  'Home Decor & Architecture',
  'FMCG Retail Brand',
];

const EXIT_REASON_SUGGESTIONS = [
  'Campaign duration completed & goals achieved',
  'Client hired internal in-house creative team',
  'Budget reallocation towards physical expansion',
  'Brand acquired by conglomerate / agency realignment',
  'Seasonal campaign ended (awaiting next cycle)',
  'Scope realignment & strategic pivot',
  'Budget constraints / paused marketing spend',
  'Shifted ad spend to offline distribution',
];

export const ClientMovementModal: React.FC<ClientMovementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMovement,
  admins,
  projects,
  defaultClientType = 'onboarded',
  defaultMonth,
}) => {
  const [clientType, setClientType] = useState<ClientMovementType>('onboarded');
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [adminId, setAdminId] = useState('');
  const [month, setMonth] = useState('');
  const [date, setDate] = useState('');
  const [brandType, setBrandType] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('social_media');
  const [exitReason, setExitReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialMovement) {
      setClientType(initialMovement.clientType);
      setProjectName(initialMovement.projectName);
      setProjectId(initialMovement.projectId || '');
      setAdminId(initialMovement.adminId || admins[0]?.id || '');
      setMonth(initialMovement.month);
      setDate(initialMovement.date);
      setBrandType(initialMovement.brandType || '');
      setProjectType(initialMovement.projectType || 'social_media');
      setExitReason(initialMovement.exitReason || '');
      setNotes(initialMovement.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = defaultMonth || today.substring(0, 7);
      setClientType(defaultClientType);
      setProjectName('');
      setProjectId('');
      setAdminId(admins[0]?.id || '');
      setMonth(currentMonth);
      setDate(today);
      setBrandType('');
      setProjectType('social_media');
      setExitReason('');
      setNotes('');
    }
  }, [initialMovement, defaultClientType, defaultMonth, admins, isOpen]);

  // When date changes, automatically keep month in sync
  const handleDateChange = (val: string) => {
    setDate(val);
    if (val && val.length >= 7) {
      setMonth(val.substring(0, 7));
    }
  };

  const handleSelectExistingProject = (projId: string) => {
    setProjectId(projId);
    if (!projId) return;
    const found = projects.find((p) => p.id === projId);
    if (found) {
      setProjectName(found.name);
      if (found.adminId) setAdminId(found.adminId);
      if (found.projectType) setProjectType(found.projectType);
      if (found.category && !brandType) {
        setBrandType(found.category);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    if (clientType === 'onboarded' && !brandType.trim()) {
      return;
    }
    if (clientType === 'exit' && !exitReason.trim()) {
      return;
    }

    onSave({
      id: initialMovement?.id,
      clientType,
      projectName: projectName.trim(),
      projectId: projectId || undefined,
      adminId: adminId || undefined,
      month: month || date.substring(0, 7),
      date: date || new Date().toISOString().split('T')[0],
      brandType: clientType === 'onboarded' ? brandType.trim() : undefined,
      projectType: clientType === 'onboarded' ? projectType : undefined,
      exitReason: clientType === 'exit' ? exitReason.trim() : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="client-movement-modal"
        className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-all my-8 animate-fadeIn"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              clientType === 'onboarded'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-pink-100 text-pink-800 border border-pink-200'
            }`}>
              {clientType === 'onboarded' ? (
                <UserCheck className="w-5 h-5" />
              ) : (
                <UserMinus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-black">
                {initialMovement ? 'Edit Client Record' : clientType === 'onboarded' ? 'Record Onboarded Client' : 'Record Exit Client'}
              </h2>
              <p className="text-xs text-zinc-500">
                {clientType === 'onboarded'
                  ? 'Track new client project and brand classification'
                  : 'Record client departure and exit reason for analysis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-black p-1 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Movement Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
              Client Movement Type *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
              <button
                type="button"
                id="toggle-type-onboarded"
                onClick={() => setClientType('onboarded')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  clientType === 'onboarded'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Onboarded Client</span>
              </button>
              <button
                type="button"
                id="toggle-type-exit"
                onClick={() => setClientType('exit')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  clientType === 'exit'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <UserMinus className="w-4 h-4" />
                <span>Exit Client</span>
              </button>
            </div>
          </div>

          {/* Quick select from existing projects */}
          {projects.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Link to Existing Project (Optional)
              </label>
              <select
                id="client-existing-project-select"
                value={projectId}
                onChange={(e) => handleSelectExistingProject(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="">-- Choose existing project or type below --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectType === 'branding' ? 'Branding' : 'Social Media'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project / Client Name */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Project / Client Name *
            </label>
            <input
              id="client-project-name-input"
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Velvet & Vine, Aura Skin Lab..."
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-semibold"
            />
          </div>

          {/* ONBOARDED CLIENT FIELD: Type of Brand */}
          {clientType === 'onboarded' && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Type of Brand *
                </label>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Required for Onboarded
                </span>
              </div>
              <input
                id="client-brand-type-input"
                type="text"
                required
                value={brandType}
                onChange={(e) => setBrandType(e.target.value)}
                placeholder="e.g. Luxury Gourmet, Clean D2C Skincare, EV Mobility..."
                className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black placeholder-zinc-400 font-semibold"
              />
              <div>
                <p className="text-[10px] text-zinc-500 mb-1.5 font-bold uppercase">Quick Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {BRAND_TYPE_SUGGESTIONS.slice(0, 6).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setBrandType(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        brandType === cat
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-emerald-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  Project Engagement Type
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-black font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="social_media">Social Media Retainer</option>
                  <option value="branding">Branding / One-time Project</option>
                </select>
              </div>
            </div>
          )}

          {/* EXIT CLIENT FIELD: Reason for Exit */}
          {clientType === 'exit' && (
            <div className="p-3.5 bg-pink-50/70 border border-pink-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-pink-900 uppercase tracking-wider">
                  Reason for Exit *
                </label>
                <span className="text-[10px] text-pink-700 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Required for Exit
                </span>
              </div>
              <textarea
                id="client-exit-reason-input"
                rows={2}
                required
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                placeholder="e.g. Campaign duration completed; client satisfied with ROI / In-house team hired..."
                className="w-full px-3 py-2 text-sm bg-white border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black placeholder-zinc-400 font-medium resize-none"
              />
              <div>
                <p className="text-[10px] text-zinc-500 mb-1.5 font-bold uppercase">Common Reasons:</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXIT_REASON_SUGGESTIONS.slice(0, 5).map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setExitReason(reason)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors text-left cursor-pointer ${
                        exitReason === reason
                          ? 'bg-pink-600 text-white border-pink-600 font-bold'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-pink-400'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Date & Month Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Month (YYYY-MM) *
              </label>
              <input
                id="client-month-input"
                type="month"
                required
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  if (!date.startsWith(e.target.value)) {
                    setDate(`${e.target.value}-01`);
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Exact Date *
              </label>
              <input
                id="client-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold"
              />
            </div>
          </div>

          {/* Assigned Admin */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Account Admin in Charge
            </label>
            <select
              id="client-admin-select"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
            >
              <option value="">-- No specific admin --</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.department})
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Internal Notes / Handoff Details (Optional)
            </label>
            <textarea
              id="client-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contract terms, deliverables, follow-up schedule, or team notes..."
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-medium resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer border border-zinc-300"
            >
              Cancel
            </button>
            <button
              id="save-client-movement-btn"
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                clientType === 'onboarded'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-pink-600 hover:bg-pink-700'
              }`}
            >
              {initialMovement ? 'Update Record' : clientType === 'onboarded' ? 'Save Onboarded Client' : 'Save Exit Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
