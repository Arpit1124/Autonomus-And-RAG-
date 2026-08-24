import React, { useState } from 'react';
import { 
  Shield, 
  KeyRound, 
  Lock, 
  Mail, 
  Building2, 
  Sparkles, 
  AlertCircle, 
  Fingerprint, 
  ArrowRight,
  Globe,
  Clock,
  BarChart3,
  BrainCircuit,
  Wrench,
  FileText,
  FolderKanban,
  CheckCircle,
  RotateCcw,
  Eye,
  Check,
  Database
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { AutonomousAgentLogo } from './AutonomousAgentLogo';

interface Props {
  availableUsers: UserProfile[];
  onSelectUser: (userId: string) => Promise<void>;
  onLogin: (email: string, password?: string) => Promise<void>;
  onRegister: (data: { name: string; email: string; role: UserRole; department: string; mfaEnabled: boolean }) => Promise<void>;
  onVerifyMfa: (code: string) => Promise<void>;
  requiresMfa?: boolean;
  onEnterGuest?: () => void;
  onTriggerSync?: () => Promise<void>;
}

export const AuthFrontPage: React.FC<Props> = ({
  availableUsers,
  onSelectUser,
  onLogin,
  onRegister,
  onVerifyMfa,
  requiresMfa = false,
  onEnterGuest,
  onTriggerSync
}) => {
  const [tab, setTab] = useState<'demo_roles' | 'login' | 'register' | 'sso'>('demo_roles');
  const [previewTab, setPreviewTab] = useState<'artifacts' | 'tasks' | 'rag' | 'tools' | 'memory' | 'analytics'>('artifacts');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Autonomous Engineering');
  const [role, setRole] = useState<UserRole>('lead');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleSelect = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await onSelectUser(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to switch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await onLogin(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await onRegister({
        name: name.trim(),
        email: email.trim(),
        role,
        department: department.trim(),
        mfaEnabled
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await onVerifyMfa(mfaCode.trim());
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      if (onTriggerSync) {
        await onTriggerSync();
      }
      setSyncSuccessMsg('Nightly 23:00 batch completed: Tasks, Gantt slices, RAG vector embeddings, tools, memory rules, and generated artifacts updated!');
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-[#e0e0e0] flex flex-col justify-between selection:bg-indigo-600 selection:text-white font-sans relative overflow-x-hidden">
      {/* Background Ambience Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2308_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2308_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent blur-3xl pointer-events-none" />
      
      {/* Top Navbar */}
      <header className="relative z-10 border-b border-[#18181c] bg-[#0b0b0e]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AutonomousAgentLogo size={36} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#f4f4f5] tracking-tight">AgentOS</span>
              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                LOCAL ENTERPRISE
              </span>
            </div>
            <p className="text-[10px] text-cyan-400 font-mono">Build Autonomous AI Agents Locally</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#71717a] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>23:00 UTC Nightly Sync Engine Active</span>
          </div>
          {onEnterGuest && (
            <button
              onClick={onEnterGuest}
              className="text-xs font-mono text-[#e0e0e0] bg-[#141418] hover:bg-[#1f1f26] px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:border-indigo-400 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore Live Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          )}
        </div>
      </header>

      {/* Main Centered Hero & Auth Layout */}
      <main className="relative z-10 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center gap-8 flex-1">
        
        {/* Centered Hero Header */}
        <div className="text-center space-y-3.5 max-w-xl mx-auto flex flex-col items-center">
          <div className="relative drop-shadow-xl inline-block mb-1">
            <AutonomousAgentLogo size={52} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enterprise Autonomous AgentOS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Sign In to Unlock the <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">Autonomous Workspace</span>
          </h1>
          
          <p className="text-sm sm:text-base text-[#a1a1aa] leading-relaxed max-w-lg">
            Authenticate with an enterprise role to access isolated sandboxes, hybrid RAG knowledge graphs, multi-step subtask planning, Gantt telemetry, and Human-in-the-Loop approval gates.
          </p>
        </div>

        {/* Centered Major Authentication Card */}
        <div className="w-full max-w-lg mx-auto">
          <div 
            id="major-auth-card"
            className="bg-[#0c0c10]/95 border border-indigo-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl shadow-indigo-950/50 relative overflow-hidden backdrop-blur-xl"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

            {/* If MFA is required */}
            {requiresMfa ? (
              <div className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto mb-2">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <h2 className="text-base font-bold text-white font-mono">Two-Factor Authentication</h2>
                  <p className="text-xs text-[#8e8e93]">
                    Enter your 6-digit TOTP authenticator code or use demo code <strong className="text-indigo-400 font-mono">123456</strong>
                  </p>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleMfaSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center text-xl tracking-[0.5em] font-mono bg-[#141418] border border-indigo-500/40 rounded-xl py-3 text-white focus:outline-none focus:border-indigo-400"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || mfaCode.length < 6}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    {isLoading ? 'Verifying...' : 'Authenticate & Enter AgentOS'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header Auth Tabs */}
                <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Identity Gateway
                    </h2>
                    <p className="text-[11px] text-[#71717a]">
                      Sign in to open the full autonomous suite
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#141418] border border-[#27272a] text-indigo-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-4 bg-[#141418] border border-[#1f1f23] rounded-lg p-1 text-[11px] font-mono font-medium text-center">
                  <button
                    type="button"
                    onClick={() => { setTab('demo_roles'); setError(null); }}
                    className={`py-1.5 rounded-md transition cursor-pointer ${
                      tab === 'demo_roles' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                    }`}
                  >
                    Demo Roles
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError(null); }}
                    className={`py-1.5 rounded-md transition cursor-pointer ${
                      tab === 'login' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab('register'); setError(null); }}
                    className={`py-1.5 rounded-md transition cursor-pointer ${
                      tab === 'register' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                    }`}
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab('sso'); setError(null); }}
                    className={`py-1.5 rounded-md transition cursor-pointer ${
                      tab === 'sso' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                    }`}
                  >
                    SSO
                  </button>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* TAB 1: Demo Roles 1-Click Login */}
                {tab === 'demo_roles' && (
                  <div className="space-y-2.5">
                    <div className="text-[11px] text-[#8e8e93] font-mono flex items-center justify-between">
                      <span>Select an Enterprise Role:</span>
                      <span className="text-cyan-400">1-Click Instant Login</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableUsers.map((user) => {
                        const roleColor = 
                          user.role === 'admin' ? 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40' :
                          user.role === 'lead' ? 'text-purple-400 bg-purple-950/60 border-purple-500/40' :
                          user.role === 'analyst' ? 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' :
                          'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';

                        return (
                          <div
                            key={user.id}
                            onClick={() => handleRoleSelect(user.id)}
                            className="p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between space-y-1.5 bg-[#121216] hover:bg-[#16161c] border-[#22222a] hover:border-[#383844]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-white truncate">
                                {user.name}
                              </span>
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-bold ${roleColor}`}>
                                {user.role}
                              </span>
                            </div>

                            <div className="text-[10px] text-[#71717a] font-mono truncate">
                              {user.email}
                            </div>

                            <div className="pt-1 border-t border-[#1a1a20] flex items-center justify-between text-[9px] font-mono text-[#8e8e93]">
                              <span>Quota: {Math.round(user.tokenCountQuota / 1000)}k tokens</span>
                              <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                                Login <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Guest exploration link */}
                    {onEnterGuest && (
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={onEnterGuest}
                          className="text-xs text-[#8e8e93] hover:text-indigo-300 font-mono transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Or continue as Guest (Bypass Authentication)</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Email & Password Sign In */}
                {tab === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">
                        Corporate Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#71717a] absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="elena.vance@agentos.internal"
                          className="w-full bg-[#141418] border border-[#27272a] focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#52525b] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#71717a] absolute left-3 top-2.5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-[#141418] border border-[#27272a] focus:border-indigo-500 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder:text-[#52525b] focus:outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-[#71717a] hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#71717a] font-mono">
                      <span>Default Demo Pwd: <code className="text-indigo-400">admin123!</code></span>
                      <button 
                        type="button" 
                        onClick={() => { setEmail('elena.vance@agentos.internal'); setPassword('admin123!'); }}
                        className="text-cyan-400 hover:underline cursor-pointer"
                      >
                        Autofill Admin
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      {isLoading ? 'Signing In...' : 'Sign In to Workspace'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* TAB 3: Register New User */}
                {tab === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Jordan Hayes"
                        className="w-full bg-[#141418] border border-[#27272a] focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525b] focus:outline-none transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="jordan@agentos.org"
                          className="w-full bg-[#141418] border border-[#27272a] focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525b] focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Role</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as any)}
                          className="w-full bg-[#141418] border border-[#27272a] focus:border-indigo-500 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none transition font-mono"
                        >
                          <option value="admin">Admin (Full Access)</option>
                          <option value="lead">Lead (Approval Gatekeeper)</option>
                          <option value="analyst">Analyst (RAG & Code)</option>
                          <option value="auditor">Auditor (Compliance Logs)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Autonomous Engineering"
                        className="w-full bg-[#141418] border border-[#27272a] focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525b] focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#141418] border border-[#27272a] focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525b] focus:outline-none transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account & Sign In'}
                      <Check className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* TAB 4: Enterprise SSO */}
                {tab === 'sso' && (
                  <div className="space-y-3 text-center py-2">
                    <div className="p-3 rounded-xl bg-[#121216] border border-[#1f1f23] space-y-2">
                      <Globe className="w-6 h-6 text-indigo-400 mx-auto" />
                      <div className="text-xs font-bold text-white font-mono">
                        Enterprise Single Sign-On (SAML 2.0 / OIDC)
                      </div>
                      <p className="text-[11px] text-[#71717a]">
                        Authenticate via Okta, Google Workspace, Azure AD, or Ping Identity.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleRoleSelect(availableUsers[0]?.id || 'usr-elena-vance')}
                        className="w-full py-2 px-3 rounded-lg bg-[#141418] hover:bg-[#1a1a22] border border-[#27272a] text-xs font-medium text-white flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Sign In with Okta SSO</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoleSelect(availableUsers[1]?.id || 'usr-marcus-reed')}
                        className="w-full py-2 px-3 rounded-lg bg-[#141418] hover:bg-[#1a1a22] border border-[#27272a] text-xs font-medium text-white flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Sign In with Azure Active Directory</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Centered Nightly 23:00 Autonomous Sync Telemetry Card */}
        <div className="w-full max-w-lg mx-auto p-3.5 rounded-xl bg-[#0c0c10] border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-white font-bold flex items-center gap-2">
                <span>Nightly Sync Service (23:00 Batch)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  Every Day at 23:00
                </span>
              </div>
              <p className="text-[11px] text-[#8e8e93]">
                Daily 23:00 batch auto-updates tasks, Gantts, RAG embeddings, tools, and artifacts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            {syncSuccessMsg && (
              <span className="text-[10px] text-emerald-400 font-sans">{syncSuccessMsg}</span>
            )}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-mono transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Run 23:00 Batch Now'}</span>
            </button>
          </div>
        </div>

        {/* Centered Interactive Showcase: "What Unlocks Inside When You Sign In" */}
        <div className="w-full max-w-2xl mx-auto bg-[#0b0b0e] border border-[#1f1f23] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#18181c] pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Interactive Preview: What Unlocks Inside
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">Updated Every Day at 23:00</span>
          </div>

          {/* Preview Feature Selector Tabs */}
          <div className="flex flex-wrap gap-1 bg-[#121216] border border-[#1f1f23] p-1 rounded-lg text-[11px] font-mono justify-center">
            {[
              { id: 'artifacts', label: 'Generated Artifacts', icon: FileText },
              { id: 'tasks', label: 'Tasks & Gantts', icon: FolderKanban },
              { id: 'rag', label: 'Knowledge (RAG)', icon: Database },
              { id: 'tools', label: 'Tool Registry', icon: Wrench },
              { id: 'memory', label: 'Memory Rules', icon: BrainCircuit },
              { id: 'analytics', label: 'Metric Analytics', icon: BarChart3 }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPreviewTab(item.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                  previewTab === item.id
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-[#8e8e93] hover:text-[#e0e0e0] hover:bg-[#1a1a20]'
                }`}
              >
                <item.icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Preview Content Windows */}
          <div className="p-3.5 rounded-xl bg-[#0e0e13] border border-[#1a1a20] min-h-[160px] text-xs font-mono space-y-2">
            
            {/* 1. Generated Artifacts Preview */}
            {previewTab === 'artifacts' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[#8e8e93] text-[11px]">
                  <span>Daily Self-Updating Artifacts Repository</span>
                  <span className="text-emerald-400">6 Generated Files Ready</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#141418] border border-[#27272a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 font-bold text-[9px]">PPTX</span>
                      <span className="text-white truncate">Q4_Executive_Board_Deck.pptx</span>
                    </div>
                    <span className="text-[#71717a] shrink-0 text-[10px]">6 Slides</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141418] border border-[#27272a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-bold text-[9px]">PDF</span>
                      <span className="text-white truncate">Workflow_Audit_Report.pdf</span>
                    </div>
                    <span className="text-[#71717a] shrink-0 text-[10px]">SOC2 Compliant</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141418] border border-[#27272a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-bold text-[9px]">PY</span>
                      <span className="text-white truncate">Customer_Churn_Model.py</span>
                    </div>
                    <span className="text-[#71717a] shrink-0 text-[10px]">AUC 0.968</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141418] border border-[#27272a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 font-bold text-[9px]">JSON</span>
                      <span className="text-white truncate">Nightly_Sync_Audit_2300.json</span>
                    </div>
                    <span className="text-emerald-400 shrink-0 text-[10px]">23:00 Batch</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Tasks & Gantts Preview */}
            {previewTab === 'tasks' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[#8e8e93] text-[11px]">
                  <span>Dynamic Multi-Step Planning & Gantt History</span>
                  <span className="text-indigo-400">P95: 1,120ms</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141418] border border-[#27272a] space-y-1.5">
                  <div className="flex items-center justify-between text-white">
                    <span className="font-bold">Q4 Enterprise SaaS Financial Analysis</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">COMPLETED</span>
                  </div>
                  <div className="w-full bg-[#1e1e24] h-2 rounded-full overflow-hidden flex">
                    <div className="bg-indigo-500 h-full w-1/3" title="Subtask 1: RAG Search" />
                    <div className="bg-purple-500 h-full w-1/3" title="Subtask 2: Python Code Execution" />
                    <div className="bg-cyan-500 h-full w-1/3" title="Subtask 3: PPTX Deck Generator" />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#71717a]">
                    <span>3 Subtasks • 3 Sandboxed Traces</span>
                    <span>Full Gantt Timeline Available Upon Sign In</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Knowledge (RAG) Preview */}
            {previewTab === 'rag' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[#8e8e93] text-[11px]">
                  <span>Hybrid Semantic Vector Search & Chunks</span>
                  <span className="text-cyan-400">14 Indexed Chunks</span>
                </div>
                <div className="p-2 rounded-lg bg-[#141418] border border-[#27272a] text-[#a1a1aa] text-[11px] leading-relaxed">
                  "Total ARR reached $14.2 Million, representing 38% YoY growth. Net Revenue Retention achieved 124% driven by enterprise add-ons."
                  <div className="mt-1 flex items-center justify-between text-[9px] text-[#71717a]">
                    <span className="text-indigo-400">Source: Q4_Enterprise_SaaS_Strategy_Report.pdf • Chunk #1</span>
                    <span>Cosine Similarity: 0.942</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Tool Registry Preview */}
            {previewTab === 'tools' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[#8e8e93] text-[11px]">
                  <span>12 Registered Sandboxed Capabilities</span>
                  <span className="text-emerald-400">100% Health Status</span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[
                    'search_knowledge_base',
                    'create_presentation',
                    'create_document',
                    'execute_code',
                    'analyze_data_and_chart',
                    'web_search_research',
                    'send_email (Sensitive)'
                  ].map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-[#141418] border border-[#27272a] text-[#8e8e93] text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Memory Rules Preview */}
            {previewTab === 'memory' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[#8e8e93] text-[11px]">
                  <span>Persistent Memory & Compliance Rules</span>
                  <span className="text-purple-400">4 Active Directives</span>
                </div>
                <div className="space-y-1 text-[11px] text-[#a1a1aa]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>[GUIDELINE] Sensitive Actions Policy: Require explicit human confirmation before emails or deletions.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span>[WORKFLOW] Presentation Standards: Include Agenda, 3-5 citation slides, and Next Steps.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Metric Analytics Preview */}
            {previewTab === 'analytics' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[#8e8e93] text-[11px]">
                  <span>30-Day Execution Telemetry</span>
                  <span className="text-emerald-400">99.4% Success Rate</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded bg-[#141418] border border-[#27272a]">
                    <div className="text-white font-bold text-sm">1,840</div>
                    <div className="text-[#71717a]">Daily Runs</div>
                  </div>
                  <div className="p-2 rounded bg-[#141418] border border-[#27272a]">
                    <div className="text-indigo-400 font-bold text-sm">1,120ms</div>
                    <div className="text-[#71717a]">Avg Latency</div>
                  </div>
                  <div className="p-2 rounded bg-[#141418] border border-[#27272a]">
                    <div className="text-cyan-400 font-bold text-sm">99.4%</div>
                    <div className="text-[#71717a]">Accuracy</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

      {/* Footer System Status Bar */}
      <footer className="relative z-10 border-t border-[#18181c] bg-[#09090c] px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#71717a] font-mono gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AgentOS Node Online (Port 3000)</span>
          </div>
          <span>•</span>
          <span>Next Scheduled Sync: 23:00:00 UTC</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Local Memory Protection</span>
          <span>•</span>
          <span>Zero-Trust RBAC Gate</span>
        </div>
      </footer>
    </div>
  );
};
