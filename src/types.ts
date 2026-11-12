export type ProjectStatus = 'Active' | 'In Progress' | 'On Hold' | 'Completed';
export type ProjectPriority = 'High' | 'Medium' | 'Low';
export type ProjectType = 'social_media' | 'branding';
export type BillingCycle = 
  | '1 to 30 or 31'
  | '5 to 5'
  | '10 to 10'
  | '15 to 15'
  | '20 to 20'
  | '25 to 25';

export interface Project {
  id: string;
  name: string;
  adminId: string;
  designerId?: string; // Optional allocated designer working on this project
  status: ProjectStatus;
  priority: ProjectPriority;
  description?: string;
  category?: string;
  projectType?: ProjectType; // 'social_media' or 'branding'
  billingCycle?: BillingCycle; // 1 to 30 or 31, 5 to 5, 10 to 10, 15 to 15, 20 to 20, 25 to 25
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  createdAt: string;
}

export interface Designer {
  id: string;
  name: string;
  email: string;
  role: string; // e.g. "UI/UX Designer", "Brand Designer", "3D Motion"
  avatarUrl?: string;
  allocatedAdminIds: string[]; // List of Admin IDs this designer is allocated to
  status: 'Available' | 'Busy' | 'On Leave';
  phone?: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  department: string;
  avatarUrl?: string;
  color: string; // Theme color for badge / card accent
}

export type ClientMovementType = 'onboarded' | 'exit';

export interface ClientMovement {
  id: string;
  clientType: ClientMovementType; // 'onboarded' | 'exit'
  projectName: string; // Project / Client Name
  projectId?: string; // Optional linked project
  adminId?: string; // Responsible admin
  month: string; // "YYYY-MM" format e.g. "2026-11"
  date: string; // Specific date string e.g. "2026-11-04"
  brandType?: string; // Type of brand (for onboarded clients)
  projectType?: ProjectType; // 'social_media' | 'branding'
  exitReason?: string; // Reason for exit (for exit clients)
  notes?: string; // Optional retrospective notes / contract details
  createdAt: string;
}

export type DeviceType = 'smartphone' | 'laptop' | 'tablet' | 'hotspot' | 'other';

export interface DeviceAllocation {
  id: string;
  adminId: string; // Admin this device is assigned to
  adminName?: string; // Admin Name
  deviceName: string; // Required: Device Name (e.g. iPhone 15 Pro, MacBook Pro M3)
  simNumber: string; // Required: SIM Number / Mobile Line (e.g. +91 98765 12001)
  deviceType?: DeviceType;
  carrier?: string; // e.g. Airtel Business, Jio 5G, Etisalat
  imeiOrSerial?: string; // IMEI or Serial No.
  status: 'Active' | 'Spare' | 'In Repair' | 'Returned';
  allocatedDate: string; // ISO date YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export type ActiveTab = 'admins' | 'projects' | 'clients' | 'devices';
