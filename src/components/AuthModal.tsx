import React, { useState } from 'react';
import { 
  UserProfile, 
  UserRole 
} from '../types';
import { 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Fingerprint, 
  ArrowRight,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableUsers: UserProfile[];
  onSelectUser: (userId: string) => Promise<void>;
  onLogin: (email: string, password?: string) => Promise<void>;
  onRegister: (data: { name: string; email: string; role: UserRole; department: string; mfaEnabled: boolean }) => Promise<void>;
  onVerifyMfa: (code: string) => Promise<void>;
  requiresMfa?: boolean;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  availableUsers,
  onSelectUser,
  onLogin,
  onRegister,
  onVerifyMfa,
  requiresMfa = false
}) => {
  const [tab, setTab] = useState<'demo_roles' | 'login' | 'register' | 'sso'>('demo_roles');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Autonomous Engineering');
  const [role, setRole] = useState<UserRole>('lead');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await onSelectUser(userId);
      onClose();
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
      if (!requiresMfa) {
        onClose();
      }
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
      onClose();
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
      onClose();
    } catch (err: any) {
      setError(err.message || '2FA Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        id="enterprise-auth-modal"
        className="w-full max-w-lg bg-[#0d0d10] border border-[#1f1f23] rounded-xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/70 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-[#e0e0e0]">Enterprise Authentication</h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                  SECURE RBAC
                </span>
              </div>
              <p className="text-[11px] text-[#8e8e93] mt-0.5">
                Role-based access control, biometric verification & SSO gateway
              </p>
            </div>
          </div>

          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-1 rounded text-[#71717a] hover:text-[#e0e0e0] hover:bg-[#141418] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MFA Step */}
        {requiresMfa ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4 py-2">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto mb-2">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-[#e0e0e0]">Two-Factor Authentication (2FA)</h4>
              <p className="text-[11px] text-[#8e8e93]">
                Enter your 6-digit TOTP authenticator code or use demo bypass (e.g. <strong>123456</strong>)
              </p>
            </div>

            <div>
              <input
                id="mfa-code-input"
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center text-lg tracking-widest font-mono bg-[#141418] border border-[#1f1f23] focus:border-indigo-500 rounded-lg py-2 text-[#e0e0e0] focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleMfaSubmit({ preventDefault: () => {} } as any)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Verify & Enter Platform</span>
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[#141418] border border-[#1f1f23] text-xs font-medium">
              <button
                id="tab-demo-roles"
                onClick={() => setTab('demo_roles')}
                className={`py-1.5 px-2 rounded-md transition text-center ${
                  tab === 'demo_roles' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                }`}
              >
                Demo Roles
              </button>
              <button
                id="tab-login"
                onClick={() => setTab('login')}
                className={`py-1.5 px-2 rounded-md transition text-center ${
                  tab === 'login' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                }`}
              >
                Password
              </button>
              <button
                id="tab-sso"
                onClick={() => setTab('sso')}
                className={`py-1.5 px-2 rounded-md transition text-center ${
                  tab === 'sso' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                }`}
              >
                SSO / OAuth
              </button>
              <button
                id="tab-register"
                onClick={() => setTab('register')}
                className={`py-1.5 px-2 rounded-md transition text-center ${
                  tab === 'register' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                }`}
              >
                Register
              </button>
            </div>

            {/* Tab 1: Instant Demo Persona Switching */}
            {tab === 'demo_roles' && (
              <div className="space-y-2 py-1">
                <span className="text-[10px] font-mono text-[#8e8e93] uppercase tracking-wider block">
                  Select Corporate Persona & Security Tier:
                </span>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      id={`select-role-user-${u.id}`}
                      onClick={() => handleRoleSelect(u.id)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#141418] hover:bg-[#1a1a20] border border-[#1f1f23] hover:border-indigo-500/40 transition text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {u.avatarUrl ? (
                          <img 
                            src={u.avatarUrl} 
                            alt={u.name} 
                            className="w-8 h-8 rounded-full object-cover border border-[#27272a] shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#e0e0e0] group-hover:text-indigo-300 transition">
                              {u.name}
                            </span>
                            <span className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded border ${
                              u.role === 'admin' 
                                ? 'bg-red-950/70 text-red-300 border-red-500/30' 
                                : u.role === 'lead' 
                                ? 'bg-indigo-950/70 text-indigo-300 border-indigo-500/30'
                                : u.role === 'analyst'
                                ? 'bg-purple-950/70 text-purple-300 border-purple-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#8e8e93] truncate">{u.department}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                        <span>Sign In</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Standard Password Login */}
            {tab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3 py-1">
                <div>
                  <label className="block text-[11px] font-medium text-[#8e8e93] mb-1">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#52525b] absolute left-3 top-2.5" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="elena.vance@agentos.enterprise.io"
                      className="w-full bg-[#141418] border border-[#1f1f23] focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-[#e0e0e0] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#8e8e93] mb-1">
                    Enterprise Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#52525b] absolute left-3 top-2.5" />
                    <input
                      id="login-password-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#141418] border border-[#1f1f23] focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-[#e0e0e0] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  id="submit-login-btn"
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  <span>Sign In with Password</span>
                </button>
              </form>
            )}

            {/* Tab 3: SSO & OAuth */}
            {tab === 'sso' && (
              <div className="space-y-2.5 py-1">
                <p className="text-[11px] text-[#8e8e93]">
                  Single Sign-On through certified Identity Providers with zero password footprint:
                </p>

                <div className="space-y-2">
                  <button
                    id="sso-google-btn"
                    onClick={() => handleRoleSelect('usr-elena-vance')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#141418] hover:bg-[#1a1a20] border border-[#1f1f23] hover:border-indigo-500/40 text-xs font-medium text-[#e0e0e0] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-red-400" />
                      <span>Google Workspace SSO (Google Identity)</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Connected</span>
                  </button>

                  <button
                    id="sso-okta-btn"
                    onClick={() => handleRoleSelect('usr-marcus-reed')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#141418] hover:bg-[#1a1a20] border border-[#1f1f23] hover:border-indigo-500/40 text-xs font-medium text-[#e0e0e0] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span>Okta / SAML 2.0 Identity Provider</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400">Enterprise</span>
                  </button>

                  <button
                    id="sso-azure-btn"
                    onClick={() => handleRoleSelect('usr-sarah-jenkins')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#141418] hover:bg-[#1a1a20] border border-[#1f1f23] hover:border-indigo-500/40 text-xs font-medium text-[#e0e0e0] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-emerald-400" />
                      <span>Microsoft Entra ID / Azure AD</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Verified</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Register Custom Account */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-2.5 py-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-[#8e8e93] mb-1">Full Name</label>
                    <input
                      id="reg-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jordan Blake"
                      className="w-full bg-[#141418] border border-[#1f1f23] focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-[#8e8e93] mb-1">Corporate Email</label>
                    <input
                      id="reg-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@agentos.io"
                      className="w-full bg-[#141418] border border-[#1f1f23] focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-[#8e8e93] mb-1">Security Role</label>
                    <select
                      id="reg-role-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-[#141418] border border-[#1f1f23] focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs text-[#e0e0e0] focus:outline-none cursor-pointer"
                    >
                      <option value="admin">Admin (Lead Architect)</option>
                      <option value="lead">Lead (Operations & Approvals)</option>
                      <option value="analyst">Analyst (Data & Research)</option>
                      <option value="viewer">Viewer (Auditor Read-only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-[#8e8e93] mb-1">Department</label>
                    <input
                      id="reg-dept-input"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="AI Engineering"
                      className="w-full bg-[#141418] border border-[#1f1f23] focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="reg-mfa-checkbox"
                    type="checkbox"
                    checked={mfaEnabled}
                    onChange={(e) => setMfaEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#1f1f23] text-indigo-600 focus:ring-0 bg-[#141418] cursor-pointer"
                  />
                  <label htmlFor="reg-mfa-checkbox" className="text-[11px] text-[#8e8e93] cursor-pointer">
                    Enable Two-Factor Authentication (2FA) verification
                  </label>
                </div>

                <button
                  id="submit-register-btn"
                  type="submit"
                  disabled={isLoading || !name || !email}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Create Account & Log In</span>
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
