import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  UserMinus,
  Calendar,
  Sparkles,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Admin, Project, ClientMovement, ClientMovementType } from '../types';

interface ClientMovementViewProps {
  movements: ClientMovement[];
  admins: Admin[];
  projects: Project[];
  isAdminLoggedIn: boolean;
  onOpenAddClient: (type?: ClientMovementType, month?: string) => void;
  onEditClient: (movement: ClientMovement) => void;
  onDeleteClient: (movementId: string) => void;
  onRequireAdminAuth: (action: () => void) => void;
}

export const ClientMovementView: React.FC<ClientMovementViewProps> = ({
  movements,
  admins,
  onOpenAddClient,
  onEditClient,
  onDeleteClient,
  onRequireAdminAuth,
}) => {
  // Top right selections
  // 1. Client option: 'all' | 'onboarded' | 'exit'
  const [selectedType, setSelectedType] = useState<'all' | 'onboarded' | 'exit'>('all');
  // 2. Month-wise selector: 'all' or 'YYYY-MM'
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  // Additional search and admin filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('all');

  // Compute all available months from movements sorted descending
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    movements.forEach((m) => {
      if (m.month) monthsSet.add(m.month);
    });
    // Ensure current month is available even if no movements
    const currentMonth = new Date().toISOString().substring(0, 7);
    monthsSet.add(currentMonth);

    return Array.from(monthsSet).sort().reverse();
  }, [movements]);

  // Format month label like "November 2026"
  const formatMonthLabel = (monthStr: string) => {
    if (!monthStr || monthStr === 'all') return 'All Months';
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  // Format date like "Nov 03, 2026"
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Filtered movements based on top-right option, month-wise selection, search, and admin
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Top right type selection
      if (selectedType !== 'all' && m.clientType !== selectedType) {
        return false;
      }
      // Top right month-wise selection
      if (selectedMonth !== 'all' && m.month !== selectedMonth) {
        return false;
      }
      // Admin filter
      if (selectedAdminId !== 'all' && m.adminId !== selectedAdminId) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesProject = m.projectName.toLowerCase().includes(query);
        const matchesBrand = m.brandType?.toLowerCase().includes(query);
        const matchesExitReason = m.exitReason?.toLowerCase().includes(query);
        const matchesNotes = m.notes?.toLowerCase().includes(query);
        const admin = admins.find((a) => a.id === m.adminId);
        const matchesAdmin = admin?.name.toLowerCase().includes(query);

        if (!matchesProject && !matchesBrand && !matchesExitReason && !matchesNotes && !matchesAdmin) {
          return false;
        }
      }
      return true;
    });
  }, [movements, selectedType, selectedMonth, selectedAdminId, searchQuery, admins]);

  // Aggregate stats for the current view
  const stats = useMemo(() => {
    const scopeMovements = movements.filter((m) => {
      if (selectedMonth !== 'all' && m.month !== selectedMonth) return false;
      if (selectedAdminId !== 'all' && m.adminId !== selectedAdminId) return false;
      return true;
    });

    const onboarded = scopeMovements.filter((m) => m.clientType === 'onboarded');
    const exit = scopeMovements.filter((m) => m.clientType === 'exit');
    const net = onboarded.length - exit.length;

    // Distinct brand types count
    const brandTypes = new Set(onboarded.map((o) => o.brandType).filter(Boolean));

    return {
      totalOnboarded: onboarded.length,
      totalExit: exit.length,
      netMovement: net,
      brandTypesCount: brandTypes.size,
    };
  }, [movements, selectedMonth, selectedAdminId]);

  // Group filtered movements by month
  const groupedByMonth = useMemo(() => {
    const groups: { [month: string]: ClientMovement[] } = {};
    filteredMovements.forEach((m) => {
      const key = m.month || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });

    // Sort items within each month descending by date
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    // Return keys sorted descending
    const sortedKeys = Object.keys(groups).sort().reverse();
    return sortedKeys.map((key) => ({
      month: key,
      items: groups[key],
    }));
  }, [filteredMovements]);

  // Handle month stepping with < >
  const handlePrevMonth = () => {
    if (selectedMonth === 'all') {
      if (availableMonths.length > 0) setSelectedMonth(availableMonths[0]);
      return;
    }
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[idx + 1]);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'all') return;
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx > 0) {
      setSelectedMonth(availableMonths[idx - 1]);
    } else {
      setSelectedMonth('all');
    }
  };

  return (
    <div id="client-lifecycle-page" className="space-y-6">
      {/* Top Header & Prominent Top-Right Option Selectors */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title and Description */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-black tracking-tight">
                  Client Movement Tracker
                </h2>
                <p className="text-xs text-zinc-500">
                  Month-wise registry of Onboarded Clients (with brand types) and Exit Clients (with exit reasons)
                </p>
              </div>
            </div>
          </div>

          {/* TOP RIGHT SELECTION SECTION: User requested option from top right */}
          <div id="top-right-client-options" className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            {/* Top Right Option 1: Onboarded vs Exit Client Selector */}
            <div className="inline-flex p-1 bg-zinc-100 border border-zinc-200 rounded-xl shadow-xs">
              <button
                id="select-option-all"
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedType === 'all'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                All Clients
              </button>
              <button
                id="select-option-onboarded"
                onClick={() => setSelectedType('onboarded')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedType === 'onboarded'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-emerald-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Onboarded</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedType === 'onboarded' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {stats.totalOnboarded}
                </span>
              </button>
              <button
                id="select-option-exit"
                onClick={() => setSelectedType('exit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedType === 'exit'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-pink-700'
                }`}
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Exit Clients</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedType === 'exit' ? 'bg-pink-700 text-white' : 'bg-pink-100 text-pink-800'
                }`}>
                  {stats.totalExit}
                </span>
              </button>
            </div>

            {/* Top Right Option 2: Month-wise Selector */}
            <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-xl p-1">
              <button
                id="prev-month-btn"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 text-zinc-600 hover:text-black hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <select
                  id="top-right-month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-black focus:outline-none cursor-pointer py-1 pr-1"
                >
                  <option value="all" className="bg-white text-black">
                    All Months
                  </option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="bg-white text-black">
                      {formatMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="next-month-btn"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 text-zinc-600 hover:text-black hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Top Right Action: Add Client Movement */}
            <button
              id="top-right-add-client-btn"
              onClick={() => {
                onRequireAdminAuth(() => {
                  onOpenAddClient(
                    selectedType === 'exit' ? 'exit' : 'onboarded',
                    selectedMonth !== 'all' ? selectedMonth : undefined
                  );
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Client</span>
            </button>
          </div>
        </div>

        {/* Selected Month Banner & Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-200">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Viewing Period</span>
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <p className="text-sm font-bold text-black mt-1 truncate">
              {formatMonthLabel(selectedMonth)}
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Onboarded</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-700">{stats.totalOnboarded}</span>
              <span className="text-[10px] text-emerald-800 font-semibold">
                {stats.brandTypesCount} brand types
              </span>
            </div>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Total Exited</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-pink-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-pink-700">{stats.totalExit}</span>
              <span className="text-[10px] text-pink-800 font-semibold">completed / churn</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Net Client Delta</span>
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <p className={`text-xl font-black mt-1 ${
              stats.netMovement > 0
                ? 'text-emerald-700'
                : stats.netMovement < 0
                ? 'text-pink-700'
                : 'text-black'
            }`}>
              {stats.netMovement > 0 ? `+${stats.netMovement}` : stats.netMovement}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="client-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, brand type, or exit reason..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black placeholder-zinc-400 font-medium shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-black font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter by Admin */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            id="client-admin-filter"
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            className="text-xs bg-white border border-zinc-300 rounded-xl px-3 py-2 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs cursor-pointer"
          >
            <option value="all">All Admins</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content: Month-wise Client Cards */}
      {groupedByMonth.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-black">No client movements found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No records matching "${searchQuery}". Try clearing search.`
              : `No ${selectedType !== 'all' ? selectedType : ''} records recorded for ${formatMonthLabel(selectedMonth)}.`}
          </p>
          <button
            onClick={() => {
              onRequireAdminAuth(() => {
                onOpenAddClient(
                  selectedType === 'exit' ? 'exit' : 'onboarded',
                  selectedMonth !== 'all' ? selectedMonth : undefined
                );
              });
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Client</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByMonth.map((group) => {
            const monthOnboarded = group.items.filter((m) => m.clientType === 'onboarded');
            const monthExit = group.items.filter((m) => m.clientType === 'exit');

            return (
              <div 
                key={group.month} 
                id={`month-section-${group.month}`}
                className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm"
              >
                {/* Month Group Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-black">
                        {formatMonthLabel(group.month)}
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-medium">
                        Month overview: {monthOnboarded.length} onboarded, {monthExit.length} exited
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+{monthOnboarded.length} Onboarded</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 text-pink-800 border border-pink-200 flex items-center gap-1.5">
                      <UserMinus className="w-3.5 h-3.5 text-pink-600" />
                      <span>-{monthExit.length} Exited</span>
                    </span>
                  </div>
                </div>

                {/* Grid of Client Cards for this Month */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map((movement) => {
                    const admin = admins.find((a) => a.id === movement.adminId);
                    const isOnboarded = movement.clientType === 'onboarded';

                    return (
                      <div
                        key={movement.id}
                        id={`client-card-${movement.id}`}
                        className={`rounded-xl p-4.5 border transition-all hover:shadow-md flex flex-col justify-between ${
                          isOnboarded
                            ? 'bg-white border-emerald-200 hover:border-emerald-400'
                            : 'bg-white border-pink-200 hover:border-pink-400'
                        }`}
                      >
                        {/* Card Header: Type Badge & Date */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isOnboarded
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-pink-100 text-pink-800 border border-pink-300'
                              }`}
                            >
                              {isOnboarded ? (
                                <>
                                  <UserCheck className="w-3 h-3 text-emerald-700" />
                                  <span>Onboarded Client</span>
                                </>
                              ) : (
                                <>
                                  <UserMinus className="w-3 h-3 text-pink-700" />
                                  <span>Exit Client</span>
                                </>
                              )}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-zinc-500 font-semibold">
                                {formatDateLabel(movement.date)}
                              </span>
                            </div>
                          </div>

                          {/* Client / Project Name */}
                          <div className="flex items-baseline justify-between gap-2 mb-2">
                            <h4 className="text-base font-black text-black tracking-tight">
                              {movement.projectName}
                            </h4>
                            {isOnboarded && movement.projectType && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 font-semibold">
                                {movement.projectType === 'branding' ? 'Branding' : 'Social Media'}
                              </span>
                            )}
                          </div>

                          {/* REQUIRED FIELD DISPLAY 1: FOR ONBOARDED CLIENTS -> TYPE OF BRAND */}
                          {isOnboarded && (
                            <div className="my-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-0.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="uppercase tracking-wider text-[10px] text-emerald-800 font-black">
                                  Type of Brand:
                                </span>
                              </div>
                              <p className="text-xs font-bold text-emerald-950 pl-5">
                                {movement.brandType || 'Brand Classification Pending'}
                              </p>
                            </div>
                          )}

                          {/* REQUIRED FIELD DISPLAY 2: FOR EXIT CLIENTS -> REASON FOR EXIT */}
                          {!isOnboarded && (
                            <div className="my-2.5 p-3 rounded-lg bg-pink-50/70 border border-pink-200">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-pink-900 mb-0.5">
                                <AlertCircle className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                                <span className="uppercase tracking-wider text-[10px] text-pink-800 font-black">
                                  Reason for Exit:
                                </span>
                              </div>
                              <p className="text-xs font-medium text-pink-950 pl-5">
                                {movement.exitReason || 'No specific exit reason recorded'}
                              </p>
                            </div>
                          )}

                          {/* Notes if present */}
                          {movement.notes && (
                            <p className="text-xs text-zinc-600 mt-2 line-clamp-2 italic bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                              "{movement.notes}"
                            </p>
                          )}
                        </div>

                        {/* Card Footer: Admin in charge and Action buttons */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-200 text-xs">
                          <div className="flex items-center gap-2">
                            {admin ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: admin.color }}
                                />
                                <span className="text-black font-bold">{admin.name}</span>
                                <span className="text-zinc-500 text-[10px]">({admin.department.split('&')[0].trim()})</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 text-xs italic">Unassigned admin</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              id={`edit-client-${movement.id}`}
                              onClick={() => {
                                onRequireAdminAuth(() => onEditClient(movement));
                              }}
                              title="Edit Record"
                              className="p-1.5 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-client-${movement.id}`}
                              onClick={() => {
                                onRequireAdminAuth(() => onDeleteClient(movement.id));
                              }}
                              title="Delete Record"
                              className="p-1.5 text-zinc-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
