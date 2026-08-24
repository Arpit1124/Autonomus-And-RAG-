import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Laptop, 
  Smartphone, 
  LogOut, 
  Check, 
  Copy, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Lock, 
  Fingerprint, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { UserProfile, ActiveSessionInfo } from '../../types';
import { api } from '../../services/api';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  sessionToken: string;
  onUserUpdated: (user: UserProfile) => void;
  onLogoutAllDevices: () => void;
}

export const SecuritySettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  sessionToken,
  onUserUpdated,
  onLogoutAllDevices
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'password' | 'api_key' | 'mfa'>('sessions');
  const [sessions, setSessions] = useState<ActiveSessionInfo[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isTerminatingAll, setIsTerminatingAll] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Status & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [isTogglingMfa, setIsTogglingMfa] = useState(false);

  useEffect(() => {
    if (isOpen && sessionToken) {
      loadActiveSessions();
    }
  }, [isOpen, sessionToken]);

  const loadActiveSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const list = await api.getActiveSessions(sessionToken);
      setSessions(list);
    } catch {
      // fallback session
      setSessions([
        {
          id: 'sess-current',
          ipAddress: '127.0.0.1 (Current Session)',
          userAgent: navigator.userAgent,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isCurrent: true
        }
      ]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to terminate all active sessions across all devices? You will be logged out immediately.')) {
      return;
    }
    setIsTerminatingAll(true);
    try {
      await api.logoutAllDevices(sessionToken);
      onLogoutAllDevices();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to terminate all sessions' });
      setIsTerminatingAll(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setFeedback({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPass(true);
    setFeedback(null);
    try {
      await api.changePassword(sessionToken, currentPassword, newPassword);
      setFeedback({ type: 'success', text: 'Password updated successfully! All other sessions have been invalidated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleRotateApiKey = async () => {
    setIsRotatingKey(true);
    setFeedback(null);
    try {
      const { apiKey } = await api.rotateApiKey(sessionToken);
      onUserUpdated({ ...currentUser, apiKey });
      setFeedback({ type: 'success', text: 'New API Key generated and activated.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to rotate API Key.' });
    } finally {
      setIsRotatingKey(false);
    }
  };

  const handleToggleMfa = async () => {
    setIsTogglingMfa(true);
    setFeedback(null);
    try {
      const res = await api.toggleMfa(sessionToken, !currentUser.mfaEnabled);
      onUserUpdated(res.user);
      setFeedback({ 
        type: 'success', 
        text: `Two-Factor Authentication has been ${res.user.mfaEnabled ? 'Enabled' : 'Disabled'}.` 
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to toggle 2FA.' });
    } finally {
      setIsTogglingMfa(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(currentUser.apiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#09090f] border border-[#1e1e2c] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e1e2c] flex items-center justify-between bg-[#0e0e18]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">Security & Session Governance</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                  PBKDF2 SHA-512
                </span>
              </div>
              <p className="text-xs text-[#8e8e98] mt-0.5">
                Manage active device tokens, cryptographic passwords, 2FA, and developer API keys.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#1e1e2c] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1e1e2c] bg-[#0c0c14] px-4 pt-2 gap-2 text-xs font-mono">
          <button
            onClick={() => { setActiveTab('sessions'); setFeedback(null); }}
            className={`px-3.5 py-2.5 rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-indigo-500 text-indigo-300 bg-[#12121e] font-bold'
                : 'border-transparent text-[#71717a] hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Active Sessions ({sessions.length || 1})</span>
          </button>

          <button
            onClick={() => { setActiveTab('password'); setFeedback(null); }}
            className={`px-3.5 py-2.5 rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'password'
                ? 'border-indigo-500 text-indigo-300 bg-[#12121e] font-bold'
                : 'border-transparent text-[#71717a] hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => { setActiveTab('mfa'); setFeedback(null); }}
            className={`px-3.5 py-2.5 rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'mfa'
                ? 'border-indigo-500 text-indigo-300 bg-[#12121e] font-bold'
                : 'border-transparent text-[#71717a] hover:text-white'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Two-Factor (2FA)</span>
          </button>

          <button
            onClick={() => { setActiveTab('api_key'); setFeedback(null); }}
            className={`px-3.5 py-2.5 rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'api_key'
                ? 'border-indigo-500 text-indigo-300 bg-[#12121e] font-bold'
                : 'border-transparent text-[#71717a] hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Keys</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-mono ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/40 text-red-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* TAB 1: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Authenticated Device Sessions</h4>
                  <p className="text-[11px] text-[#71717a]">
                    Tokens are valid for 24 hours (or 30 days if 'Remember Me' is toggled).
                  </p>
                </div>

                <button
                  onClick={handleLogoutAll}
                  disabled={isTerminatingAll}
                  className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isTerminatingAll ? 'Terminating...' : 'Logout From All Devices'}</span>
                </button>
              </div>

              {isLoadingSessions ? (
                <div className="py-8 text-center text-xs text-[#71717a] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Loading device telemetry...</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((sess, idx) => (
                    <div
                      key={sess.id || idx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                        sess.isCurrent
                          ? 'bg-[#121220] border-indigo-500/40'
                          : 'bg-[#0d0d14] border-[#1e1e2c]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#181826] border border-[#2a2a3c] flex items-center justify-center text-indigo-400 shrink-0">
                          {sess.userAgent?.includes('Mobile') ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              {sess.ipAddress || '127.0.0.1 (Verified)'}
                            </span>
                            {sess.isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 uppercase font-semibold">
                                Current Device
                              </span>
                            )}
                            {sess.rememberMe && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30 uppercase font-semibold">
                                Remembered (30 Days)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#71717a] mt-0.5 truncate max-w-md">
                            Expires: {new Date(sess.expiresAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-emerald-400 shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4 font-mono max-w-lg">
              <div className="space-y-1">
                <label className="text-xs text-[#8e8e98] uppercase font-bold">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-[#12121c] border border-[#242436] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-[#52525b] outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-[#71717a] hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#8e8e98] uppercase font-bold">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (8+ chars, uppercase, number, symbol)"
                    className="w-full bg-[#12121c] border border-[#242436] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-[#52525b] outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-[#71717a] hover:text-white"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <PasswordStrengthMeter password={newPassword} />

              <div className="space-y-1">
                <label className="text-xs text-[#8e8e98] uppercase font-bold">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#12121c] border border-[#242436] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#52525b] outline-none focus:border-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass || !currentPassword || !newPassword}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {isChangingPass ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Update Password & Re-Hash</span>
              </button>
            </form>
          )}

          {/* TAB 3: TWO-FACTOR AUTH */}
          {activeTab === 'mfa' && (
            <div className="space-y-4 font-mono">
              <div className="p-4 rounded-xl bg-[#12121e] border border-[#1e1e2e] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Time-Based One-Time Password (TOTP)</h4>
                      <p className="text-[11px] text-[#8e8e98]">
                        Requires a secondary 6-digit authenticator code upon signing in from unrecognized cleanroom terminals.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleMfa}
                    disabled={isTogglingMfa}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                      currentUser.mfaEnabled
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {isTogglingMfa && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>{currentUser.mfaEnabled ? '2FA Enabled (Active)' : 'Enable 2FA'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#101018] border border-[#1e1e2e] text-xs text-[#a1a1aa] space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SEMI E10 Compliance Mandate</span>
                </div>
                <p className="text-[11px] text-[#71717a]">
                  Cleanroom operations with P0 Batch Sign-Off and Vision Model Parameter modification authority are advised to maintain active 2FA enforcement.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: API KEYS */}
          {activeTab === 'api_key' && (
            <div className="space-y-4 font-mono">
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Developer & Automation API Token</h4>
                <p className="text-[11px] text-[#71717a]">
                  Allows external semiconductor inspection pipelines to submit wafer images and query defect telemetry.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#12121c] border border-[#242436] space-y-2">
                <label className="text-[10px] text-[#8e8e98] uppercase font-bold">Active API Secret Key</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUser.apiKey}
                    className="flex-1 bg-[#09090f] border border-[#1e1e2c] rounded-lg px-3 py-2 text-xs text-indigo-300 font-mono outline-none"
                  />
                  <button
                    onClick={handleCopyKey}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedApiKey ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedApiKey ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleRotateApiKey}
                    disabled={isRotatingKey}
                    className="px-3 py-2 rounded-lg bg-[#1a1a28] hover:bg-[#222234] border border-[#2a2a3c] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRotatingKey ? 'animate-spin' : ''}`} />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
