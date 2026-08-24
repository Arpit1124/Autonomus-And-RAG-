import { SystemActivityEvent, ActivityEventType, ActivitySeverity } from '../src/types.js';

let activityEventsStore: SystemActivityEvent[] = [
  {
    id: 'evt-101',
    type: 'user_login',
    severity: 'info',
    title: 'Enterprise SSO Authentication',
    description: 'Arpit Sharma logged into AgentOS platform via Okta SAML SSO.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    userId: 'usr-arpit-sharma',
    userName: 'Arpit Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    metadata: {
      ipAddress: '192.168.1.45',
      mfaVerified: true,
      authMethod: 'Enterprise SSO'
    }
  },
  {
    id: 'evt-102',
    type: 'knowledge_ingested',
    severity: 'success',
    title: 'Document Embedded into Vector Index',
    description: 'Ingested "AgentOS Architecture Spec v2.4.md" into RAG vector memory with 8 semantic chunks.',
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    userId: 'usr-arpit-sharma',
    userName: 'Arpit Sharma',
    metadata: {
      docId: 'doc-arch-spec',
      docTitle: 'AgentOS Architecture Spec v2.4.md',
      chunksCount: 8,
      vectorEmbeddingModel: 'gemini-embedding-001'
    }
  },
  {
    id: 'evt-103',
    type: 'task_completed',
    severity: 'success',
    title: 'Autonomous Research Task Completed',
    description: 'Competitive market analysis across generative agent frameworks finished with 4 citations and 1 synthesized report.',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    userId: 'usr-arpit-sharma',
    userName: 'Arpit Sharma',
    metadata: {
      taskId: 'task-1741298400000',
      durationMs: 4200,
      tokensUsed: 1850,
      mode: 'research'
    }
  },
  {
    id: 'evt-104',
    type: 'file_generated',
    severity: 'success',
    title: 'Executive Presentation Generated',
    description: 'Generated 6-slide presentation deck: "Q3 Agent Performance & ROI Report.pptx".',
    timestamp: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    userId: 'usr-arpit-sharma',
    userName: 'Arpit Sharma',
    metadata: {
      fileId: 'file-deck-q3-roi',
      fileName: 'Q3 Agent Performance & ROI Report.pptx',
      fileFormat: 'pptx',
      slidesCount: 6
    }
  },
  {
    id: 'evt-105',
    type: 'approval_required',
    severity: 'warning',
    title: 'Human-in-the-Loop Interceptor Triggered',
    description: 'Agent requested authorization to dispatch 42 automated digest emails to executive stakeholders.',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    userId: 'usr-arpit-sharma',
    userName: 'Arpit Sharma',
    metadata: {
      taskId: 'task-sec-102',
      actionType: 'send_email',
      toolName: 'send_email_digest',
      recipientsCount: 42
    }
  },
  {
    id: 'evt-106',
    type: 'approval_resolved',
    severity: 'info',
    title: 'Action Approved by Administrator',
    description: 'Arpit Sharma approved the outbound email dispatch after payload inspection.',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    userId: 'usr-arpit-sharma',
    userName: 'Arpit Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    metadata: {
      taskId: 'task-sec-102',
      decision: 'approved',
      approverRole: 'admin'
    }
  },
  {
    id: 'evt-107',
    type: 'nightly_sync',
    severity: 'info',
    title: 'Nightly Knowledge & Telemetry Sync Completed',
    description: 'Vector embeddings synchronized, 4 memory rules pruned, and telemetry aggregated.',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    metadata: {
      durationMs: 3100,
      documentsReindexed: 4,
      rulesConsolidated: 2
    }
  },
  {
    id: 'evt-108',
    type: 'memory_updated',
    severity: 'info',
    title: 'Enterprise Compliance Rule Learned',
    description: 'Agent saved guideline: "Always verify PII redaction on client CSV exports before download".',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    userId: 'usr-arpit-sharma',
    userName: 'Arpit Sharma',
    metadata: {
      ruleKey: 'pii_redaction_policy',
      source: 'auto_extracted'
    }
  }
];

export function getActivityEvents(): SystemActivityEvent[] {
  return [...activityEventsStore].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function logActivityEvent(event: Omit<SystemActivityEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): SystemActivityEvent {
  const newEvent: SystemActivityEvent = {
    id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: event.type,
    severity: event.severity,
    title: event.title,
    description: event.description,
    timestamp: event.timestamp || new Date().toISOString(),
    userId: event.userId,
    userName: event.userName,
    userAvatar: event.userAvatar,
    metadata: event.metadata || {}
  };

  activityEventsStore.unshift(newEvent);
  // Cap at 300 items
  if (activityEventsStore.length > 300) {
    activityEventsStore = activityEventsStore.slice(0, 300);
  }
  return newEvent;
}

export function clearActivityEvents(): { success: boolean; clearedCount: number } {
  const count = activityEventsStore.length;
  activityEventsStore = [];
  return { success: true, clearedCount: count };
}

export function seedActivityEvents(): SystemActivityEvent[] {
  activityEventsStore = [
    {
      id: `evt-${Date.now()}-1`,
      type: 'user_login',
      severity: 'info',
      title: 'Enterprise SSO Authentication',
      description: 'Arpit Sharma logged into AgentOS platform via Okta SAML SSO.',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      userId: 'usr-arpit-sharma',
      userName: 'Arpit Sharma',
      metadata: { ipAddress: '192.168.1.45', mfaVerified: true }
    },
    {
      id: `evt-${Date.now()}-2`,
      type: 'task_completed',
      severity: 'success',
      title: 'Autonomous Research Task Completed',
      description: 'Financial forecasting model task completed with 12 tool traces.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      userId: 'usr-arpit-sharma',
      userName: 'Arpit Sharma',
      metadata: { durationMs: 3800, tokensUsed: 1420 }
    },
    {
      id: `evt-${Date.now()}-3`,
      type: 'file_generated',
      severity: 'success',
      title: 'Artifact Exported: Strategy Brief',
      description: 'Created markdown report "Enterprise Strategy 2026.md".',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      metadata: { fileName: 'Enterprise Strategy 2026.md', fileFormat: 'markdown' }
    },
    {
      id: `evt-${Date.now()}-4`,
      type: 'approval_required',
      severity: 'warning',
      title: 'High-Risk Action Blocked',
      description: 'Agent requested database migration execution authorization.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      metadata: { toolName: 'database_migration', actionType: 'modify_settings' }
    }
  ];
  return getActivityEvents();
}
