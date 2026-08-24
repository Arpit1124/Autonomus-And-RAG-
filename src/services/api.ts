import { 
  AgentTask, 
  AgentMode, 
  KnowledgeDocument, 
  ToolDefinition, 
  MemoryItem, 
  GeneratedFile, 
  Citation, 
  ChartDataConfig, 
  UserProfile, 
  SecurityAuditLog, 
  UserRole, 
  SystemActivityEvent,
  AuthResponse,
  ActiveSessionInfo
} from '../types';

export const api = {
  // ================= AUTHENTICATION & SECURITY =================

  async login(
    email: string, 
    password?: string, 
    rememberMe = false
  ): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe })
    });
    const data = await res.json().catch(() => ({ error: 'Network error during login' }));
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    return data;
  },

  async register(data: {
    name: string;
    email: string;
    password?: string;
    role?: UserRole;
    department?: string;
    organization?: string;
    bio?: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse & { verificationCode: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({ error: 'Network error during registration' }));
    if (!res.ok) {
      throw new Error(result.error || 'Registration failed');
    }
    return result;
  },

  async oauthLogin(payload: {
    provider: 'google' | 'github' | 'microsoft';
    email: string;
    name?: string;
    picture?: string;
    avatarUrl?: string;
    sub?: string;
    id?: string;
    username?: string;
    tenant?: string;
    rawToken?: string;
    scope?: string;
    roleHint?: UserRole;
    departmentHint?: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse & { mappedRole: UserRole; isNewUser: boolean }> {
    const res = await fetch('/api/auth/oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({ error: 'OAuth authentication failed' }));
    if (!res.ok) {
      throw new Error(data.error || 'OAuth authentication failed');
    }
    return data;
  },

  async googleAuth(googleProfile: {
    email: string;
    name: string;
    picture?: string;
    sub?: string;
    rawToken?: string;
    scope?: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleProfile)
    });
    const data = await res.json().catch(() => ({ error: 'Google authentication failed' }));
    if (!res.ok) {
      throw new Error(data.error || 'Google authentication failed');
    }
    return data;
  },

  async githubAuth(githubProfile: {
    email?: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
    picture?: string;
    id?: string;
    rawToken?: string;
    scope?: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(githubProfile)
    });
    const data = await res.json().catch(() => ({ error: 'GitHub authentication failed' }));
    if (!res.ok) {
      throw new Error(data.error || 'GitHub authentication failed');
    }
    return data;
  },

  async microsoftAuth(msProfile: {
    email: string;
    name: string;
    picture?: string;
    sub?: string;
    tenant?: string;
    rawToken?: string;
    scope?: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/microsoft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msProfile)
    });
    const data = await res.json().catch(() => ({ error: 'Microsoft authentication failed' }));
    if (!res.ok) {
      throw new Error(data.error || 'Microsoft authentication failed');
    }
    return data;
  },

  async getOAuthUrl(provider: 'google' | 'github' | 'microsoft' = 'google'): Promise<{ provider: string; url: string; redirectUri: string }> {
    const res = await fetch(`/api/auth/oauth/url?provider=${provider}`);
    if (!res.ok) throw new Error(`Failed to generate ${provider} OAuth URL`);
    return res.json();
  },

  async getGoogleAuthUrl(): Promise<{ url: string; redirectUri: string }> {
    const res = await fetch('/api/auth/google/url');
    if (!res.ok) throw new Error('Failed to generate Google OAuth URL');
    return res.json();
  },

  async getMe(token: string): Promise<{ user: UserProfile; session: { createdAt: number; expiresAt: number; rememberMe: boolean } }> {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Session invalid or expired');
    return res.json();
  },

  async refreshSession(token: string): Promise<{ token: string; expiresAt: number; user: UserProfile }> {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });
    if (!res.ok) throw new Error('Failed to refresh session');
    return res.json();
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; resetCode?: string; resetToken?: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request password reset');
    return data;
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
  },

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; user: UserProfile; message: string }> {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Email verification failed');
    return data;
  },

  async resendVerification(email: string): Promise<{ success: boolean; verificationCode: string; message: string }> {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resend code');
    return data;
  },

  async logout(token?: string): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ token })
    }).catch(() => {});
  },

  async logoutAllDevices(token: string): Promise<{ success: boolean; terminatedSessionsCount: number }> {
    const res = await fetch('/api/auth/logout-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to logout from all devices');
    return res.json();
  },

  async getActiveSessions(token: string): Promise<ActiveSessionInfo[]> {
    const res = await fetch('/api/auth/sessions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch active sessions');
    return res.json();
  },

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  },

  async toggleMfa(token: string, enabled: boolean): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch('/api/auth/toggle-mfa', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) throw new Error('Failed to toggle 2FA');
    return res.json();
  },

  async rotateApiKey(token: string): Promise<{ apiKey: string }> {
    const res = await fetch('/api/auth/rotate-api-key', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to rotate API key');
    return res.json();
  },

  async getUsers(): Promise<UserProfile[]> {
    const res = await fetch('/api/auth/users');
    if (!res.ok) throw new Error('Failed to fetch user directory');
    return res.json();
  },

  async switchUser(userId: string): Promise<{ user: UserProfile; token: string; expiresAt: number }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error('Failed to switch user');
    return res.json();
  },

  async getAuditLogs(): Promise<SecurityAuditLog[]> {
    const res = await fetch('/api/auth/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch security audit logs');
    return res.json();
  },

  // ================= AGENT & TASKS =================

  async orchestrate(prompt: string, mode: AgentMode = 'agent'): Promise<AgentTask> {
    const res = await fetch('/api/agent/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to orchestrate' }));
      throw new Error(err.error || 'Server error during agent orchestration');
    }
    return res.json();
  },

  async runAgent(prompt: string, mode: AgentMode = 'agent'): Promise<{
    content: string;
    taskId: string;
    subTasks?: any[];
    traces?: any[];
    citations?: any[];
    generatedFiles?: GeneratedFile[];
    chartData?: any;
    approvalRequest?: any;
    task: AgentTask;
  }> {
    const task = await this.orchestrate(prompt, mode);
    return {
      content: task.finalResponse || 'Task completed successfully.',
      taskId: task.id,
      subTasks: task.subTasks,
      traces: task.traces,
      citations: task.citations,
      generatedFiles: task.generatedFiles,
      chartData: task.chartData,
      approvalRequest: task.pendingApproval,
      task
    };
  },

  async approveAction(
    taskId: string, 
    decisionOrModified?: 'approve' | 'reject' | Record<string, any>, 
    modifiedInput?: Record<string, any>
  ): Promise<AgentTask> {
    let decision: 'approve' | 'reject' = 'approve';
    let actualInput = modifiedInput;

    if (decisionOrModified === 'approve' || decisionOrModified === 'reject') {
      decision = decisionOrModified;
    } else if (typeof decisionOrModified === 'object') {
      decision = 'approve';
      actualInput = decisionOrModified;
    }

    const res = await fetch('/api/agent/approve-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, decision, modifiedInput: actualInput })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to process approval' }));
      throw new Error(err.error || 'Approval processing failed');
    }
    return res.json();
  },

  async rejectAction(taskId: string): Promise<AgentTask> {
    return this.approveAction(taskId, 'reject');
  },

  async batchApproveActions(
    taskIds: string[], 
    decision: 'approve' | 'reject'
  ): Promise<{ successCount: number; updatedTasks: AgentTask[]; errors: string[] }> {
    const res = await fetch('/api/agent/approve-actions-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds, decision })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to batch process approvals' }));
      throw new Error(err.error || 'Failed to process batch approvals');
    }
    return res.json();
  },

  async getTasks(): Promise<AgentTask[]> {
    const res = await fetch('/api/agent/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getTask(id: string): Promise<AgentTask> {
    const res = await fetch(`/api/agent/tasks/${id}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  async bulkDeleteTasks(taskIds: string[]): Promise<{ successCount: number; deletedIds: string[] }> {
    const res = await fetch('/api/agent/tasks/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to bulk delete tasks' }));
      throw new Error(err.error || 'Failed to bulk delete tasks');
    }
    return res.json();
  },

  async bulkUpdateTaskStatus(taskIds: string[], status: AgentTask['status']): Promise<{ successCount: number; updatedTasks: AgentTask[] }> {
    const res = await fetch('/api/agent/tasks/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds, status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to bulk update task status' }));
      throw new Error(err.error || 'Failed to bulk update task status');
    }
    return res.json();
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/agent/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  async updateTaskStatus(id: string, status: AgentTask['status']): Promise<AgentTask> {
    const res = await fetch(`/api/agent/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update task status');
    return res.json();
  },

  // ================= DOCUMENTS & RAG =================

  async getDocuments(): Promise<KnowledgeDocument[]> {
    const res = await fetch('/api/rag/documents');
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocument(doc: {
    title: string;
    filename: string;
    fileType: string;
    rawContent: string;
    tags?: string[];
  }): Promise<KnowledgeDocument> {
    const res = await fetch('/api/rag/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/rag/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  async searchKnowledge(query: string, topK = 4, filterTag?: string): Promise<{
    citations: Citation[];
    combinedContext: string;
  }> {
    const res = await fetch('/api/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK, filterTag })
    });
    if (!res.ok) throw new Error('Failed to search knowledge base');
    return res.json();
  },

  async executeTool(toolName: string, input: Record<string, any>): Promise<any> {
    const res = await fetch('/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, input })
    });
    if (!res.ok) throw new Error('Failed to execute tool');
    return res.json();
  },

  async getGeneratedFiles(): Promise<GeneratedFile[]> {
    const res = await fetch('/api/files');
    if (!res.ok) throw new Error('Failed to fetch generated files');
    return res.json();
  },

  async getFiles(): Promise<GeneratedFile[]> {
    return this.getGeneratedFiles();
  },

  async getMemories(): Promise<MemoryItem[]> {
    const res = await fetch('/api/memories');
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },

  async addMemory(memory: Omit<MemoryItem, 'id' | 'createdAt'>): Promise<MemoryItem> {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory)
    });
    if (!res.ok) throw new Error('Failed to add memory');
    return res.json();
  },

  async updateMemory(id: string, updates: Partial<MemoryItem>): Promise<MemoryItem> {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update memory');
    return res.json();
  },

  async deleteMemory(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete memory');
    return res.json();
  },

  // ================= ACTIVITY & SYNC =================

  async getSyncReport(): Promise<any> {
    const res = await fetch('/api/sync/report');
    if (!res.ok) throw new Error('Failed to fetch nightly sync report');
    return res.json();
  },

  async triggerNightlySync(): Promise<any> {
    const res = await fetch('/api/sync/nightly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to trigger nightly sync batch');
    return res.json();
  },

  async getActivityEvents(): Promise<SystemActivityEvent[]> {
    const res = await fetch('/api/activity/events');
    if (!res.ok) throw new Error('Failed to fetch activity events');
    return res.json();
  },

  async logActivity(event: Partial<SystemActivityEvent>): Promise<SystemActivityEvent> {
    const res = await fetch('/api/activity/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error('Failed to log activity event');
    return res.json();
  },

  async clearActivityEvents(): Promise<{ success: boolean; clearedCount: number }> {
    const res = await fetch('/api/activity/events', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear activity events');
    return res.json();
  },

  async seedActivityEvents(): Promise<SystemActivityEvent[]> {
    const res = await fetch('/api/activity/seed', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed activity events');
    return res.json();
  }
};
