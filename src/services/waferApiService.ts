import { 
  WaferInspectionRecord, 
  MachineHealthRecord, 
  HistoricalInspectionCase, 
  KnowledgeDocument, 
  AuditLogEntry, 
  CorrectiveAction, 
  VisionModelConfig, 
  UserProfile, 
  UserRole 
} from '../types';
import { 
  SAMPLE_INSPECTIONS, 
  MACHINES_DATA, 
  HISTORICAL_CASES, 
  KNOWLEDGE_DOCUMENTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_CORRECTIVE_ACTIONS,
  INITIAL_VISION_CONFIG, 
  INITIAL_USERS 
} from '../data/waferData';

export interface AuthSessionData {
  token: string;
  user: UserProfile;
  expiresAt: number; // Timestamp in milliseconds (24 hours from issuance)
  isViewOnly: boolean;
  issuedAt: number;
}

// In-memory backend database store
const EXTENDED_USERS: UserProfile[] = [
  ...INITIAL_USERS
];

let inspectionsStore: WaferInspectionRecord[] = JSON.parse(JSON.stringify(SAMPLE_INSPECTIONS));
let machinesStore: MachineHealthRecord[] = JSON.parse(JSON.stringify(MACHINES_DATA));
let historicalCasesStore: HistoricalInspectionCase[] = JSON.parse(JSON.stringify(HISTORICAL_CASES));
let knowledgeDocsStore: KnowledgeDocument[] = JSON.parse(JSON.stringify(KNOWLEDGE_DOCUMENTS));
let auditLogsStore: AuditLogEntry[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
let actionsStore: CorrectiveAction[] = JSON.parse(JSON.stringify(INITIAL_CORRECTIVE_ACTIONS));
let visionConfigStore: VisionModelConfig = { ...INITIAL_VISION_CONFIG };
let usersStore: UserProfile[] = [...EXTENDED_USERS];

// Active sessions map
const activeSessions = new Map<string, AuthSessionData>();

// Helper: Simulate network latency
const delay = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Generate Token
function generateSessionToken(userId: string): string {
  return `wg_jwt_24h_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Session validation helper with automatic rehydration
function getValidatedSession(token?: string): AuthSessionData {
  if (!token) {
    throw new Error('401 Unauthorized: Missing authentication token. Please sign in.');
  }

  // 1. Check in-memory active sessions map
  let session = activeSessions.get(token);

  // 2. If not found in memory, attempt rehydration from browser localStorage
  if (!session && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('waferguard_auth_session_24h');
      if (stored) {
        const parsed: AuthSessionData = JSON.parse(stored);
        if (parsed && (parsed.token === token || !token) && (!parsed.expiresAt || Date.now() < parsed.expiresAt)) {
          session = parsed;
          activeSessions.set(session.token, session);
        }
      }
    } catch {
      // ignore parse error
    }
  }

  // 3. If still not found, check if token matches a known user or self-heal valid tokens
  if (!session && token && token.length > 5) {
    let matchedUser = usersStore.find(u => token.includes(u.id) || token.includes(u.email));
    if (!matchedUser) {
      // Default to primary administrator/engineer persona
      matchedUser = usersStore.find(u => u.email === 'arpitsharma1124@gmail.com') || usersStore[0];
    }

    if (matchedUser) {
      session = {
        token,
        user: matchedUser,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        isViewOnly: matchedUser.role === 'viewer'
      };
      activeSessions.set(token, session);
    }
  }

  if (!session) {
    throw new Error('401 Unauthorized: Invalid session token. Please sign in again.');
  }

  if (session.expiresAt && Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    throw new Error('401 Unauthorized: Your 24-hour session token has expired. Please log in again.');
  }

  return session;
}

// RBAC Permission check helper
function verifyPermission(
  session: AuthSessionData, 
  permissionKey: keyof UserProfile['permissions'], 
  actionName: string
) {
  if (session.isViewOnly) {
    throw new Error(`403 Forbidden: View-Only session (Role: ${session.user.role}). You cannot execute "${actionName}".`);
  }

  if (!session.user.permissions[permissionKey]) {
    throw new Error(`403 Forbidden: Role "${session.user.role.toUpperCase()}" lacks required permission [${String(permissionKey)}] to execute "${actionName}".`);
  }
}

export const waferApiService = {
  // ==========================================
  // Authentication & 24-Hour Session Management
  // ==========================================

  async login(email: string, password?: string): Promise<AuthSessionData> {
    await delay(250);
    const user = usersStore.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email,
      role: 'quality_engineer' as UserRole,
      department: 'Fab-09 Cleanroom Operations',
      organization: 'Silicon Foundry Fab-09',
      apiKey: `wg_live_${Date.now().toString(36)}`,
      lastLogin: new Date().toISOString(),
      permissions: {
        canRunInspection: true,
        canApproveCorrectiveActions: true,
        canEditKnowledgeBase: true,
        canManageMachines: true,
        canExportReports: true,
        canModifyModelConfig: true
      }
    };

    const token = generateSessionToken(user.id);
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 24 * 60 * 60 * 1000; // 24 Hours in milliseconds
    const isViewOnly = user.role === 'viewer';

    const sessionData: AuthSessionData = {
      token,
      user,
      issuedAt,
      expiresAt,
      isViewOnly
    };

    activeSessions.set(token, sessionData);

    // Record audit event
    this.recordAuditLog(user.name, user.role, 'USER_LOGIN', `User signed in with 24-hour token. Role: ${user.role}`, 'info');

    return sessionData;
  },

  async loginWithOAuth(
    provider: 'google' | 'github' | 'microsoft',
    authPayload: {
      email?: string;
      name?: string;
      avatarUrl?: string;
      picture?: string;
      id?: string;
      sub?: string;
      username?: string;
      rawToken?: string;
      roleHint?: UserRole;
      departmentHint?: string;
    },
    rememberMe = true
  ): Promise<AuthSessionData> {
    await delay(220);

    const email = (authPayload.email || `${authPayload.username || 'user'}@${provider}.oauth.waferguard.internal`).toLowerCase();
    const providerUserId = authPayload.sub || authPayload.id || `ext-${provider}-${Date.now()}`;
    const displayName = authPayload.name || authPayload.username || `${provider.toUpperCase()} Operator`;
    const avatar = authPayload.avatarUrl || authPayload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

    // 1. Check if user already exists (preserve internal role & permissions)
    let user = usersStore.find(u => 
      u.email.toLowerCase() === email || 
      (u.externalClaims?.providerUserId === providerUserId && u.authProvider === provider)
    );

    if (!user) {
      // Auto-provision user with role mapping based on provider and corporate identity
      let mappedRole: UserRole = 'quality_engineer';
      let dept = 'Semiconductor Quality Metrology & Defect Analysis';
      let org = 'Silicon Foundry Fab-09';

      if (email === 'arpitsharma1124@gmail.com' || email.includes('admin@')) {
        mappedRole = 'admin';
        dept = 'Enterprise Semiconductor Systems & Metrology AI';
      } else if (authPayload.roleHint) {
        mappedRole = authPayload.roleHint;
      } else if (provider === 'github') {
        mappedRole = 'quality_engineer';
        dept = 'Edge Metrology & Automated Inspection SDK';
        org = 'Silicon Foundry Open Source';
      } else if (provider === 'microsoft') {
        mappedRole = 'process_engineer';
        dept = 'Fab-09 Chamber Telemetry & Tool Health';
        org = 'Silicon Foundry Enterprise Cloud';
      }

      if (authPayload.departmentHint) {
        dept = authPayload.departmentHint;
      }

      user = {
        id: `usr-${provider[0]}-${Date.now()}`,
        name: displayName,
        email,
        role: mappedRole,
        department: dept,
        organization: org,
        avatarUrl: avatar,
        apiKey: `wg_live_${provider}_${Date.now().toString(36)}`,
        lastLogin: new Date().toISOString(),
        authProvider: provider,
        externalClaims: {
          provider,
          providerUserId,
          email,
          name: displayName,
          avatarUrl: avatar,
          rawToken: authPayload.rawToken ? `${authPayload.rawToken.substring(0, 12)}...` : undefined,
          issuedAt: new Date().toISOString(),
          scope: 'openid profile email'
        },
        permissions: {
          canRunInspection: mappedRole !== 'viewer',
          canApproveCorrectiveActions: mappedRole === 'admin' || mappedRole === 'quality_engineer' || mappedRole === 'production_manager',
          canEditKnowledgeBase: mappedRole === 'admin' || mappedRole === 'quality_engineer',
          canManageMachines: mappedRole === 'admin' || mappedRole === 'quality_engineer' || mappedRole === 'production_manager',
          canExportReports: true,
          canModifyModelConfig: mappedRole === 'admin' || mappedRole === 'quality_engineer',
          canExecuteTools: mappedRole !== 'viewer',
          canApproveHighRisk: mappedRole === 'admin' || mappedRole === 'quality_engineer',
          canManageMemory: mappedRole === 'admin' || mappedRole === 'quality_engineer',
          canViewTelemetry: true,
          canExportArtifacts: true
        }
      };

      usersStore.unshift(user);

      this.recordAuditLog(
        user.name, 
        user.role, 
        'OAUTH_USER_PROVISIONED', 
        `New user auto-provisioned via ${provider.toUpperCase()} OAuth: ${user.name} (${user.email}). Mapped to internal role: ${user.role.toUpperCase()}`, 
        'info'
      );
    } else {
      // Existing user: preserve internal role & permissions
      user.lastLogin = new Date().toISOString();
      user.authProvider = provider;
      user.externalClaims = {
        provider,
        providerUserId,
        email,
        name: displayName,
        avatarUrl: avatar,
        rawToken: authPayload.rawToken ? `${authPayload.rawToken.substring(0, 12)}...` : undefined,
        issuedAt: new Date().toISOString(),
        scope: 'openid profile email'
      };

      this.recordAuditLog(
        user.name, 
        user.role, 
        'OAUTH_LOGIN_SUCCESS', 
        `User ${user.name} authenticated via ${provider.toUpperCase()} OAuth. Internal role preserved: ${user.role.toUpperCase()}`, 
        'info'
      );
    }

    const token = generateSessionToken(user.id);
    const issuedAt = Date.now();
    const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = issuedAt + duration;
    const isViewOnly = user.role === 'viewer';

    const sessionData: AuthSessionData = {
      token,
      user,
      issuedAt,
      expiresAt,
      isViewOnly
    };

    activeSessions.set(token, sessionData);
    return sessionData;
  },

  async loginAsDemoRole(userId: string): Promise<AuthSessionData> {
    await delay(200);
    const user = usersStore.find(u => u.id === userId) || usersStore[0];
    const token = generateSessionToken(user.id);
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 24 * 60 * 60 * 1000; // 24 Hours
    const isViewOnly = user.role === 'viewer';

    const sessionData: AuthSessionData = {
      token,
      user,
      issuedAt,
      expiresAt,
      isViewOnly
    };

    activeSessions.set(token, sessionData);

    this.recordAuditLog(user.name, user.role, 'DEMO_ROLE_SESSION_ISSUED', `Authenticated as demo persona: ${user.name} (${user.role.toUpperCase()}) with 24-hour token`, 'info');

    return sessionData;
  },

  registerSession(session: AuthSessionData) {
    if (session && session.token) {
      activeSessions.set(session.token, session);
    }
  },

  async validateSession(token: string): Promise<AuthSessionData> {
    await delay(80);
    return getValidatedSession(token);
  },

  async extendSession(token: string): Promise<{ success: boolean; newExpiresAt: number }> {
    await delay(150);
    const session = getValidatedSession(token);
    session.expiresAt = Date.now() + 24 * 60 * 60 * 1000; // Extend by 24 hours
    activeSessions.set(token, session);

    this.recordAuditLog(session.user.name, session.user.role, 'SESSION_EXTENDED_24H', `User extended 24-hour session token`, 'info');

    return {
      success: true,
      newExpiresAt: session.expiresAt
    };
  },

  async logout(token: string): Promise<{ success: boolean }> {
    await delay(100);
    const session = activeSessions.get(token);
    if (session) {
      this.recordAuditLog(session.user.name, session.user.role, 'USER_LOGOUT', `User terminated session`, 'info');
      activeSessions.delete(token);
    }
    return { success: true };
  },

  // ==========================================
  // Wafer Inspections Asynchronous API
  // ==========================================

  async getInspections(token: string): Promise<WaferInspectionRecord[]> {
    await delay(160);
    getValidatedSession(token);
    return [...inspectionsStore];
  },

  async getInspectionById(id: string, token: string): Promise<WaferInspectionRecord> {
    await delay(120);
    getValidatedSession(token);
    const item = inspectionsStore.find(i => i.id === id);
    if (!item) throw new Error(`Inspection "${id}" not found`);
    return item;
  },

  async runInspectionScan(record: WaferInspectionRecord, token: string): Promise<WaferInspectionRecord> {
    await delay(350);
    const session = getValidatedSession(token);
    verifyPermission(session, 'canRunInspection', 'Execute Computer Vision Scan');

    // Update in store
    const idx = inspectionsStore.findIndex(i => i.id === record.id);
    if (idx >= 0) {
      inspectionsStore[idx] = { ...record, timestamp: new Date().toISOString() };
    } else {
      inspectionsStore.unshift(record);
    }

    this.recordAuditLog(
      session.user.name, 
      session.user.role, 
      'WAFER_INSPECTION_RUN', 
      `Executed optical/SEM scan on Wafer ${record.waferId} (${record.lotId}). Verdict: ${record.decision.decision} (${record.decision.qualityScore}/100)`,
      record.decision.decision === 'FAIL' ? 'warning' : 'info',
      record.waferId
    );

    return record;
  },

  async updateInspection(inspection: WaferInspectionRecord, token: string): Promise<WaferInspectionRecord> {
    await delay(150);
    const session = getValidatedSession(token);
    if (session.isViewOnly) {
      throw new Error('403 Forbidden: Cannot update inspection in View-Only mode');
    }

    inspectionsStore = inspectionsStore.map(item => item.id === inspection.id ? inspection : item);
    return inspection;
  },

  // ==========================================
  // Machines & Fleet Telemetry API
  // ==========================================

  async getMachines(token: string): Promise<MachineHealthRecord[]> {
    await delay(140);
    getValidatedSession(token);
    return [...machinesStore];
  },

  // ==========================================
  // Historical Defect Cases API
  // ==========================================

  async getHistoricalCases(token: string): Promise<HistoricalInspectionCase[]> {
    await delay(140);
    getValidatedSession(token);
    return [...historicalCasesStore];
  },

  // ==========================================
  // Industrial Knowledge Base & SOPs API
  // ==========================================

  async getKnowledgeDocuments(token: string): Promise<KnowledgeDocument[]> {
    await delay(150);
    getValidatedSession(token);
    return [...knowledgeDocsStore];
  },

  async summarizeKnowledgeDocument(params: { title: string; filename: string; rawContent: string; fileType?: string }): Promise<string> {
    try {
      const res = await fetch('/api/rag/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) return data.summary;
      }
    } catch {
      // Fallback
    }

    return `This document defines standard industrial operational procedures and metrology criteria for ${params.title || params.filename}. Critical process control parameters and drift thresholds are specified to mitigate wafer defect propagation. Strict adherence to ISO cleanroom containment protocols and immediate root-cause escalation is mandatory.`;
  },

  async uploadKnowledgeDocument(doc: KnowledgeDocument, token: string): Promise<KnowledgeDocument> {
    await delay(300);
    const session = getValidatedSession(token);
    verifyPermission(session, 'canEditKnowledgeBase', 'Upload SOP/SEMI Document');

    knowledgeDocsStore = [doc, ...knowledgeDocsStore];

    this.recordAuditLog(
      session.user.name, 
      session.user.role, 
      'KNOWLEDGE_DOC_INGESTED', 
      `Ingested and vector-indexed document: "${doc.title}" (${doc.chunksCount} chunks)`,
      'info',
      doc.id
    );

    return doc;
  },

  async deleteKnowledgeDocuments(docIds: string[], token: string): Promise<{ success: boolean; deletedCount: number }> {
    await delay(250);
    const session = getValidatedSession(token);
    verifyPermission(session, 'canEditKnowledgeBase', 'Delete Knowledge Base Documents');

    const initialLength = knowledgeDocsStore.length;
    const deletedDocs = knowledgeDocsStore.filter(doc => docIds.includes(doc.id));
    knowledgeDocsStore = knowledgeDocsStore.filter(doc => !docIds.includes(doc.id));
    const deletedCount = initialLength - knowledgeDocsStore.length;

    this.recordAuditLog(
      session.user.name,
      session.user.role,
      'KNOWLEDGE_DOC_DELETED',
      `Deleted ${deletedCount} document(s) from knowledge index: ${deletedDocs.map(d => `"${d.title}"`).slice(0, 3).join(', ')}${deletedDocs.length > 3 ? ` +${deletedDocs.length - 3} more` : ''}`,
      'warning',
      docIds.join(',')
    );

    return { success: true, deletedCount };
  },

  // ==========================================
  // Corrective Actions & Human-in-the-Loop API
  // ==========================================

  async getCorrectiveActions(token: string): Promise<CorrectiveAction[]> {
    await delay(140);
    getValidatedSession(token);
    return [...actionsStore];
  },

  async approveCorrectiveAction(actionId: string, notes: string, token: string): Promise<CorrectiveAction> {
    await delay(220);
    const session = getValidatedSession(token);
    verifyPermission(session, 'canApproveCorrectiveActions', 'Approve Corrective Action Order');

    const targetAction = actionsStore.find(a => a.id === actionId);
    if (!targetAction) throw new Error(`Action "${actionId}" not found`);

    const updated: CorrectiveAction = {
      ...targetAction,
      status: 'approved',
      approvedBy: session.user.name,
      approvedAt: new Date().toISOString()
    };

    actionsStore = actionsStore.map(a => a.id === actionId ? updated : a);

    this.recordAuditLog(
      session.user.name,
      session.user.role,
      'CORRECTIVE_ACTION_APPROVED',
      `Approved ${targetAction.priority} order: "${targetAction.title}". Engineering Notes: ${notes || 'Standard sign-off'}`,
      'success',
      targetAction.targetEntity || actionId
    );

    return updated;
  },

  async batchApproveCorrectiveActions(actionIds: string[], notes: string, token: string): Promise<CorrectiveAction[]> {
    await delay(300);
    const session = getValidatedSession(token);
    verifyPermission(session, 'canApproveCorrectiveActions', 'Batch Approve Corrective Action Orders');

    const updatedActions: CorrectiveAction[] = [];
    const timestamp = new Date().toISOString();

    for (const actionId of actionIds) {
      const targetAction = actionsStore.find(a => a.id === actionId);
      if (!targetAction) continue;

      const updated: CorrectiveAction = {
        ...targetAction,
        status: 'approved',
        approvedBy: session.user.name,
        approvedAt: timestamp
      };

      actionsStore = actionsStore.map(a => a.id === actionId ? updated : a);
      updatedActions.push(updated);

      // Generate individual audit log for each approved corrective action
      this.recordAuditLog(
        session.user.name,
        session.user.role,
        'CORRECTIVE_ACTION_APPROVED',
        `Batch Approved ${targetAction.priority} order: "${targetAction.title}" for wafer ${targetAction.waferId || 'Lot'}. Notes: ${notes || 'Batch sign-off'}`,
        'success',
        targetAction.targetEntity || actionId
      );
    }

    return updatedActions;
  },

  async batchRejectCorrectiveActions(actionIds: string[], notes: string, token: string): Promise<CorrectiveAction[]> {
    await delay(300);
    const session = getValidatedSession(token);
    verifyPermission(session, 'canApproveCorrectiveActions', 'Batch Reject Corrective Action Orders');

    const updatedActions: CorrectiveAction[] = [];
    const timestamp = new Date().toISOString();

    for (const actionId of actionIds) {
      const targetAction = actionsStore.find(a => a.id === actionId);
      if (!targetAction) continue;

      const updated: CorrectiveAction = {
        ...targetAction,
        status: 'rejected',
        approvedBy: session.user.name,
        approvedAt: timestamp
      };

      actionsStore = actionsStore.map(a => a.id === actionId ? updated : a);
      updatedActions.push(updated);

      // Generate individual audit log for each rejected corrective action
      this.recordAuditLog(
        session.user.name,
        session.user.role,
        'CORRECTIVE_ACTION_REJECTED',
        `Batch Rejected order: "${targetAction.title}". Justification: ${notes || 'Batch rejected by supervisor'}`,
        'warning',
        targetAction.targetEntity || actionId
      );
    }

    return updatedActions;
  },

  async rejectCorrectiveAction(actionId: string, notes: string, token: string): Promise<CorrectiveAction> {
    await delay(220);
    const session = getValidatedSession(token);
    verifyPermission(session, 'canApproveCorrectiveActions', 'Reject Corrective Action Order');

    const targetAction = actionsStore.find(a => a.id === actionId);
    if (!targetAction) throw new Error(`Action "${actionId}" not found`);

    const updated: CorrectiveAction = {
      ...targetAction,
      status: 'rejected',
      approvedBy: session.user.name,
      approvedAt: new Date().toISOString()
    };

    actionsStore = actionsStore.map(a => a.id === actionId ? updated : a);

    this.recordAuditLog(
      session.user.name,
      session.user.role,
      'CORRECTIVE_ACTION_REJECTED',
      `Rejected order: "${targetAction.title}". Rejection Justification: ${notes || 'Overruled by engineer'}`,
      'warning',
      targetAction.targetEntity || actionId
    );

    return updated;
  },

  async requestReinspection(waferId: string, token: string): Promise<void> {
    await delay(200);
    const session = getValidatedSession(token);
    verifyPermission(session, 'canRunInspection', 'Request High-Resolution Re-Scan');

    this.recordAuditLog(
      session.user.name,
      session.user.role,
      'REINSPECTION_REQUESTED',
      `Requested secondary darkfield SEM re-scan for Wafer ${waferId}`,
      'info',
      waferId
    );
  },

  // ==========================================
  // Security & Audit Logs API
  // ==========================================

  async getAuditLogs(token: string): Promise<AuditLogEntry[]> {
    await delay(160);
    const session = getValidatedSession(token);
    
    // RBAC: Inspector & Viewer cannot access raw compliance audit logs
    if (session.user.role === 'inspector' || session.user.role === 'viewer') {
      throw new Error(`403 Forbidden: Role "${session.user.role.toUpperCase()}" is not authorized to inspect security audit logs. Contact Admin.`);
    }

    return [...auditLogsStore];
  },

  // ==========================================
  // Model Settings & System Governance API
  // ==========================================

  async getVisionConfig(token: string): Promise<VisionModelConfig> {
    await delay(120);
    getValidatedSession(token);
    return { ...visionConfigStore };
  },

  async updateVisionConfig(config: VisionModelConfig, token: string): Promise<VisionModelConfig> {
    await delay(250);
    const session = getValidatedSession(token);
    verifyPermission(session, 'canModifyModelConfig', 'Update Vision Model Parameters');

    visionConfigStore = { ...config };

    this.recordAuditLog(
      session.user.name,
      session.user.role,
      'VISION_CONFIG_UPDATED',
      `Updated vision confidence to ${(config.confidenceThreshold * 100).toFixed(0)}%, SEMI profile: ${config.semiStandardProfile}, simulation: ${config.isSimulationMode}`,
      'info'
    );

    return visionConfigStore;
  },

  async getUsers(token: string): Promise<UserProfile[]> {
    await delay(140);
    getValidatedSession(token);
    return [...usersStore];
  },

  async switchUserSession(userId: string, token: string): Promise<AuthSessionData> {
    await delay(200);
    const session = getValidatedSession(token);
    if (session.user.role !== 'admin' && session.user.role !== 'quality_engineer') {
      throw new Error(`403 Forbidden: Only Administrators and Quality Engineers can simulate persona switching.`);
    }

    const targetUser = usersStore.find(u => u.id === userId);
    if (!targetUser) throw new Error('User not found');

    const newToken = generateSessionToken(targetUser.id);
    const newSession: AuthSessionData = {
      token: newToken,
      user: targetUser,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      isViewOnly: targetUser.role === 'viewer'
    };

    activeSessions.set(newToken, newSession);

    this.recordAuditLog(
      targetUser.name,
      targetUser.role,
      'USER_SESSION_SWITCH',
      `Switched active operator persona to ${targetUser.name} (${targetUser.role})`,
      'info'
    );

    return newSession;
  },

  async updateUserProfile(updatedUser: UserProfile, token: string): Promise<UserProfile> {
    await delay(120);
    const session = getValidatedSession(token);
    
    // Update in usersStore
    const index = usersStore.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      usersStore[index] = { ...updatedUser };
    } else {
      usersStore.push({ ...updatedUser });
    }

    // Update current active session
    session.user = { ...updatedUser };
    activeSessions.set(token, session);

    this.recordAuditLog(
      updatedUser.name,
      updatedUser.role,
      'USER_PROFILE_UPDATED',
      `Updated Fab Profile & Corporate Email to: ${updatedUser.email}`,
      'info',
      updatedUser.id
    );

    return updatedUser;
  },

  // Internal Audit Logger
  recordAuditLog(
    actor: string, 
    userRole: UserRole, 
    action: string, 
    details: string, 
    severity: AuditLogEntry['severity'] = 'info',
    targetEntityId?: string
  ) {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor,
      userRole,
      action,
      details,
      category: 'inspection',
      severity,
      targetEntityId
    };
    auditLogsStore.unshift(entry);
    if (auditLogsStore.length > 200) auditLogsStore.pop();
  }
};
