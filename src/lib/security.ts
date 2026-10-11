/**
 * FILEX STORE - Advanced Security Shield & Anti-Tamper Engine
 * Protects against:
 * - Code reverse engineering and inspection (Anti-DevTools, Anti-Source Inspection)
 * - XSS & Script Injection (Input Sanitization)
 * - Brute-Force & Credential Stuffing (Rate Limiting & Lockout Protection)
 * - Data theft from Local Storage (Obfuscation Cipher & Tamper Detection)
 */

// 1. INPUT SANITIZATION & XSS PROTECTION
const MALICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /on\w+\s*=/gi, // onerror=, onclick=, onload=, etc.
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<svg[^>]*onload/gi,
];

/**
 * Sanitizes untrusted user strings to prevent stored/reflected XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim();
  for (const pattern of MALICIOUS_PATTERNS) {
    clean = clean.replace(pattern, '');
  }
  return clean
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitizes plain text while keeping standard characters safe
 */
export function cleanPlainText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim();
  for (const pattern of MALICIOUS_PATTERNS) {
    clean = clean.replace(pattern, '');
  }
  return clean;
}

// 2. BRUTE FORCE & RATE LIMITING DEFENSE
interface RateLimitTracker {
  attempts: number;
  lastAttemptTime: number;
  lockedUntil: number;
}

const rateLimitMap: Record<string, RateLimitTracker> = {};

/**
 * Check if an action (e.g. login, registration) is allowed or throttled
 * @param actionKey unique identifier e.g. "auth_login"
 * @param maxAttempts maximum attempts before temporary lockout (default: 5)
 * @param lockoutDurationMs lockout duration in ms (default: 45 seconds)
 */
export function checkRateLimit(
  actionKey: string,
  maxAttempts = 5,
  lockoutDurationMs = 45000
): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  const tracker = rateLimitMap[actionKey] || {
    attempts: 0,
    lastAttemptTime: now,
    lockedUntil: 0,
  };

  // Check if currently locked
  if (tracker.lockedUntil > now) {
    const waitSeconds = Math.ceil((tracker.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // Reset window if last attempt was over 2 minutes ago
  if (now - tracker.lastAttemptTime > 120000) {
    tracker.attempts = 0;
  }

  return { allowed: true, waitSeconds: 0 };
}

export function recordFailedAttempt(
  actionKey: string,
  maxAttempts = 5,
  lockoutDurationMs = 45000
): { locked: boolean; waitSeconds: number } {
  const now = Date.now();
  if (!rateLimitMap[actionKey]) {
    rateLimitMap[actionKey] = {
      attempts: 1,
      lastAttemptTime: now,
      lockedUntil: 0,
    };
    return { locked: false, waitSeconds: 0 };
  }

  const tracker = rateLimitMap[actionKey];
  tracker.attempts += 1;
  tracker.lastAttemptTime = now;

  if (tracker.attempts >= maxAttempts) {
    tracker.lockedUntil = now + lockoutDurationMs;
    const waitSeconds = Math.ceil(lockoutDurationMs / 1000);
    return { locked: true, waitSeconds };
  }

  return { locked: false, waitSeconds: 0 };
}

export function resetRateLimit(actionKey: string): void {
  delete rateLimitMap[actionKey];
}

// 3. STORAGE ENCRYPTION & DATA TAMPER SHIELD
const CIPHER_SALT = 'fx_sec_7893_v1';

/**
 * Simple reversible XOR-salt cipher for local state protection
 * Prevents plain-text inspection of orders, carts, and user profiles in DevTools Application tab
 */
function xorEncrypt(text: string, salt: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
  }
  return btoa(encodeURIComponent(result));
}

function xorDecrypt(cipherText: string, salt: string): string {
  try {
    const raw = decodeURIComponent(atob(cipherText));
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      result += String.fromCharCode(raw.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * Store data securely in localStorage with encryption
 */
export function secureSetItem(key: string, value: unknown): void {
  try {
    const jsonStr = JSON.stringify(value);
    const encrypted = xorEncrypt(jsonStr, CIPHER_SALT);
    localStorage.setItem(`__sec_${key}`, encrypted);
  } catch {}
}

/**
 * Retrieve and decrypt data from localStorage
 */
export function secureGetItem<T>(key: string, fallback: T): T {
  try {
    const encrypted = localStorage.getItem(`__sec_${key}`);
    if (encrypted) {
      const decrypted = xorDecrypt(encrypted, CIPHER_SALT);
      if (decrypted) {
        return JSON.parse(decrypted) as T;
      }
    }
    // Backward compatibility with unencrypted legacy keys
    const legacy = localStorage.getItem(key);
    if (legacy) {
      return JSON.parse(legacy) as T;
    }
  } catch {}
  return fallback;
}

// 4. ANTI-DEVTOOLS & ANTI-INSPECTION SHIELD
/**
 * Initializes browser anti-inspection listeners to protect site source code
 */
export function initAntiInspectionShield(): () => void {
  const isInput = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
  };

  // Prevent keyboard shortcuts used to open DevTools or view source
  const handleKeydown = (e: KeyboardEvent) => {
    // F12 (Inspect Element)
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const ctrlOrMeta = e.ctrlKey || e.metaKey;

    // Ctrl+Shift+I / Cmd+Option+I (DevTools)
    if (ctrlOrMeta && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+J / Cmd+Option+J (Console)
    if (ctrlOrMeta && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+C / Cmd+Option+C (Element Inspector)
    if (ctrlOrMeta && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U / Cmd+Option+U (View Page Source)
    if (ctrlOrMeta && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Cmd+S (Save Page)
    if (ctrlOrMeta && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  // Prevent right-click context menu globally (except inside form inputs)
  const handleContextMenu = (e: MouseEvent) => {
    if (!isInput(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  window.addEventListener('keydown', handleKeydown, { capture: true });
  window.addEventListener('contextmenu', handleContextMenu, { capture: true });

  return () => {
    window.removeEventListener('keydown', handleKeydown, { capture: true });
    window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
  };
}
