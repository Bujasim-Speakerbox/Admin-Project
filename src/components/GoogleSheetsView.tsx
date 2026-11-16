import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  PlusCircle,
  Link2,
  RefreshCw,
  ExternalLink,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  UploadCloud,
  Table as TableIcon,
  CalendarPlus,
  Users,
  Smartphone,
  FolderKanban,
} from 'lucide-react';
import {
  Admin,
  BillingCycle,
  ClientMovement,
  DeviceAllocation,
  Project,
} from '../types';
import {
  initAuth,
  googleSignIn,
  googleLogout,
  getAccessToken,
} from '../services/googleAuth';
import {
  SpreadsheetMetadata,
  fetchSpreadsheetMetadata,
  createNewSpreadsheet,
  readSheetValues,
  replaceSheetValues,
  appendSheetRows,
} from '../services/googleSheets';
import { SheetConfirmConfig, SheetConfirmModal } from './modals/SheetConfirmModal';

interface GoogleSheetsViewProps {
  admins: Admin[];
  projects: Project[];
  movements: ClientMovement[];
  devices: DeviceAllocation[];
}

const SAVED_SHEET_STORAGE_KEY = 'admin_portal_linked_sheet_id_v1';

const BILLING_CYCLES: BillingCycle[] = [
  '1 to 30 or 31',
  '5 to 5',
  '10 to 10',
  '15 to 15',
  '20 to 20',
  '25 to 25',
];

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  admins,
  projects,
  movements,
  devices,
}) => {
  // Auth state (access token is kept strictly in memory in googleAuth.ts + component state)
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
  const [needsAuth, setNeedsAuth] = useState<boolean>(() => !getAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Beginner induction guide toggle
  const [showInduction, setShowInduction] = useState(true);

  // Sheet connection state
  const [sheetInput, setSheetInput] = useState<string>(() => {
    return localStorage.getItem(SAVED_SHEET_STORAGE_KEY) || '';
  });
  const [metadata, setMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [selectedTabTitle, setSelectedTabTitle] = useState<string>('');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // Live preview rows state
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Feedback banner
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Quick Date Collector Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [collectDate, setCollectDate] = useState<string>(todayStr);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || 'custom'
  );
  const [customEntryLabel, setCustomEntryLabel] = useState<string>('');
  const [selectedAdminId, setSelectedAdminId] = useState<string>(
    admins[0]?.id || ''
  );
  const [collectCycle, setCollectCycle] = useState<BillingCycle>('1 to 30 or 31');
  const [collectNotes, setCollectNotes] = useState<string>('');

  // Confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<SheetConfirmConfig>({
    isOpen: false,
    title: '',
    description: '',
    spreadsheetTitle: '',
    sheetTabTitle: '',
    rowCount: 0,
    isOverwrite: false,
    onConfirm: () => {},
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize Firebase auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      (authUser) => {
        setUser(authUser);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-load saved spreadsheet metadata once signed in with an access token
  useEffect(() => {
    const savedId = localStorage.getItem(SAVED_SHEET_STORAGE_KEY);
    if (accessToken && savedId && !metadata) {
      handleLoadExistingSheet(savedId, accessToken, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Keep form admin/cycle synced when picking an existing project
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== 'custom') {
      const proj = projects.find((p) => p.id === selectedProjectId);
      if (proj) {
        setSelectedAdminId(proj.adminId);
        if (proj.billingCycle) {
          setCollectCycle(proj.billingCycle);
        }
      }
    }
  }, [selectedProjectId, projects]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        setStatusMessage({
          type: 'success',
          text: `Signed in as ${result.user.email || result.user.displayName}. You can now create or connect a Google Sheet!`,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.';
      setStatusMessage({
        type: 'error',
        text: message,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleLogout();
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
    setMetadata(null);
    setPreviewRows([]);
    setStatusMessage({
      type: 'info',
      text: 'Disconnected from Google Sheets. Sign in again whenever you are ready.',
    });
  };

  const requireToken = (): string | null => {
    const token = accessToken || getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setStatusMessage({
        type: 'error',
        text: 'Please sign in with Google first (Step 1) to access Google Sheets.',
      });
      return null;
    }
    return token;
  };

  const handleLoadExistingSheet = async (
    idOrUrl: string = sheetInput,
    tokenOverride?: string,
    silent = false
  ) => {
    const token = tokenOverride || requireToken();
    if (!token) return;

    if (!idOrUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please paste a Google Sheet link or Spreadsheet ID.',
      });
      return;
    }

    setIsLoadingSheet(true);
    if (!silent) setStatusMessage(null);
    try {
      const meta = await fetchSpreadsheetMetadata(token, idOrUrl);
      setMetadata(meta);
      localStorage.setItem(SAVED_SHEET_STORAGE_KEY, meta.spreadsheetId);
      setSheetInput(meta.spreadsheetId);
      const firstTab = meta.sheets[0]?.title || '';
      setSelectedTabTitle(firstTab);

      if (firstTab) {
        const rows = await readSheetValues(token, meta.spreadsheetId, firstTab);
        setPreviewRows(rows);
      }

      if (!silent) {
        setStatusMessage({
          type: 'success',
          text: `Connected to "${meta.title}" (${meta.sheets.length} tab${
            meta.sheets.length === 1 ? '' : 's'
          } found).`,
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Could not load that Google Sheet.';
      if (!silent) {
        setStatusMessage({
          type: 'error',
          text: `${msg} Make sure you signed in with the Google account that has access to this sheet.`,
        });
      }
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleCreateStarterSheet = async () => {
    const token = requireToken();
    if (!token) return;

    setIsCreatingSheet(true);
    setStatusMessage(null);
    try {
      const sheetTitle = `Admin Project Manager - Data & Dates (${todayStr})`;
      const meta = await createNewSpreadsheet(token, sheetTitle, [
        'Date Log',
        'Projects & Dates',
        'Client Movements',
        'Device Allocations',
      ]);

      setMetadata(meta);
      localStorage.setItem(SAVED_SHEET_STORAGE_KEY, meta.spreadsheetId);
      setSheetInput(meta.spreadsheetId);
      setSelectedTabTitle('Date Log');
      setPreviewRows([]);

      setStatusMessage({
        type: 'success',
        text: `Created new Google Sheet "${meta.title}" with 4 ready-to-use tabs! Proceed to Step 3 below to collect dates or sync your data.`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create Google Sheet.';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleRefreshPreview = async (tabName?: string) => {
    const token = requireToken();
    if (!token || !metadata) return;
    const targetTab = tabName || selectedTabTitle;
    if (!targetTab) return;

    setIsLoadingPreview(true);
    try {
      const rows = await readSheetValues(token, metadata.spreadsheetId, targetTab);
      setPreviewRows(rows);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch live sheet rows.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleTabSelectionChange = (newTab: string) => {
    setSelectedTabTitle(newTab);
    handleRefreshPreview(newTab);
  };

  // Helper to resolve target tab if user has a starter sheet vs custom sheet
  const getTargetTab = (preferredTab: string): string => {
    if (!metadata) return selectedTabTitle;
    const exactMatch = metadata.sheets.find((s) => s.title === preferredTab);
    return exactMatch ? exactMatch.title : selectedTabTitle;
  };

  // Action 1: Collect a single Date row (Quick Date Collector)
  const handleCollectDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = requireToken();
    if (!token) return;
    if (!metadata) {
      setStatusMessage({
        type: 'error',
        text: 'Please create or connect a Google Sheet first in Step 2.',
      });
      return;
    }

    const projectObj =
      selectedProjectId !== 'custom'
        ? projects.find((p) => p.id === selectedProjectId)
        : null;
    const label = projectObj
      ? projectObj.name
      : customEntryLabel.trim() || 'General Date Entry';
    const adminObj = admins.find((a) => a.id === selectedAdminId);
    const targetTab = getTargetTab('Date Log');

    const headers = [
      'Collected Date',
      'Project / Label',
      'Project Type',
      'Assigned Admin',
      'Billing Cycle',
      'Notes',
      'Recorded At',
    ];

    const row = [
      collectDate,
      label,
      projectObj
        ? projectObj.projectType === 'branding'
          ? 'Branding / One-time'
          : 'Social Media'
        : 'Custom Entry',
      adminObj?.name || 'Unassigned',
      collectCycle,
      collectNotes.trim() || '-',
      new Date().toLocaleString(),
    ];

    setConfirmConfig({
      isOpen: true,
      title: 'Collect Date Row to Google Sheet?',
      description: `Append a new date record (${collectDate}) for "${label}" into your Google Sheet.`,
      spreadsheetTitle: metadata.title,
      sheetTabTitle: targetTab,
      rowCount: 1,
      isOverwrite: false,
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          await appendSheetRows(
            token,
            metadata.spreadsheetId,
            targetTab,
            [row],
            headers
          );
          setSelectedTabTitle(targetTab);
          await handleRefreshPreview(targetTab);
          setCollectNotes('');
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          setStatusMessage({
            type: 'success',
            text: `Collected date "${collectDate}" for "${label}" into tab "${targetTab}"!`,
          });
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Failed to append date row.';
          setStatusMessage({ type: 'error', text: msg });
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Action 2: Sync all Projects & Dates
  const handleSyncProjects = () => {
    const token = requireToken();
    if (!token || !metadata) return;

    const targetTab = getTargetTab('Projects & Dates');
    const headers = [
      'Project Name',
      'Assigned Admin',
      'Project Type',
      'Category / Industry',
      'Billing Cycle',
      'Start Date',
      'End Date',
      'Status',
      'Priority',
      'Created Date',
    ];

    const rows = projects.map((p) => {
      const admin = admins.find((a) => a.id === p.adminId);
      return [
        p.name,
        admin?.name || 'Unassigned',
        p.projectType === 'branding' ? 'Branding / One-time' : 'Social Media',
        p.category || '',
        p.billingCycle || '1 to 30 or 31',
        p.startDate || '',
        p.endDate || p.dueDate || '',
        p.status,
        p.priority,
        p.createdAt || '',
      ];
    });

    setConfirmConfig({
      isOpen: true,
      title: 'Sync All Projects & Dates?',
      description: `Export all ${projects.length} projects along with their billing cycles, start dates, end dates, and assigned admins.`,
      spreadsheetTitle: metadata.title,
      sheetTabTitle: targetTab,
      rowCount: rows.length + 1,
      isOverwrite: true,
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          await replaceSheetValues(token, metadata.spreadsheetId, targetTab, [
            headers,
            ...rows,
          ]);
          setSelectedTabTitle(targetTab);
          await handleRefreshPreview(targetTab);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          setStatusMessage({
            type: 'success',
            text: `Synced ${projects.length} projects and their dates to "${targetTab}".`,
          });
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Failed to sync projects.';
          setStatusMessage({ type: 'error', text: msg });
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Action 3: Sync Client Movements
  const handleSyncMovements = () => {
    const token = requireToken();
    if (!token || !metadata) return;

    const targetTab = getTargetTab('Client Movements');
    const headers = [
      'Movement Type',
      'Project / Client Name',
      'Assigned Admin',
      'Month',
      'Date',
      'Brand Type (Onboarded)',
      'Exit Reason (Exit)',
      'Notes',
    ];

    const rows = movements.map((m) => {
      const admin = admins.find((a) => a.id === m.adminId);
      return [
        m.clientType === 'onboarded' ? 'Onboarded' : 'Exit',
        m.projectName,
        admin?.name || 'Unassigned',
        m.month,
        m.date,
        m.brandType || '-',
        m.exitReason || '-',
        m.notes || '-',
      ];
    });

    setConfirmConfig({
      isOpen: true,
      title: 'Sync Client Movements?',
      description: `Export all ${movements.length} client onboarding and exit records with months and dates.`,
      spreadsheetTitle: metadata.title,
      sheetTabTitle: targetTab,
      rowCount: rows.length + 1,
      isOverwrite: true,
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          await replaceSheetValues(token, metadata.spreadsheetId, targetTab, [
            headers,
            ...rows,
          ]);
          setSelectedTabTitle(targetTab);
          await handleRefreshPreview(targetTab);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          setStatusMessage({
            type: 'success',
            text: `Synced ${movements.length} client movement records to "${targetTab}".`,
          });
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Failed to sync client movements.';
          setStatusMessage({ type: 'error', text: msg });
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Action 4: Sync Device Allocations
  const handleSyncDevices = () => {
    const token = requireToken();
    if (!token || !metadata) return;

    const targetTab = getTargetTab('Device Allocations');
    const headers = [
      'Admin Name',
      'Device Name',
      'SIM Number',
      'Device Type',
      'Carrier',
      'IMEI / Serial',
      'Status',
      'Allocated Date',
      'Notes',
    ];

    const rows = devices.map((d) => {
      const admin = admins.find((a) => a.id === d.adminId);
      return [
        admin?.name || d.adminName || 'Unassigned',
        d.deviceName,
        d.simNumber,
        d.deviceType || '-',
        d.carrier || '-',
        d.imeiOrSerial || '-',
        d.status,
        d.allocatedDate,
        d.notes || '-',
      ];
    });

    setConfirmConfig({
      isOpen: true,
      title: 'Sync Device Allocations?',
      description: `Export all ${devices.length} device & SIM allocations along with allocated dates.`,
      spreadsheetTitle: metadata.title,
      sheetTabTitle: targetTab,
      rowCount: rows.length + 1,
      isOverwrite: true,
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          await replaceSheetValues(token, metadata.spreadsheetId, targetTab, [
            headers,
            ...rows,
          ]);
          setSelectedTabTitle(targetTab);
          await handleRefreshPreview(targetTab);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          setStatusMessage({
            type: 'success',
            text: `Synced ${devices.length} device allocations to "${targetTab}".`,
          });
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Failed to sync devices.';
          setStatusMessage({ type: 'error', text: msg });
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Step progress evaluation
  const isStep1Done = !needsAuth && !!accessToken;
  const isStep2Done = isStep1Done && !!metadata;
  const isStep3Ready = isStep2Done;

  return (
    <div id="google-sheets-view" className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-black">
                Google Sheets Collector & Sync
              </h2>
              {isStep1Done ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Not Signed In
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-zinc-600">
              Collect project dates, billing cycles, client movements, and device logs directly in Google Sheets.
            </p>
          </div>
        </div>

        <button
          id="toggle-induction-guide-btn"
          type="button"
          onClick={() => setShowInduction(!showInduction)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors cursor-pointer self-start sm:self-center"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{showInduction ? 'Hide Step-by-Step Guide' : 'Show Step-by-Step Guide'}</span>
          {showInduction ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Step-by-Step Induction Guide for Beginners */}
      {showInduction && (
        <div
          id="beginner-induction-guide"
          className="bg-gradient-to-br from-orange-50/70 via-white to-pink-50/70 border border-orange-200 rounded-2xl p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-black text-black uppercase tracking-wider">
                Beginner Induction: 4 Easy Steps to Collect Dates in Google Sheets
              </h3>
            </div>
            <span className="text-[11px] font-bold text-zinc-600">
              Follow steps 1 → 4 in order
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1 Card */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                isStep1Done
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-white border-orange-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isStep1Done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-orange-600 text-white'
                  }`}
                >
                  STEP 1
                </span>
                {isStep1Done && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <h4 className="text-xs font-black text-black mb-1">
                Sign in with Google
              </h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Click the <strong>Sign in with Google</strong> button below and choose your Google account so the app has permission to write to your Sheets.
              </p>
            </div>

            {/* Step 2 Card */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                isStep2Done
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : isStep1Done
                  ? 'bg-white border-orange-300 shadow-xs'
                  : 'bg-zinc-50/70 border-zinc-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isStep2Done
                      ? 'bg-emerald-600 text-white'
                      : isStep1Done
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-300 text-zinc-700'
                  }`}
                >
                  STEP 2
                </span>
                {isStep2Done && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <h4 className="text-xs font-black text-black mb-1">
                Create or Link a Sheet
              </h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                New here? Click <strong>Create New Google Sheet</strong> to build a ready-made spreadsheet automatically—or paste an existing Google Sheet link.
              </p>
            </div>

            {/* Step 3 Card */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                isStep3Ready
                  ? 'bg-white border-orange-300 shadow-xs'
                  : 'bg-zinc-50/70 border-zinc-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isStep3Ready
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-300 text-zinc-700'
                  }`}
                >
                  STEP 3
                </span>
              </div>
              <h4 className="text-xs font-black text-black mb-1">
                Collect Dates & Data
              </h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Pick a date in <strong>Quick Date Collector</strong> to add a single row, or click <strong>Sync All Projects & Dates</strong> to export everything at once.
              </p>
            </div>

            {/* Step 4 Card */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                previewRows.length > 0
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : isStep3Ready
                  ? 'bg-white border-zinc-200'
                  : 'bg-zinc-50/70 border-zinc-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    previewRows.length > 0
                      ? 'bg-emerald-600 text-white'
                      : isStep3Ready
                      ? 'bg-pink-600 text-white'
                      : 'bg-zinc-300 text-zinc-700'
                  }`}
                >
                  STEP 4
                </span>
                {previewRows.length > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <h4 className="text-xs font-black text-black mb-1">
                View & Verify Live Rows
              </h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Click <strong>Open in Google Sheets</strong> to view your spreadsheet in a new tab, or preview your collected rows in the live table below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {statusMessage && (
        <div
          id="sheets-status-banner"
          className={`flex items-start gap-2.5 p-4 rounded-2xl border text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-pink-50 border-pink-300 text-pink-900'
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{statusMessage.text}</span>
        </div>
      )}

      {/* STEP 1 & STEP 2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STEP 1: Google Account Connection */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-orange-700 border border-orange-200">
                STEP 1
              </span>
              <h3 className="text-base font-black text-black">
                Connect Google Account
              </h3>
            </div>
            {isStep1Done && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Ready
              </span>
            )}
          </div>

          {needsAuth ? (
            <div className="space-y-4">
              <p className="text-xs text-zinc-600 leading-relaxed">
                Sign in with your Google account to create new Google Sheets or update existing ones with your project dates and records.
              </p>
              <div>
                <button
                  id="google-signin-btn"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        style={{ display: 'block' }}
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        ></path>
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        ></path>
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        ></path>
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        ></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
                    </span>
                    <span style={{ display: 'none' }}>Sign in with Google</span>
                  </div>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Tip: If a popup is blocked by your browser, allow popups for this site and click again.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-zinc-300 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center shrink-0">
                    {(user?.email || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-black text-black truncate">
                    {user?.displayName || 'Google Account Connected'}
                  </p>
                  <p className="text-xs text-zinc-600 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                id="google-signout-btn"
                type="button"
                onClick={handleGoogleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          )}
        </div>

        {/* STEP 2: Create or Connect Google Sheet */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-orange-700 border border-orange-200">
                STEP 2
              </span>
              <h3 className="text-base font-black text-black">
                Select or Create Google Sheet
              </h3>
            </div>
            {metadata && (
              <a
                id="open-google-sheet-link"
                href={metadata.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <span>Open in Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="space-y-3">
            {/* Option A: One-Click Create New Sheet */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-orange-50/50 border border-orange-200">
              <div>
                <p className="text-xs font-black text-black">
                  New to Google Sheets?
                </p>
                <p className="text-[11px] text-zinc-600">
                  Automatically create a clean spreadsheet with 4 pre-formatted tabs.
                </p>
              </div>
              <button
                id="create-starter-sheet-btn"
                type="button"
                disabled={!isStep1Done || isCreatingSheet}
                onClick={handleCreateStarterSheet}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {isCreatingSheet ? 'Creating...' : 'Create New Google Sheet'}
                </span>
              </button>
            </div>

            {/* Option B: Connect Existing Sheet by URL or ID */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Or Paste Existing Google Sheet Link / ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  <input
                    id="existing-sheet-url-input"
                    type="text"
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-black font-medium"
                  />
                </div>
                <button
                  id="load-existing-sheet-btn"
                  type="button"
                  disabled={!isStep1Done || isLoadingSheet}
                  onClick={() => handleLoadExistingSheet()}
                  className="px-4 py-2 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {isLoadingSheet ? 'Loading...' : 'Load Sheet'}
                </button>
              </div>
            </div>

            {/* Connected Sheet Info & Dynamic Tab Selector */}
            {metadata && (
              <div className="pt-2 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-500 font-semibold">
                    Connected Spreadsheet:
                  </p>
                  <p className="text-xs font-black text-black truncate">
                    {metadata.title}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-[11px] font-bold text-zinc-600">
                    Active Tab:
                  </label>
                  <select
                    id="sheet-tab-selector"
                    value={selectedTabTitle}
                    onChange={(e) => handleTabSelectionChange(e.target.value)}
                    className="text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-black font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    {metadata.sheets.map((tab) => (
                      <option key={tab.sheetId} value={tab.title}>
                        {tab.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STEP 3: Collect Dates & Sync Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Quick Date Collector */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-orange-700 border border-orange-200">
                STEP 3A
              </span>
              <h3 className="text-base font-black text-black flex items-center gap-1.5">
                <CalendarPlus className="w-4 h-4 text-orange-600" />
                <span>Collect Date Entry</span>
              </h3>
            </div>
          </div>

          <p className="text-xs text-zinc-600">
            Log a specific date for a project or custom task and append it directly as a new row in your Google Sheet.
          </p>

          <form onSubmit={handleCollectDateSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  Date to Collect *
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-orange-600 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    id="collect-date-input"
                    type="date"
                    required
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  Billing Cycle
                </label>
                <select
                  id="collect-cycle-select"
                  value={collectCycle}
                  onChange={(e) => setCollectCycle(e.target.value as BillingCycle)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-bold cursor-pointer"
                >
                  {BILLING_CYCLES.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {cycle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  Project / Client
                </label>
                <select
                  id="collect-project-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="custom">+ Custom Label / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  Assigned Admin
                </label>
                <select
                  id="collect-admin-select"
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold cursor-pointer"
                >
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedProjectId === 'custom' && (
              <div>
                <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                  Custom Label *
                </label>
                <input
                  id="collect-custom-label-input"
                  type="text"
                  required
                  value={customEntryLabel}
                  onChange={(e) => setCustomEntryLabel(e.target.value)}
                  placeholder="e.g. Monthly Billing Check-in"
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-semibold"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                Notes (Optional)
              </label>
              <input
                id="collect-notes-input"
                type="text"
                value={collectNotes}
                onChange={(e) => setCollectNotes(e.target.value)}
                placeholder="e.g. Invoice sent, content calendar approved..."
                className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-black font-medium"
              />
            </div>

            <button
              id="collect-date-submit-btn"
              type="submit"
              disabled={!isStep3Ready || isSyncing}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Collect Date to Google Sheet</span>
            </button>
          </form>
        </div>

        {/* Card B: One-Click Full Dataset Sync */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pink-50 text-pink-700 border border-pink-200">
                STEP 3B
              </span>
              <h3 className="text-base font-black text-black flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-pink-600" />
                <span>Sync Full App Data & Dates</span>
              </h3>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Export your complete dashboard tables—including start dates, end dates, billing cycles, client onboarding/exit dates, and device allocation dates—in one click.
            </p>

            <div className="space-y-2.5">
              <button
                id="sync-projects-sheet-btn"
                type="button"
                disabled={!isStep3Ready || isSyncing}
                onClick={handleSyncProjects}
                className="w-full p-3.5 rounded-xl border border-zinc-200 hover:border-orange-300 hover:bg-orange-50/40 transition-all flex items-center justify-between gap-3 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-black">
                      Sync All Projects & Dates ({projects.length})
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Writes Project Name, Admin, Billing Cycle, Start & End Dates
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-600 text-white shrink-0">
                  Sync
                </span>
              </button>

              <button
                id="sync-movements-sheet-btn"
                type="button"
                disabled={!isStep3Ready || isSyncing}
                onClick={handleSyncMovements}
                className="w-full p-3.5 rounded-xl border border-zinc-200 hover:border-pink-300 hover:bg-pink-50/40 transition-all flex items-center justify-between gap-3 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-black">
                      Sync Client Movements ({movements.length})
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Writes Onboarded/Exit status, Month, Exact Date & Brand/Reason
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-pink-600 text-white shrink-0">
                  Sync
                </span>
              </button>

              <button
                id="sync-devices-sheet-btn"
                type="button"
                disabled={!isStep3Ready || isSyncing}
                onClick={handleSyncDevices}
                className="w-full p-3.5 rounded-xl border border-zinc-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all flex items-center justify-between gap-3 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-black">
                      Sync Device Allocations ({devices.length})
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Writes Admin, Device Name, SIM Number & Allocated Date
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-600 text-white shrink-0">
                  Sync
                </span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
            Note: You will always see a confirmation window before any spreadsheet tab is updated.
          </p>
        </div>
      </div>

      {/* STEP 4: Live Sheet Preview */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              STEP 4
            </span>
            <h3 className="text-sm font-black text-black flex items-center gap-1.5">
              <TableIcon className="w-4 h-4 text-emerald-600" />
              <span>
                Live Google Sheet Preview
                {selectedTabTitle ? ` — "${selectedTabTitle}"` : ''}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-sheet-preview-btn"
              type="button"
              disabled={!isStep3Ready || isLoadingPreview}
              onClick={() => handleRefreshPreview()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black bg-white hover:bg-zinc-100 border border-zinc-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`}
              />
              <span>{isLoadingPreview ? 'Refreshing...' : 'Refresh Preview'}</span>
            </button>
          </div>
        </div>

        {!metadata ? (
          <div className="p-10 text-center text-xs text-zinc-500">
            Complete <strong>Step 1</strong> (Sign in) and <strong>Step 2</strong> (Create or Connect a Google Sheet) to preview your live spreadsheet rows here.
          </div>
        ) : previewRows.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-500">
            This tab (<strong>{selectedTabTitle}</strong>) is currently empty. Use <strong>Step 3A</strong> or <strong>Step 3B</strong> above to collect dates or sync your data!
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 sticky top-0">
                <tr>
                  {previewRows[0].map((headerCell, idx) => (
                    <th
                      key={idx}
                      className="py-2.5 px-4 font-black text-black uppercase tracking-wider whitespace-nowrap"
                    >
                      {headerCell || `Column ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {previewRows.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-orange-50/30 transition-colors">
                    {previewRows[0].map((_, colIdx) => (
                      <td
                        key={colIdx}
                        className="py-2.5 px-4 text-zinc-800 font-medium whitespace-nowrap"
                      >
                        {row[colIdx] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mandatory Confirmation Modal before mutating Google Sheet data */}
      <SheetConfirmModal
        config={confirmConfig}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        isProcessing={isSyncing}
      />
    </div>
  );
};
