import React, { useState } from 'react';
import { KeyRound, X, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPassword: string;
  onChangePassword: (newPassword: string) => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  currentPassword,
  onChangePassword,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (oldPassword !== currentPassword) {
      setError('Current passcode does not match. Please enter your existing passcode.');
      return;
    }

    if (newPassword.length < 4) {
      setError('New passcode must be at least 4 characters or digits.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passcodes do not match. Please verify confirmation.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New passcode must be different from your current passcode.');
      return;
    }

    // Success
    onChangePassword(newPassword);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    setError('');
    setSuccess(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black">Change Admin Passcode</h3>
              <p className="text-[11px] text-zinc-500">Update security passcode for locked sections</p>
            </div>
          </div>
          <button
            id="close-change-password-modal-btn"
            onClick={handleClose}
            className="text-zinc-500 hover:text-black p-1 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-black">Passcode Changed!</h4>
              <p className="text-xs text-zinc-600">
                Your new admin passcode has been saved securely in your browser.
              </p>
            </div>
          ) : (
            <>
              {/* Current Password Field */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Current Passcode *</span>
                  {currentPassword === '12345' && (
                    <span className="text-[10px] text-orange-600 font-bold">Default: 12345</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showOldPass ? 'text' : 'password'}
                    required
                    autoFocus
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter current passcode..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-semibold"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-black cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  New Passcode *
                </label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter at least 4 digits/characters..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-semibold"
                  />
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-black cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  Confirm New Passcode *
                </label>
                <div className="relative">
                  <input
                    id="confirm-password-input"
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Re-enter new passcode..."
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-semibold"
                  />
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-pink-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-zinc-200">
                <button
                  id="cancel-change-password-btn"
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer border border-zinc-300"
                >
                  Cancel
                </button>
                <button
                  id="save-new-password-btn"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Passcode</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
