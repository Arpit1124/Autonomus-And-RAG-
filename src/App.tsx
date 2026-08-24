import React, { useState, useEffect, useCallback } from 'react';
import { 
  WaferInspectionRecord, 
  MachineHealthRecord, 
  HistoricalInspectionCase, 
  KnowledgeDocument, 
  AuditLogEntry, 
  CorrectiveAction, 
  VisionModelConfig, 
  UserProfile, 
  ChatMessage, 
  Citation,
  UserRole 
} from './types';
import { waferApiService, AuthSessionData } from './services/waferApiService';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { AIInspectionView } from './components/AIInspectionView';
import { RootCauseAnalysisView } from './components/RootCauseAnalysisView';
import { DefectTaxonomyView } from './components/DefectTaxonomyView';
import { MachineHealthView } from './components/MachineHealthView';
import { HistoricalCasesView } from './components/HistoricalCasesView';
import { IndustrialKnowledgeBaseView } from './components/IndustrialKnowledgeBaseView';
import { QualityCopilotView } from './components/QualityCopilotView';
import { HumanInTheLoopView } from './components/HumanInTheLoopView';
import { ProductionAnalyticsView } from './components/ProductionAnalyticsView';
import { InspectionReportView } from './components/InspectionReportView';
import { AuditLogsView } from './components/AuditLogsView';
import { ModelSettingsView } from './components/ModelSettingsView';
import { WaferGuardLogin } from './components/WaferGuardLogin';
import { SessionExpiryModal } from './components/SessionExpiryModal';
import { SecuritySettingsModal } from './components/auth/SecuritySettingsModal';
import { VoiceCommandHUD } from './components/voice/VoiceCommandHUD';
import { globalVoiceService } from './services/voiceCommandService';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { NotificationCenterModal, IndustrialNotification } from './components/common/NotificationCenterModal';
import { SystemHealthModal } from './components/common/SystemHealthModal';
import { HelpDocModal } from './components/common/HelpDocModal';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

const SESSION_STORAGE_KEY = 'waferguard_auth_session_24h';

export default function App() {
  // Authentication & 24-Hour Session State
  const [authSession, setAuthSession] = useState<AuthSessionData | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed: AuthSessionData = JSON.parse(stored);
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          waferApiService.registerSession(parsed);
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [logoutReason, setLogoutReason] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(86400);
  const [showExpiryModal, setShowExpiryModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [showGlobalSearchModal, setShowGlobalSearchModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showSystemHealthModal, setShowSystemHealthModal] = useState<boolean>(false);
  const [showHelpDocsModal, setShowHelpDocsModal] = useState<boolean>(false);

  // Industrial Notifications State
  const [notifications, setNotifications] = useState<IndustrialNotification[]>([
    {
      id: 'notif-01',
      title: 'M-03 Chamber Drift Anomaly',
      message: 'Etch Chamber M-03 temperature variance exceeded threshold (+14.2°C on chuck perimeter thermocouple).',
      timestamp: '2 mins ago',
      severity: 'critical',
      category: 'tool_drift',
      read: false,
      linkTab: 'machines'
    },
    {
      id: 'notif-02',
      title: 'Critical Defect Cluster on W-7821',
      message: 'Sub-micron poly-Si bridging detected across Die (18, 12). 8D RCA analysis synthesized.',
      timestamp: '14 mins ago',
      severity: 'major',
      category: 'defect_spike',
      read: false,
      linkTab: 'rca'
    },
    {
      id: 'notif-03',
      title: 'Corrective Action Pending Approval',
      message: 'Action CA-2024-089 (MFC-04 Valve Flush) requires Lead Quality Engineer sign-off.',
      timestamp: '32 mins ago',
      severity: 'minor',
      category: 'approval_required',
      read: true,
      linkTab: 'hitl'
    },
    {
      id: 'notif-04',
      title: 'SEMI E10 Knowledge Index Synced',
      message: '14,820 SOP and semiconductor standard embeddings updated in Qdrant vector database.',
      timestamp: '1 hour ago',
      severity: 'info',
      category: 'rag_sync',
      read: true,
      linkTab: 'knowledge'
    }
  ]);

  // Global Keydown Listeners (⌘K, etc.)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowGlobalSearchModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('inspection');

  // Core Asynchronous Data Stores
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [inspections, setInspections] = useState<WaferInspectionRecord[]>([]);
  const [currentInspection, setCurrentInspection] = useState<WaferInspectionRecord | null>(null);
  const [machines, setMachines] = useState<MachineHealthRecord[]>([]);
  const [historicalCases, setHistoricalCases] = useState<HistoricalInspectionCase[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [visionConfig, setVisionConfig] = useState<VisionModelConfig>({
    activeModelName: 'WaferGuard-YOLOv8-Semiconductor-v2.4',
    endpointUrl: 'https://vision-api.internal.fab9-semi.com/v1/inspect',
    confidenceThreshold: 0.85,
    iouThreshold: 0.45,
    autoTriggerRcaOnFail: true,
    minDefectSizeUm: 5.0,
    semiStandardProfile: 'SEMI_E10_STRICT',
    isSimulationMode: true
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autonomous Agent Chat Engine State
  const [isCopilotProcessing, setIsCopilotProcessing] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 1. Asynchronous Data Fetching Layer (Mimicking Real Backend API)
  const fetchAllData = useCallback(async (token: string) => {
    setIsDataLoading(true);
    setErrorMessage(null);
    try {
      const [
        fetchedInspections,
        fetchedMachines,
        fetchedCases,
        fetchedDocs,
        fetchedActions,
        fetchedConfig,
        fetchedUsers
      ] = await Promise.all([
        waferApiService.getInspections(token),
        waferApiService.getMachines(token),
        waferApiService.getHistoricalCases(token),
        waferApiService.getKnowledgeDocuments(token),
        waferApiService.getCorrectiveActions(token),
        waferApiService.getVisionConfig(token),
        waferApiService.getUsers(token)
      ]);

      setInspections(fetchedInspections);
      setCurrentInspection(fetchedInspections[0] || null);
      setMachines(fetchedMachines);
      setHistoricalCases(fetchedCases);
      setDocuments(fetchedDocs);
      setActions(fetchedActions);
      setVisionConfig(fetchedConfig);
      setUsers(fetchedUsers);

      // Audit logs (may throw 403 for Inspector / Viewer)
      try {
        const fetchedLogs = await waferApiService.getAuditLogs(token);
        setAuditLogs(fetchedLogs);
      } catch (err: any) {
        console.warn('Audit logs not accessible for current role:', err?.message);
        setAuditLogs([]);
      }

      // Initialize Copilot Greeting
      if (fetchedInspections[0]) {
        setChatMessages([
          {
            id: 'msg-init-01',
            role: 'agent',
            timestamp: new Date().toTimeString().split(' ')[0],
            content: `### 🛡️ WaferGuard AI System Ready
Autonomous Quality Engineering Copilot initialized for **Fab-09 Cleanroom Operations**.

- **Active Inspection Target:** Wafer \`${fetchedInspections[0].waferId}\` (Lot: \`${fetchedInspections[0].lotId}\`)
- **Metrology Station:** \`${fetchedInspections[0].machineId}\` (Plasma Etcher #3)
- **Fleet Alert:** Chamber B thermal drift (+24.2°C) detected on Tool \`M-03\`.

How can I assist you with wafer metrology, root-cause decomposition, or corrective action planning today?`,
            subTasks: [
              { id: 'st-01', title: 'Connect Optical & SEM Metrology Data Feed', status: 'completed' },
              { id: 'st-02', title: 'Index SEMI E10 & Foundry SOP Protocols', status: 'completed' },
              { id: 'st-03', title: 'Initialize Real-Time Tool Telemetry Stream', status: 'completed' }
            ]
          }
        ]);
      }
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      const msg = err?.message || 'Failed to connect to semiconductor API';
      if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('expired')) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setAuthSession(null);
        setLogoutReason('Your session has expired. Please sign in again.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Sync session on mount
  useEffect(() => {
    if (authSession?.token) {
      fetchAllData(authSession.token);
    }
  }, [authSession?.token, fetchAllData]);

  // 2. 24-Hour Session Expiry & 5-Minute Warning Modal Timer
  useEffect(() => {
    if (!authSession) return;

    const interval = setInterval(() => {
      const remainingMs = authSession.expiresAt - Date.now();
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setRemainingSeconds(remainingSec);

      // Trigger 5-minute warning modal (300 seconds)
      if (remainingSec <= 300 && remainingSec > 0) {
        setShowExpiryModal(true);
      }

      // Automatic Logout when session expires
      if (remainingSec <= 0) {
        clearInterval(interval);
        handleAutomaticLogout('Your 24-hour secure cleanroom session has expired. Please sign in again.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [authSession]);

  // Handle Automatic Logout
  const handleAutomaticLogout = (reason: string) => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setAuthSession(null);
    setShowExpiryModal(false);
    setLogoutReason(reason);
    setActiveTab('inspection');
  };

  // Handle Manual Logout
  const handleManualLogout = async () => {
    if (authSession?.token) {
      await waferApiService.logout(authSession.token);
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setAuthSession(null);
    setShowExpiryModal(false);
    setLogoutReason('You have signed out successfully.');
    setActiveTab('inspection');
  };

  // Handle Session Extension (+24 Hours)
  const handleExtendSession = async () => {
    if (!authSession?.token) return;
    const res = await waferApiService.extendSession(authSession.token);
    if (res.success) {
      const updated: AuthSessionData = {
        ...authSession,
        expiresAt: res.newExpiresAt
      };
      setAuthSession(updated);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      setShowExpiryModal(false);
    }
  };

  // Simulation Helper for Testing Session Expiration
  const handleSimulateRemainingSeconds = (sec: number) => {
    if (!authSession) return;
    const newExpiresAt = Date.now() + sec * 1000;
    const updated: AuthSessionData = {
      ...authSession,
      expiresAt: newExpiresAt
    };
    setAuthSession(updated);
    setRemainingSeconds(sec);
    if (sec <= 300 && sec > 0) {
      setShowExpiryModal(true);
    }
  };

  // Demo Login Handler
  const handleLoginWithDemo = async (userId: string) => {
    setIsLoadingAuth(true);
    setLogoutReason(null);
    try {
      const session = await waferApiService.loginAsDemoRole(userId);
      setAuthSession(session);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      await fetchAllData(session.token);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Email Login Handler
  const handleLoginWithEmail = async (email: string, password?: string) => {
    setIsLoadingAuth(true);
    setLogoutReason(null);
    try {
      const session = await waferApiService.login(email, password);
      setAuthSession(session);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      await fetchAllData(session.token);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Multi-Provider OAuth Login Handler (Google, GitHub, Microsoft)
  const handleLoginWithOAuth = async (provider: 'google' | 'github' | 'microsoft', payload?: any) => {
    setIsLoadingAuth(true);
    setLogoutReason(null);
    try {
      const defaultPayload = provider === 'google' 
        ? {
            email: 'arpitsharma1124@gmail.com',
            name: 'Dr. Arpit Sharma',
            picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            sub: 'g_auth_984102948',
            rawToken: 'ya29.a0AfH6SMD_google_oauth_bearer_mock_verified'
          }
        : provider === 'github'
        ? {
            email: 'dev.engineer@silicon-foundry.io',
            name: 'Dr. Alex Vance',
            username: 'alexvance-semidev',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            id: 'gh_948201',
            rawToken: 'gho_894321948201_github_oauth_token',
            roleHint: 'quality_engineer' as UserRole,
            departmentHint: 'Edge Metrology & Automated Inspection SDK'
          }
        : {
            email: 'chen.wei@silicon-enterprise.com',
            name: 'Dr. Wei Chen',
            picture: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
            sub: 'ms_aad_983210492',
            tenant: 'foundry-fab09-tenant',
            rawToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOi..._ms_entra_id_token',
            roleHint: 'process_engineer' as UserRole,
            departmentHint: 'Fab-09 Chamber Telemetry & Tool Health'
          };

      const session = await waferApiService.loginWithOAuth(provider, payload || defaultPayload, true);
      setAuthSession(session);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      await fetchAllData(session.token);
    } catch (err: any) {
      setErrorMessage(err?.message || `${provider.toUpperCase()} OAuth authentication failed`);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Role Switching Handler (for Admin / Lead Engineer)
  const handleSwitchUserPersona = async (targetUser: UserProfile) => {
    if (!authSession?.token) return;
    try {
      const newSession = await waferApiService.switchUserSession(targetUser.id, authSession.token);
      setAuthSession(newSession);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
      await fetchAllData(newSession.token);
    } catch (err: any) {
      alert(`Permission Denied: ${err?.message}`);
    }
  };

  // Update Profile & Fab Email Handler
  const handleUpdateUserProfile = async (updatedUser: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (authSession) {
      const newSession: AuthSessionData = {
        ...authSession,
        user: updatedUser
      };
      setAuthSession(newSession);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
        if (authSession.token) {
          await waferApiService.updateUserProfile(updatedUser, authSession.token);
          const logs = await waferApiService.getAuditLogs(authSession.token);
          setAuditLogs(logs);
        }
      } catch (e) {
        console.error('Failed to update session storage or API service', e);
      }
    }
  };

  // 3. Asynchronous Inspection & Mutation Handlers (respecting Session Permissions)
  const handleRunInspection = async (record: WaferInspectionRecord) => {
    if (!authSession?.token) return;
    try {
      const updated = await waferApiService.runInspectionScan(record, authSession.token);
      setCurrentInspection(updated);
      setInspections(prev => prev.map(item => item.id === updated.id ? updated : item));
    } catch (err: any) {
      alert(`Operation Blocked: ${err?.message}`);
    }
  };

  const handleApproveAction = async (actionId: string, notes?: string) => {
    if (!authSession?.token) return;
    try {
      const updated = await waferApiService.approveCorrectiveAction(actionId, notes || '', authSession.token);
      setActions(prev => prev.map(a => a.id === actionId ? updated : a));
      const logs = await waferApiService.getAuditLogs(authSession.token);
      setAuditLogs(logs);
    } catch (err: any) {
      alert(`Approval Blocked: ${err?.message}`);
    }
  };

  const handleBatchApproveActions = async (actionIds: string[], notes?: string) => {
    if (!authSession?.token || actionIds.length === 0) return;
    try {
      const updatedList = await waferApiService.batchApproveCorrectiveActions(actionIds, notes || '', authSession.token);
      const updatedMap = new Map(updatedList.map(a => [a.id, a]));
      setActions(prev => prev.map(a => updatedMap.has(a.id) ? updatedMap.get(a.id)! : a));
      const logs = await waferApiService.getAuditLogs(authSession.token);
      setAuditLogs(logs);
    } catch (err: any) {
      alert(`Batch Approval Blocked: ${err?.message}`);
    }
  };

  const handleBatchRejectActions = async (actionIds: string[], notes?: string) => {
    if (!authSession?.token || actionIds.length === 0) return;
    try {
      const updatedList = await waferApiService.batchRejectCorrectiveActions(actionIds, notes || '', authSession.token);
      const updatedMap = new Map(updatedList.map(a => [a.id, a]));
      setActions(prev => prev.map(a => updatedMap.has(a.id) ? updatedMap.get(a.id)! : a));
      const logs = await waferApiService.getAuditLogs(authSession.token);
      setAuditLogs(logs);
    } catch (err: any) {
      alert(`Batch Rejection Blocked: ${err?.message}`);
    }
  };

  const handleRejectAction = async (actionId: string, notes?: string) => {
    if (!authSession?.token) return;
    try {
      const updated = await waferApiService.rejectCorrectiveAction(actionId, notes || '', authSession.token);
      setActions(prev => prev.map(a => a.id === actionId ? updated : a));
      const logs = await waferApiService.getAuditLogs(authSession.token);
      setAuditLogs(logs);
    } catch (err: any) {
      alert(`Action Blocked: ${err?.message}`);
    }
  };

  const handleRequestReinspection = async (waferId: string) => {
    if (!authSession?.token) return;
    try {
      await waferApiService.requestReinspection(waferId, authSession.token);
      setActiveTab('inspection');
    } catch (err: any) {
      alert(`Re-scan Blocked: ${err?.message}`);
    }
  };

  const handleUploadDocument = async (newDoc: KnowledgeDocument) => {
    if (!authSession?.token) return;
    try {
      const doc = await waferApiService.uploadKnowledgeDocument(newDoc, authSession.token);
      setDocuments(prev => [doc, ...prev]);
    } catch (err: any) {
      alert(`Upload Blocked: ${err?.message}`);
    }
  };

  const handleDeleteDocuments = async (docIds: string[]) => {
    if (!authSession?.token || !docIds.length) return;
    try {
      await waferApiService.deleteKnowledgeDocuments(docIds, authSession.token);
      setDocuments(prev => prev.filter(d => !docIds.includes(d.id)));
    } catch (err: any) {
      alert(`Deletion Blocked: ${err?.message}`);
    }
  };

  const handleUpdateVisionConfig = async (newConfig: VisionModelConfig) => {
    if (!authSession?.token) return;
    try {
      const cfg = await waferApiService.updateVisionConfig(newConfig, authSession.token);
      setVisionConfig(cfg);
    } catch (err: any) {
      alert(`Config Blocked: ${err?.message}`);
    }
  };

  // Copilot Message Handler
  const handleSendCopilotMessage = (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toTimeString().split(' ')[0],
      content
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsCopilotProcessing(true);

    setTimeout(() => {
      let agentResponse: ChatMessage;
      const targetWafer = currentInspection?.waferId || 'W-7801-A4';

      if (content.toLowerCase().includes('root-cause') || content.toLowerCase().includes('m-03') || content.toLowerCase().includes('wafer')) {
        agentResponse = {
          id: `msg-agent-${Date.now()}`,
          role: 'agent',
          timestamp: new Date().toTimeString().split(' ')[0],
          content: `### 🎯 Root-Cause Analysis Synthesis: Wafer ${targetWafer} & Machine M-03

I have autonomously orchestrated multi-source diagnostics across **computer vision metrology**, **machine telemetry streams**, **historical cases**, and **SEMI standards**:

1. **Defect Morphology Confirmation:**
   - Visual inspection identified **3 defects** (1 Critical Edge Crack, 2 Particle Clusters).
   - Defect spatial cluster localized at periphery coordinates **(X: +138mm, Y: -112mm)**.

2. **Chamber Telemetry Correlation:**
   - **Machine M-03 Chamber B** shows extreme electrostatic chuck (ESC) temperature rise: **+24.2°C above setpoint** (Actual: 89.2°C vs Target: 65°C).
   - Helium backside cooling gas flow dropped to **6.8 sccm** (Threshold: >10 sccm), causing localized thermal stress fracture.

3. **Historical Matching:**
   - **94% match** found with **HIST-2025-0812** (*Helium backside micro-channel blockage*). Previous resolution: chemical ultrasonic flush and ceramic puck replacement.

4. **SEMI Compliance & Safety Directive:**
   - Grounded in **SEMI E10-0304 §4.2** & **SOP-ETC-412**: Zero tolerance for micro-fractures during high-temperature plasma etch. Immediate tool isolation required.`,
          subTasks: [
            { id: 'st-c1', title: `Execute inspect_image() on ${targetWafer}`, status: 'completed' },
            { id: 'st-c2', title: 'Query Tool M-03 Chamber B sensor logs', status: 'completed' },
            { id: 'st-c3', title: 'Correlate with Historical Case Archive', status: 'completed' },
            { id: 'st-c4', title: 'Synthesize 5-Whys & CAPA Recommendation', status: 'completed' }
          ],
          traces: [
            {
              id: 'tr-01',
              toolName: 'inspect_image',
              status: 'success',
              durationMs: 180,
              input: { waferId: targetWafer, model: 'YOLOv8-Wafer-Inspection-v3' },
              output: { defectsFound: 3, criticalCount: 1, qualityVerdict: 'FAIL' }
            },
            {
              id: 'tr-02',
              toolName: 'get_machine_data',
              status: 'success',
              durationMs: 95,
              input: { machineId: 'M-03', chamber: 'CH-B', sensorTypes: ['temp', 'gas_flow', 'pressure'] },
              output: { tempC: 89.2, targetTempC: 65.0, gasFlowSccm: 6.8, anomalyDetected: true }
            },
            {
              id: 'tr-03',
              toolName: 'search_historical_defects',
              status: 'success',
              durationMs: 140,
              input: { defectCategory: 'crack', machineType: 'etcher', similarityThreshold: 0.85 },
              output: { matchedCaseId: 'HIST-2025-0812', similarityScore: 0.94 }
            },
            {
              id: 'tr-04',
              toolName: 'search_knowledge_base',
              status: 'success',
              durationMs: 110,
              input: { query: 'SEMI E10 plasma etch temperature drift helium backside crack' },
              output: { citationsFound: 2, topDoc: 'SOP-ETC-412' }
            }
          ],
          citations: [
            {
              id: 'cit-01',
              documentId: 'doc-sop-etc-412',
              documentTitle: 'SOP-ETC-412: Plasma Etch Chamber Overheating & Thermal Stress Protocol',
              section: 'Section 4.2: Helium Backside Cooling Failure',
              snippet: 'If helium flow drops below 8 sccm or chuck delta-T exceeds 15°C, wafer edge fractures occur within 45s of RF strike. Immediate tool lockout is mandatory.'
            },
            {
              id: 'cit-02',
              documentId: 'doc-semi-e10',
              documentTitle: 'SEMI E10-0304: Standard for Definition and Measurement of Equipment Reliability',
              section: 'Clause 6.3: Unscheduled Downtime Classification',
              snippet: 'Thermal runaway events require zero-tolerance quarantine of preceding 3 production lots.'
            }
          ]
        };
      } else {
        agentResponse = {
          id: `msg-agent-${Date.now()}`,
          role: 'agent',
          timestamp: new Date().toTimeString().split(' ')[0],
          content: `### 🔍 Agent Diagnostic Response
I have analyzed the request regarding: **"${content}"**.

- **Active System Scope:** Fab-09 Quality Operations & Metrology Station
- **Knowledge Base Retrieval:** 6 SOPs & SEMI specifications indexed
- **Tool Status:** 5 Tools Nominal, 1 Tool (M-03) requiring Chamber B maintenance

You can inspect the full defect classification under **Defect Taxonomy**, inspect chamber telemetry under **Tool Fleet**, or review human approval orders in **Corrective Actions**.`
        };
      }

      setChatMessages(prev => [...prev, agentResponse]);
      setIsCopilotProcessing(false);
    }, 850);
  };

  const handleTriggerCopilotWithPrompt = (prompt: string) => {
    setActiveTab('copilot');
    handleSendCopilotMessage(prompt);
  };

  // Voice Command Action Dispatchers
  const handleVoiceTriggerInspection = () => {
    if (currentInspection) {
      handleRunInspection(currentInspection);
    }
  };

  const handleVoiceBatchApprovePending = () => {
    const pendingIds = actions.filter(a => a.status === 'pending').map(a => a.id);
    if (pendingIds.length > 0) {
      handleBatchApproveActions(pendingIds, 'Authorized via Cleanroom Hands-Free Voice Command');
    }
  };

  const handleNextWafer = () => {
    if (!inspections.length || !currentInspection) return;
    const idx = inspections.findIndex(i => i.id === currentInspection.id);
    const nextIdx = (idx + 1) % inspections.length;
    setCurrentInspection(inspections[nextIdx]);
  };

  const handlePrevWafer = () => {
    if (!inspections.length || !currentInspection) return;
    const idx = inspections.findIndex(i => i.id === currentInspection.id);
    const prevIdx = (idx - 1 + inspections.length) % inspections.length;
    setCurrentInspection(inspections[prevIdx]);
  };

  const handleReadSummary = () => {
    if (!currentInspection) return;
    const verdict = currentInspection.decision.decision;
    const defectCount = currentInspection.defects.length;
    const score = currentInspection.decision.qualityScore;
    const waferId = currentInspection.waferId;
    const text = `Inspection readout for wafer ${waferId}. Official SEMI Verdict is ${verdict}, with quality score ${score} out of 100. Total defects detected: ${defectCount}. SEMI E10 compliance nominal.`;
    globalVoiceService.speak(text);
  };

  // 4. Authentication Gate: If not authenticated, render Protected Login Screen
  if (!authSession) {
    return (
      <WaferGuardLogin 
        onLoginWithDemo={handleLoginWithDemo}
        onLoginWithEmail={handleLoginWithEmail}
        onLoginWithOAuth={handleLoginWithOAuth}
        onLoginSuccess={async (user, token, expiresAt) => {
          const session: AuthSessionData = {
            token,
            expiresAt,
            issuedAt: Date.now(),
            isViewOnly: user.role === 'viewer',
            user
          };
          setAuthSession(session);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          await fetchAllData(token);
        }}
        availableUsers={users.length > 0 ? users : [
          {
            id: 'user-01',
            name: 'Arpit Sharma',
            email: 'arpitsharma1124@gmail.com',
            role: 'admin',
            department: 'Enterprise Metrology & Systems Administration',
            organization: 'Silicon Foundry Fab-09',
            apiKey: 'wg_live_arpit_admin_98f4a7bc',
            lastLogin: 'Just now',
            permissions: {
              canRunInspection: true,
              canApproveCorrectiveActions: true,
              canEditKnowledgeBase: true,
              canManageMachines: true,
              canExportReports: true,
              canModifyModelConfig: true,
              canViewTelemetry: true
            }
          }
        ]}
        logoutReason={logoutReason}
      />
    );
  }

  // Loading Screen for Asynchronous Backend Data Loading
  if (isDataLoading && !currentInspection) {
    return (
      <div className="h-screen w-screen bg-[#07070a] flex flex-col items-center justify-center font-mono text-xs text-white space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="tracking-wider text-[#a1a1aa]">Connecting to Fab-09 Asynchronous Metrology Stream...</span>
      </div>
    );
  }

  const currentUser = authSession.user;

  // RBAC Tab Protection Check (if Inspector or Viewer attempts to open Audit tab, redirect)
  const isInspectorOrViewer = currentUser.role === 'inspector' || currentUser.role === 'viewer';
  const effectiveTab = (activeTab === 'audit' && isInspectorOrViewer) ? 'inspection' : activeTab;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07070a] text-[#e0e0e0] font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 5-Minute Warning Session Expiry Modal */}
      <SessionExpiryModal 
        isOpen={showExpiryModal}
        remainingSeconds={remainingSeconds}
        onExtendSession={handleExtendSession}
        onLogout={handleManualLogout}
        userName={currentUser.name}
        userRole={currentUser.role.replace('_', ' ').toUpperCase()}
      />

      {/* Enterprise Security Settings & Active Sessions Modal */}
      <SecuritySettingsModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        currentUser={currentUser}
        sessionToken={authSession.token}
        onLogoutAllDevices={() => {
          setShowSecurityModal(false);
          handleAutomaticLogout('All active device sessions have been revoked. Please sign in again.');
        }}
        onUserUpdated={(updatedUser) => {
          const updatedSession = { ...authSession, user: updatedUser };
          setAuthSession(updatedSession);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
        }}
      />

      {/* Industrial Navigation Sidebar with RBAC & 24h Countdown */}
      <Sidebar 
        activeTab={effectiveTab} 
        onSelectTab={setActiveTab}
        pendingActionsCount={actions.filter(a => a.status === 'pending').length}
        anomalyDetected={machines.some(m => m.anomalyDetected)}
        currentUser={currentUser}
        remainingSeconds={remainingSeconds}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07070a]">
        {/* Semiconductor Status Header */}
        <Header 
          currentInspection={currentInspection || inspections[0]}
          allInspections={inspections}
          onSelectInspection={(insp) => {
            setCurrentInspection(insp);
            handleRunInspection(insp);
          }}
          isSimulationMode={visionConfig.isSimulationMode}
          machines={machines}
          currentUser={currentUser}
          onNavigateTab={setActiveTab}
          onTriggerCopilot={handleTriggerCopilotWithPrompt}
          remainingSeconds={remainingSeconds}
          onExtendSession={handleExtendSession}
          onLogout={handleManualLogout}
          onSimulateRemainingSeconds={handleSimulateRemainingSeconds}
          onOpenSecuritySettings={() => setShowSecurityModal(true)}
          onOpenGlobalSearch={() => setShowGlobalSearchModal(true)}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onOpenSystemHealth={() => setShowSystemHealthModal(true)}
          onOpenHelpDocs={() => setShowHelpDocsModal(true)}
          unreadNotificationsCount={notifications.filter(n => !n.read).length}
        />

        {/* Dynamic Industrial Tab Views */}
        <main className="flex-1 overflow-hidden flex flex-col relative bg-[#07070a]">
          {/* 1. AI Wafer Inspection View */}
          {effectiveTab === 'inspection' && currentInspection && (
            <AIInspectionView 
              currentInspection={currentInspection}
              onUpdateInspection={(insp) => {
                setCurrentInspection(insp);
                setInspections(prev => prev.map(item => item.id === insp.id ? insp : item));
              }}
              onNavigateTab={setActiveTab}
              onOpenReportModal={(insp) => {
                setCurrentInspection(insp);
                setActiveTab('reports');
              }}
              onTriggerCopilotWithInspection={handleTriggerCopilotWithPrompt}
              modelConfig={visionConfig}
              onUpdateModelConfig={handleUpdateVisionConfig}
              allSampleInspections={inspections}
            />
          )}

          {/* 2. Root-Cause Analysis (RCA) View */}
          {effectiveTab === 'rca' && currentInspection && (
            <RootCauseAnalysisView 
              inspection={currentInspection}
              machines={machines}
              historicalCases={historicalCases}
              onNavigateTab={setActiveTab}
              onTriggerCopilot={handleTriggerCopilotWithPrompt}
              onRequestApproval={(action) => {
                setActions(prev => [action, ...prev]);
                setActiveTab('hitl');
              }}
            />
          )}

          {/* 3. SEMI Defect Taxonomy Explorer */}
          {effectiveTab === 'taxonomy' && (
            <DefectTaxonomyView 
              inspections={inspections}
              onSelectWaferInspection={(insp) => {
                setCurrentInspection(insp);
              }}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* 4. Tool Fleet & Chamber Telemetry View */}
          {effectiveTab === 'machines' && (
            <MachineHealthView 
              machines={machines}
              onNavigateTab={setActiveTab}
              onTriggerCopilot={handleTriggerCopilotWithPrompt}
            />
          )}

          {/* 5. Historical Cases & Pattern Matching View */}
          {effectiveTab === 'history' && currentInspection && (
            <HistoricalCasesView 
              currentInspection={currentInspection}
              onNavigateTab={setActiveTab}
              onTriggerCopilot={handleTriggerCopilotWithPrompt}
            />
          )}

          {/* 6. Industrial Knowledge Base (RAG & SEMI Standards) */}
          {effectiveTab === 'knowledge' && (
            <IndustrialKnowledgeBaseView 
              documents={documents}
              onUploadDocument={handleUploadDocument}
              onDeleteDocuments={handleDeleteDocuments}
              onTriggerCopilot={handleTriggerCopilotWithPrompt}
            />
          )}

          {/* 7. Autonomous Quality Copilot View */}
          {effectiveTab === 'copilot' && (
            <QualityCopilotView 
              messages={chatMessages}
              onSendMessage={handleSendCopilotMessage}
              isProcessing={isCopilotProcessing}
              currentInspection={currentInspection || inspections[0]}
              machines={machines}
              historicalCases={historicalCases}
              documents={documents}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* 8. Human-in-the-Loop Governance & Corrective Actions */}
          {effectiveTab === 'hitl' && (
            <HumanInTheLoopView 
              actions={actions}
              currentUser={currentUser}
              onApproveAction={handleApproveAction}
              onRejectAction={handleRejectAction}
              onBatchApprove={handleBatchApproveActions}
              onBatchReject={handleBatchRejectActions}
              onRequestReinspection={handleRequestReinspection}
            />
          )}

          {/* 9. Production Analytics & Yield Trends */}
          {effectiveTab === 'analytics' && (
            <ProductionAnalyticsView 
              onTriggerCopilot={handleTriggerCopilotWithPrompt}
            />
          )}

          {/* 10. Inspection Reports & Audit Certificates */}
          {effectiveTab === 'reports' && currentInspection && (
            <InspectionReportView 
              inspection={currentInspection}
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* 11. Security & Compliance Audit Trail */}
          {effectiveTab === 'audit' && (
            <AuditLogsView 
              logs={auditLogs}
            />
          )}

          {/* 12. Vision Model & Governance Settings */}
          {effectiveTab === 'settings' && (
            <ModelSettingsView 
              config={visionConfig}
              onUpdateConfig={handleUpdateVisionConfig}
              currentUser={currentUser}
              allUsers={users}
              onSwitchUser={handleSwitchUserPersona}
              onUpdateUser={handleUpdateUserProfile}
            />
          )}
        </main>
      </div>

      {/* Cleanroom Voice Command HUD (Hands-Free Speech & Audio Control) */}
      <VoiceCommandHUD 
        activeTab={effectiveTab}
        onNavigateTab={setActiveTab}
        onTriggerInspection={handleVoiceTriggerInspection}
        onBatchApprovePending={handleVoiceBatchApprovePending}
        onNextWafer={handleNextWafer}
        onPrevWafer={handlePrevWafer}
        onSendCopilotQuery={handleTriggerCopilotWithPrompt}
        onReadSummary={handleReadSummary}
      />

      {/* Global Metrology & Fab Search Modal (⌘K) */}
      <GlobalSearchModal 
        isOpen={showGlobalSearchModal}
        onClose={() => setShowGlobalSearchModal(false)}
        inspections={inspections}
        machines={machines}
        historicalCases={historicalCases}
        documents={documents}
        onSelectInspection={(insp) => {
          setCurrentInspection(insp);
          setActiveTab('inspection');
        }}
        onSelectMachine={(m) => {
          setActiveTab('machines');
        }}
        onSelectCase={(c) => {
          setActiveTab('history');
        }}
        onSelectDocument={(d) => {
          setActiveTab('knowledge');
        }}
      />

      {/* Industrial Notifications Center Modal */}
      <NotificationCenterModal 
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }}
        onMarkAllAsRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
        onClearAll={() => {
          setNotifications([]);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab as NavTab);
        }}
      />

      {/* Fab-09 Infrastructure & System Health Monitor */}
      <SystemHealthModal 
        isOpen={showSystemHealthModal}
        onClose={() => setShowSystemHealthModal(false)}
      />

      {/* Cleanroom Operator Handbook & SEMI Standards Modal */}
      <HelpDocModal 
        isOpen={showHelpDocsModal}
        onClose={() => setShowHelpDocsModal(false)}
      />
    </div>
  );
}
