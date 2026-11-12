import React, { useState } from 'react';
import { Lock, X, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  currentPassword?: string;
  onOpenChangePassword?: () => void;
}

export function AdminLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  currentPassword = '12345',
  onOpenChangePassword,
}: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === currentPassword) {
      setError('');
      setPassword('');
      onLoginSuccess();
      onClose();
    } else {
      setError(`Incorrect admin passcode.`);
    }
  };

  const handleFillDemoPass = () => {
    setPassword(currentPassword);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black">Admin Authentication</h3>
              <p className="text-[11px] text-zinc-500">Unlock protected sections & actions</p>
            </div>
          </div>
          <button
            id="close-login-modal-btn"
            onClick={onClose}
            className="text-zinc-500 hover:text-black p-1 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Admin Passcode</span>
              {currentPassword === '12345' && (
                <span className="text-[10px] text-orange-600 font-bold">Default: 12345</span>
              )}
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPass ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter admin passcode..."
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-semibold"
              />
              <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-black cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-pink-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-600 flex items-center justify-between">
            <span className="font-medium text-zinc-600">Quick fill passcode:</span>
            <button
              type="button"
              onClick={handleFillDemoPass}
              className="px-2.5 py-1 rounded bg-orange-100 hover:bg-orange-200 border border-orange-200 text-orange-800 font-bold text-[11px] transition-colors cursor-pointer"
            >
              {currentPassword === '12345' ? 'Use 12345' : 'Fill Current'}
            </button>
          </div>

          {onOpenChangePassword && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChangePassword();
                }}
                className="text-xs text-orange-600 hover:text-orange-700 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Admin Passcode</span>
              </button>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-zinc-200">
            <button
              id="cancel-login-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer border border-zinc-300"
            >
              Cancel
            </button>
            <button
              id="submit-login-modal-btn"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Log In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
