import React from 'react';
import { 
  FolderKanban, 
  Users, 
  Plus, 
  RotateCcw, 
  Search,
  UserPlus,
  FolderPlus,
  Lock,
  Unlock,
  LogOut,
  ShieldCheck,
  Eye,
  TrendingUp,
  UserCheck,
  Smartphone,
  KeyRound
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAdminLoggedIn: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAddAdmin: () => void;
  onOpenAddProject: () => void;
  onOpenAddClient?: () => void;
  onOpenAddDevice?: () => void;
  onResetData: () => void;
  onOpenChangePassword?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  isAdminLoggedIn,
  onOpenLogin,
  onLogout,
  onOpenAddAdmin,
  onOpenAddProject,
  onOpenAddClient,
  onOpenAddDevice,
  onResetData,
  onOpenChangePassword,
}) => {
  return (
    <header id="main-navbar" className="bg-white/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 md:py-4 gap-4">
          {/* Logo and Main Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-orange-500/25 font-bold text-lg">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-black tracking-tight">
                  Admin Project Manager
                </h1>
                {isAdminLoggedIn ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Admin Mode
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                    <Eye className="w-3 h-3 text-amber-600" />
                    Visitor Mode (View Only)
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-600">
                Manage assigned projects, client movements & device allocations
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search admins, projects, clients, devices..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-100/90 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-500 transition-all text-black placeholder-zinc-500 font-medium"
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-zinc-500 hover:text-black"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action & Auth Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {isAdminLoggedIn ? (
              <>
                <div className="dropdown relative inline-block text-left group">
                  <button
                    id="quick-add-dropdown-btn"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                  <div className="hidden group-hover:block group-focus-within:block absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-zinc-200 py-1.5 z-50 animate-fadeIn">
                    <button
                      id="add-admin-option"
                      onClick={onOpenAddAdmin}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-orange-600" />
                      <span>Add Admin</span>
                    </button>
                    <button
                      id="add-project-option"
                      onClick={onOpenAddProject}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2 transition-colors"
                    >
                      <FolderPlus className="w-4 h-4 text-pink-600" />
                      <span>Add Project</span>
                    </button>
                    {onOpenAddClient && (
                      <button
                        id="add-client-option"
                        onClick={onOpenAddClient}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 border-t border-zinc-100 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Record Client</span>
                      </button>
                    )}
                    {onOpenAddDevice && (
                      <button
                        id="add-device-option"
                        onClick={onOpenAddDevice}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 border-t border-zinc-100 transition-colors"
                      >
                        <Smartphone className="w-4 h-4 text-purple-600" />
                        <span>Allocate Device</span>
                      </button>
                    )}
                    {onOpenChangePassword && (
                      <button
                        id="change-password-dropdown-option"
                        onClick={onOpenChangePassword}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 border-t border-zinc-100 transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-orange-600" />
                        <span>Change Passcode</span>
                      </button>
                    )}
                  </div>
                </div>
                {onOpenChangePassword && (
                  <button
                    id="change-password-nav-btn"
                    onClick={onOpenChangePassword}
                    title="Change Admin Passcode"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer border border-zinc-200"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                    <span className="hidden sm:inline">Passcode</span>
                  </button>
                )}
                <button
                  id="reset-initial-data-btn"
                  onClick={onResetData}
                  title="Reset to default prompt projects & admins"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer border border-zinc-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Reset Seed</span>
                </button>
                <button
                  id="admin-logout-btn"
                  onClick={onLogout}
                  title="Log out of Admin Mode"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-pink-700 hover:text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                id="admin-login-header-btn"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer animate-pulse-subtle"
              >
                <Lock className="w-4 h-4 text-white" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-zinc-200 overflow-x-auto space-x-6 pt-2">
          <button
            id="tab-admins"
            onClick={() => setActiveTab('admins')}
            className={`pb-3 text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'admins'
                ? 'border-b-2 border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-zinc-600 hover:text-black hover:border-zinc-300 font-semibold'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Admins & Assignments</span>
          </button>
          <button
            id="tab-projects"
            onClick={() => setActiveTab('projects')}
            className={`pb-3 text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'projects'
                ? 'border-b-2 border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-zinc-600 hover:text-black hover:border-zinc-300 font-semibold'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>All Projects Directory</span>
          </button>
          <button
            id="tab-clients"
            onClick={() => setActiveTab('clients')}
            className={`pb-3 text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'clients'
                ? 'border-b-2 border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-zinc-600 hover:text-black hover:border-zinc-300 font-semibold'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Client Movement (Onboarded & Exit)</span>
            {!isAdminLoggedIn ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                <Lock className="w-2.5 h-2.5" />
                Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Unlock className="w-2.5 h-2.5" />
                Unlocked
              </span>
            )}
          </button>
          <button
            id="tab-devices"
            onClick={() => setActiveTab('devices')}
            className={`pb-3 text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'devices'
                ? 'border-b-2 border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-zinc-600 hover:text-black hover:border-zinc-300 font-semibold'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Device Allocation</span>
            {!isAdminLoggedIn ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                <Lock className="w-2.5 h-2.5" />
                Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Unlock className="w-2.5 h-2.5" />
                Unlocked
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

