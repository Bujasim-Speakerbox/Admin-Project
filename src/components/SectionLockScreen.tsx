import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface SectionLockScreenProps {
  sectionTitle: string;
  sectionDescription: string;
  currentPassword: string;
  onUnlockSuccess: () => void;
  onOpenChangePassword?: () => void;
}

export const SectionLockScreen: React.FC<SectionLockScreenProps> = ({
  sectionTitle,
  sectionDescription,
  currentPassword,
  onUnlockSuccess,
  onOpenChangePassword,
}) => {
  const [enteredPassword, setEnteredPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword === currentPassword) {
      setError('');
      setEnteredPassword('');
      onUnlockSuccess();
    } else {
      setError('Incorrect passcode. Please enter the correct admin passcode.');
    }
  };

  const handleFillDemo = () => {
    setEnteredPassword(currentPassword);
    setError('');
  };

  return (
    <div id="section-lock-container" className="py-12 px-4 flex items-center justify-center min-h-[500px]">
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-lg text-center space-y-6 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600" />

        {/* Lock Shield Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 flex items-center justify-center mx-auto text-orange-600 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
            <Lock className="w-3.5 h-3.5" />
            <span>Passcode Protected Section</span>
          </div>
          <h2 className="text-2xl font-black text-black tracking-tight">
            {sectionTitle}
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            {sectionDescription}
          </p>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4 pt-2">
          <div>
            <div className="relative">
              <input
                id="section-passcode-input"
                type={showPass ? 'text' : 'password'}
                autoFocus
                value={enteredPassword}
                onChange={(e) => {
                  setEnteredPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter admin passcode to unlock..."
                className="w-full pl-10 pr-10 py-3 text-sm bg-zinc-50 border border-zinc-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-black placeholder-zinc-400 font-semibold text-center transition-all shadow-inner"
              />
              <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-black cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="unlock-section-btn"
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Unlock Section</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        {/* Footer Quick Options */}
        <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Passcode hint:</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
            >
              {currentPassword === '12345' ? 'Use default (12345)' : 'Quick-fill'}
            </button>
          </div>

          {onOpenChangePassword && (
            <button
              type="button"
              onClick={onOpenChangePassword}
              className="text-zinc-600 hover:text-black font-semibold hover:underline cursor-pointer flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5 text-orange-600" />
              <span>Change Passcode</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
