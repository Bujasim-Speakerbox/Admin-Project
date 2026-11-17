import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  UserPlus,
  Trash2,
  LogOut,
  Users,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Smartphone,
  Link2,
  Database,
} from 'lucide-react';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  FirestoreVerificationResult,
  verifyFirestoreWorkspaceRoundTrip,
  WorkspaceMetadata,
} from '../../services/firestoreSync';

interface TeamCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  cloudStatus: 'local' | 'connecting' | 'synced' | 'unauthorized';
  workspaceMeta: WorkspaceMetadata | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onUpdateMemberEmails: (nextEmails: string[]) => Promise<void>;
}

const SHARED_APP_URL =
  'https://ais-pre-nhw545afxw437smezbfg5v-103396233082.asia-southeast1.run.app';

export function TeamCloudModal({
  isOpen,
  onClose,
  firebaseUser,
  cloudStatus,
  workspaceMeta,
  onGoogleSignIn,
  onGoogleSignOut,
  onUpdateMemberEmails,
}: TeamCloudModalProps) {
  const [newEmail, setNewEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSavingEmails, setIsSavingEmails] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<FirestoreVerificationResult | null>(null);

  if (!isOpen) return null;

  const handleVerifyConnection = async () => {
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await verifyFirestoreWorkspaceRoundTrip();
      setVerifyResult(res);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to verify Firestore connection.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const userEmail = (firebaseUser?.email || '').toLowerCase().trim();
  const isOwner =
    userEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
    (!!workspaceMeta && workspaceMeta.ownerUid === firebaseUser?.uid);

  const memberEmails = workspaceMeta?.memberEmails || [];

  const shareUrl =
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.startsWith('ais-dev-')
      ? window.location.origin
      : SHARED_APP_URL;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setErrorMsg('Could not copy automatically. Please select and copy the URL manually.');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleaned = newEmail.toLowerCase().trim();
    if (!cleaned || !cleaned.includes('@') || !cleaned.includes('.')) {
      setErrorMsg('Please enter a valid Google email address.');
      return;
    }
    if (memberEmails.includes(cleaned)) {
      setErrorMsg('This email already has access to the workspace.');
      return;
    }
    if (memberEmails.length >= 20) {
      setErrorMsg('Maximum limit of 20 team member emails reached.');
      return;
    }

    setIsSavingEmails(true);
    try {
      await onUpdateMemberEmails([...memberEmails, cleaned]);
      setNewEmail('');
      setSuccessMsg(`Added ${cleaned}. They can now sign in and collaborate live!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to update team access.'
      );
    } finally {
      setIsSavingEmails(false);
    }
  };

  const handleRemoveMember = async (emailToRemove: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (
      emailToRemove.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
      emailToRemove.toLowerCase() === workspaceMeta?.ownerEmail?.toLowerCase()
    ) {
      return;
    }

    setIsSavingEmails(true);
    try {
      const next = memberEmails.filter(
        (e) => e.toLowerCase() !== emailToRemove.toLowerCase()
      );
      await onUpdateMemberEmails(next);
      setSuccessMsg(`Removed ${emailToRemove} from workspace access.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to remove team member.'
      );
    } finally {
      setIsSavingEmails(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white shadow-sm">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-black">
                Firebase Live Sync & Team Sharing
              </h3>
              <p className="text-[11px] font-medium text-zinc-600">
                Use across multiple devices & sync edits in real time with your team
              </p>
            </div>
          </div>
          <button
            id="close-team-cloud-modal-btn"
            onClick={onClose}
            className="text-zinc-500 hover:text-black p-1.5 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Account & Status Card */}
          {firebaseUser ? (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {firebaseUser.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt={firebaseUser.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-zinc-300 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-black flex items-center justify-center text-sm shrink-0 border border-orange-200">
                    {(firebaseUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-black truncate">
                      {firebaseUser.displayName || firebaseUser.email}
                    </span>
                    {cloudStatus === 'synced' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Sync Active
                      </span>
                    )}
                    {cloudStatus === 'connecting' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Connecting...
                      </span>
                    )}
                    {cloudStatus === 'unauthorized' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-[10px] font-bold">
                        Access Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 truncate">{firebaseUser.email}</p>
                </div>
              </div>

              <button
                id="cloud-sign-out-btn"
                type="button"
                onClick={() => {
                  onGoogleSignOut();
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-black">Not Connected to Firebase Cloud</h4>
                <p className="text-xs text-zinc-700">
                  Sign in with Google to save all changes to Firebase and sync live across devices.
                </p>
              </div>
              <button
                id="modal-google-signin-btn"
                type="button"
                onClick={onGoogleSignIn}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
              >
                Sign in with Google
              </button>
            </div>
          )}

          {/* Unauthorized Banner inside modal */}
          {cloudStatus === 'unauthorized' && firebaseUser && (
            <div className="p-3.5 rounded-xl bg-pink-50 border border-pink-200 flex items-start gap-2.5 text-xs text-pink-800">
              <AlertCircle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Your email is not yet on the authorized team list.</p>
                <p className="mt-0.5 text-pink-700">
                  Ask the workspace owner (<span className="font-bold">{BOOTSTRAP_ADMIN_EMAIL}</span>) to add{' '}
                  <span className="font-bold">{firebaseUser.email}</span> inside Team Access Management, then refresh this page.
                </p>
              </div>
            </div>
          )}

          {/* Shared App Link Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-orange-600" />
              <span>Shared Team App Link</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 px-3 py-2 text-xs font-mono bg-zinc-100 border border-zinc-300 rounded-xl text-zinc-800 focus:outline-none"
              />
              <button
                id="copy-shared-link-btn"
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Open this exact link on your phone, tablet, or another laptop — or send it to authorized teammates.
            </p>
          </div>

          {/* Team Access Management */}
          {cloudStatus === 'synced' && (
            <div className="space-y-3 pt-2 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-pink-600" />
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                    Authorized Team Members ({memberEmails.length}/20)
                  </h4>
                </div>
                {isOwner && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Workspace Owner
                  </span>
                )}
              </div>

              {isOwner ? (
                <form onSubmit={handleAddMember} className="flex items-center gap-2">
                  <input
                    id="invite-teammate-email-input"
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Enter teammate's Google email (e.g. designer@company.com)"
                    disabled={isSavingEmails}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder-zinc-400 font-medium"
                  />
                  <button
                    id="add-teammate-email-btn"
                    type="submit"
                    disabled={isSavingEmails}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    {isSavingEmails ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>Add Email</span>
                  </button>
                </form>
              ) : (
                <p className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">
                  Only the workspace owner ({workspaceMeta?.ownerEmail || BOOTSTRAP_ADMIN_EMAIL}) can add or remove team members.
                </p>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-pink-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {memberEmails.map((email) => {
                  const isRowOwner =
                    email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
                    email.toLowerCase() === workspaceMeta?.ownerEmail?.toLowerCase();
                  return (
                    <div
                      key={email}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-black truncate">{email}</span>
                        {isRowOwner && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold shrink-0">
                            Owner
                          </span>
                        )}
                        {email.toLowerCase() === userEmail && !isRowOwner && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      {isOwner && !isRowOwner && (
                        <button
                          type="button"
                          disabled={isSavingEmails}
                          onClick={() => handleRemoveMember(email)}
                          title={`Remove ${email}`}
                          className="p-1 text-zinc-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Firestore Read/Write Verification */}
              <div className="pt-3 border-t border-zinc-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-black uppercase tracking-wider">
                      Firestore Connection Check
                    </span>
                  </div>
                  <button
                    id="verify-firestore-btn"
                    type="button"
                    disabled={isVerifying}
                    onClick={handleVerifyConnection}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isVerifying ? 'Verifying...' : 'Verify Live Save & Load'}</span>
                  </button>
                </div>

                {verifyResult && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Connected &amp; Verified ({verifyResult.latencyMs} ms
                        {verifyResult.writeVerified ? ' • Server Read & Write OK' : ' • Server Read OK'})
                      </span>
                    </p>
                    <p className="text-emerald-800">
                      Synced Records: {verifyResult.counts.admins} Admins, {verifyResult.counts.projects} Projects,{' '}
                      {verifyResult.counts.designers} Designers, {verifyResult.counts.movements} Movements,{' '}
                      {verifyResult.counts.devices} Devices
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step-by-Step Multi-Device & Team Sync Guide */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-black text-black uppercase tracking-wider">
                How Multi-Device & Live Team Sync Works
              </h4>
            </div>
            <ol className="space-y-1.5 text-xs text-zinc-700 list-decimal list-inside">
              <li>
                <span className="font-bold text-black">Your own multiple devices:</span> Open the Shared Team App Link on your phone, tablet, or another computer and click{' '}
                <span className="font-semibold text-orange-700">Connect Firebase</span> using the exact same Google account (<span className="font-semibold">{BOOTSTRAP_ADMIN_EMAIL}</span>).
              </li>
              <li>
                <span className="font-bold text-black">Share with teammates:</span> Add your teammate&apos;s Google email in the box above, then copy &amp; send them the Shared Team App Link.
              </li>
              <li>
                <span className="font-bold text-black">Real-time updates:</span> Whenever anyone adds, edits, or deletes a project, admin, designer, movement, or device, everyone&apos;s open screen updates automatically in real time.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex justify-end shrink-0">
          <button
            id="done-team-cloud-modal-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
