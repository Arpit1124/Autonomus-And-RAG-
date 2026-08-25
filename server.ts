import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { 
  orchestrateAgent, 
  handleApprovalDecision, 
  handleBatchApprovalDecisions,
  getAllTasks, 
  getTaskById,
  deleteTask,
  bulkDeleteTasks,
  updateTaskStatus,
  bulkUpdateTaskStatus
} from "./server/agent.js";
import { getDocuments, ingestDocument, deleteDocument, searchKnowledgeBase, generate3SentenceSummary } from "./server/rag.js";
import { executeTool } from "./server/tools.js";
import { getMemories, addMemory, updateMemory, deleteMemory } from "./server/memory.js";
import { getGeneratedFiles, getFileById } from "./server/files.js";
import { executeNightlySync, getNightlySyncReport } from "./server/sync.js";
import { 
  getActivityEvents, 
  logActivityEvent, 
  clearActivityEvents, 
  seedActivityEvents 
} from "./server/activity.js";
import { 
  getAllUsers, 
  loginUser, 
  registerUser, 
  googleOAuthLogin,
  githubOAuthLogin,
  microsoftOAuthLogin,
  multiProviderOAuthLogin,
  verifyTokenAndGetUser,
  refreshSessionToken,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
  resendVerificationEmail,
  logoutUser,
  logoutAllDevices,
  getUserActiveSessions,
  switchUser, 
  changePassword,
  toggleMfa,
  rotateApiKey, 
  getAuditLogs
} from "./server/auth.js";

dotenv.config();

/**
 * Middleware helper to extract Bearer token from authorization header
 */
function extractToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const tokenQuery = req.query.token as string;
  if (tokenQuery) return tokenQuery;
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // ================= AUTHENTICATION & SECURITY API ROUTES =================

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth: Register new account
  app.post("/api/auth/register", (req, res) => {
    try {
      const { name, email, password, role, department, organization, bio, rememberMe } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

      const result = registerUser({
        name,
        email,
        password,
        role,
        department,
        organization,
        bio,
        rememberMe: Boolean(rememberMe),
        ipAddress,
        userAgent
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Registration failed" });
    }
  });

  // Auth: Login with Email and Password
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

      const result = loginUser(email, password, Boolean(rememberMe), ipAddress, userAgent);
      res.json(result);
    } catch (err: any) {
      const status = err.message?.includes('locked') ? 429 : 401;
      res.status(status).json({ error: err.message || "Authentication failed" });
    }
  });

  // Auth: Multi-Provider OAuth (Google, GitHub, Microsoft) Handshake & Role Mapping
  app.post("/api/auth/oauth", (req, res) => {
    try {
      const { provider, email, name, picture, avatarUrl, sub, id, username, tenant, rawToken, scope, roleHint, departmentHint, rememberMe } = req.body;
      if (!provider || !['google', 'github', 'microsoft'].includes(provider)) {
        return res.status(400).json({ error: "Valid OAuth provider ('google', 'github', or 'microsoft') is required" });
      }

      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

      const result = multiProviderOAuthLogin(
        {
          provider,
          email,
          name: name || username,
          picture,
          avatarUrl,
          sub,
          id,
          username,
          tenant,
          rawToken,
          scope,
          roleHint,
          departmentHint
        },
        Boolean(rememberMe),
        ipAddress,
        userAgent
      );

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "OAuth authentication failed" });
    }
  });

  // Auth: Google OAuth / ID Token Sign-In or Sign-Up
  app.post("/api/auth/google", (req, res) => {
    try {
      const { email, name, picture, sub, rawToken, scope, rememberMe } = req.body;
      if (!email) return res.status(400).json({ error: "Google email is required" });

      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

      const result = googleOAuthLogin(
        { email, name: name || 'Google User', picture, sub, rawToken, scope },
        Boolean(rememberMe),
        ipAddress,
        userAgent
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Google authentication failed" });
    }
  });

  // Auth: GitHub OAuth Sign-In or Sign-Up
  app.post("/api/auth/github", (req, res) => {
    try {
      const { email, name, username, avatarUrl, picture, id, rawToken, scope, rememberMe } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

      const result = githubOAuthLogin(
        { email, name, username, avatarUrl, picture, id, rawToken, scope },
        Boolean(rememberMe),
        ipAddress,
        userAgent
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "GitHub authentication failed" });
    }
  });

  // Auth: Microsoft / Azure AD OAuth Sign-In or Sign-Up
  app.post("/api/auth/microsoft", (req, res) => {
    try {
      const { email, name, picture, sub, tenant, rawToken, scope, rememberMe } = req.body;
      if (!email) return res.status(400).json({ error: "Microsoft email is required" });

      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

      const result = microsoftOAuthLogin(
        { email, name: name || 'Microsoft User', picture, sub, tenant, rawToken, scope },
        Boolean(rememberMe),
        ipAddress,
        userAgent
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Microsoft authentication failed" });
    }
  });

  // Auth: Universal OAuth URL generator for Google, GitHub, and Microsoft
  app.get("/api/auth/oauth/url", (req, res) => {
    const provider = (req.query.provider as string) || 'google';
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/callback?provider=${provider}`;

    if (provider === 'github') {
      const clientId = process.env.GITHUB_CLIENT_ID || 'demo_github_metrology_client_id';
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'read:user user:email',
        state: `wg_gh_${Date.now()}`
      });
      return res.json({ provider: 'github', url: `https://github.com/login/oauth/authorize?${params.toString()}`, redirectUri });
    }

    if (provider === 'microsoft') {
      const clientId = process.env.MICROSOFT_CLIENT_ID || 'demo_microsoft_entra_client_id';
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'openid profile email User.Read',
        response_mode: 'query',
        state: `wg_ms_${Date.now()}`
      });
      return res.json({ provider: 'microsoft', url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`, redirectUri });
    }

    // Default Google
    const clientId = process.env.GOOGLE_CLIENT_ID || 'demo-semiconductor-client-id.apps.googleusercontent.com';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    return res.json({ provider: 'google', url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, redirectUri });
  });

  // Auth: Google OAuth URL generator (backward compatibility)
  app.get("/api/auth/google/url", (req, res) => {
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/callback`;
    const clientId = process.env.GOOGLE_CLIENT_ID || 'demo-semiconductor-client-id.apps.googleusercontent.com';
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url: googleAuthUrl, redirectUri });
  });

  // OAuth Callback Route (renders popup postMessage script per iframe requirements)
  const oauthCallbackHandler = (req: express.Request, res: express.Response) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { background: #07070a; color: #e0e0e0; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #121218; border: 1px solid #22222e; padding: 24px; border-radius: 12px; text-align: center; }
            h2 { color: #818cf8; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🛡️ Authentication Verified</h2>
            <p>Connecting your Google account to WaferGuard AI Fab-09...</p>
            <p style="color: #71717a; font-size: 12px;">This popup window will close automatically.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              setTimeout(() => window.close(), 600);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  };

  app.get('/auth/callback', oauthCallbackHandler);
  app.get('/auth/callback/', oauthCallbackHandler);

  // Auth: Verify current token / Get profile
  app.get("/api/auth/me", (req, res) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "No authentication token provided" });

    const authResult = verifyTokenAndGetUser(token);
    if (!authResult) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    res.json({
      user: authResult.user,
      session: {
        createdAt: authResult.session.createdAt,
        expiresAt: authResult.session.expiresAt,
        rememberMe: authResult.session.rememberMe
      }
    });
  });

  // Auth: Refresh Session Token
  app.post("/api/auth/refresh", (req, res) => {
    try {
      const token = extractToken(req) || req.body.token;
      if (!token) return res.status(400).json({ error: "Token is required" });

      const result = refreshSessionToken(token);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || "Failed to refresh token" });
    }
  });

  // Auth: Request Password Reset (Forgot Password)
  app.post("/api/auth/forgot-password", (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const result = requestPasswordReset(email);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to process password reset request" });
    }
  });

  // Auth: Confirm Password Reset with Token/Code
  app.post("/api/auth/reset-password", (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Email, verification code, and new password are required" });
      }

      const result = confirmPasswordReset(email, code, newPassword);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to reset password" });
    }
  });

  // Auth: Verify Email Address
  app.post("/api/auth/verify-email", (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: "Email and verification code are required" });

      const result = verifyEmail(email, code);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Email verification failed" });
    }
  });

  // Auth: Resend Email Verification Code
  app.post("/api/auth/resend-verification", (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const result = resendVerificationEmail(email);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to resend verification code" });
    }
  });

  // Auth: Logout Current Device
  app.post("/api/auth/logout", (req, res) => {
    const token = extractToken(req) || req.body.token;
    if (token) {
      logoutUser(token);
    }
    res.json({ success: true, message: "Logged out from current device" });
  });

  // Auth: Logout from ALL Devices
  app.post("/api/auth/logout-all", (req, res) => {
    try {
      const token = extractToken(req);
      if (!token) return res.status(401).json({ error: "Authentication required" });

      const authResult = verifyTokenAndGetUser(token);
      if (!authResult) return res.status(401).json({ error: "Invalid session" });

      const result = logoutAllDevices(authResult.user.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to logout from all devices" });
    }
  });

  // Auth: List Active Sessions
  app.get("/api/auth/sessions", (req, res) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "Authentication required" });

    const authResult = verifyTokenAndGetUser(token);
    if (!authResult) return res.status(401).json({ error: "Invalid session" });

    const sessions = getUserActiveSessions(authResult.user.id, token);
    res.json(sessions);
  });

  // Auth: Change Password
  app.post("/api/auth/change-password", (req, res) => {
    try {
      const token = extractToken(req);
      if (!token) return res.status(401).json({ error: "Authentication required" });

      const authResult = verifyTokenAndGetUser(token);
      if (!authResult) return res.status(401).json({ error: "Invalid session" });

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      changePassword(authResult.user.id, currentPassword, newPassword);
      res.json({ success: true, message: "Password updated successfully" });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to change password" });
    }
  });

  // Auth: Toggle MFA
  app.post("/api/auth/toggle-mfa", (req, res) => {
    try {
      const token = extractToken(req);
      if (!token) return res.status(401).json({ error: "Authentication required" });

      const authResult = verifyTokenAndGetUser(token);
      if (!authResult) return res.status(401).json({ error: "Invalid session" });

      const { enabled } = req.body;
      const updatedUser = toggleMfa(authResult.user.id, Boolean(enabled));
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update 2FA status" });
    }
  });

  // Auth: Rotate API Key
  app.post("/api/auth/rotate-api-key", (req, res) => {
    try {
      const token = extractToken(req);
      if (!token) return res.status(401).json({ error: "Authentication required" });

      const authResult = verifyTokenAndGetUser(token);
      if (!authResult) return res.status(401).json({ error: "Invalid session" });

      const newKey = rotateApiKey(authResult.user.id);
      res.json({ apiKey: newKey });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to rotate API key" });
    }
  });

  // Auth: List available demo/enterprise users
  app.get("/api/auth/users", (req, res) => {
    res.json(getAllUsers());
  });

  // Auth: Switch persona (for development testing)
  app.post("/api/auth/switch-user", (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: "userId is required" });

      const result = switchUser(userId);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ error: err.message || "Failed to switch user" });
    }
  });

  // Auth: Security audit logs
  app.get("/api/auth/audit-logs", (req, res) => {
    res.json(getAuditLogs());
  });

  // ================= AGENT & RAG ROUTES =================

  // Orchestrate Agent workflow
  app.post("/api/agent/orchestrate", async (req, res) => {
    try {
      const { prompt, mode } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt string is required" });
      }
      const task = await orchestrateAgent(prompt, mode || "agent");
      res.json(task);
    } catch (err: any) {
      console.error("Orchestration error:", err);
      res.status(500).json({ error: err.message || "Failed to orchestrate task" });
    }
  });

  // Approve / Reject sensitive action
  app.post("/api/agent/approve-action", async (req, res) => {
    try {
      const { taskId, decision, modifiedInput } = req.body;
      if (!taskId || !decision) {
        return res.status(400).json({ error: "taskId and decision are required" });
      }
      const task = await handleApprovalDecision(taskId, decision, modifiedInput);
      res.json(task);
    } catch (err: any) {
      console.error("Approval error:", err);
      res.status(500).json({ error: err.message || "Failed to process approval" });
    }
  });

  // Batch Approve / Reject sensitive actions
  app.post("/api/agent/approve-actions-batch", async (req, res) => {
    try {
      const { taskIds, decision } = req.body;
      if (!Array.isArray(taskIds) || taskIds.length === 0 || !decision) {
        return res.status(400).json({ error: "taskIds array and decision ('approve' | 'reject') are required" });
      }
      const result = await handleBatchApprovalDecisions(taskIds, decision);
      res.json(result);
    } catch (err: any) {
      console.error("Batch approval error:", err);
      res.status(500).json({ error: err.message || "Failed to process batch approvals" });
    }
  });

  // Get all tasks / history
  app.get("/api/agent/tasks", (req, res) => {
    res.json(getAllTasks());
  });

  // Bulk delete tasks
  app.post("/api/agent/tasks/bulk-delete", (req, res) => {
    try {
      const { taskIds } = req.body;
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ error: "taskIds array is required" });
      }
      const result = bulkDeleteTasks(taskIds);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to bulk delete tasks" });
    }
  });

  // Bulk update task status
  app.post("/api/agent/tasks/bulk-status", (req, res) => {
    try {
      const { taskIds, status } = req.body;
      if (!Array.isArray(taskIds) || taskIds.length === 0 || !status) {
        return res.status(400).json({ error: "taskIds array and status are required" });
      }
      const result = bulkUpdateTaskStatus(taskIds, status);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to bulk update task status" });
    }
  });

  // Get specific task
  app.get("/api/agent/tasks/:id", (req, res) => {
    const task = getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  // Update single task status
  app.patch("/api/agent/tasks/:id", (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });
    const updated = updateTaskStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Task not found" });
    res.json(updated);
  });

  // Delete single task
  app.delete("/api/agent/tasks/:id", (req, res) => {
    const success = deleteTask(req.params.id);
    res.json({ success });
  });

  // RAG: List documents
  app.get("/api/rag/documents", (req, res) => {
    res.json(getDocuments());
  });

  // RAG: AI Document Summarizer (3-Sentence Executive Summary)
  app.post("/api/rag/summarize", async (req, res) => {
    try {
      const { title, filename, rawContent, fileType } = req.body;
      if (!rawContent && !title) {
        return res.status(400).json({ error: "rawContent or title is required" });
      }
      const summary = await generate3SentenceSummary(
        title || filename || "Semiconductor Standard Document",
        rawContent || "",
        fileType || "pdf"
      );
      res.json({ summary, model: "gemini-3.7-flash" });
    } catch (err: any) {
      console.error("Summarization error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI executive summary" });
    }
  });

  // RAG: Ingest document
  app.post("/api/rag/upload", async (req, res) => {
    try {
      const { title, filename, fileType, rawContent, tags, category, author, summary } = req.body;
      if (!rawContent || !filename) {
        return res.status(400).json({ error: "rawContent and filename are required" });
      }
      const doc = await ingestDocument({
        title: title || filename,
        filename,
        fileType: fileType || "pdf",
        rawContent,
        category,
        author,
        summary,
        tags: tags || []
      });
      res.json(doc);
    } catch (err: any) {
      console.error("Ingest error:", err);
      res.status(500).json({ error: err.message || "Failed to ingest document" });
    }
  });

  // RAG: Delete document
  app.delete("/api/rag/documents/:id", (req, res) => {
    const success = deleteDocument(req.params.id);
    res.json({ success });
  });

  // RAG: Semantic search
  app.post("/api/rag/search", async (req, res) => {
    try {
      const { query, topK, filterTag } = req.body;
      if (!query) return res.status(400).json({ error: "Query is required" });
      const results = await searchKnowledgeBase(query, topK || 4, filterTag);
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Search error" });
    }
  });

  // Direct tool execution playground
  app.post("/api/tools/execute", async (req, res) => {
    try {
      const { toolName, input } = req.body;
      if (!toolName) return res.status(400).json({ error: "toolName is required" });
      const result = await executeTool(toolName, input || {});
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Tool execution error" });
    }
  });

  // Generated Files: List
  app.get("/api/files", (req, res) => {
    res.json(getGeneratedFiles());
  });

  // Generated Files: Get by ID
  app.get("/api/files/:id", (req, res) => {
    const file = getFileById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json(file);
  });

  // Memories: List
  app.get("/api/memories", (req, res) => {
    res.json(getMemories());
  });

  // Memories: Add
  app.post("/api/memories", (req, res) => {
    const { type, key, value, source, enabled } = req.body;
    if (!key || !value) return res.status(400).json({ error: "key and value are required" });
    const memory = addMemory({
      type: type || "preference",
      key,
      value,
      source: source || "user_defined",
      enabled: enabled !== undefined ? enabled : true
    });
    res.json(memory);
  });

  // Memories: Update
  app.patch("/api/memories/:id", (req, res) => {
    const updated = updateMemory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Memory not found" });
    res.json(updated);
  });

  // Memories: Delete
  app.delete("/api/memories/:id", (req, res) => {
    const success = deleteMemory(req.params.id);
    res.json({ success });
  });

  // Activity Events
  app.get("/api/activity/events", (req, res) => {
    res.json(getActivityEvents());
  });

  app.post("/api/activity/events", (req, res) => {
    try {
      const { type, severity, title, description, metadata, userId, userName, userAvatar } = req.body;
      if (!type || !title) {
        return res.status(400).json({ error: "type and title are required" });
      }
      const event = logActivityEvent({
        type,
        severity: severity || "info",
        title,
        description: description || "",
        metadata,
        userId,
        userName,
        userAvatar
      });
      res.json(event);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to log event" });
    }
  });

  app.delete("/api/activity/events", (req, res) => {
    res.json(clearActivityEvents());
  });

  app.post("/api/activity/seed", (req, res) => {
    res.json(seedActivityEvents());
  });

  // 23:00 Nightly Batch Sync
  app.get("/api/sync/report", (req, res) => {
    res.json(getNightlySyncReport());
  });

  app.post("/api/sync/nightly", (req, res) => {
    try {
      const report = executeNightlySync();
      res.json(report);
    } catch (err: any) {
      console.error("Nightly sync error:", err);
      res.status(500).json({ error: err.message || "Failed to execute nightly sync" });
    }
  });

  // ================= VITE / STATIC MIDDLEWARE =================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WaferGuard AI Authentication & Metrology Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
