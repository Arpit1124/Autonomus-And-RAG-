import crypto from 'crypto';

// Salt length and PBKDF2 parameters for enterprise-grade cryptographic password protection
const SALT_BYTES = 16;
const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';

/**
 * Hashes a plain-text password using PBKDF2 with SHA-512 and a random cryptographically secure salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return { hash, salt };
}

/**
 * Verifies a plain-text password against a stored PBKDF2 hash using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const storedHashBuf = Buffer.from(storedHash, 'hex');
    if (hashBuf.length !== storedHashBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuf, storedHashBuf);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure random session token.
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generates a 6-digit numeric OTP code for email verification or password reset.
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sanitizes user text inputs to prevent XSS and injection attacks.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // remove direct tag injectors
    .substring(0, 500); // enforce length limit
}

/**
 * Validates RFC-5322 compliant email addresses.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim().toLowerCase());
}

/**
 * Validates password complexity and returns a strength score (0 to 4) and validation errors.
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return { valid: false, score: 0, errors: ['Password is required'] };
  }

  if (password.length >= 8) score++;
  else errors.push('Must be at least 8 characters long');

  if (/[A-Z]/.test(password)) score++;
  else errors.push('Must contain at least one uppercase letter (A-Z)');

  if (/[0-9]/.test(password)) score++;
  else errors.push('Must contain at least one numeric digit (0-9)');

  if (/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) score++;
  else errors.push('Must contain at least one special character (!@#$%^&*)');

  if (password.length >= 12) score = Math.min(4, score + 1);

  return {
    valid: errors.length === 0,
    score,
    errors
  };
}

// ----------------------------------------------------
// Rate Limiting & Account Lockout Tracker
// ----------------------------------------------------

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 minutes window

/**
 * Checks if an IP or email is currently rate-limited or locked out.
 */
export function checkRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemainingSec: number;
} {
  const record = rateLimitMap.get(key);
  const now = Date.now();

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS, lockoutRemainingSec: 0 };
  }

  // Check if locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const lockoutRemainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, lockoutRemainingSec };
  }

  // Check if window has expired
  if (now - record.firstAttemptAt > WINDOW_DURATION_MS) {
    rateLimitMap.delete(key);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS, lockoutRemainingSec: 0 };
  }

  const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return {
    allowed: remainingAttempts > 0,
    remainingAttempts,
    lockoutRemainingSec: 0
  };
}

/**
 * Records a failed authentication attempt. Automatically triggers lockout if threshold is exceeded.
 */
export function recordFailedAttempt(key: string): {
  locked: boolean;
  lockoutRemainingSec: number;
  remainingAttempts: number;
} {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_DURATION_MS) {
    record = {
      attempts: 1,
      firstAttemptAt: now
    };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimitMap.set(key, record);
    return {
      locked: true,
      lockoutRemainingSec: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      remainingAttempts: 0
    };
  }

  rateLimitMap.set(key, record);
  return {
    locked: false,
    lockoutRemainingSec: 0,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts)
  };
}

/**
 * Clears rate limiting state upon successful authentication.
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
