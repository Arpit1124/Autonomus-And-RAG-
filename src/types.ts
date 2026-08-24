// ==========================================
// WaferGuard AI — System Types & Definitions
// ==========================================

export type NavTab = 
  | 'dashboard'
  | 'inspection'
  | 'defects'
  | 'rca'
  | 'knowledge'
  | 'historical'
  | 'machines'
  | 'analytics'
  | 'copilot'
  | 'approvals'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'workspace'
  | 'tasks'
  | 'tools'
  | 'files'
  | 'memory'
  | 'activity'
  | 'auth';

export type UserRole = 
  | 'inspector' 
  | 'quality_engineer' 
  | 'production_manager' 
  | 'process_engineer' 
  | 'admin' 
  | 'lead' 
  | 'analyst' 
  | 'operator'
  | 'student_user'
  | 'viewer'
  | 'Production Manager'
  | 'Quality Engineer'
  | 'Process Engineer';

export type AuthProvider = 'local' | 'google' | 'github' | 'microsoft' | 'demo';

export interface ExternalIdentityClaim {
  provider: AuthProvider;
  providerUserId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  rawToken?: string;
  issuedAt?: string;
  scope?: string;
}

export interface ActiveSessionInfo {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
  rememberMe?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  department: string;
  organization: string;
  bio?: string;
  apiKey: string;
  lastLogin: string;
  authProvider?: AuthProvider;
  externalClaims?: ExternalIdentityClaim;
  mfaEnabled?: boolean;
  isEmailVerified?: boolean;
  accountStatus?: 'active' | 'locked' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
  activeSessionsCount?: number;
  usedTokens?: number;
  tokenCountQuota?: number;
  permissions: {
    canRunInspection?: boolean;
    canApproveCorrectiveActions?: boolean;
    canEditKnowledgeBase?: boolean;
    canManageMachines?: boolean;
    canExportReports?: boolean;
    canModifyModelConfig?: boolean;
    canExecuteTools?: boolean;
    canApproveHighRisk?: boolean;
    canManageMemory?: boolean;
    canViewTelemetry?: boolean;
    canExportArtifacts?: boolean;
  };
}

export interface AuthResponse {
  success: boolean;
  user: UserProfile;
  token: string;
  expiresAt: number;
  authProvider?: AuthProvider;
  requiresMfa?: boolean;
  message?: string;
  activeSessions?: ActiveSessionInfo[];
}

// ------------------------------------------
// Defect Taxonomy & Inspection Types
// ------------------------------------------

export type DefectCategory = 
  | 'scratch'
  | 'crack'
  | 'particle_contamination'
  | 'stain'
  | 'pattern_anomaly'
  | 'missing_structure'
  | 'edge_defect'
  | 'alignment_defect'
  | 'abnormal_region'
  | 'general_surface_anomaly';

export type DefectSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface DefectBoundingBox {
  x: number;      // % of image width (0-100)
  y: number;      // % of image height (0-100)
  width: number;  // % of image width
  height: number; // % of image height
}

export interface DefectItem {
  id: string; // e.g. "DEF-01"
  category: DefectCategory;
  name: string;
  confidence: number; // 0 to 1 (e.g. 0.964)
  severity: DefectSeverity;
  location: DefectBoundingBox;
  dieCoordinate?: { x: number; y: number };
  estimatedSizeUm: number; // in µm² (micrometers squared)
  timestamp: string;
  waferId: string;
  batchId: string;
  lotId: string;
  machineId: string;
  inspectionStation: string;
  description: string;
}

export type QualityDecision = 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';

export interface QualityDecisionResult {
  decision: QualityDecision;
  qualityScore: number; // 0 - 100
  defectCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  aiConfidence: number; // 0 to 1
  reason: string;
  ruleTriggered: string;
  isManualOverride?: boolean;
}

export interface WaferInspectionRecord {
  id: string; // e.g. "INSP-2026-001"
  waferId: string; // e.g. "W-7801-A4"
  lotId: string; // e.g. "LOT-2026-9921"
  batchId: string; // e.g. "BATCH-FAB9-412"
  machineId: string; // e.g. "M-03" (Plasma Etch #3)
  processStage: string; // e.g. "Post-Etch High-Aspect Ratio Metrology"
  recipeName?: string;
  inspectionType?: string;
  isDemoMode?: boolean;
  timestamp: string;
  imageUrl?: string;
  originalImageUrl?: string;
  annotatedImageUrl?: string;
  heatmapUrl?: string;
  waferDiameterMm?: number;
  dieCount?: number;
  yieldPct?: number;
  dieGrid?: {
    rows: number;
    cols: number;
    totalDies: number;
    yieldEstimatePct: number;
  };
  defects: DefectItem[];
  decision: QualityDecisionResult;
  rca?: RootCauseItem[];
  correctiveActions?: CorrectiveAction[];
  status?: 'scanned' | 'analyzing' | 'completed' | 'quarantined';
  approvalStatus?: string;
}

// ------------------------------------------
// Root-Cause Analysis (RCA) Types
// ------------------------------------------

export type RcaCategory = 
  | 'machine_hardware'
  | 'process_recipe'
  | 'material_contaminant'
  | 'environment'
  | 'operator_method'
  | 'equipment'
  | 'material_chemical';

export interface TelemetryCorrelation {
  parameter?: string;
  normalRange?: string;
  observedValue?: string | number;
  deviationPct?: number;
  isCritical?: boolean;
  sensorName?: string;
  machineId?: string;
  chamberId?: string;
  measuredValue?: number;
  nominalValue?: number;
  unit: string;
  driftPercentage?: number;
  correlationScore?: number; // 0 to 1 (e.g. 0.94)
  isAnomaly?: boolean;
  timeRange?: string;
}

export type SensorParameterDeviation = TelemetryCorrelation;

export type FiveWhysStep = string | {
  step: number;
  question: string;
  answer: string;
  evidence?: string;
};

export interface IshikawaBranch {
  category: 'Machine' | 'Method' | 'Material' | 'Measurement' | 'Environment' | 'Manpower' | string;
  factors: Array<{
    name: string;
    description: string;
    impact: 'primary' | 'secondary' | 'contributing' | 'eliminated';
    evidence: string;
  }>;
}

export interface RootCauseItem {
  id: string;
  title: string;
  category: RcaCategory;
  evidenceScore: number; // 0 - 100%
  summary?: string;
  explanation: string;
  supportingEvidence?: string[];
  sensorCorrelations?: TelemetryCorrelation[];
  telemetryCorrelations?: TelemetryCorrelation[];
  fiveWhys: FiveWhysStep[];
  ishikawa?: IshikawaBranch[];
  ishikawaCategory?: string;
  relatedHistoricalCases?: string[];
  relatedHistoricalCaseIds?: string[];
  relevantDocuments?: Array<{
    docTitle: string;
    section: string;
    snippet: string;
    score: number;
  }>;
  recommendedInvestigation?: string[];
  recommendedActions?: string[];
}

// ------------------------------------------
// Corrective Actions & Human-in-the-Loop
// ------------------------------------------

export type ActionPriority = 'P0' | 'P1' | 'P2';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';

export interface CorrectiveAction {
  id: string;
  inspectionId?: string;
  type?: 'immediate' | 'investigation' | 'preventive' | string;
  title: string;
  priority: ActionPriority;
  targetEntity: string; // e.g. "Machine M-03 (Chamber B)" or "Lot 9921"
  description: string;
  requiresHumanApproval: boolean;
  status: ActionStatus;
  assignedRole: UserRole;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  waferId: string;
  supportingRcaTitle?: string;
  actionsTaken?: string[];
}

// ------------------------------------------
// Tool Fleet & Chamber Telemetry
// ------------------------------------------

export interface ChamberTelemetry {
  id: string;
  name: string;
  temperatureC: number;
  targetTempC: number;
  pressureMtorr: number;
  targetPressureMtorr: number;
  rfPowerW: number;
  gasFlowSccm: number;
  vibrationG?: number;
  status: 'nominal' | 'warning' | 'anomaly';
}

export interface MachineHealthRecord {
  id: string; // e.g. "M-03"
  name: string; // e.g. "Lam Plasma Etcher Kiyo45"
  stationType: string; // e.g. "Dry Plasma Etching"
  location: string; // e.g. "Cleanroom Bay 4"
  status: 'nominal' | 'warning' | 'anomaly' | 'maintenance';
  healthScore: number; // 0 - 100%
  baselineDefectRate: number; // %
  currentDefectRate: number;  // %
  defectRateDeltaPct: number; // +37.2%
  anomalyDetected: boolean;
  anomalyAlert?: string;
  correlatedDefectsCount?: number;
  chambers: ChamberTelemetry[];
  maintenanceLogs: Array<{
    date: string;
    type: string;
    description: string;
    technician: string;
  }>;
  recentBatches: string[];
  lastCalibration: string;
  nextScheduledMaintenance: string;
}

// ------------------------------------------
// Historical Defect Memory
// ------------------------------------------

export interface HistoricalInspectionCase {
  id: string; // e.g. "HIST-2025-0812"
  date: string;
  waferId: string;
  lotId: string;
  batchId?: string;
  processStep: string;
  machineId: string;
  defectCategory: DefectCategory;
  severity?: DefectSeverity;
  similarityPct: number; // 0 - 100%
  defectCount?: number;
  rootCauseSummary: string;
  correctiveActionSummary: string;
  finalResolution: string;
  decision: QualityDecision;
  keyFactors: string[];
}

// ------------------------------------------
// Industrial Knowledge Base & RAG
// ------------------------------------------

export interface AuthSession {
  token: string;
  user: UserProfile;
  requiresMfa?: boolean;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  page?: number;
  section?: string;
  content: string;
  standardReference?: string; // e.g. "SEMI E10-0304 §4.2"
  tokenCount?: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  filename: string;
  category?: 'sop' | 'semi_standard' | 'machine_manual' | 'troubleshooting' | 'material_spec' | 'general' | string;
  fileType: 'pdf' | 'docx' | 'txt' | 'csv' | 'markdown' | 'code' | 'json' | string;
  sizeBytes: number;
  uploadedAt: string;
  chunksCount: number;
  status: 'ready' | 'indexing' | 'error';
  summary?: string;
  tags: string[];
  author?: string;
  chunks?: DocumentChunk[];
  rawContent?: string;
}

export interface Citation {
  id: string;
  chunkId?: string;
  documentId: string;
  documentTitle: string;
  section?: string;
  page?: number;
  pageNumber?: number;
  snippet: string;
  score?: number;
  similarityScore?: number;
}

// ------------------------------------------
// Copilot & Autonomous Agent Tool System
// ------------------------------------------

export type CopilotToolName = 
  | 'inspect_image'
  | 'search_knowledge_base'
  | 'search_historical_defects'
  | 'get_machine_data'
  | 'get_batch_data'
  | 'analyze_defect_trend'
  | 'find_similar_cases'
  | 'perform_root_cause_analysis'
  | 'generate_quality_report'
  | 'request_human_approval';

export interface ToolCallTrace {
  id: string;
  toolName: CopilotToolName | string;
  category?: 'vision' | 'knowledge' | 'rca' | 'telemetry' | 'governance' | 'reporting' | 'data' | 'productivity' | 'web' | 'communication' | 'developer' | string;
  input: Record<string, any>;
  toolInput?: Record<string, any>;
  output?: any;
  toolOutput?: any;
  status: 'running' | 'success' | 'error' | 'awaiting_approval' | 'failed' | string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
}

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_approval';
  dependencies?: string[];
  toolName?: CopilotToolName | string;
  traceId?: string;
  resultSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  traces?: ToolCallTrace[];
  subTasks?: SubTask[];
  citations?: Citation[];
  inspectionId?: string;
  rcaId?: string;
  approvalRequest?: any;
  generatedFiles?: any[];
  chartData?: {
    type: 'bar' | 'line' | 'pie';
    title: string;
    data: Array<Record<string, any>>;
    xAxisKey: string;
    dataKeys: string[];
  };
}

// ------------------------------------------
// Audit & Telemetry
// ------------------------------------------

export type AuditCategory = 'inspection' | 'rca' | 'approval' | 'machine' | 'knowledge' | 'system' | 'auth';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: AuditCategory;
  severity: 'info' | 'warning' | 'critical' | 'success';
  actor: string;
  userRole: UserRole;
  action: string;
  details: string;
  targetEntityId?: string;
  diff?: Record<string, any>;
  ipAddress?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'approval';
  title: string;
  message: string;
  timestamp: string;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
  targetTab?: NavTab;
  taskId?: string;
  fileId?: string;
  approvalRequest?: any;
}

// ------------------------------------------
// Vision Model & Integration Config
// ------------------------------------------

export interface VisionModelConfig {
  isSimulationMode: boolean; // Demo/Simulation Mode
  activeModelName: string; // e.g. "WaferGuard-YOLOv8-Semiconductor-v2"
  endpointUrl?: string;
  apiKeySecretName?: string;
  confidenceThreshold: number; // e.g. 0.80
  iouThreshold: number;        // e.g. 0.45
  autoTriggerRcaOnFail: boolean;
  minDefectSizeUm: number;
  semiStandardProfile: 'SEMI_E10_STRICT' | 'SEMI_E30_STANDARD' | 'CUSTOM';
}

// ------------------------------------------
// Compatibility Types for Legacy Modules
// ------------------------------------------

export type AgentMode = 'agent' | 'chat' | 'research' | 'document' | 'data_analyst' | 'developer';
export type SubTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_approval';

export interface SensitiveApprovalRequest {
  id: string;
  title: string;
  action?: string;
  tool?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
  status?: string;
  actionType?: string;
  toolName?: string;
  toolInput?: any;
  description?: string;
  suggestedAction?: string;
  targetDetails?: any;
  parameters?: Record<string, any>;
  requestedAt?: string;
  createdAt?: string;
  taskId?: string;
  requiresMfa?: boolean;
}

export interface AgentTask {
  id: string;
  title?: string;
  description?: string;
  mode?: any;
  prompt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked' | 'waiting_approval' | 'planning' | string;
  progress?: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  planOutline?: any;
  executionDurationMs?: number;
  tokensUsed?: number;
  finalResponse?: string;
  subTasks?: SubTask[];
  approvalRequest?: SensitiveApprovalRequest;
  pendingApproval?: boolean | any;
  traces?: ToolCallTrace[];
  citations?: Citation[];
  chartData?: any;
  generatedFiles?: any[];
  dependencies?: string[];
  logs?: string[];
}

export interface ToolDefinition {
  id?: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
  parameters: Record<string, any> | any[];
  requiresApproval?: boolean;
  isSensitive?: boolean;
  rateLimitPerMinute?: number;
}

export interface MemoryItem {
  id: string;
  key?: string;
  title?: string;
  content?: string;
  value?: string;
  type?: string;
  category?: string;
  confidence?: number;
  enabled?: boolean;
  source?: string;
  createdAt?: string;
  lastUpdated?: string;
}

export interface GeneratedFile {
  id: string;
  taskId?: string;
  filename?: string;
  title?: string;
  fileType?: string;
  format?: string;
  content: string;
  downloadUrl?: string;
  sizeBytes?: number;
  createdAt: string;
  description?: string;
  tags?: string[];
  metadata?: any;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor?: string;
  userId?: string;
  userName?: string;
  severity?: string;
  ipAddress?: string;
  status?: string;
  details: string;
}

export type ActivityEventType = string;
export type ActivitySeverity = 'info' | 'warning' | 'error' | 'success';

export interface SystemActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityEventType;
  title: string;
  description: string;
  actor?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  metadata?: any;
  targetId?: string;
  severity: ActivitySeverity;
}

export interface ChartDataConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | string;
  title: string;
  description?: string;
  data: Array<Record<string, any>>;
  xAxisKey: string;
  dataKeys: string[];
}
