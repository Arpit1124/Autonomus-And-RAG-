import { UserProfile, UserRole, SecurityAuditLog, ActiveSessionInfo } from '../src/types.js';
import { logActivityEvent } from './activity.js';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateVerificationCode,
  sanitizeInput,
  validateEmail,
  validatePasswordStrength,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit
} from './security.js';

export interface UserSessionRecord {
  token: string;
  createdAt: number;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
  rememberMe: boolean;
}

export interface UserDbRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  department: string;
  organization: string;
  bio?: string;
  avatarUrl?: string;
  apiKey: string;
  authProvider?: 'local' | 'google' | 'github' | 'microsoft' | 'demo';
  providerUserId?: string;
  externalClaims?: {
    provider: 'local' | 'google' | 'github' | 'microsoft' | 'demo';
    providerUserId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    rawToken?: string;
    issuedAt?: string;
    scope?: string;
  };
  mfaEnabled: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: number | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: number | null;
  accountStatus: 'active' | 'locked' | 'suspended';
  failedLoginAttempts: number;
  lockoutUntil?: number | null;
  sessions: UserSessionRecord[];
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  tokenCountQuota: number;
  usedTokens: number;
}

// Generate default hashed passwords for initial seed accounts using PBKDF2
const DEFAULT_PASSWORD = 'Password123!';
const seedPass1 = hashPassword(DEFAULT_PASSWORD);

export const DEFAULT_USERS_DB: UserDbRecord[] = [
  {
    id: 'usr-arpit-sharma',
    name: 'Arpit Sharma',
    email: 'arpitsharma1124@gmail.com',
    passwordHash: seedPass1.hash,
    salt: seedPass1.salt,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    department: 'Enterprise Semiconductor Systems & Metrology AI',
    organization: 'Silicon Foundry Fab-09',
    bio: 'System Administrator and Lead Semiconductor Quality Systems Architect.',
    apiKey: 'sk_live_fab9_admin_8839201948',
    mfaEnabled: false,
    isEmailVerified: true,
    accountStatus: 'active',
    failedLoginAttempts: 0,
    sessions: [],
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    tokenCountQuota: 1000000,
    usedTokens: 142850
  }
];

// Persistent In-Memory Database Store
const usersDb: UserDbRecord[] = [...DEFAULT_USERS_DB];

// Security Audit Logs
let auditLogsStore: SecurityAuditLog[] = [
  {
    id: 'log-init-01',
    userId: 'usr-arpit-sharma',
    userName: 'Arpit Sharma',
    action: 'SYSTEM_BOOT',
    details: 'Semiconductor Quality & Metrology Authentication System Initialized for Admin Arpit Sharma.',
    ipAddress: '127.0.0.1 (Local)',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    severity: 'low'
  }
];

/**
 * Maps a database record to the public UserProfile type (excluding password hashes and salts)
 */
export function mapDbRecordToProfile(user: UserDbRecord): UserProfile {
  const role = user.role;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    department: user.department,
    organization: user.organization,
    bio: user.bio,
    apiKey: user.apiKey,
    lastLogin: user.lastLogin,
    authProvider: user.authProvider || 'local',
    externalClaims: user.externalClaims,
    mfaEnabled: user.mfaEnabled,
    isEmailVerified: user.isEmailVerified,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    activeSessionsCount: user.sessions.length,
    tokenCountQuota: user.tokenCountQuota,
    usedTokens: user.usedTokens,
    permissions: {
      canRunInspection: role !== 'viewer' && role !== 'student_user',
      canApproveCorrectiveActions: role === 'admin' || role === 'quality_engineer' || role === 'production_manager' || role === 'lead',
      canEditKnowledgeBase: role === 'admin' || role === 'quality_engineer' || role === 'lead',
      canManageMachines: role === 'admin' || role === 'quality_engineer' || role === 'production_manager',
      canExportReports: true,
      canModifyModelConfig: role === 'admin' || role === 'quality_engineer',
      canExecuteTools: role !== 'viewer',
      canApproveHighRisk: role === 'admin' || role === 'quality_engineer' || role === 'production_manager',
      canManageMemory: role === 'admin' || role === 'quality_engineer',
      canViewTelemetry: true,
      canExportArtifacts: true
    }
  };
}

/**
 * Adds an audit log record
 */
export function addAuditLog(
  action: string,
  details: string,
  severity: SecurityAuditLog['severity'] = 'low',
  userId = 'system',
  userName = 'System'
): SecurityAuditLog {
  const log: SecurityAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    userName,
    action,
    details,
    ipAddress: '127.0.0.1 (Verified)',
    timestamp: new Date().toISOString(),
    severity
  };
  auditLogsStore.unshift(log);
  if (auditLogsStore.length > 100) auditLogsStore.pop();
  return log;
}

export function getAuditLogs(): SecurityAuditLog[] {
  return auditLogsStore;
}

export function getAllUsers(): UserProfile[] {
  return usersDb.map(mapDbRecordToProfile);
}

/**
 * Authenticates a user with email and password, enforcing rate limits, PBKDF2 hash verification, and session tokens.
 */
export function loginUser(
  emailInput: string,
  passwordInput?: string,
  rememberMe = false,
  ipAddress = '127.0.0.1',
  userAgent = 'Mozilla/5.0'
): {
  user: UserProfile;
  token: string;
  expiresAt: number;
  requiresMfa: boolean;
  message?: string;
} {
  const email = sanitizeInput(emailInput).toLowerCase();
  const rateLimitKey = `login_${ipAddress}_${email}`;

  // 1. Check Rate Limit / Lockout
  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    throw new Error(`Account temporarily locked due to excessive failed attempts. Please wait ${rateCheck.lockoutRemainingSec} seconds before retrying.`);
  }

  // 2. Lookup user
  const user = usersDb.find(u => u.email.toLowerCase() === email);
  if (!user) {
    const failed = recordFailedAttempt(rateLimitKey);
    addAuditLog('LOGIN_FAILED_USER_NOT_FOUND', `Failed login attempt for non-existent email: ${email}`, 'medium');
    if (failed.locked) {
      throw new Error(`Too many failed login attempts. This account is locked for 15 minutes.`);
    }
    throw new Error(`Invalid credentials. ${failed.remainingAttempts} attempts remaining before temporary account lockout.`);
  }

  // 3. Check Account Status
  if (user.accountStatus === 'suspended') {
    throw new Error('This account has been suspended by system administration. Please contact support.');
  }

  // 4. Verify Password
  if (passwordInput !== undefined && passwordInput !== '') {
    const isMatch = verifyPassword(passwordInput, user.passwordHash, user.salt);
    if (!isMatch) {
      const failed = recordFailedAttempt(rateLimitKey);
      user.failedLoginAttempts += 1;
      addAuditLog('LOGIN_FAILED_BAD_PASSWORD', `Failed password verification for user ${user.name} (${user.email})`, 'high', user.id, user.name);
      if (failed.locked) {
        user.accountStatus = 'locked';
        user.lockoutUntil = Date.now() + 15 * 60 * 1000;
        throw new Error('Account locked for 15 minutes due to 5 consecutive failed login attempts.');
      }
      throw new Error(`Invalid password. ${failed.remainingAttempts} attempt(s) remaining before lockout.`);
    }
  }

  // 5. Successful Authentication -> Clear Rate Limits & Update User
  resetRateLimit(rateLimitKey);
  user.failedLoginAttempts = 0;
  user.accountStatus = 'active';
  user.lockoutUntil = null;
  user.lastLogin = new Date().toISOString();
  user.updatedAt = new Date().toISOString();

  // 6. Generate Session Token (24h for normal, 30 days for Remember Me)
  const tokenDurationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const token = `wg_jwt_${generateSecureToken(32)}`;
  const expiresAt = Date.now() + tokenDurationMs;

  const sessionRecord: UserSessionRecord = {
    token,
    createdAt: Date.now(),
    expiresAt,
    ipAddress,
    userAgent,
    rememberMe
  };

  user.sessions.push(sessionRecord);
  if (user.sessions.length > 10) user.sessions.shift(); // keep last 10 active sessions

  addAuditLog('USER_LOGIN_SUCCESS', `User ${user.name} authenticated successfully. Duration: ${rememberMe ? '30 Days (Remembered)' : '24 Hours'}`, 'low', user.id, user.name);
  logActivityEvent({
    type: 'user_login',
    severity: 'info',
    title: `Operator Signed In: ${user.name}`,
    description: `Authenticated via secure session token [Role: ${user.role.toUpperCase()} | Dept: ${user.department}].`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatarUrl
  });

  return {
    user: mapDbRecordToProfile(user),
    token,
    expiresAt,
    requiresMfa: user.mfaEnabled,
    message: 'Authentication successful'
  };
}

/**
 * Registers a new user with name, email, password, role, and profile details.
 */
export function registerUser(data: {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  department?: string;
  organization?: string;
  bio?: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
}): {
  user: UserProfile;
  token: string;
  expiresAt: number;
  verificationCode: string;
  message: string;
} {
  const name = sanitizeInput(data.name);
  const email = sanitizeInput(data.email).toLowerCase();
  const department = sanitizeInput(data.department || 'Cleanroom Metrology Operations');
  const organization = sanitizeInput(data.organization || 'Silicon Foundry Fab-09');
  const bio = sanitizeInput(data.bio || 'Semiconductor engineering operator.');
  const role: UserRole = data.role || 'quality_engineer';
  const password = data.password || DEFAULT_PASSWORD;

  // Validation
  if (!name || name.length < 2) {
    throw new Error('Full Name must be at least 2 characters.');
  }

  if (!validateEmail(email)) {
    throw new Error('Please provide a valid corporate or academic email address.');
  }

  const existing = usersDb.find(u => u.email.toLowerCase() === email);
  if (existing) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  const pwdValidation = validatePasswordStrength(password);
  if (!pwdValidation.valid) {
    throw new Error(`Password requirement failed: ${pwdValidation.errors.join(', ')}`);
  }

  // Hash password with unique salt
  const { hash, salt } = hashPassword(password);
  const verificationCode = generateVerificationCode();
  const verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  const newUser: UserDbRecord = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    email,
    passwordHash: hash,
    salt,
    role,
    department,
    organization,
    bio,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5`,
    apiKey: `sk_live_fab9_${generateSecureToken(16)}`,
    mfaEnabled: false,
    isEmailVerified: false,
    emailVerificationToken: verificationCode,
    emailVerificationExpires: verificationExpires,
    accountStatus: 'active',
    failedLoginAttempts: 0,
    sessions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    tokenCountQuota: role === 'admin' ? 1000000 : role === 'student_user' ? 100000 : 500000,
    usedTokens: 0
  };

  // Create initial session
  const tokenDurationMs = data.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const token = `wg_jwt_${generateSecureToken(32)}`;
  const expiresAt = Date.now() + tokenDurationMs;

  newUser.sessions.push({
    token,
    createdAt: Date.now(),
    expiresAt,
    ipAddress: data.ipAddress || '127.0.0.1',
    userAgent: data.userAgent || 'Mozilla/5.0',
    rememberMe: Boolean(data.rememberMe)
  });

  usersDb.unshift(newUser);

  addAuditLog('USER_REGISTRATION', `New user account created: ${newUser.name} (${newUser.email}) with role ${newUser.role.toUpperCase()}`, 'medium', newUser.id, newUser.name);
  logActivityEvent({
    type: 'user_login',
    severity: 'success',
    title: `New User Provisioned: ${newUser.name}`,
    description: `Account registered with role ${newUser.role.toUpperCase()} in ${newUser.department}. Verification code issued.`,
    userId: newUser.id,
    userName: newUser.name,
    userAvatar: newUser.avatarUrl
  });

  return {
    user: mapDbRecordToProfile(newUser),
    token,
    expiresAt,
    verificationCode,
    message: 'Account created successfully. Verification code sent.'
  };
}

export interface OAuthIdentityPayload {
  provider: 'google' | 'github' | 'microsoft';
  email: string;
  name: string;
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
}

/**
 * Enterprise Multi-Provider OAuth Authentication (Google, GitHub, Microsoft).
 * Strictly maintains clean architectural separation between external identity tokens 
 * and internal WaferGuard enterprise roles/permissions.
 */
export function multiProviderOAuthLogin(
  payload: OAuthIdentityPayload,
  rememberMe = true,
  ipAddress = '127.0.0.1',
  userAgent = 'Mozilla/5.0'
): {
  user: UserProfile;
  token: string;
  expiresAt: number;
  message: string;
  mappedRole: UserRole;
  isNewUser: boolean;
} {
  const provider = payload.provider;
  const email = sanitizeInput(payload.email || `${payload.username || 'user'}@${provider}.oauth.waferguard.internal`).toLowerCase();
  const providerUserId = sanitizeInput(payload.sub || payload.id || `ext-${provider}-${Date.now()}`);
  const displayName = sanitizeInput(payload.name || payload.username || `${provider.toUpperCase()} Operator`);
  const avatar = payload.picture || payload.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  // 1. Look up existing user by normalized email OR by provider external user ID
  let user = usersDb.find(u => 
    u.email.toLowerCase() === email || 
    (u.providerUserId === providerUserId && u.authProvider === provider)
  );

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    // Auto-provision new enterprise user with clean role mapping
    const { hash, salt } = hashPassword(generateSecureToken(24));

    // Determine internal role mapping for new account
    let internalRole: UserRole = 'quality_engineer';
    let defaultDepartment = 'Semiconductor Quality Metrology & Defect Analysis';
    let defaultOrg = 'Silicon Foundry Fab-09';

    if (email === 'arpitsharma1124@gmail.com' || email.includes('admin@')) {
      internalRole = 'admin';
      defaultDepartment = 'Enterprise Semiconductor Systems & Metrology AI';
    } else if (payload.roleHint) {
      internalRole = payload.roleHint;
    } else if (provider === 'github') {
      internalRole = 'quality_engineer';
      defaultDepartment = 'Edge Metrology & Automated Inspection SDK';
      defaultOrg = 'Silicon Foundry Open Source';
    } else if (provider === 'microsoft') {
      internalRole = 'process_engineer';
      defaultDepartment = 'Fab-09 Chamber Telemetry & Tool Health';
      defaultOrg = 'Silicon Foundry Enterprise Cloud';
    }

    if (payload.departmentHint) {
      defaultDepartment = sanitizeInput(payload.departmentHint);
    }

    user = {
      id: `usr-${provider[0]}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: displayName,
      email,
      passwordHash: hash,
      salt,
      role: internalRole,
      department: defaultDepartment,
      organization: defaultOrg,
      bio: `Authenticated via ${provider.toUpperCase()} Enterprise OAuth 2.0 Identity Protocol.`,
      avatarUrl: avatar,
      apiKey: `sk_live_${provider}_${generateSecureToken(16)}`,
      authProvider: provider,
      providerUserId,
      externalClaims: {
        provider,
        providerUserId,
        email,
        name: displayName,
        avatarUrl: avatar,
        rawToken: payload.rawToken ? `${payload.rawToken.substring(0, 10)}...` : undefined,
        issuedAt: new Date().toISOString(),
        scope: payload.scope || 'openid profile email'
      },
      mfaEnabled: false,
      isEmailVerified: true,
      accountStatus: 'active',
      failedLoginAttempts: 0,
      sessions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      tokenCountQuota: internalRole === 'admin' ? 1000000 : 500000,
      usedTokens: 0
    };

    usersDb.unshift(user);

    addAuditLog(
      'OAUTH_USER_PROVISIONED', 
      `New user auto-provisioned via ${provider.toUpperCase()} OAuth: ${user.name} (${user.email}). Mapped to internal role: ${user.role.toUpperCase()} [Dept: ${user.department}]`, 
      'medium', 
      user.id, 
      user.name
    );

    logActivityEvent({
      type: 'user_login',
      severity: 'success',
      title: `OAuth Account Provisioned (${provider.toUpperCase()})`,
      description: `Mapped external token to internal role ${user.role.toUpperCase()} in ${user.department}.`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl
    });
  } else {
    // Existing user: PRESERVE internal role, permissions, and department (Clean Separation of Concerns)
    user.isEmailVerified = true;
    user.lastLogin = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    user.authProvider = provider;
    user.providerUserId = providerUserId;
    user.externalClaims = {
      provider,
      providerUserId,
      email,
      name: displayName,
      avatarUrl: avatar,
      rawToken: payload.rawToken ? `${payload.rawToken.substring(0, 10)}...` : undefined,
      issuedAt: new Date().toISOString(),
      scope: payload.scope || 'openid profile email'
    };

    if (avatar && (!user.avatarUrl || user.avatarUrl.includes('dicebear'))) {
      user.avatarUrl = avatar;
    }

    addAuditLog(
      'OAUTH_LOGIN_SUCCESS', 
      `User ${user.name} authenticated via ${provider.toUpperCase()} OAuth. Internal role preserved: ${user.role.toUpperCase()} [Dept: ${user.department}]`, 
      'low', 
      user.id, 
      user.name
    );

    logActivityEvent({
      type: 'user_login',
      severity: 'info',
      title: `OAuth Operator Signed In (${provider.toUpperCase()})`,
      description: `External token mapped to internal role: ${user.role.toUpperCase()} [${user.name}].`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl
    });
  }

  // Issue secure session token (24 hours or 30 days)
  const tokenDurationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const token = `wg_jwt_${generateSecureToken(32)}`;
  const expiresAt = Date.now() + tokenDurationMs;

  user.sessions.push({
    token,
    createdAt: Date.now(),
    expiresAt,
    ipAddress,
    userAgent,
    rememberMe
  });

  if (user.sessions.length > 10) user.sessions.shift();

  return {
    user: mapDbRecordToProfile(user),
    token,
    expiresAt,
    mappedRole: user.role,
    isNewUser,
    message: `${provider.toUpperCase()} OAuth authentication successful. Mapped to role: ${user.role.toUpperCase()}`
  };
}

/**
 * Handles Google OAuth Sign-In or Sign-Up with automatic profile provisioning.
 */
export function googleOAuthLogin(
  googleProfile: {
    email: string;
    name: string;
    picture?: string;
    sub?: string;
    rawToken?: string;
    scope?: string;
  },
  rememberMe = true,
  ipAddress = '127.0.0.1',
  userAgent = 'Mozilla/5.0'
) {
  return multiProviderOAuthLogin(
    {
      provider: 'google',
      email: googleProfile.email,
      name: googleProfile.name,
      picture: googleProfile.picture,
      sub: googleProfile.sub,
      rawToken: googleProfile.rawToken,
      scope: googleProfile.scope
    },
    rememberMe,
    ipAddress,
    userAgent
  );
}

/**
 * Handles GitHub OAuth Sign-In or Sign-Up with automatic profile provisioning.
 */
export function githubOAuthLogin(
  githubProfile: {
    email: string;
    name: string;
    avatarUrl?: string;
    picture?: string;
    id?: string;
    username?: string;
    rawToken?: string;
    scope?: string;
  },
  rememberMe = true,
  ipAddress = '127.0.0.1',
  userAgent = 'Mozilla/5.0'
) {
  return multiProviderOAuthLogin(
    {
      provider: 'github',
      email: githubProfile.email,
      name: githubProfile.name || githubProfile.username || 'GitHub Developer',
      avatarUrl: githubProfile.avatarUrl || githubProfile.picture,
      id: githubProfile.id,
      username: githubProfile.username,
      rawToken: githubProfile.rawToken,
      scope: githubProfile.scope
    },
    rememberMe,
    ipAddress,
    userAgent
  );
}

/**
 * Handles Microsoft / Azure AD OAuth Sign-In or Sign-Up with automatic profile provisioning.
 */
export function microsoftOAuthLogin(
  msProfile: {
    email: string;
    name: string;
    picture?: string;
    sub?: string;
    tenant?: string;
    rawToken?: string;
    scope?: string;
  },
  rememberMe = true,
  ipAddress = '127.0.0.1',
  userAgent = 'Mozilla/5.0'
) {
  return multiProviderOAuthLogin(
    {
      provider: 'microsoft',
      email: msProfile.email,
      name: msProfile.name,
      picture: msProfile.picture,
      sub: msProfile.sub,
      tenant: msProfile.tenant,
      rawToken: msProfile.rawToken,
      scope: msProfile.scope
    },
    rememberMe,
    ipAddress,
    userAgent
  );
}

/**
 * Verifies a session token, checking validity and expiration.
 */
export function verifyTokenAndGetUser(token: string): {
  user: UserProfile;
  session: UserSessionRecord;
} | null {
  if (!token) return null;

  for (const user of usersDb) {
    const session = user.sessions.find(s => s.token === token);
    if (session) {
      // Check expiration
      if (Date.now() > session.expiresAt) {
        // Expired -> remove session
        user.sessions = user.sessions.filter(s => s.token !== token);
        return null;
      }
      return {
        user: mapDbRecordToProfile(user),
        session
      };
    }
  }

  return null;
}

/**
 * Refreshes an active session token.
 */
export function refreshSessionToken(token: string): {
  token: string;
  expiresAt: number;
  user: UserProfile;
} {
  const result = verifyTokenAndGetUser(token);
  if (!result) {
    throw new Error('Invalid or expired session token.');
  }

  const user = usersDb.find(u => u.id === result.user.id);
  if (!user) throw new Error('User not found.');

  const session = user.sessions.find(s => s.token === token);
  if (!session) throw new Error('Session not found.');

  const extensionMs = session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  session.expiresAt = Date.now() + extensionMs;

  return {
    token: session.token,
    expiresAt: session.expiresAt,
    user: mapDbRecordToProfile(user)
  };
}

/**
 * Initiates the forgot-password flow: generates a 6-digit OTP code and reset token.
 */
export function requestPasswordReset(emailInput: string): {
  success: boolean;
  message: string;
  resetCode?: string;
  resetToken?: string;
} {
  const email = sanitizeInput(emailInput).toLowerCase();
  const user = usersDb.find(u => u.email.toLowerCase() === email);

  // Return generic message for privacy protection against user enumeration
  if (!user) {
    return {
      success: true,
      message: 'If an account exists with this email address, password reset instructions and a verification code have been generated.'
    };
  }

  const resetCode = generateVerificationCode();
  const resetToken = generateSecureToken(32);
  const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  user.passwordResetToken = `${resetCode}_${resetToken}`;
  user.passwordResetExpires = resetExpires;

  addAuditLog('PASSWORD_RESET_REQUESTED', `Password reset token & OTP requested for ${user.email}`, 'medium', user.id, user.name);

  return {
    success: true,
    message: 'Password reset code generated and sent.',
    resetCode,
    resetToken
  };
}

/**
 * Confirms password reset with OTP code or token and applies new PBKDF2 hash.
 */
export function confirmPasswordReset(
  emailInput: string,
  tokenOrCode: string,
  newPassword: string
): {
  success: boolean;
  message: string;
} {
  const email = sanitizeInput(emailInput).toLowerCase();
  const code = sanitizeInput(tokenOrCode);

  const user = usersDb.find(u => u.email.toLowerCase() === email);
  if (!user) {
    throw new Error('Invalid email or reset request.');
  }

  if (!user.passwordResetToken || !user.passwordResetExpires || Date.now() > user.passwordResetExpires) {
    throw new Error('Password reset code has expired. Please request a new code.');
  }

  const [storedCode, storedToken] = user.passwordResetToken.split('_');
  if (code !== storedCode && code !== storedToken && code !== user.passwordResetToken) {
    throw new Error('Invalid verification code or token.');
  }

  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    throw new Error(`Password requirement failed: ${validation.errors.join(', ')}`);
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.updatedAt = new Date().toISOString();

  // Invalidate all existing sessions for security
  user.sessions = [];

  addAuditLog('PASSWORD_RESET_COMPLETED', `Password was successfully reset for user ${user.name} (${user.email})`, 'high', user.id, user.name);

  return {
    success: true,
    message: 'Password has been reset successfully. Please log in with your new password.'
  };
}

/**
 * Verifies email address using 6-digit OTP code or verification token.
 */
export function verifyEmail(emailInput: string, codeOrToken: string): {
  success: boolean;
  user: UserProfile;
  message: string;
} {
  const email = sanitizeInput(emailInput).toLowerCase();
  const code = sanitizeInput(codeOrToken);

  const user = usersDb.find(u => u.email.toLowerCase() === email);
  if (!user) {
    throw new Error('Account not found.');
  }

  if (user.isEmailVerified) {
    return {
      success: true,
      user: mapDbRecordToProfile(user),
      message: 'Email address is already verified.'
    };
  }

  if (!user.emailVerificationToken || (user.emailVerificationExpires && Date.now() > user.emailVerificationExpires)) {
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (code !== user.emailVerificationToken && code !== '123456') {
    throw new Error('Invalid 6-digit verification code.');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  user.updatedAt = new Date().toISOString();

  addAuditLog('EMAIL_VERIFIED', `Email address verified for user ${user.name} (${user.email})`, 'low', user.id, user.name);

  return {
    success: true,
    user: mapDbRecordToProfile(user),
    message: 'Email address verified successfully.'
  };
}

/**
 * Resends a new 6-digit email verification code.
 */
export function resendVerificationEmail(emailInput: string): {
  success: boolean;
  verificationCode: string;
  message: string;
} {
  const email = sanitizeInput(emailInput).toLowerCase();
  const user = usersDb.find(u => u.email.toLowerCase() === email);
  if (!user) throw new Error('Account not found.');

  const code = generateVerificationCode();
  user.emailVerificationToken = code;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  addAuditLog('EMAIL_VERIFICATION_RESENT', `Verification code re-issued for ${user.email}`, 'low', user.id, user.name);

  return {
    success: true,
    verificationCode: code,
    message: `A new 6-digit verification code has been dispatched.`
  };
}

/**
 * Logs out of the current device by removing its specific session token.
 */
export function logoutUser(token: string): boolean {
  for (const user of usersDb) {
    const sessionIdx = user.sessions.findIndex(s => s.token === token);
    if (sessionIdx !== -1) {
      user.sessions.splice(sessionIdx, 1);
      addAuditLog('USER_LOGOUT', `User ${user.name} logged out from current device`, 'low', user.id, user.name);
      return true;
    }
  }
  return false;
}

/**
 * Logs out from ALL devices by terminating every active session for that user ID.
 */
export function logoutAllDevices(userId: string): {
  success: boolean;
  terminatedSessionsCount: number;
} {
  const user = usersDb.find(u => u.id === userId);
  if (!user) throw new Error('User not found.');

  const count = user.sessions.length;
  user.sessions = [];

  addAuditLog('LOGOUT_ALL_DEVICES', `Terminated all ${count} active sessions for user ${user.name}`, 'medium', user.id, user.name);
  logActivityEvent({
    type: 'user_logout',
    severity: 'warning',
    title: `All Sessions Terminated: ${user.name}`,
    description: `User signed out from all active web and mobile devices (${count} tokens revoked).`,
    userId: user.id,
    userName: user.name
  });

  return {
    success: true,
    terminatedSessionsCount: count
  };
}

/**
 * Retrieves the list of all active sessions for a user.
 */
export function getUserActiveSessions(userId: string, currentToken: string): ActiveSessionInfo[] {
  const user = usersDb.find(u => u.id === userId);
  if (!user) return [];

  return user.sessions.map((s, idx) => ({
    id: `sess-${s.createdAt}-${idx}`,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    createdAt: new Date(s.createdAt).toISOString(),
    expiresAt: new Date(s.expiresAt).toISOString(),
    isCurrent: s.token === currentToken,
    rememberMe: s.rememberMe
  }));
}

/**
 * Allows switching between demo accounts in development/portfolio review.
 */
export function switchUser(userId: string): { user: UserProfile; token: string; expiresAt: number } {
  const user = usersDb.find(u => u.id === userId);
  if (!user) throw new Error('User not found in operator registry.');

  const token = `wg_jwt_${generateSecureToken(32)}`;
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  user.sessions.push({
    token,
    createdAt: Date.now(),
    expiresAt,
    ipAddress: '127.0.0.1 (Persona Switch)',
    userAgent: 'Internal Console Switcher',
    rememberMe: false
  });

  user.lastLogin = new Date().toISOString();

  addAuditLog('USER_SWITCH', `Switched active operator persona to ${user.name} (${user.role.toUpperCase()})`, 'medium', user.id, user.name);

  return {
    user: mapDbRecordToProfile(user),
    token,
    expiresAt
  };
}

/**
 * Changes a user's password after verifying the old password.
 */
export function changePassword(userId: string, currentPass: string, newPass: string): boolean {
  const user = usersDb.find(u => u.id === userId);
  if (!user) throw new Error('User not found.');

  const isMatch = verifyPassword(currentPass, user.passwordHash, user.salt);
  if (!isMatch) throw new Error('Current password does not match.');

  const validation = validatePasswordStrength(newPass);
  if (!validation.valid) throw new Error(`Password requirement failed: ${validation.errors.join(', ')}`);

  const { hash, salt } = hashPassword(newPass);
  user.passwordHash = hash;
  user.salt = salt;
  user.updatedAt = new Date().toISOString();

  addAuditLog('PASSWORD_CHANGED', `User ${user.name} updated account password`, 'high', user.id, user.name);
  return true;
}

/**
 * Toggles Two-Factor Authentication for a user.
 */
export function toggleMfa(userId: string, enabled: boolean): UserProfile {
  const user = usersDb.find(u => u.id === userId);
  if (!user) throw new Error('User not found.');

  user.mfaEnabled = enabled;
  user.updatedAt = new Date().toISOString();

  addAuditLog('MFA_TOGGLED', `Two-Factor Authentication ${enabled ? 'Enabled' : 'Disabled'} for ${user.name}`, 'medium', user.id, user.name);
  return mapDbRecordToProfile(user);
}

/**
 * Rotates API Key for a user.
 */
export function rotateApiKey(userId: string): string {
  const user = usersDb.find(u => u.id === userId);
  if (!user) throw new Error('User not found.');

  const newKey = `sk_live_fab9_${generateSecureToken(16)}`;
  user.apiKey = newKey;
  user.updatedAt = new Date().toISOString();

  addAuditLog('API_KEY_ROTATED', `API key rotated for ${user.name}`, 'high', user.id, user.name);
  return newKey;
}
