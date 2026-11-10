import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { AdminCard } from './components/AdminCard';
import { AdminKanbanBoard } from './components/AdminKanbanBoard';
import { ProjectsView } from './components/ProjectsView';
import { ClientMovementView } from './components/ClientMovementView';
import { DeviceAllocationView } from './components/DeviceAllocationView';
import { AdminModal } from './components/modals/AdminModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { DesignerModal } from './components/modals/DesignerModal';
import { ClientMovementModal } from './components/modals/ClientMovementModal';
import { DeviceModal } from './components/modals/DeviceModal';
import { AdminLoginModal } from './components/modals/AdminLoginModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { AdminDesignerAllotment } from './components/AdminDesignerAllotment';
import { ActiveTab, Admin, Project, ProjectStatus, Designer, ProjectType, ClientMovement, ClientMovementType, DeviceAllocation } from './types';
import { INITIAL_ADMINS, INITIAL_PROJECTS, INITIAL_DESIGNERS, INITIAL_CLIENT_MOVEMENTS, INITIAL_DEVICES } from './data/initialData';
import { FolderKanban, UserPlus, Columns, Rows } from 'lucide-react';

const STORAGE_KEYS = {
  ADMINS: 'admin_portal_admins_v1',
  PROJECTS: 'admin_portal_projects_v1',
  DESIGNERS: 'admin_portal_designers_v1',
  MOVEMENTS: 'admin_portal_movements_v1',
  DEVICES: 'admin_portal_devices_v1',
  AUTH: 'admin_portal_auth_v1',
};

export default function App() {
  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<ActiveTab>('admins');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [adminViewMode, setAdminViewMode] = useState<'kanban' | 'stack'>('kanban');

  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Core Data States with localStorage persistence
  const [admins, setAdmins] = useState<Admin[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMINS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ADMINS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (saved) {
      try {
        const parsed: Project[] = JSON.parse(saved);
        const initialized = parsed.map((p) => ({
          ...p,
          projectType: p.projectType || 'social_media',
        }));
        const hasBranding = initialized.some((p) => p.projectType === 'branding');
        if (!hasBranding) {
          const initialBranding = INITIAL_PROJECTS.filter((p) => p.projectType === 'branding');
          return [...initialized, ...initialBranding];
        }
        return initialized;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PROJECTS;
  });

  const [designers, setDesigners] = useState<Designer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DESIGNERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_DESIGNERS;
  });

  const [movements, setMovements] = useState<ClientMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CLIENT_MOVEMENTS;
  });

  const [devices, setDevices] = useState<DeviceAllocation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEVICES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_DEVICES;
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DESIGNERS, JSON.stringify(designers));
  }, [designers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, isAdminLoggedIn ? 'true' : 'false');
  }, [isAdminLoggedIn]);

  // Auth Handler helpers
  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
  };

  const requireAdminAuth = (action: () => void) => {
    if (isAdminLoggedIn) {
      action();
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  // Modal Control States
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [defaultProjectAdminId, setDefaultProjectAdminId] = useState<string | undefined>();
  const [defaultProjectType, setDefaultProjectType] = useState<ProjectType>('social_media');

  const [isDesignerModalOpen, setIsDesignerModalOpen] = useState(false);
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);
  const [defaultDesignerAdminId, setDefaultDesignerAdminId] = useState<string | undefined>();

  // Client Movement Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClientMovement, setEditingClientMovement] = useState<ClientMovement | null>(null);
  const [defaultClientMovementType, setDefaultClientMovementType] = useState<ClientMovementType>('onboarded');
  const [defaultMovementMonth, setDefaultMovementMonth] = useState<string | undefined>();

  // Device Allocation Modal State
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceAllocation | null>(null);
  const [defaultDeviceAdminId, setDefaultDeviceAdminId] = useState<string | undefined>();

  // Delete Confirmation Modal State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // --- CRUD Operations for Admins ---
  const handleOpenAddAdmin = () => {
    requireAdminAuth(() => {
      setEditingAdmin(null);
      setIsAdminModalOpen(true);
    });
  };

  const handleEditAdmin = (admin: Admin) => {
    requireAdminAuth(() => {
      setEditingAdmin(admin);
      setIsAdminModalOpen(true);
    });
  };

  const handleSaveAdmin = (adminData: Omit<Admin, 'id'> & { id?: string }) => {
    if (adminData.id) {
      setAdmins((prev) =>
        prev.map((a) => (a.id === adminData.id ? { ...a, ...adminData } : a))
      );
    } else {
      const newAdmin: Admin = {
        ...adminData,
        id: `admin-${Date.now()}`,
      };
      setAdmins((prev) => [...prev, newAdmin]);
    }
  };

  const handleDeleteAdmin = (adminId: string) => {
    requireAdminAuth(() => {
      const admin = admins.find((a) => a.id === adminId);
      if (!admin) return;

      const adminProjects = projects.filter((p) => p.adminId === adminId);

      setDeleteModalConfig({
        isOpen: true,
        title: `Delete Admin "${admin.name}"?`,
        description: `Are you sure you want to delete ${admin.name}? This will remove the admin and delete their ${adminProjects.length} assigned project(s).`,
        onConfirm: () => {
          setAdmins((prev) => prev.filter((a) => a.id !== adminId));
          setProjects((prev) => prev.filter((p) => p.adminId !== adminId));
        },
      });
    });
  };

  // --- CRUD Operations for Projects ---
  const handleOpenAddProject = (adminId?: string, projectType: ProjectType = 'social_media') => {
    requireAdminAuth(() => {
      setEditingProject(null);
      setDefaultProjectAdminId(adminId);
      setDefaultProjectType(projectType);
      setIsProjectModalOpen(true);
    });
  };

  const handleEditProject = (project: Project) => {
    requireAdminAuth(() => {
      setEditingProject(project);
      setIsProjectModalOpen(true);
    });
  };

  const handleSaveProject = (
    projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (projectData.id) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectData.id ? { ...p, ...projectData } : p))
      );
    } else {
      const newProject: Project = {
        ...projectData,
        id: `proj-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProjects((prev) => [newProject, ...prev]);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    requireAdminAuth(() => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      setDeleteModalConfig({
        isOpen: true,
        title: `Delete Project "${project.name}"?`,
        description: `Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`,
        onConfirm: () => {
          setProjects((prev) => prev.filter((p) => p.id !== projectId));
        },
      });
    });
  };

  const handleQuickStatusChange = (projectId: string, status: ProjectStatus) => {
    requireAdminAuth(() => {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status } : p))
      );
    });
  };

  // --- CRUD Operations for Designers ---
  const handleOpenAddDesigner = (adminId?: string) => {
    requireAdminAuth(() => {
      setEditingDesigner(null);
      setDefaultDesignerAdminId(adminId);
      setIsDesignerModalOpen(true);
    });
  };

  const handleEditDesigner = (designer: Designer) => {
    requireAdminAuth(() => {
      setEditingDesigner(designer);
      setIsDesignerModalOpen(true);
    });
  };

  const handleSaveDesigner = (
    designerData: Omit<Designer, 'id'> & { id?: string }
  ) => {
    if (designerData.id) {
      setDesigners((prev) =>
        prev.map((d) => (d.id === designerData.id ? { ...d, ...designerData } : d))
      );
    } else {
      const newDesigner: Designer = {
        ...designerData,
        id: `des-${Date.now()}`,
      };
      setDesigners((prev) => [...prev, newDesigner]);
    }
  };

  const handleDeleteDesigner = (designerId: string) => {
    requireAdminAuth(() => {
      const designer = designers.find((d) => d.id === designerId);
      if (!designer) return;

      setDeleteModalConfig({
        isOpen: true,
        title: `Delete Designer "${designer.name}"?`,
        description: `Are you sure you want to delete or remove allotment for ${designer.name}?`,
        onConfirm: () => {
          setDesigners((prev) => prev.filter((d) => d.id !== designerId));
        },
      });
    });
  };

  // --- CRUD Operations for Client Movements ---
  const handleOpenAddClient = (type: ClientMovementType = 'onboarded', month?: string) => {
    requireAdminAuth(() => {
      setEditingClientMovement(null);
      setDefaultClientMovementType(type);
      setDefaultMovementMonth(month);
      setIsClientModalOpen(true);
    });
  };

  const handleEditClient = (movement: ClientMovement) => {
    requireAdminAuth(() => {
      setEditingClientMovement(movement);
      setIsClientModalOpen(true);
    });
  };

  const handleSaveClient = (
    movementData: Omit<ClientMovement, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (movementData.id) {
      setMovements((prev) =>
        prev.map((m) =>
          m.id === movementData.id
            ? { ...m, ...movementData }
            : m
        )
      );
    } else {
      const newMovement: ClientMovement = {
        ...movementData,
        id: `cm-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [newMovement, ...prev]);
    }
  };

  const handleDeleteClient = (movementId: string) => {
    requireAdminAuth(() => {
      const target = movements.find((m) => m.id === movementId);
      if (!target) return;
      setDeleteModalConfig({
        isOpen: true,
        title: `Delete ${target.clientType === 'onboarded' ? 'Onboarded' : 'Exit'} Record for "${target.projectName}"?`,
        description: `Are you sure you want to remove this client movement record?`,
        onConfirm: () => {
          setMovements((prev) => prev.filter((m) => m.id !== movementId));
        },
      });
    });
  };

  // --- CRUD Operations for Device Allocations ---
  const handleOpenAddDevice = (adminId?: string) => {
    requireAdminAuth(() => {
      setEditingDevice(null);
      setDefaultDeviceAdminId(adminId);
      setIsDeviceModalOpen(true);
    });
  };

  const handleEditDevice = (device: DeviceAllocation) => {
    requireAdminAuth(() => {
      setEditingDevice(device);
      setIsDeviceModalOpen(true);
    });
  };

  const handleSaveDevice = (
    deviceData: Omit<DeviceAllocation, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (deviceData.id) {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceData.id
            ? { ...d, ...deviceData }
            : d
        )
      );
    } else {
      const newDevice: DeviceAllocation = {
        ...deviceData,
        id: `dev-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setDevices((prev) => [newDevice, ...prev]);
    }
  };

  const handleDeleteDevice = (deviceId: string) => {
    requireAdminAuth(() => {
      const target = devices.find((d) => d.id === deviceId);
      if (!target) return;
      const admin = admins.find((a) => a.id === target.adminId);
      setDeleteModalConfig({
        isOpen: true,
        title: `Remove Device "${target.deviceName}"?`,
        description: `Are you sure you want to remove this device allocation from ${admin?.name || target.adminName || 'Admin'}? (SIM: ${target.simNumber})`,
        onConfirm: () => {
          setDevices((prev) => prev.filter((d) => d.id !== deviceId));
        },
      });
    });
  };

  // Reset to initial default seed data
  const handleResetToInitialData = () => {
    requireAdminAuth(() => {
      setDeleteModalConfig({
        isOpen: true,
        title: 'Reset to Initial Seed Data?',
        description: 'This will reset all admins, projects, designer allotments, client movements, and device allocations back to original defaults.',
        onConfirm: () => {
          setAdmins(INITIAL_ADMINS);
          setProjects(INITIAL_PROJECTS);
          setDesigners(INITIAL_DESIGNERS);
          setMovements(INITIAL_CLIENT_MOVEMENTS);
          setDevices(INITIAL_DEVICES);
          localStorage.removeItem(STORAGE_KEYS.ADMINS);
          localStorage.removeItem(STORAGE_KEYS.PROJECTS);
          localStorage.removeItem(STORAGE_KEYS.DESIGNERS);
          localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
          localStorage.removeItem(STORAGE_KEYS.DEVICES);
        },
      });
    });
  };

  // Filtered admins according to search query
  const filteredAdmins = admins.filter((admin) => {
    const adminProjects = projects.filter((p) => p.adminId === admin.id);
    const matchesName = admin.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = admin.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = adminProjects.some((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesName || matchesDept || matchesProject;
  });

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Header / Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenLogin={() => setIsAdminLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenAddAdmin={handleOpenAddAdmin}
        onOpenAddProject={() => handleOpenAddProject()}
        onOpenAddClient={() => handleOpenAddClient()}
        onOpenAddDevice={() => handleOpenAddDevice()}
        onResetData={handleResetToInitialData}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Bar */}
        <StatsBar admins={admins} projects={projects} />

        {/* Tab 1: Admins Overview & Assignments */}
        {activeTab === 'admins' && (
          <div id="admins-tab-content" className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-black text-black">Admins Column Board</h2>
                <p className="text-xs font-medium text-zinc-600">
                  Social media and Branding / One-time projects structured per admin column.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* View Switcher Toggle */}
                <div className="flex items-center bg-zinc-100 border border-zinc-200 p-1 rounded-xl shadow-xs">
                  <button
                    id="switch-view-kanban-btn"
                    onClick={() => setAdminViewMode('kanban')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      adminViewMode === 'kanban'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Columns</span>
                  </button>
                  <button
                    id="switch-view-stack-btn"
                    onClick={() => setAdminViewMode('stack')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      adminViewMode === 'stack'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    <Rows className="w-3.5 h-3.5" />
                    <span>Rows</span>
                  </button>
                </div>

                <button
                  id="add-admin-main-btn"
                  onClick={handleOpenAddAdmin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Admin</span>
                </button>
              </div>
            </div>

            {filteredAdmins.length === 0 ? (
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-12 text-center">
                <FolderKanban className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-900 mb-1">No Admins Found</h3>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto mb-4">
                  No admins match your search term "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {/* SECTION 1: Social Media Projects Board */}
                <div id="social-media-board-section" className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-black">Social Media Projects</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          {projects.filter((p) => p.projectType !== 'branding').length} Projects
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-600">
                        Active social media retainer client accounts per admin.
                      </p>
                    </div>
                  </div>

                  {adminViewMode === 'kanban' ? (
                    <AdminKanbanBoard
                      admins={filteredAdmins}
                      projects={projects.filter((p) => p.projectType !== 'branding')}
                      projectType="social_media"
                      onEditAdmin={handleEditAdmin}
                      onDeleteAdmin={handleDeleteAdmin}
                      onAddProjectForAdmin={(adminId, type) => handleOpenAddProject(adminId, type || 'social_media')}
                      onEditProject={handleEditProject}
                      onDeleteProject={handleDeleteProject}
                      onQuickStatusChange={handleQuickStatusChange}
                      onOpenAddAdmin={handleOpenAddAdmin}
                    />
                  ) : (
                    <div className="space-y-4">
                      {filteredAdmins.map((admin) => {
                        const adminProjects = projects.filter(
                          (p) => p.adminId === admin.id && p.projectType !== 'branding'
                        );
                        return (
                          <AdminCard
                            key={`sm-${admin.id}`}
                            admin={admin}
                            projects={adminProjects}
                            onEditAdmin={handleEditAdmin}
                            onDeleteAdmin={handleDeleteAdmin}
                            onAddProjectForAdmin={(adminId) => handleOpenAddProject(adminId, 'social_media')}
                            onEditProject={handleEditProject}
                            onDeleteProject={handleDeleteProject}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION 2: Branding / One-time Projects Board */}
                <div id="branding-board-section" className="space-y-3 pt-6 border-t border-zinc-200">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-black">Branding / One-time Projects</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                          {projects.filter((p) => p.projectType === 'branding').length} Projects
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-600">
                        Brand identity, logo design, packaging, and one-time deliverables per admin.
                      </p>
                    </div>
                  </div>

                  {adminViewMode === 'kanban' ? (
                    <AdminKanbanBoard
                      admins={filteredAdmins}
                      projects={projects.filter((p) => p.projectType === 'branding')}
                      projectType="branding"
                      onEditAdmin={handleEditAdmin}
                      onDeleteAdmin={handleDeleteAdmin}
                      onAddProjectForAdmin={(adminId, type) => handleOpenAddProject(adminId, type || 'branding')}
                      onEditProject={handleEditProject}
                      onDeleteProject={handleDeleteProject}
                      onQuickStatusChange={handleQuickStatusChange}
                      onOpenAddAdmin={handleOpenAddAdmin}
                    />
                  ) : (
                    <div className="space-y-4">
                      {filteredAdmins.map((admin) => {
                        const adminProjects = projects.filter(
                          (p) => p.adminId === admin.id && p.projectType === 'branding'
                        );
                        return (
                          <AdminCard
                            key={`branding-${admin.id}`}
                            admin={admin}
                            projects={adminProjects}
                            onEditAdmin={handleEditAdmin}
                            onDeleteAdmin={handleDeleteAdmin}
                            onAddProjectForAdmin={(adminId) => handleOpenAddProject(adminId, 'branding')}
                            onEditProject={handleEditProject}
                            onDeleteProject={handleDeleteProject}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section below Admins Column Board: Designer Allotments per Admin */}
            <AdminDesignerAllotment
              admins={admins}
              designers={designers}
              onAddDesignerForAdmin={(adminId) => handleOpenAddDesigner(adminId)}
              onEditDesigner={handleEditDesigner}
              onDeleteDesigner={handleDeleteDesigner}
            />
          </div>
        )}

        {/* Tab 2: All Projects Directory */}
        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            admins={admins}
            searchQuery={searchQuery}
            onAddProject={() => handleOpenAddProject()}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onQuickStatusChange={handleQuickStatusChange}
          />
        )}

        {/* Tab 3: Client Movement (Onboarded & Exit Clients) */}
        {activeTab === 'clients' && (
          <ClientMovementView
            movements={movements}
            admins={admins}
            projects={projects}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenAddClient={handleOpenAddClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            onRequireAdminAuth={requireAdminAuth}
          />
        )}

        {/* Tab 4: Device Allocation for Admins */}
        {activeTab === 'devices' && (
          <DeviceAllocationView
            devices={devices}
            admins={admins}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenAddDevice={handleOpenAddDevice}
            onEditDevice={handleEditDevice}
            onDeleteDevice={handleDeleteDevice}
            onRequireAdminAuth={requireAdminAuth}
          />
        )}
      </main>

      {/* Modals */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSave={handleSaveAdmin}
        initialAdmin={editingAdmin}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        initialProject={editingProject}
        admins={admins}
        defaultAdminId={defaultProjectAdminId}
        defaultProjectType={defaultProjectType}
      />

      <DesignerModal
        isOpen={isDesignerModalOpen}
        onClose={() => setIsDesignerModalOpen(false)}
        onSave={handleSaveDesigner}
        initialDesigner={editingDesigner}
        admins={admins}
        defaultAdminId={defaultDesignerAdminId}
      />

      <ClientMovementModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        initialMovement={editingClientMovement}
        admins={admins}
        projects={projects}
        defaultClientType={defaultClientMovementType}
        defaultMonth={defaultMovementMonth}
      />

      <DeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        onSave={handleSaveDevice}
        initialDevice={editingDevice}
        admins={admins}
        defaultAdminId={defaultDeviceAdminId}
      />

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig({ ...deleteModalConfig, isOpen: false })}
        onConfirm={deleteModalConfig.onConfirm}
        title={deleteModalConfig.title}
        description={deleteModalConfig.description}
      />
    </div>
  );
}

