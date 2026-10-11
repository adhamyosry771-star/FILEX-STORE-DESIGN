import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { AuthUser, checkUserBanStatus, BanStatus, ModeratorPermissionKey } from '../types';
import { logStoreActivity } from './firebaseService';

export class AccountBannedError extends Error {
  public banStatus: BanStatus;
  constructor(banStatus: BanStatus) {
    super('تم تقييد هذا الحساب');
    this.name = 'AccountBannedError';
    this.banStatus = banStatus;
  }
}

// Default Hardcoded Admin Account Credentials
export const ADMIN_CREDENTIALS = {
  email: 'admin@filex.store',
  secondaryEmail: 'tolex907@gmail.com',
  password: 'Admin@Filex2026!',
  displayName: 'FILEX',
  role: 'admin' as const
};

const AUTH_STORAGE_KEY = 'filex_store_auth_user_v1';
const USERS_STORAGE_KEY = 'filex_registered_users_v1';

// Helper to get registered local users
const getLocalUsers = (): Record<string, AuthUser & { passwordHash?: string }> => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// Helper to save registered local users
const saveLocalUsers = (users: Record<string, AuthUser & { passwordHash?: string }>) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}
};

/**
 * Get the currently logged-in user from storage
 */
export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const user: AuthUser = JSON.parse(raw);
      if (!user || !user.email) return null;

      const lowerEmail = user.email.toLowerCase();

      // Master Admin is strictly 10000 and name is strictly FILEX
      if (
        user.role === 'admin' ||
        lowerEmail === ADMIN_CREDENTIALS.email.toLowerCase() ||
        lowerEmail === ADMIN_CREDENTIALS.secondaryEmail.toLowerCase()
      ) {
        let modified = false;
        if (user.id !== '10000') {
          user.id = '10000';
          modified = true;
        }
        if (user.displayName !== 'FILEX') {
          user.displayName = 'FILEX';
          modified = true;
        }
        if (modified) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        }
        return user;
      }

      // Customer account: ensure strictly clean sequential numeric ID (10001, 10002...)
      const isSequential = user.id && /^\d{5,}$/.test(user.id);
      if (!isSequential) {
        const localUsers = getLocalUsers();
        const known = localUsers[lowerEmail];
        if (known && known.id && /^\d{5,}$/.test(known.id)) {
          user.id = known.id;
        } else if (lowerEmail.includes('alex')) {
          user.id = '10001';
        } else if (lowerEmail.includes('tolex666')) {
          user.id = '10002';
        } else {
          let lastSeq = 10002;
          try {
            const cached = localStorage.getItem('filex_last_user_seq_id');
            if (cached) lastSeq = Math.max(10002, parseInt(cached, 10) || 10002);
          } catch {}
          const newId = String(lastSeq + 1);
          user.id = newId;
          try {
            localStorage.setItem('filex_last_user_seq_id', newId);
          } catch {}
          if (known) {
            known.id = newId;
            saveLocalUsers(localUsers);
          }
        }
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      }

      return user;
    }
  } catch {}
  return null;
}

/**
 * Set user in persistent session
 */
export function setCurrentUser(user: AuthUser | null) {
  try {
    if (user) {
      const lowerEmail = user.email?.toLowerCase() || '';
      if (
        user.role === 'admin' ||
        lowerEmail === ADMIN_CREDENTIALS.email.toLowerCase() ||
        lowerEmail === ADMIN_CREDENTIALS.secondaryEmail.toLowerCase()
      ) {
        user.id = '10000';
        user.displayName = 'FILEX';
      } else if (!user.id || !/^\d{5,}$/.test(user.id)) {
        if (lowerEmail.includes('alex')) {
          user.id = '10001';
        } else if (lowerEmail.includes('tolex666')) {
          user.id = '10002';
        } else {
          const localUsers = getLocalUsers();
          const known = localUsers[lowerEmail];
          if (known && known.id && /^\d{5,}$/.test(known.id)) {
            user.id = known.id;
          }
        }
      }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {}
}

/**
 * Login function
 */
export async function loginUser(emailInput: string, passwordInput: string): Promise<AuthUser> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  // 1. Check if it's the Admin Account
  const isAdminEmail = 
    email === ADMIN_CREDENTIALS.email.toLowerCase() || 
    email === ADMIN_CREDENTIALS.secondaryEmail.toLowerCase();

  if (isAdminEmail && password === ADMIN_CREDENTIALS.password) {
    const adminUser: AuthUser = {
      id: '10000',
      email: ADMIN_CREDENTIALS.email,
      displayName: ADMIN_CREDENTIALS.displayName,
      role: 'admin',
      vipLevel: 9,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    setCurrentUser(adminUser);
    logStoreActivity('admin_login_success', { email });
    return adminUser;
  }

  // 1.5. Instant Zero-Delay Ban Check (Prior to any network roundtrip)
  try {
    const rawBanned = localStorage.getItem('filex_banned_emails_v1');
    if (rawBanned) {
      const bannedMap = JSON.parse(rawBanned);
      const bannedRecord = bannedMap[email];
      if (bannedRecord) {
        const banStatus = checkUserBanStatus(bannedRecord);
        if (banStatus.banned) {
          logStoreActivity('banned_user_login_blocked_instant', { email, banStatus });
          throw new AccountBannedError(banStatus);
        }
      }
    }
  } catch (e) {
    if (e instanceof AccountBannedError) throw e;
  }

  const localUsers = getLocalUsers();
  const existingLocal = localUsers[email];
  if (existingLocal && existingLocal.role !== 'admin') {
    const localBanStatus = checkUserBanStatus(existingLocal);
    if (localBanStatus.banned) {
      logStoreActivity('banned_user_login_blocked_instant', { email, banStatus: localBanStatus });
      throw new AccountBannedError(localBanStatus);
    }
  }

  // 2. Try Firebase Auth (if enabled on the user's Firebase console)
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    // Check if user has role in Firestore
    let role: 'admin' | 'user' | 'moderator' = 'user';
    let isModerator = false;
    let moderatorPermissions: ModeratorPermissionKey[] = [];
    let isModeratorRevoked = false;
    let displayName = fbUser.displayName || email.split('@')[0];
    let userAppId = '';
    const nowIso = new Date().toISOString();

    let isBanned = false;
    let banDurationType = undefined;
    let bannedUntil = null;
    let banReason = undefined;
    let bannedAt = undefined;

    let sequentialId = '';
    try {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.id && /^\d{5,}$/.test(String(data.id))) {
          sequentialId = String(data.id);
        }
        if (data.role === 'admin') role = 'admin';
        else if (data.role === 'moderator' || data.isModerator) role = 'moderator';
        if (data.isModerator) isModerator = true;
        if (data.moderatorPermissions) moderatorPermissions = data.moderatorPermissions;
        if (data.isModeratorRevoked !== undefined) isModeratorRevoked = data.isModeratorRevoked;
        if (data.displayName) displayName = data.displayName;
        if (data.userAppId) userAppId = data.userAppId;
        if (data.isBanned) isBanned = data.isBanned;
        if (data.banDurationType) banDurationType = data.banDurationType;
        if (data.bannedUntil !== undefined) bannedUntil = data.bannedUntil;
        if (data.banReason) banReason = data.banReason;
        if (data.bannedAt) bannedAt = data.bannedAt;
      }
    } catch (e) {
      console.warn('Could not read user doc from Firestore:', e);
    }

    if (!sequentialId) {
      const localUsers = getLocalUsers();
      if (localUsers[email]?.id && /^\d{5,}$/.test(localUsers[email].id)) {
        sequentialId = localUsers[email].id;
        if (localUsers[email]?.role === 'moderator' || localUsers[email]?.isModerator) {
          role = 'moderator';
          isModerator = true;
          moderatorPermissions = localUsers[email]?.moderatorPermissions || [];
          isModeratorRevoked = !!localUsers[email]?.isModeratorRevoked;
        }
      } else if (email.includes('alex')) {
        sequentialId = '10001';
      } else if (email.includes('tolex666')) {
        sequentialId = '10002';
      } else {
        sequentialId = await getNextSequentialUserId();
      }
    }

    const finalUserId = role === 'admin' ? '10000' : sequentialId;

    // Update Firestore to ensure user doc always has the clean sequential ID
    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        id: finalUserId,
        email,
        displayName,
        lastSeen: serverTimestamp()
      }, { merge: true });
      await setDoc(doc(db, 'users', finalUserId), {
        id: finalUserId,
        firebaseUid: fbUser.uid,
        email,
        displayName,
        role,
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch {}

    // Check if banned
    if (role !== 'admin') {
      const banStatus = checkUserBanStatus({ isBanned, bannedUntil, banReason });
      if (banStatus.banned) {
        logStoreActivity('banned_user_login_blocked', { email, banStatus });
        throw new AccountBannedError(banStatus);
      }
    }

    const authUser: AuthUser = {
      id: finalUserId,
      email: fbUser.email || email,
      displayName,
      role,
      userAppId,
      vipLevel: role === 'admin' ? 9 : (role === 'moderator' ? 5 : 3),
      createdAt: new Date().toISOString(),
      lastSeen: nowIso,
      isBanned,
      banDurationType,
      bannedUntil,
      banReason,
      bannedAt,
      isModerator: role === 'moderator' || isModerator,
      moderatorPermissions,
      isModeratorRevoked
    };

    setCurrentUser(authUser);
    logStoreActivity('user_login_success', { uid: fbUser.uid, email, role });
    return authUser;
  } catch (fbError: any) {
    if (fbError instanceof AccountBannedError || fbError.name === 'AccountBannedError') {
      throw fbError;
    }

    // 3. Fallback to registered local accounts (ensures instant zero-friction login)
    const localUsers = getLocalUsers();
    const existing = localUsers[email];

    if (existing) {
      if (existing.passwordHash === password) {
        // Check if banned locally
        if (existing.role !== 'admin') {
          const banStatus = checkUserBanStatus(existing);
          if (banStatus.banned) {
            logStoreActivity('banned_user_login_blocked_local', { email, banStatus });
            throw new AccountBannedError(banStatus);
          }
        }

        const nowIso = new Date().toISOString();
        existing.lastSeen = nowIso;
        // Ensure plainPassword is saved
        if (!existing.plainPassword) {
          existing.plainPassword = password;
        }
        saveLocalUsers(localUsers);

        // Also touch in Firestore if possible
        try {
          if (existing.id) {
            setDoc(doc(db, 'users', existing.id), {
              lastSeen: serverTimestamp()
            }, { merge: true }).catch(() => {});
          }
        } catch {}

        const { passwordHash, ...userClean } = existing;
        setCurrentUser(userClean);
        logStoreActivity('user_login_success_local', { email, role: userClean.role });
        return userClean;
      } else {
        throw new Error('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.');
      }
    }

    // Handle standard Firebase error codes cleanly
    if (fbError.code === 'auth/invalid-credential' || fbError.code === 'auth/wrong-password') {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } else if (fbError.code === 'auth/user-not-found') {
      throw new Error('الحساب غير موجود، يرجى إنشاء حساب جديد.');
    } else if (fbError.code === 'auth/too-many-requests') {
      throw new Error('محاولات كثيرة خاطئة، يرجى الانتظار قليلاً.');
    }

    throw new Error('تعذر تسجيل الدخول. تأكد من صحة البريد وكلمة المرور.');
  }
}

/**
 * Generate next sequential user ID starting from 10000 for Admin, and 10001+ for subsequent users
 */
export async function getNextSequentialUserId(): Promise<string> {
  let highestId = 10000;

  // 1. Check local sequence cache
  try {
    const storedSeq = localStorage.getItem('filex_last_user_seq_id');
    if (storedSeq) {
      const parsed = parseInt(storedSeq, 10);
      if (!isNaN(parsed) && parsed > highestId) {
        highestId = parsed;
      }
    }
  } catch {}

  // 2. Check local registered users
  const localUsers = getLocalUsers();
  Object.values(localUsers).forEach((u) => {
    if (u && u.id) {
      const num = parseInt(u.id, 10);
      if (!isNaN(num) && num >= 10000 && num > highestId) {
        highestId = num;
      }
    }
  });

  // 3. Check Firestore users
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach((d) => {
      const data = d.data();
      const rawId = data.id || data.numericId || d.id;
      const num = parseInt(rawId, 10);
      if (!isNaN(num) && num >= 10000 && num > highestId) {
        highestId = num;
      }
    });
  } catch {}

  const nextId = highestId + 1;
  try {
    localStorage.setItem('filex_last_user_seq_id', String(nextId));
  } catch {}

  return String(nextId);
}

/**
 * Register a new customer account
 */
export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  userAppId?: string;
}): Promise<AuthUser> {
  const name = params.name.trim();
  const email = params.email.trim().toLowerCase();
  const password = params.password.trim();
  const userAppId = params.userAppId?.trim() || '';

  if (!name || name.length < 2) {
    throw new Error('يرجى إدخال اسم أو لقب صحيح (حرفين على الأقل).');
  }
  if (!email || !email.includes('@')) {
    throw new Error('يرجى إدخال بريد إلكتروني صحيح.');
  }
  if (!password || password.length < 6) {
    throw new Error('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.');
  }

  // Prevent regular users from registering as the admin master email
  if (email === ADMIN_CREDENTIALS.email.toLowerCase() || email === ADMIN_CREDENTIALS.secondaryEmail.toLowerCase()) {
    throw new Error('هذا البريد مخصص لإدارة المتجر فقط.');
  }

  // Get strictly ascending sequential ID (10001, 10002, 10003...)
  const sequentialId = await getNextSequentialUserId();
  let firebaseUid = '';

  // 1. Attempt to create in Firebase Auth
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    firebaseUid = cred.user.uid;
    try {
      await updateProfile(cred.user, { displayName: name });
    } catch {}
  } catch (fbErr: any) {
    console.warn('Firebase Auth create error, using local fallback:', fbErr.message);
    if (fbErr.code === 'auth/email-already-in-use') {
      throw new Error('هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول.');
    }
    // Continue with local registration
  }

  const nowIso = new Date().toISOString();
  const newUser: AuthUser = {
    id: sequentialId,
    email,
    displayName: name,
    role: 'user', // strictly normal user
    userAppId,
    vipLevel: 3,
    createdAt: nowIso,
    lastSeen: nowIso
  };

  // 2. Save in Firestore if accessible
  try {
    await setDoc(doc(db, 'users', sequentialId), {
      id: sequentialId,
      firebaseUid,
      displayName: name,
      email,
      role: 'user',
      userAppId,
      password: password, // Saved for Admin Dashboard inspection
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    });
    if (firebaseUid && firebaseUid !== sequentialId) {
      await setDoc(doc(db, 'users', firebaseUid), {
        id: sequentialId,
        firebaseUid,
        displayName: name,
        email,
        role: 'user',
        userAppId,
        password: password,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
  } catch (e) {
    console.warn('Could not write to Firestore users collection:', e);
  }

  // 3. Save locally in registered users database
  const localUsers = getLocalUsers();
  localUsers[email] = {
    ...newUser,
    plainPassword: password,
    passwordHash: password
  };
  saveLocalUsers(localUsers);

  // 4. Set current session
  setCurrentUser(newUser);
  logStoreActivity('user_registered', { email, name, userAppId, id: sequentialId });

  return newUser;
}

/**
 * Touch / Update user last seen timestamp
 */
export async function touchUserLastSeen(userId: string, email: string): Promise<void> {
  if (!email) return;
  const nowIso = new Date().toISOString();
  try {
    const localUsers = getLocalUsers();
    if (localUsers[email.toLowerCase()]) {
      localUsers[email.toLowerCase()].lastSeen = nowIso;
      saveLocalUsers(localUsers);
    }
    const current = getCurrentUser();
    if (current && current.email.toLowerCase() === email.toLowerCase()) {
      current.lastSeen = nowIso;
      setCurrentUser(current);
    }
  } catch {}

  try {
    if (userId) {
      await setDoc(doc(db, 'users', userId), {
        lastSeen: serverTimestamp()
      }, { merge: true });
    }
  } catch {}
}

/**
 * Ban user for 1 day, 1 week, 1 year, or permanently
 */
export async function banUser(
  userId: string,
  email: string,
  durationType: '1_day' | '1_week' | '1_month' | '1_year' | 'permanent',
  reason?: string
): Promise<{ bannedUntil: string | null; banDurationType: string }> {
  const now = Date.now();
  let bannedUntil: string | null = null;
  if (durationType === '1_day') {
    bannedUntil = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  } else if (durationType === '1_week') {
    bannedUntil = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (durationType === '1_month') {
    bannedUntil = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (durationType === '1_year') {
    bannedUntil = new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    bannedUntil = null; // permanent
  }

  const banData = {
    isBanned: true,
    banDurationType: durationType,
    bannedUntil,
    banReason: reason || 'مخالفة سياسات وشروط المتجر',
    bannedAt: new Date().toISOString()
  };

  // 1. Update in local storage
  try {
    const localUsers = getLocalUsers();
    localUsers[email.toLowerCase()] = {
      ...(localUsers[email.toLowerCase()] || {
        id: userId,
        email: email.toLowerCase(),
        displayName: email.split('@')[0],
        role: 'user',
        createdAt: new Date().toISOString()
      }),
      ...banData
    };
    saveLocalUsers(localUsers);

    // Save to dedicated instant banned map for 0ms lookup
    const rawBanned = localStorage.getItem('filex_banned_emails_v1');
    const bannedMap = rawBanned ? JSON.parse(rawBanned) : {};
    bannedMap[email.toLowerCase()] = {
      ...banData,
      email: email.toLowerCase(),
      userId
    };
    localStorage.setItem('filex_banned_emails_v1', JSON.stringify(bannedMap));
  } catch {}

  // 2. Update Firestore
  try {
    if (userId) {
      await setDoc(doc(db, 'users', userId), banData, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore banUser write:', e);
  }

  // 3. Dispatch real-time ban trigger to kick out user immediately
  try {
    const payload = JSON.stringify({
      userId,
      email: email.toLowerCase(),
      banData,
      timestamp: Date.now()
    });
    localStorage.setItem('filex_active_ban_event', payload);
    window.dispatchEvent(new CustomEvent('filex_user_banned', { detail: { userId, email: email.toLowerCase(), banData } }));
  } catch {}

  logStoreActivity('admin_banned_user', { userId, email, durationType, bannedUntil });
  return { bannedUntil, banDurationType: durationType };
}

/**
 * Unban user
 */
export async function unbanUser(userId: string, email: string): Promise<void> {
  // 1. Update local storage
  try {
    const localUsers = getLocalUsers();
    if (localUsers[email.toLowerCase()]) {
      const u = localUsers[email.toLowerCase()];
      u.isBanned = false;
      delete u.bannedUntil;
      delete u.banDurationType;
      delete u.banReason;
      delete u.bannedAt;
      saveLocalUsers(localUsers);
    }
    // Remove from instant banned map
    const rawBanned = localStorage.getItem('filex_banned_emails_v1');
    if (rawBanned) {
      const bannedMap = JSON.parse(rawBanned);
      delete bannedMap[email.toLowerCase()];
      localStorage.setItem('filex_banned_emails_v1', JSON.stringify(bannedMap));
    }
  } catch {}

  // 2. Update Firestore
  try {
    if (userId) {
      await setDoc(doc(db, 'users', userId), {
        isBanned: false,
        bannedUntil: null,
        banDurationType: null,
        banReason: null
      }, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore unbanUser write:', e);
  }

  // 3. Dispatch unban trigger
  try {
    const payload = JSON.stringify({
      userId,
      email: email.toLowerCase(),
      timestamp: Date.now()
    });
    localStorage.setItem('filex_active_unban_event', payload);
    window.dispatchEvent(new CustomEvent('filex_user_unbanned', { detail: { userId, email: email.toLowerCase() } }));
  } catch {}

  logStoreActivity('admin_unbanned_user', { userId, email });
}

/**
 * Logout function
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {}
  setCurrentUser(null);
  logStoreActivity('user_logged_out');
}

/**
 * Fetch all registered users (local and Firestore)
 */
export async function getAllRegisteredUsers(): Promise<AuthUser[]> {
  const usersMap: Record<string, AuthUser> = {};

  // 1. Add Default Master Admin (Strict ID: 10000)
  usersMap[ADMIN_CREDENTIALS.email.toLowerCase()] = {
    id: '10000',
    email: ADMIN_CREDENTIALS.email,
    displayName: ADMIN_CREDENTIALS.displayName,
    role: 'admin',
    plainPassword: ADMIN_CREDENTIALS.password,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastSeen: new Date().toISOString(),
    isBanned: false
  };

  // 2. Add local storage users
  const localUsers = getLocalUsers();
  Object.values(localUsers).forEach((u) => {
    if (u && u.email) {
      const lowerEmail = u.email.toLowerCase();
      if (
        lowerEmail === ADMIN_CREDENTIALS.email.toLowerCase() ||
        lowerEmail === ADMIN_CREDENTIALS.secondaryEmail.toLowerCase()
      ) {
        return;
      }
      usersMap[lowerEmail] = {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role || (u.isModerator ? 'moderator' : 'user'),
        plainPassword: u.plainPassword || u.passwordHash,
        createdAt: u.createdAt || new Date().toISOString(),
        lastSeen: u.lastSeen || u.createdAt || new Date().toISOString(),
        isBanned: !!u.isBanned,
        banDurationType: u.banDurationType,
        bannedUntil: u.bannedUntil,
        banReason: u.banReason,
        bannedAt: u.bannedAt,
        isModerator: !!u.isModerator || u.role === 'moderator',
        moderatorPermissions: u.moderatorPermissions || [],
        isModeratorRevoked: !!u.isModeratorRevoked
      };
    }
  });

  // 3. Add Firestore users if available
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach((d) => {
      const data = d.data();
      if (data.email) {
        const lowerEmail = data.email.toLowerCase();
        if (
          lowerEmail === ADMIN_CREDENTIALS.email.toLowerCase() ||
          lowerEmail === ADMIN_CREDENTIALS.secondaryEmail.toLowerCase()
        ) {
          return;
        }
        const firestoreCreated = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString());
        const firestoreLastSeen = data.lastSeen?.toDate ? data.lastSeen.toDate().toISOString() : (data.lastSeen || usersMap[lowerEmail]?.lastSeen || firestoreCreated);

        usersMap[lowerEmail] = {
          id: data.id || usersMap[lowerEmail]?.id || d.id,
          email: data.email,
          displayName: data.displayName || data.name || 'مستخدم',
          role: data.role || (data.isModerator ? 'moderator' : (usersMap[lowerEmail]?.role || 'user')),
          plainPassword: data.password || usersMap[lowerEmail]?.plainPassword,
          createdAt: firestoreCreated,
          lastSeen: firestoreLastSeen,
          isBanned: data.isBanned !== undefined ? data.isBanned : !!usersMap[lowerEmail]?.isBanned,
          banDurationType: data.banDurationType || usersMap[lowerEmail]?.banDurationType,
          bannedUntil: data.bannedUntil !== undefined ? data.bannedUntil : usersMap[lowerEmail]?.bannedUntil,
          banReason: data.banReason || usersMap[lowerEmail]?.banReason,
          bannedAt: data.bannedAt || usersMap[lowerEmail]?.bannedAt,
          isModerator: data.isModerator !== undefined ? data.isModerator : (usersMap[lowerEmail]?.isModerator || data.role === 'moderator'),
          moderatorPermissions: data.moderatorPermissions || usersMap[lowerEmail]?.moderatorPermissions || [],
          isModeratorRevoked: data.isModeratorRevoked !== undefined ? data.isModeratorRevoked : !!usersMap[lowerEmail]?.isModeratorRevoked
        };
      }
    });
  } catch (e) {
    console.warn('Could not read Firestore users collection:', e);
  }

  // 4. Normalize sequential IDs: 10001, 10002, 10003... in ascending order based on creation time
  const nonAdminUsers = Object.values(usersMap).filter(
    (u) =>
      u.email.toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase() &&
      u.email.toLowerCase() !== ADMIN_CREDENTIALS.secondaryEmail.toLowerCase()
  );
  nonAdminUsers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let currentSeq = 10001;
  let hasLocalUpdates = false;

  nonAdminUsers.forEach((user) => {
    const parsedId = parseInt(user.id, 10);
    if (isNaN(parsedId) || parsedId < 10001) {
      user.id = String(currentSeq);
      hasLocalUpdates = true;
      if (localUsers[user.email.toLowerCase()]) {
        localUsers[user.email.toLowerCase()].id = user.id;
      }
    } else {
      if (parsedId >= currentSeq) {
        currentSeq = parsedId;
      }
    }
    currentSeq++;
  });

  if (hasLocalUpdates) {
    saveLocalUsers(localUsers);
  }

  try {
    localStorage.setItem('filex_last_user_seq_id', String(Math.max(10000, currentSeq - 1)));
  } catch {}

  // Sync current user session ID if changed
  try {
    const current = getCurrentUser();
    if (current && current.role !== 'admin' && usersMap[current.email.toLowerCase()]) {
      const match = usersMap[current.email.toLowerCase()];
      if (match.id && current.id !== match.id) {
        current.id = match.id;
        setCurrentUser(current);
      }
    }
  } catch {}

  // Sync banned users to filex_banned_emails_v1 cache for instant 0ms lookup
  try {
    const rawBanned = localStorage.getItem('filex_banned_emails_v1');
    const bannedMap = rawBanned ? JSON.parse(rawBanned) : {};
    Object.values(usersMap).forEach((u) => {
      if (u.isBanned && u.email) {
        bannedMap[u.email.toLowerCase()] = {
          isBanned: true,
          banDurationType: u.banDurationType,
          bannedUntil: u.bannedUntil,
          banReason: u.banReason,
          bannedAt: u.bannedAt,
          userId: u.id,
          email: u.email.toLowerCase()
        };
      }
    });
    localStorage.setItem('filex_banned_emails_v1', JSON.stringify(bannedMap));
  } catch {}

  return Object.values(usersMap);
}

/**
 * Create a new moderator account with custom credentials and button permissions
 */
export async function createModeratorAccount(params: {
  email: string;
  password: string;
  displayName?: string;
  permissions: ModeratorPermissionKey[];
}): Promise<AuthUser> {
  const email = params.email.trim().toLowerCase();
  const password = params.password.trim();
  const displayName = params.displayName?.trim() || email.split('@')[0];
  const permissions = params.permissions || [];

  if (!email || !email.includes('@')) {
    throw new Error('يرجى إدخال بريد إلكتروني صحيح.');
  }
  if (!password || password.length < 4) {
    throw new Error('يرجى إدخال كلمة مرور مكونة من 4 أحرف أو أرقام على الأقل.');
  }
  if (
    email === ADMIN_CREDENTIALS.email.toLowerCase() ||
    email === ADMIN_CREDENTIALS.secondaryEmail.toLowerCase()
  ) {
    throw new Error('هذا البريد مخصص للمدير التنفيذي الرئيسي ولا يمكن تعيينه كمشرف.');
  }

  const localUsers = getLocalUsers();
  if (localUsers[email] && localUsers[email].role === 'admin') {
    throw new Error('هذا الحساب يتبع الإدارة العليا بالفعل.');
  }

  // Get sequential numeric ID for this user so they appear cleanly in the users list
  const existingId = localUsers[email]?.id;
  const sequentialId = existingId && /^\d{5,}$/.test(existingId)
    ? existingId
    : await getNextSequentialUserId();

  const nowIso = new Date().toISOString();
  const newModerator: AuthUser = {
    id: sequentialId,
    email,
    displayName,
    role: 'moderator',
    vipLevel: 5,
    plainPassword: password,
    createdAt: localUsers[email]?.createdAt || nowIso,
    lastSeen: nowIso,
    isBanned: false,
    isModerator: true,
    moderatorPermissions: permissions,
    isModeratorRevoked: false
  };

  // 1. Save in local registered users database
  localUsers[email] = {
    ...newModerator,
    plainPassword: password,
    passwordHash: password
  };
  saveLocalUsers(localUsers);

  // 2. Save in Firestore users collection
  try {
    await setDoc(doc(db, 'users', sequentialId), {
      id: sequentialId,
      email,
      displayName,
      role: 'moderator',
      isModerator: true,
      moderatorPermissions: permissions,
      isModeratorRevoked: false,
      password: password,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('Could not write moderator to Firestore:', e);
  }

  // Also try to create in Firebase Auth if available, without breaking if it fails
  try {
    await createUserWithEmailAndPassword(auth, email, password).catch(() => {});
  } catch {}

  logStoreActivity('admin_created_moderator', {
    email,
    id: sequentialId,
    permissionsCount: permissions.length,
    permissions
  });

  return newModerator;
}

/**
 * Update moderator permissions, status, or password
 */
export async function updateModeratorAccount(params: {
  email: string;
  permissions?: ModeratorPermissionKey[];
  isModeratorRevoked?: boolean;
  newPassword?: string;
  displayName?: string;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  const localUsers = getLocalUsers();
  const existing = localUsers[email];
  if (!existing) {
    throw new Error('حساب المشرف غير موجود.');
  }

  if (params.permissions !== undefined) {
    existing.moderatorPermissions = params.permissions;
  }
  if (params.isModeratorRevoked !== undefined) {
    existing.isModeratorRevoked = params.isModeratorRevoked;
  }
  if (params.newPassword && params.newPassword.trim().length >= 4) {
    existing.plainPassword = params.newPassword.trim();
    existing.passwordHash = params.newPassword.trim();
  }
  if (params.displayName && params.displayName.trim()) {
    existing.displayName = params.displayName.trim();
  }

  saveLocalUsers(localUsers);

  // Update in Firestore
  try {
    const updatePayload: Record<string, any> = {};
    if (params.permissions !== undefined) updatePayload.moderatorPermissions = params.permissions;
    if (params.isModeratorRevoked !== undefined) updatePayload.isModeratorRevoked = params.isModeratorRevoked;
    if (params.newPassword) updatePayload.password = params.newPassword.trim();
    if (params.displayName) updatePayload.displayName = params.displayName.trim();

    if (existing.id) {
      await setDoc(doc(db, 'users', existing.id), updatePayload, { merge: true });
    }
  } catch (e) {
    console.warn('Could not update moderator in Firestore:', e);
  }

  // If the updated moderator is the currently logged in session, update session immediately
  const current = getCurrentUser();
  if (current && current.email.toLowerCase() === email) {
    if (params.permissions !== undefined) current.moderatorPermissions = params.permissions;
    if (params.isModeratorRevoked !== undefined) current.isModeratorRevoked = params.isModeratorRevoked;
    if (params.displayName) current.displayName = params.displayName;
    setCurrentUser(current);
  }

  // Dispatch custom event for real-time reactivity
  try {
    window.dispatchEvent(new CustomEvent('filex_moderator_updated', {
      detail: { email, permissions: params.permissions, isRevoked: params.isModeratorRevoked }
    }));
  } catch {}

  logStoreActivity('admin_updated_moderator', {
    email,
    permissions: params.permissions,
    isRevoked: params.isModeratorRevoked
  });
}

/**
 * Delete moderator or revoke moderator status (converts to normal user or removes)
 */
export async function deleteModeratorAccount(emailInput: string, removeUserEntirely: boolean = false): Promise<void> {
  const email = emailInput.trim().toLowerCase();
  const localUsers = getLocalUsers();
  const existing = localUsers[email];
  if (!existing) return;

  if (removeUserEntirely) {
    delete localUsers[email];
    saveLocalUsers(localUsers);
    try {
      const { deleteDoc } = await import('firebase/firestore');
      if (existing.id) {
        await deleteDoc(doc(db, 'users', existing.id));
      }
    } catch {}
  } else {
    // Revert to standard user role and clear moderator permissions
    existing.role = 'user';
    existing.isModerator = false;
    existing.moderatorPermissions = [];
    existing.isModeratorRevoked = true;
    saveLocalUsers(localUsers);

    try {
      if (existing.id) {
        await setDoc(doc(db, 'users', existing.id), {
          role: 'user',
          isModerator: false,
          moderatorPermissions: [],
          isModeratorRevoked: true
        }, { merge: true });
      }
    } catch {}
  }

  logStoreActivity('admin_deleted_moderator', { email, removeUserEntirely });
}
