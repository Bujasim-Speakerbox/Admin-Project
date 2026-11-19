import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  waitForPendingWrites,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  resolvedFirebaseConfig,
} from '../firebase';
import {
  Admin,
  BillingCycle,
  ClientMovement,
  Designer,
  DeviceAllocation,
  Project,
  ProjectPriority,
  ProjectStatus,
  ProjectType,
} from '../types';
import {
  INITIAL_ADMINS,
  INITIAL_CLIENT_MOVEMENTS,
  INITIAL_DESIGNERS,
  INITIAL_DEVICES,
  INITIAL_PROJECTS,
} from '../data/initialData';

export const WORKSPACE_ID = 'main';
export const BOOTSTRAP_ADMIN_EMAIL = 'bujasim@speakerbox.in';
export const SECURITY_DOC_ID = 'passcode';

export interface WorkspaceMetadata {
  name: string;
  ownerUid: string;
  ownerEmail: string;
  memberEmails: string[];
  seeded: boolean;
}

export interface WorkspaceSeedData {
  admins: Admin[];
  projects: Project[];
  designers: Designer[];
  movements: ClientMovement[];
  devices: DeviceAllocation[];
  passcode: string;
}

// --- Sanitization Helpers (Mirroring firebase-blueprint.json verbatim) ---
export function sanitizeId(id: string): string {
  const cleaned = (id || `id-${Date.now()}`)
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  return cleaned || `id_${Date.now()}`;
}

function clampStr(val: string | undefined, maxLen: number, fallback = ''): string {
  const s = (val ?? fallback).trim();
  return s.slice(0, maxLen);
}

function clampColor(val: string | undefined): string {
  const s = (val || '#f97316').trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(s) ? s.slice(0, 20) : '#f97316';
}

function sanitizeMemberEmails(emails: string[], currentUserEmail?: string | null): string[] {
  const set = new Set<string>();
  set.add(BOOTSTRAP_ADMIN_EMAIL.toLowerCase());
  if (currentUserEmail) {
    const trimmed = currentUserEmail.trim().slice(0, 160);
    const lowered = trimmed.toLowerCase();
    if (lowered.length >= 3 && lowered.includes('@')) {
      set.add(lowered);
    }
    if (trimmed.length >= 3 && trimmed.includes('@') && trimmed !== lowered) {
      set.add(trimmed);
    }
  }
  for (const e of emails) {
    const cleaned = e.toLowerCase().trim().slice(0, 160);
    if (cleaned.length >= 3 && cleaned.includes('@')) {
      set.add(cleaned);
    }
    if (set.size >= 20) break;
  }
  return Array.from(set).slice(0, 20);
}

function timestampToDateStr(ts: unknown, fallback?: string): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString().split('T')[0];
  }
  if (typeof ts === 'string' && ts.trim()) {
    return ts;
  }
  return fallback || new Date().toISOString().split('T')[0];
}

// --- Serializers ---
function buildAdminPayload(
  admin: Admin,
  ownerUid: string,
  memberEmails: string[],
  isCreate: boolean
) {
  const id = sanitizeId(admin.id);
  const payload: Record<string, unknown> = {
    id,
    workspaceId: WORKSPACE_ID,
    ownerUid: sanitizeId(ownerUid),
    memberEmails,
    name: clampStr(admin.name, 100, 'Admin'),
    email: clampStr(admin.email, 160, 'admin@company.com'),
    department: clampStr(admin.department, 120, 'Operations'),
    color: clampColor(admin.color),
    updatedAt: serverTimestamp(),
  };
  if (admin.avatarUrl && admin.avatarUrl.trim()) {
    payload.avatarUrl = clampStr(admin.avatarUrl, 500);
  }
  if (isCreate) {
    payload.createdAt = serverTimestamp();
  }
  return payload;
}

function buildAdminUpdateFields(admin: Admin) {
  return {
    name: clampStr(admin.name, 100, 'Admin'),
    email: clampStr(admin.email, 160, 'admin@company.com'),
    department: clampStr(admin.department, 120, 'Operations'),
    color: clampColor(admin.color),
    avatarUrl: admin.avatarUrl?.trim() ? clampStr(admin.avatarUrl, 500) : deleteField(),
    updatedAt: serverTimestamp(),
  };
}

function buildProjectPayload(
  project: Project,
  ownerUid: string,
  memberEmails: string[],
  isCreate: boolean
) {
  const id = sanitizeId(project.id);
  const validStatuses: ProjectStatus[] = ['Active', 'In Progress', 'On Hold', 'Completed'];
  const validPriorities: ProjectPriority[] = ['High', 'Medium', 'Low'];
  const validTypes: ProjectType[] = ['social_media', 'branding'];
  const validCycles: BillingCycle[] = [
    '1 to 30 or 31',
    '5 to 5',
    '10 to 10',
    '15 to 15',
    '20 to 20',
    '25 to 25',
  ];

  const payload: Record<string, unknown> = {
    id,
    workspaceId: WORKSPACE_ID,
    ownerUid: sanitizeId(ownerUid),
    memberEmails,
    name: clampStr(project.name, 150, 'Untitled Project'),
    adminId: sanitizeId(project.adminId || 'admin-1'),
    status: validStatuses.includes(project.status) ? project.status : 'Active',
    priority: validPriorities.includes(project.priority) ? project.priority : 'Medium',
    projectType:
      project.projectType && validTypes.includes(project.projectType)
        ? project.projectType
        : 'social_media',
    billingCycle:
      project.billingCycle && validCycles.includes(project.billingCycle)
        ? project.billingCycle
        : '1 to 30 or 31',
    updatedAt: serverTimestamp(),
  };

  if (project.designerId && project.designerId.trim()) {
    payload.designerId = clampStr(project.designerId, 128);
  }
  if (project.description !== undefined && project.description.trim()) {
    payload.description = clampStr(project.description, 1000);
  }
  if (project.category !== undefined && project.category.trim()) {
    payload.category = clampStr(project.category, 120);
  }
  if (project.startDate && project.startDate.trim()) {
    payload.startDate = clampStr(project.startDate, 32);
  }
  if (project.endDate && project.endDate.trim()) {
    payload.endDate = clampStr(project.endDate, 32);
  }
  if (project.dueDate && project.dueDate.trim()) {
    payload.dueDate = clampStr(project.dueDate, 32);
  }
  if (isCreate) {
    if (project.createdAt && project.createdAt.trim()) {
      payload.createdDateStr = clampStr(project.createdAt, 32);
    }
    payload.createdAt = serverTimestamp();
  }
  return payload;
}

function buildProjectUpdateFields(project: Project) {
  const validStatuses: ProjectStatus[] = ['Active', 'In Progress', 'On Hold', 'Completed'];
  const validPriorities: ProjectPriority[] = ['High', 'Medium', 'Low'];
  const validTypes: ProjectType[] = ['social_media', 'branding'];
  const validCycles: BillingCycle[] = [
    '1 to 30 or 31',
    '5 to 5',
    '10 to 10',
    '15 to 15',
    '20 to 20',
    '25 to 25',
  ];
  return {
    name: clampStr(project.name, 150, 'Untitled Project'),
    adminId: sanitizeId(project.adminId || 'admin-1'),
    designerId: project.designerId?.trim()
      ? clampStr(project.designerId, 128)
      : deleteField(),
    status: validStatuses.includes(project.status) ? project.status : 'Active',
    priority: validPriorities.includes(project.priority) ? project.priority : 'Medium',
    description: project.description?.trim()
      ? clampStr(project.description, 1000)
      : deleteField(),
    category: project.category?.trim()
      ? clampStr(project.category, 120)
      : deleteField(),
    projectType:
      project.projectType && validTypes.includes(project.projectType)
        ? project.projectType
        : 'social_media',
    billingCycle:
      project.billingCycle && validCycles.includes(project.billingCycle)
        ? project.billingCycle
        : '1 to 30 or 31',
    startDate: project.startDate?.trim()
      ? clampStr(project.startDate, 32)
      : deleteField(),
    endDate: project.endDate?.trim()
      ? clampStr(project.endDate, 32)
      : deleteField(),
    dueDate: project.dueDate?.trim()
      ? clampStr(project.dueDate, 32)
      : deleteField(),
    updatedAt: serverTimestamp(),
  };
}

function buildDesignerPayload(
  designer: Designer,
  ownerUid: string,
  memberEmails: string[],
  isCreate: boolean
) {
  const id = sanitizeId(designer.id);
  const validStatuses = ['Available', 'Busy', 'On Leave'];
  const allocated = Array.isArray(designer.allocatedAdminIds)
    ? designer.allocatedAdminIds.map((a) => sanitizeId(a)).slice(0, 20)
    : [];

  const payload: Record<string, unknown> = {
    id,
    workspaceId: WORKSPACE_ID,
    ownerUid: sanitizeId(ownerUid),
    memberEmails,
    name: clampStr(designer.name, 100, 'Designer'),
    email: clampStr(designer.email, 160, 'designer@company.com'),
    role: clampStr(designer.role, 100, 'Designer'),
    allocatedAdminIds: allocated,
    status: validStatuses.includes(designer.status) ? designer.status : 'Available',
    updatedAt: serverTimestamp(),
  };

  if (designer.avatarUrl && designer.avatarUrl.trim()) {
    payload.avatarUrl = clampStr(designer.avatarUrl, 500);
  }
  if (designer.phone && designer.phone.trim()) {
    payload.phone = clampStr(designer.phone, 40);
  }
  if (isCreate) {
    payload.createdAt = serverTimestamp();
  }
  return payload;
}

function buildDesignerUpdateFields(designer: Designer) {
  const validStatuses = ['Available', 'Busy', 'On Leave'];
  return {
    name: clampStr(designer.name, 100, 'Designer'),
    email: clampStr(designer.email, 160, 'designer@company.com'),
    role: clampStr(designer.role, 100, 'Designer'),
    avatarUrl: designer.avatarUrl?.trim()
      ? clampStr(designer.avatarUrl, 500)
      : deleteField(),
    allocatedAdminIds: Array.isArray(designer.allocatedAdminIds)
      ? designer.allocatedAdminIds.map((a) => sanitizeId(a)).slice(0, 20)
      : [],
    status: validStatuses.includes(designer.status) ? designer.status : 'Available',
    phone: designer.phone?.trim() ? clampStr(designer.phone, 40) : deleteField(),
    updatedAt: serverTimestamp(),
  };
}

function buildMovementPayload(
  movement: ClientMovement,
  ownerUid: string,
  memberEmails: string[],
  isCreate: boolean
) {
  const id = sanitizeId(movement.id);
  const payload: Record<string, unknown> = {
    id,
    workspaceId: WORKSPACE_ID,
    ownerUid: sanitizeId(ownerUid),
    memberEmails,
    clientType: movement.clientType === 'exit' ? 'exit' : 'onboarded',
    projectName: clampStr(movement.projectName, 150, 'Client Project'),
    month: clampStr(movement.month, 10, new Date().toISOString().slice(0, 7)),
    date: clampStr(movement.date, 32, new Date().toISOString().split('T')[0]),
    updatedAt: serverTimestamp(),
  };

  if (movement.projectId && movement.projectId.trim()) {
    payload.projectId = clampStr(movement.projectId, 128);
  }
  if (movement.adminId && movement.adminId.trim()) {
    payload.adminId = clampStr(movement.adminId, 128);
  }
  if (movement.brandType && movement.brandType.trim()) {
    payload.brandType = clampStr(movement.brandType, 120);
  }
  if (movement.projectType === 'social_media' || movement.projectType === 'branding') {
    payload.projectType = movement.projectType;
  }
  if (movement.exitReason && movement.exitReason.trim()) {
    payload.exitReason = clampStr(movement.exitReason, 500);
  }
  if (movement.notes && movement.notes.trim()) {
    payload.notes = clampStr(movement.notes, 1000);
  }
  if (isCreate) {
    payload.createdAt = serverTimestamp();
  }
  return payload;
}

function buildMovementUpdateFields(movement: ClientMovement) {
  return {
    clientType: movement.clientType === 'exit' ? 'exit' : 'onboarded',
    projectName: clampStr(movement.projectName, 150, 'Client Project'),
    projectId: movement.projectId?.trim()
      ? clampStr(movement.projectId, 128)
      : deleteField(),
    adminId: movement.adminId?.trim()
      ? clampStr(movement.adminId, 128)
      : deleteField(),
    month: clampStr(movement.month, 10, new Date().toISOString().slice(0, 7)),
    date: clampStr(movement.date, 32, new Date().toISOString().split('T')[0]),
    brandType: movement.brandType?.trim()
      ? clampStr(movement.brandType, 120)
      : deleteField(),
    projectType:
      movement.projectType === 'social_media' || movement.projectType === 'branding'
        ? movement.projectType
        : deleteField(),
    exitReason: movement.exitReason?.trim()
      ? clampStr(movement.exitReason, 500)
      : deleteField(),
    notes: movement.notes?.trim() ? clampStr(movement.notes, 1000) : deleteField(),
    updatedAt: serverTimestamp(),
  };
}

function buildDevicePayload(
  device: DeviceAllocation,
  ownerUid: string,
  memberEmails: string[],
  isCreate: boolean
) {
  const id = sanitizeId(device.id);
  const validTypes = ['smartphone', 'laptop', 'tablet', 'hotspot', 'other'];
  const validStatuses = ['Active', 'Spare', 'In Repair', 'Returned'];

  const payload: Record<string, unknown> = {
    id,
    workspaceId: WORKSPACE_ID,
    ownerUid: sanitizeId(ownerUid),
    memberEmails,
    adminId: sanitizeId(device.adminId || 'admin-1'),
    deviceName: clampStr(device.deviceName, 150, 'Device'),
    simNumber: clampStr(device.simNumber, 40, 'N/A'),
    status: validStatuses.includes(device.status) ? device.status : 'Active',
    allocatedDate: clampStr(
      device.allocatedDate,
      32,
      new Date().toISOString().split('T')[0]
    ),
    updatedAt: serverTimestamp(),
  };

  if (device.adminName && device.adminName.trim()) {
    payload.adminName = clampStr(device.adminName, 100);
  }
  if (device.deviceType && validTypes.includes(device.deviceType)) {
    payload.deviceType = device.deviceType;
  }
  if (device.carrier && device.carrier.trim()) {
    payload.carrier = clampStr(device.carrier, 80);
  }
  if (device.imeiOrSerial && device.imeiOrSerial.trim()) {
    payload.imeiOrSerial = clampStr(device.imeiOrSerial, 80);
  }
  if (device.notes && device.notes.trim()) {
    payload.notes = clampStr(device.notes, 1000);
  }
  if (isCreate) {
    payload.createdAt = serverTimestamp();
  }
  return payload;
}

function buildDeviceUpdateFields(device: DeviceAllocation) {
  const validTypes = ['smartphone', 'laptop', 'tablet', 'hotspot', 'other'];
  const validStatuses = ['Active', 'Spare', 'In Repair', 'Returned'];
  return {
    adminId: sanitizeId(device.adminId || 'admin-1'),
    adminName: device.adminName?.trim()
      ? clampStr(device.adminName, 100)
      : deleteField(),
    deviceName: clampStr(device.deviceName, 150, 'Device'),
    simNumber: clampStr(device.simNumber, 40, 'N/A'),
    deviceType:
      device.deviceType && validTypes.includes(device.deviceType)
        ? device.deviceType
        : deleteField(),
    carrier: device.carrier?.trim() ? clampStr(device.carrier, 80) : deleteField(),
    imeiOrSerial: device.imeiOrSerial?.trim()
      ? clampStr(device.imeiOrSerial, 80)
      : deleteField(),
    status: validStatuses.includes(device.status) ? device.status : 'Active',
    allocatedDate: clampStr(
      device.allocatedDate,
      32,
      new Date().toISOString().split('T')[0]
    ),
    notes: device.notes?.trim() ? clampStr(device.notes, 1000) : deleteField(),
    updatedAt: serverTimestamp(),
  };
}

// --- Batch Helper (Max 400 ops per Firestore batch) ---
async function commitBatchedWrites(
  operations: Array<(batch: ReturnType<typeof writeBatch>) => void>
) {
  const chunkSize = 400;
  for (let i = 0; i < operations.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = operations.slice(i, i + chunkSize);
    chunk.forEach((op) => op(batch));
    await batch.commit();
  }
}

function buildSeedOperations(
  seedData: WorkspaceSeedData,
  ownerUid: string,
  memberEmails: string[]
): Array<(batch: ReturnType<typeof writeBatch>) => void> {
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  seedData.admins.forEach((admin) => {
    const id = sanitizeId(admin.id);
    ops.push((b) =>
      b.set(
        doc(db, 'workspaces', WORKSPACE_ID, 'admins', id),
        buildAdminPayload(admin, ownerUid, memberEmails, true)
      )
    );
  });

  seedData.projects.forEach((project) => {
    const id = sanitizeId(project.id);
    ops.push((b) =>
      b.set(
        doc(db, 'workspaces', WORKSPACE_ID, 'projects', id),
        buildProjectPayload(project, ownerUid, memberEmails, true)
      )
    );
  });

  seedData.designers.forEach((designer) => {
    const id = sanitizeId(designer.id);
    ops.push((b) =>
      b.set(
        doc(db, 'workspaces', WORKSPACE_ID, 'designers', id),
        buildDesignerPayload(designer, ownerUid, memberEmails, true)
      )
    );
  });

  seedData.movements.forEach((movement) => {
    const id = sanitizeId(movement.id);
    ops.push((b) =>
      b.set(
        doc(db, 'workspaces', WORKSPACE_ID, 'movements', id),
        buildMovementPayload(movement, ownerUid, memberEmails, true)
      )
    );
  });

  seedData.devices.forEach((device) => {
    const id = sanitizeId(device.id);
    ops.push((b) =>
      b.set(
        doc(db, 'workspaces', WORKSPACE_ID, 'devices', id),
        buildDevicePayload(device, ownerUid, memberEmails, true)
      )
    );
  });

  return ops;
}

// --- Workspace Initialization & Access Check ---
export async function checkAndInitializeWorkspace(
  user: User,
  seedData: WorkspaceSeedData
): Promise<{
  status: 'authorized' | 'unauthorized';
  workspace?: WorkspaceMetadata;
}> {
  const workspacePath = `workspaces/${WORKSPACE_ID}`;
  const workspaceRef = doc(db, 'workspaces', WORKSPACE_ID);

  try {
    const rawEmail = (user.email || '').trim();
    const normalizedEmail = rawEmail.toLowerCase();
    const snap = await getDocFromServer(workspaceRef);

    if (snap.exists()) {
      let data = snap.data() as WorkspaceMetadata;
      const isOwnerOrBootstrap =
        normalizedEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
        data.ownerUid === user.uid;

      if (isOwnerOrBootstrap && rawEmail) {
        const currentMembers = Array.isArray(data.memberEmails) ? data.memberEmails : [];
        const hasMember =
          currentMembers.includes(normalizedEmail) || currentMembers.includes(rawEmail);

        if (!hasMember) {
          const updatedMembers = sanitizeMemberEmails(currentMembers, rawEmail);
          await updateDoc(workspaceRef, {
            memberEmails: updatedMembers,
            updatedAt: serverTimestamp(),
          });
          data = { ...data, memberEmails: updatedMembers };
        }

        // Ensure security/passcode document exists
        const secRef = doc(db, 'workspaces', WORKSPACE_ID, 'security', SECURITY_DOC_ID);
        const secSnap = await getDocFromServer(secRef);
        if (!secSnap.exists()) {
          await setDoc(secRef, {
            workspaceId: WORKSPACE_ID,
            ownerUid: sanitizeId(user.uid),
            passcode: clampStr(seedData.passcode, 64, '12345'),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        // Self-heal if workspace was created with seeded: false or collections are completely empty
        const [adminsCheck, projectsCheck] = await Promise.all([
          getDocsFromServer(
            query(
              collection(db, 'workspaces', WORKSPACE_ID, 'admins'),
              where('memberEmails', 'array-contains', normalizedEmail)
            )
          ),
          getDocsFromServer(
            query(
              collection(db, 'workspaces', WORKSPACE_ID, 'projects'),
              where('memberEmails', 'array-contains', normalizedEmail)
            )
          ),
        ]);

        if (data.seeded === false || (adminsCheck.empty && projectsCheck.empty)) {
          const memberEmails = sanitizeMemberEmails(
            data.memberEmails || [rawEmail],
            rawEmail
          );
          const ownerUid = sanitizeId(user.uid);
          const ops = buildSeedOperations(seedData, ownerUid, memberEmails);
          await commitBatchedWrites(ops);
          await updateDoc(workspaceRef, {
            seeded: true,
            updatedAt: serverTimestamp(),
          });
          await waitForPendingWrites(db);
          data = { ...data, memberEmails, seeded: true };
        }
      }

      return { status: 'authorized', workspace: data };
    }

    // Workspace does not exist yet: initialize with seeded: false until batch succeeds
    if (!rawEmail || !user.emailVerified) {
      return { status: 'unauthorized' };
    }

    const memberEmails = sanitizeMemberEmails([rawEmail], rawEmail);
    const ownerUid = sanitizeId(user.uid);

    await setDoc(workspaceRef, {
      name: 'Admin Project Manager Workspace',
      ownerUid,
      ownerEmail: rawEmail,
      memberEmails,
      seeded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'workspaces', WORKSPACE_ID, 'security', SECURITY_DOC_ID), {
      workspaceId: WORKSPACE_ID,
      ownerUid,
      passcode: clampStr(seedData.passcode, 64, '12345'),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const ops = buildSeedOperations(seedData, ownerUid, memberEmails);
    await commitBatchedWrites(ops);

    await updateDoc(workspaceRef, {
      seeded: true,
      updatedAt: serverTimestamp(),
    });
    await waitForPendingWrites(db);

    return {
      status: 'authorized',
      workspace: {
        name: 'Admin Project Manager Workspace',
        ownerUid,
        ownerEmail: rawEmail,
        memberEmails,
        seeded: true,
      },
    };
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (
      code === 'permission-denied' &&
      user.email?.toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL
    ) {
      return { status: 'unauthorized' };
    }
    handleFirestoreError(error, OperationType.GET, workspacePath);
  }
}

// --- Real-time Subscriptions ---
export function subscribeToWorkspace(
  userEmail: string,
  handlers: {
    onWorkspace: (meta: WorkspaceMetadata) => void;
    onPasscode: (passcode: string) => void;
    onAdmins: (admins: Admin[]) => void;
    onProjects: (projects: Project[]) => void;
    onDesigners: (designers: Designer[]) => void;
    onMovements: (movements: ClientMovement[]) => void;
    onDevices: (devices: DeviceAllocation[]) => void;
  }
): () => void {
  const unsubscribers: Unsubscribe[] = [];
  const normalizedEmail = userEmail.toLowerCase().trim();

  const wsPath = `workspaces/${WORKSPACE_ID}`;
  unsubscribers.push(
    onSnapshot(
      doc(db, 'workspaces', WORKSPACE_ID),
      (snap) => {
        if (snap.exists()) {
          handlers.onWorkspace(snap.data() as WorkspaceMetadata);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, wsPath)
    )
  );

  const secPath = `workspaces/${WORKSPACE_ID}/security/${SECURITY_DOC_ID}`;
  unsubscribers.push(
    onSnapshot(
      doc(db, 'workspaces', WORKSPACE_ID, 'security', SECURITY_DOC_ID),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { passcode?: string };
          if (data.passcode) handlers.onPasscode(data.passcode);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, secPath)
    )
  );

  const adminsPath = `workspaces/${WORKSPACE_ID}/admins`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'workspaces', WORKSPACE_ID, 'admins'),
        where('memberEmails', 'array-contains', normalizedEmail)
      ),
      (snap) => {
        const list: Admin[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            name: data.name || '',
            email: data.email || '',
            department: data.department || '',
            avatarUrl: data.avatarUrl,
            color: data.color || '#f97316',
          };
        });
        list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        handlers.onAdmins(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, adminsPath)
    )
  );

  const projectsPath = `workspaces/${WORKSPACE_ID}/projects`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'workspaces', WORKSPACE_ID, 'projects'),
        where('memberEmails', 'array-contains', normalizedEmail)
      ),
      (snap) => {
        const list: Project[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            name: data.name || '',
            adminId: data.adminId || '',
            designerId: data.designerId,
            status: data.status || 'Active',
            priority: data.priority || 'Medium',
            description: data.description,
            category: data.category,
            projectType: data.projectType || 'social_media',
            billingCycle: data.billingCycle || '1 to 30 or 31',
            startDate: data.startDate,
            endDate: data.endDate,
            dueDate: data.dueDate,
            createdAt: data.createdDateStr || timestampToDateStr(data.createdAt),
          };
        });
        list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        handlers.onProjects(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, projectsPath)
    )
  );

  const designersPath = `workspaces/${WORKSPACE_ID}/designers`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'workspaces', WORKSPACE_ID, 'designers'),
        where('memberEmails', 'array-contains', normalizedEmail)
      ),
      (snap) => {
        const list: Designer[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            name: data.name || '',
            email: data.email || '',
            role: data.role || '',
            avatarUrl: data.avatarUrl,
            allocatedAdminIds: Array.isArray(data.allocatedAdminIds)
              ? data.allocatedAdminIds
              : [],
            status: data.status || 'Available',
            phone: data.phone,
          };
        });
        list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        handlers.onDesigners(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, designersPath)
    )
  );

  const movementsPath = `workspaces/${WORKSPACE_ID}/movements`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'workspaces', WORKSPACE_ID, 'movements'),
        where('memberEmails', 'array-contains', normalizedEmail)
      ),
      (snap) => {
        const list: ClientMovement[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            clientType: data.clientType || 'onboarded',
            projectName: data.projectName || '',
            projectId: data.projectId,
            adminId: data.adminId,
            month: data.month || '',
            date: data.date || '',
            brandType: data.brandType,
            projectType: data.projectType,
            exitReason: data.exitReason,
            notes: data.notes,
            createdAt: timestampToDateStr(data.createdAt),
          };
        });
        list.sort(
          (a, b) =>
            (b.date || '').localeCompare(a.date || '') ||
            a.id.localeCompare(b.id, undefined, { numeric: true })
        );
        handlers.onMovements(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, movementsPath)
    )
  );

  const devicesPath = `workspaces/${WORKSPACE_ID}/devices`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'workspaces', WORKSPACE_ID, 'devices'),
        where('memberEmails', 'array-contains', normalizedEmail)
      ),
      (snap) => {
        const list: DeviceAllocation[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            adminId: data.adminId || '',
            adminName: data.adminName,
            deviceName: data.deviceName || '',
            simNumber: data.simNumber || '',
            deviceType: data.deviceType,
            carrier: data.carrier,
            imeiOrSerial: data.imeiOrSerial,
            status: data.status || 'Active',
            allocatedDate: data.allocatedDate || '',
            notes: data.notes,
            createdAt: timestampToDateStr(data.createdAt),
          };
        });
        list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        handlers.onDevices(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, devicesPath)
    )
  );

  return () => {
    unsubscribers.forEach((u) => u());
  };
}

// --- CRUD Operations ---
function getAuthUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User must be signed in to save to Firestore.');
  return sanitizeId(uid);
}

export async function saveAdminToCloud(
  admin: Admin,
  isNew: boolean,
  memberEmails: string[]
) {
  const id = sanitizeId(admin.id);
  const path = `workspaces/${WORKSPACE_ID}/admins/${id}`;
  const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'admins', id);
  const safeEmails = sanitizeMemberEmails(memberEmails, auth.currentUser?.email);

  try {
    if (isNew) {
      await setDoc(docRef, buildAdminPayload(admin, getAuthUid(), safeEmails, true));
    } else {
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        await setDoc(docRef, buildAdminPayload(admin, getAuthUid(), safeEmails, true));
      } else {
        await updateDoc(docRef, buildAdminUpdateFields(admin));
      }
    }
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteAdminAndProjectsFromCloud(
  adminId: string,
  projectIdsToDelete: string[]
) {
  const safeAdminId = sanitizeId(adminId);
  const path = `workspaces/${WORKSPACE_ID}/admins/${safeAdminId}`;
  try {
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
      (b) => b.delete(doc(db, 'workspaces', WORKSPACE_ID, 'admins', safeAdminId)),
    ];
    projectIdsToDelete.forEach((pid) => {
      const safePid = sanitizeId(pid);
      ops.push((b) =>
        b.delete(doc(db, 'workspaces', WORKSPACE_ID, 'projects', safePid))
      );
    });
    await commitBatchedWrites(ops);
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveProjectToCloud(
  project: Project,
  isNew: boolean,
  memberEmails: string[]
) {
  const id = sanitizeId(project.id);
  const path = `workspaces/${WORKSPACE_ID}/projects/${id}`;
  const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'projects', id);
  const safeEmails = sanitizeMemberEmails(memberEmails, auth.currentUser?.email);

  try {
    if (isNew) {
      await setDoc(docRef, buildProjectPayload(project, getAuthUid(), safeEmails, true));
    } else {
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        await setDoc(docRef, buildProjectPayload(project, getAuthUid(), safeEmails, true));
      } else {
        await updateDoc(docRef, buildProjectUpdateFields(project));
      }
    }
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function updateProjectStatusInCloud(
  projectId: string,
  status: ProjectStatus,
  fallbackProject?: Project,
  memberEmails: string[] = []
) {
  const id = sanitizeId(projectId);
  const path = `workspaces/${WORKSPACE_ID}/projects/${id}`;
  const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'projects', id);
  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists() && fallbackProject) {
      const safeEmails = sanitizeMemberEmails(memberEmails, auth.currentUser?.email);
      await setDoc(
        docRef,
        buildProjectPayload({ ...fallbackProject, status }, getAuthUid(), safeEmails, true)
      );
    } else {
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    }
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProjectAndMovementsFromCloud(
  projectId: string,
  linkedMovementIds: string[]
) {
  const safePid = sanitizeId(projectId);
  const path = `workspaces/${WORKSPACE_ID}/projects/${safePid}`;
  try {
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
      (b) => b.delete(doc(db, 'workspaces', WORKSPACE_ID, 'projects', safePid)),
    ];
    linkedMovementIds.forEach((mid) => {
      const safeMid = sanitizeId(mid);
      ops.push((b) =>
        b.delete(doc(db, 'workspaces', WORKSPACE_ID, 'movements', safeMid))
      );
    });
    await commitBatchedWrites(ops);
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDesignerToCloud(
  designer: Designer,
  isNew: boolean,
  memberEmails: string[]
) {
  const id = sanitizeId(designer.id);
  const path = `workspaces/${WORKSPACE_ID}/designers/${id}`;
  const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'designers', id);
  const safeEmails = sanitizeMemberEmails(memberEmails, auth.currentUser?.email);

  try {
    if (isNew) {
      await setDoc(
        docRef,
        buildDesignerPayload(designer, getAuthUid(), safeEmails, true)
      );
    } else {
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        await setDoc(
          docRef,
          buildDesignerPayload(designer, getAuthUid(), safeEmails, true)
        );
      } else {
        await updateDoc(docRef, buildDesignerUpdateFields(designer));
      }
    }
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteDesignerFromCloud(designerId: string) {
  const id = sanitizeId(designerId);
  const path = `workspaces/${WORKSPACE_ID}/designers/${id}`;
  try {
    await deleteDoc(doc(db, 'workspaces', WORKSPACE_ID, 'designers', id));
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMovementToCloud(
  movement: ClientMovement,
  isNew: boolean,
  memberEmails: string[]
) {
  const id = sanitizeId(movement.id);
  const path = `workspaces/${WORKSPACE_ID}/movements/${id}`;
  const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'movements', id);
  const safeEmails = sanitizeMemberEmails(memberEmails, auth.currentUser?.email);

  try {
    if (isNew) {
      await setDoc(
        docRef,
        buildMovementPayload(movement, getAuthUid(), safeEmails, true)
      );
    } else {
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        await setDoc(
          docRef,
          buildMovementPayload(movement, getAuthUid(), safeEmails, true)
        );
      } else {
        await updateDoc(docRef, buildMovementUpdateFields(movement));
      }
    }
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteMovementFromCloud(movementId: string) {
  const id = sanitizeId(movementId);
  const path = `workspaces/${WORKSPACE_ID}/movements/${id}`;
  try {
    await deleteDoc(doc(db, 'workspaces', WORKSPACE_ID, 'movements', id));
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDeviceToCloud(
  device: DeviceAllocation,
  isNew: boolean,
  memberEmails: string[]
) {
  const id = sanitizeId(device.id);
  const path = `workspaces/${WORKSPACE_ID}/devices/${id}`;
  const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'devices', id);
  const safeEmails = sanitizeMemberEmails(memberEmails, auth.currentUser?.email);

  try {
    if (isNew) {
      await setDoc(docRef, buildDevicePayload(device, getAuthUid(), safeEmails, true));
    } else {
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        await setDoc(docRef, buildDevicePayload(device, getAuthUid(), safeEmails, true));
      } else {
        await updateDoc(docRef, buildDeviceUpdateFields(device));
      }
    }
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteDeviceFromCloud(deviceId: string) {
  const id = sanitizeId(deviceId);
  const path = `workspaces/${WORKSPACE_ID}/devices/${id}`;
  try {
    await deleteDoc(doc(db, 'workspaces', WORKSPACE_ID, 'devices', id));
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updatePasscodeInCloud(newPasscode: string) {
  const path = `workspaces/${WORKSPACE_ID}/security/${SECURITY_DOC_ID}`;
  const docRef = doc(db, 'workspaces', WORKSPACE_ID, 'security', SECURITY_DOC_ID);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        passcode: clampStr(newPasscode, 64, '12345'),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        workspaceId: WORKSPACE_ID,
        ownerUid: getAuthUid(),
        passcode: clampStr(newPasscode, 64, '12345'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateWorkspaceMemberEmailsInCloud(nextEmails: string[]) {
  const safeEmails = sanitizeMemberEmails(nextEmails, auth.currentUser?.email);
  const wsPath = `workspaces/${WORKSPACE_ID}`;

  try {
    await updateDoc(doc(db, 'workspaces', WORKSPACE_ID), {
      memberEmails: safeEmails,
      updatedAt: serverTimestamp(),
    });

    const subcollections = ['admins', 'projects', 'designers', 'movements', 'devices'];
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

    const normalizedEmail = (
      auth.currentUser?.email || BOOTSTRAP_ADMIN_EMAIL
    )
      .toLowerCase()
      .trim();

    for (const sub of subcollections) {
      const snap = await getDocs(
        query(
          collection(db, 'workspaces', WORKSPACE_ID, sub),
          where('memberEmails', 'array-contains', normalizedEmail)
        )
      );
      snap.docs.forEach((d) => {
        ops.push((b) =>
          b.update(d.ref, {
            memberEmails: safeEmails,
            updatedAt: serverTimestamp(),
          })
        );
      });
    }

    await commitBatchedWrites(ops);
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, wsPath);
  }
}

export async function resetCloudWorkspaceToSeed(memberEmails: string[]) {
  const ownerUid = getAuthUid();
  const safeEmails = sanitizeMemberEmails(memberEmails, auth.currentUser?.email);
  const subcollections = ['admins', 'projects', 'designers', 'movements', 'devices'];
  const path = `workspaces/${WORKSPACE_ID}`;
  const normalizedEmail = (
    auth.currentUser?.email || BOOTSTRAP_ADMIN_EMAIL
  )
    .toLowerCase()
    .trim();

  try {
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

    for (const sub of subcollections) {
      const snap = await getDocs(
        query(
          collection(db, 'workspaces', WORKSPACE_ID, sub),
          where('memberEmails', 'array-contains', normalizedEmail)
        )
      );
      snap.docs.forEach((d) => {
        ops.push((b) => b.delete(d.ref));
      });
    }

    INITIAL_ADMINS.forEach((a) => {
      ops.push((b) =>
        b.set(
          doc(db, 'workspaces', WORKSPACE_ID, 'admins', sanitizeId(a.id)),
          buildAdminPayload(a, ownerUid, safeEmails, true)
        )
      );
    });
    INITIAL_PROJECTS.forEach((p) => {
      ops.push((b) =>
        b.set(
          doc(db, 'workspaces', WORKSPACE_ID, 'projects', sanitizeId(p.id)),
          buildProjectPayload(p, ownerUid, safeEmails, true)
        )
      );
    });
    INITIAL_DESIGNERS.forEach((d) => {
      ops.push((b) =>
        b.set(
          doc(db, 'workspaces', WORKSPACE_ID, 'designers', sanitizeId(d.id)),
          buildDesignerPayload(d, ownerUid, safeEmails, true)
        )
      );
    });
    INITIAL_CLIENT_MOVEMENTS.forEach((m) => {
      ops.push((b) =>
        b.set(
          doc(db, 'workspaces', WORKSPACE_ID, 'movements', sanitizeId(m.id)),
          buildMovementPayload(m, ownerUid, safeEmails, true)
        )
      );
    });
    INITIAL_DEVICES.forEach((dev) => {
      ops.push((b) =>
        b.set(
          doc(db, 'workspaces', WORKSPACE_ID, 'devices', sanitizeId(dev.id)),
          buildDevicePayload(dev, ownerUid, safeEmails, true)
        )
      );
    });

    await commitBatchedWrites(ops);
    await waitForPendingWrites(db);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncCurrentStateToCloud(
  snapshotData: WorkspaceSeedData,
  memberEmails: string[]
): Promise<{ totalSynced: number }> {
  const ownerUid = getAuthUid();
  const safeEmails = sanitizeMemberEmails(memberEmails, auth.currentUser?.email);
  const path = `workspaces/${WORKSPACE_ID}`;
  const normalizedEmail = (
    auth.currentUser?.email || BOOTSTRAP_ADMIN_EMAIL
  )
    .toLowerCase()
    .trim();

  try {
    const [adminsSnap, projectsSnap, designersSnap, movementsSnap, devicesSnap] =
      await Promise.all([
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'admins'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'projects'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'designers'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'movements'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'devices'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
      ]);

    const existingAdmins = new Set(adminsSnap.docs.map((d) => d.id));
    const existingProjects = new Set(projectsSnap.docs.map((d) => d.id));
    const existingDesigners = new Set(designersSnap.docs.map((d) => d.id));
    const existingMovements = new Set(movementsSnap.docs.map((d) => d.id));
    const existingDevices = new Set(devicesSnap.docs.map((d) => d.id));

    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

    snapshotData.admins.forEach((a) => {
      const id = sanitizeId(a.id);
      const ref = doc(db, 'workspaces', WORKSPACE_ID, 'admins', id);
      if (existingAdmins.has(id)) {
        ops.push((b) => b.update(ref, buildAdminUpdateFields(a)));
      } else {
        ops.push((b) => b.set(ref, buildAdminPayload(a, ownerUid, safeEmails, true)));
      }
    });

    snapshotData.projects.forEach((p) => {
      const id = sanitizeId(p.id);
      const ref = doc(db, 'workspaces', WORKSPACE_ID, 'projects', id);
      if (existingProjects.has(id)) {
        ops.push((b) => b.update(ref, buildProjectUpdateFields(p)));
      } else {
        ops.push((b) => b.set(ref, buildProjectPayload(p, ownerUid, safeEmails, true)));
      }
    });

    snapshotData.designers.forEach((d) => {
      const id = sanitizeId(d.id);
      const ref = doc(db, 'workspaces', WORKSPACE_ID, 'designers', id);
      if (existingDesigners.has(id)) {
        ops.push((b) => b.update(ref, buildDesignerUpdateFields(d)));
      } else {
        ops.push((b) => b.set(ref, buildDesignerPayload(d, ownerUid, safeEmails, true)));
      }
    });

    snapshotData.movements.forEach((m) => {
      const id = sanitizeId(m.id);
      const ref = doc(db, 'workspaces', WORKSPACE_ID, 'movements', id);
      if (existingMovements.has(id)) {
        ops.push((b) => b.update(ref, buildMovementUpdateFields(m)));
      } else {
        ops.push((b) => b.set(ref, buildMovementPayload(m, ownerUid, safeEmails, true)));
      }
    });

    snapshotData.devices.forEach((dev) => {
      const id = sanitizeId(dev.id);
      const ref = doc(db, 'workspaces', WORKSPACE_ID, 'devices', id);
      if (existingDevices.has(id)) {
        ops.push((b) => b.update(ref, buildDeviceUpdateFields(dev)));
      } else {
        ops.push((b) => b.set(ref, buildDevicePayload(dev, ownerUid, safeEmails, true)));
      }
    });

    await commitBatchedWrites(ops);
    await updatePasscodeInCloud(snapshotData.passcode);
    await updateDoc(doc(db, 'workspaces', WORKSPACE_ID), {
      seeded: true,
      updatedAt: serverTimestamp(),
    });
    await waitForPendingWrites(db);

    return {
      totalSynced:
        snapshotData.admins.length +
        snapshotData.projects.length +
        snapshotData.designers.length +
        snapshotData.movements.length +
        snapshotData.devices.length,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface FirestoreVerificationResult {
  projectId: string;
  databaseId: string;
  latencyMs: number;
  writeVerified: boolean;
  counts: {
    admins: number;
    projects: number;
    designers: number;
    movements: number;
    devices: number;
  };
}

export async function verifyFirestoreWorkspaceRoundTrip(): Promise<FirestoreVerificationResult> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Sign in with Google first to verify live Firestore read/write.');
  }

  const startedAt = Date.now();
  const normalizedEmail = user.email.toLowerCase().trim();
  const wsRef = doc(db, 'workspaces', WORKSPACE_ID);
  const wsPath = `workspaces/${WORKSPACE_ID}`;

  try {
    const wsSnap = await getDocFromServer(wsRef);
    let writeVerified = false;

    if (wsSnap.exists()) {
      const data = wsSnap.data() as WorkspaceMetadata;
      const isOwner =
        normalizedEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
        data.ownerUid === user.uid;

      if (isOwner) {
        await updateDoc(wsRef, {
          seeded: true,
          updatedAt: serverTimestamp(),
        });
        await getDocFromServer(wsRef);
        writeVerified = true;
      }
    }

    const [adminsSnap, projectsSnap, designersSnap, movementsSnap, devicesSnap] =
      await Promise.all([
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'admins'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'projects'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'designers'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'movements'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
        getDocsFromServer(
          query(
            collection(db, 'workspaces', WORKSPACE_ID, 'devices'),
            where('memberEmails', 'array-contains', normalizedEmail)
          )
        ),
      ]);

    return {
      projectId: resolvedFirebaseConfig.projectId,
      databaseId: resolvedFirebaseConfig.firestoreDatabaseId,
      latencyMs: Date.now() - startedAt,
      writeVerified,
      counts: {
        admins: adminsSnap.size,
        projects: projectsSnap.size,
        designers: designersSnap.size,
        movements: movementsSnap.size,
        devices: devicesSnap.size,
      },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, wsPath);
  }
}
