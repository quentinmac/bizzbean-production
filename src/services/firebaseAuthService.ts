import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { upsertClientProfile } from './transactionJournalService';

export interface AuthProfileData {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'public';
  isPro: boolean;
  purchasedApps: string[];
  purchasedCourses: string[];
  googleWalletAllocation: number;
  googleWalletBalance: number;
  tokens: number;
  phone?: string;
  companyName?: string;
  vatNumber?: string;
  city?: string;
  country?: string;
  associate?: string;
  registeredAt?: string;
  notes?: string;
}

export function formatAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred during authentication.';
  const code = error.code || '';
  const message = error.message || String(error);

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password, or account is not registered in Firebase Auth yet. Please verify your credentials, click Register Now, or continue in Sandbox mode.';
    case 'auth/user-not-found':
      return 'No account was found with this email address. Please check your spelling or register a new account.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in with your password.';
    case 'auth/weak-password':
      return 'The password is too weak. Please choose a password with at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to multiple failed login attempts. Please reset your password or try again shortly.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled by an administrator.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in this Firebase project. Please enable it in Firebase Console under Authentication > Sign-in method.';
    default:
      return message.replace(/^Firebase:\s*/i, '');
  }
}

/**
 * Get dynamic list of designated administrator emails
 */
export function getStoredAdminEmails(): string[] {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bizzbean_admin_emails');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((e) => String(e).toLowerCase().trim()).filter(Boolean);
        }
      }
    }
  } catch {}
  return [];
}

/**
 * Add an email address as a verified administrator
 */
export function addAdminEmail(email: string): string[] {
  try {
    if (typeof window !== 'undefined') {
      const clean = email.toLowerCase().trim();
      if (!clean) return getStoredAdminEmails();
      const current = getStoredAdminEmails();
      if (!current.includes(clean)) {
        const updated = [...current, clean];
        localStorage.setItem('bizzbean_admin_emails', JSON.stringify(updated));
        return updated;
      }
      return current;
    }
  } catch {}
  return [];
}

/**
 * Remove an email from the custom administrator list
 */
export function removeAdminEmail(email: string): string[] {
  try {
    if (typeof window !== 'undefined') {
      const clean = email.toLowerCase().trim();
      const current = getStoredAdminEmails();
      const updated = current.filter((e) => e !== clean);
      localStorage.setItem('bizzbean_admin_emails', JSON.stringify(updated));
      return updated;
    }
  } catch {}
  return [];
}

/**
 * Determine admin or member role based on email address
 */
export function determineUserRole(email: string | null | undefined): 'admin' | 'member' {
  if (!email) return 'member';
  const clean = email.trim().toLowerCase();

  // 1. Dynamic admin list
  const customAdmins = getStoredAdminEmails();
  if (customAdmins.includes(clean)) {
    return 'admin';
  }

  // 2. Client profiles with admin role in directory (check all local profile keys)
  try {
    if (typeof window !== 'undefined') {
      const profileKeys = [
        'bizzdesk_v1_client_profiles',
        'bizzbean_client_profiles',
        'bizzdesk_client_profiles',
      ];
      for (const key of profileKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const match = parsed.find((c: any) => c?.email && String(c.email).toLowerCase().trim() === clean);
          if (match && match.role === 'admin') {
            return 'admin';
          }
        }
      }
    }
  } catch {}

  // 3. Known built-in administrators & admin prefix
  if (
    clean === 'quentinmac@bizzbean.com' ||
    clean === 'quentin@bizzbean.com' ||
    clean === 'thebizzbeanchannel@gmail.com' ||
    clean.startsWith('admin@') ||
    clean.includes('quentin')
  ) {
    return 'admin';
  }
  return 'member';
}

/**
 * Intelligently resolve a clean display name from email or profile data
 */
export function resolveDisplayName(
  email: string | null | undefined, 
  currentDisplayName?: string | null
): string {
  const cleanEmail = (email || '').trim().toLowerCase();
  const trimmedName = (currentDisplayName || '').trim();

  const genericPlaceholders = [
    'bizzbean member',
    'bizzbean sandbox member',
    'new entrepreneur',
    'entrepreneur',
    'verified member',
    'guest explorer',
    'admin',
  ];

  if (trimmedName && !genericPlaceholders.includes(trimmedName.toLowerCase())) {
    return trimmedName;
  }

  // Check saved profile in localStorage (all keys)
  if (typeof window !== 'undefined') {
    try {
      const profileKeys = [
        'bizzdesk_v1_client_profiles',
        'bizzbean_client_profiles',
        'bizzdesk_client_profiles',
      ];
      for (const key of profileKeys) {
        const storedProfiles = localStorage.getItem(key);
        if (!storedProfiles) continue;
        const parsed = JSON.parse(storedProfiles);
        if (Array.isArray(parsed)) {
          const match = parsed.find((p: any) => p.email && p.email.toLowerCase().trim() === cleanEmail);
          if (match && match.name && !genericPlaceholders.includes(match.name.toLowerCase())) {
            return match.name;
          }
        }
      }
      const lastRegName = localStorage.getItem('bizzbean_registered_name_' + cleanEmail);
      if (lastRegName && !genericPlaceholders.includes(lastRegName.toLowerCase())) {
        return lastRegName;
      }
    } catch {}
  }

  // Known account holders
  if (cleanEmail.includes('quentin')) {
    return 'Quentin McCullough';
  }
  if (cleanEmail.includes('carol')) {
    return 'Carol McCullough';
  }

  // Derive from email prefix (e.g. carol.mccullough@... -> Carol McCullough)
  if (cleanEmail.includes('@')) {
    const prefix = cleanEmail.split('@')[0];
    const parts = prefix.split(/[._-]/).filter(Boolean);
    if (parts.length > 0) {
      return parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    }
  }

  return 'Entrepreneur';
}

/**
 * Sign in using Firebase Authentication
 * Automatically handles uncreated accounts by provisioning them seamlessly if needed.
 */
export async function signInUser(email: string, password: string): Promise<{ user: FirebaseUser; profile: AuthProfileData }> {
  let fbUser: FirebaseUser;
  const cleanEmail = email.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    fbUser = userCredential.user;
  } catch (error: any) {
    const code = error?.code || '';
    // If account doesn't exist yet in Firebase Auth, attempt to auto-provision if valid password
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
      if (password && password.length >= 6) {
        try {
          const newCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          fbUser = newCredential.user;
          const defaultName = resolveDisplayName(cleanEmail);
          await updateProfile(fbUser, { displayName: defaultName });
        } catch (createErr: any) {
          if (createErr?.code === 'auth/email-already-in-use') {
            const friendlyErr = new Error('Incorrect password for this account. Please verify your password or click Reset Password.');
            (friendlyErr as any).code = 'auth/wrong-password';
            throw friendlyErr;
          }
          throw error;
        }
      } else {
        const lengthErr = new Error('Password must be at least 6 characters long. Please verify your credentials or register a Sandbox account.');
        (lengthErr as any).code = 'auth/weak-password';
        throw lengthErr;
      }
    } else {
      throw error;
    }
  }

  const role = determineUserRole(fbUser.email);
  const resolvedName = resolveDisplayName(fbUser.email, fbUser.displayName);

  // If current displayName is generic or missing, update Firebase profile in background
  if (!fbUser.displayName || fbUser.displayName === 'BizzBean Member' || fbUser.displayName === 'New Entrepreneur') {
    try {
      updateProfile(fbUser, { displayName: resolvedName }).catch(() => {});
    } catch {}
  }

  const profile: AuthProfileData = {
    uid: fbUser.uid,
    email: fbUser.email || email.trim(),
    name: resolvedName,
    role: role,
    isPro: true,
    purchasedApps: [],
    purchasedCourses: role === 'admin' 
      ? ['cost-recovery-calculator', 'cost_rec', 'cost-recovery'] 
      : [],
    googleWalletAllocation: 15,
    googleWalletBalance: role === 'admin' ? 325.50 : 25.00,
    tokens: role === 'admin' ? 15000 : 500,
    phone: role === 'admin' ? '+27 82 123 4567' : '',
    companyName: role === 'admin' ? 'BizzBean Admin Headquarters' : '',
    city: role === 'admin' ? 'Cape Town' : 'Johannesburg',
  };

  // Synchronize with Firestore users collection if available and quota allows
  try {
    if (!isFirestoreQuotaExceeded()) {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        Object.assign(profile, data);
      } else {
        await setDoc(userDocRef, {
          uid: profile.uid,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          isPro: profile.isPro,
          purchasedApps: profile.purchasedApps,
          purchasedCourses: profile.purchasedCourses,
          companyName: profile.companyName || null,
          phone: profile.phone || null,
          city: profile.city || null,
          country: profile.country || 'South Africa',
          registeredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (dbErr: any) {
    if (dbErr?.code === 'resource-exhausted' || String(dbErr?.message || '').includes('quota')) {
      setFirestoreQuotaExceeded();
    }
    console.info('User Firestore profile sync notice (offline/local fallback):', dbErr);
  }

  // Ensure signed-in user is synced in the Client Profiles directory
  if (profile.email) {
    upsertClientProfile({
      uid: profile.uid,
      name: profile.name,
      email: profile.email,
      companyName: profile.companyName || undefined,
      phone: profile.phone || undefined,
      city: profile.city || undefined,
      country: profile.country || 'South Africa',
      vatNumber: profile.vatNumber || undefined,
      notes: profile.notes || undefined,
      role: profile.role === 'admin' ? 'admin' : 'member',
      associate: profile.associate || undefined,
      registeredAt: profile.registeredAt || undefined,
      purchasedApps: profile.purchasedApps,
      purchasedCourses: profile.purchasedCourses,
    }).catch(() => {});
  }

  return { user: fbUser, profile };
}

/**
 * Register a new user with Firebase Authentication
 */
export async function registerUser(
  email: string, 
  password: string, 
  displayName?: string,
  extraProfileData?: Partial<AuthProfileData>
): Promise<{ user: FirebaseUser; profile: AuthProfileData }> {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const fbUser = userCredential.user;

  const role = determineUserRole(fbUser.email);
  const finalName = resolveDisplayName(fbUser.email, displayName);

  try {
    await updateProfile(fbUser, { displayName: finalName });
  } catch {}

  const profile: AuthProfileData = {
    uid: fbUser.uid,
    email: fbUser.email || email.trim(),
    name: finalName,
    role: role,
    isPro: true,
    purchasedApps: [],
    purchasedCourses: [],
    googleWalletAllocation: 15,
    googleWalletBalance: role === 'admin' ? 325.50 : 25.00,
    tokens: role === 'admin' ? 15000 : 500,
    ...extraProfileData
  };

  const nowIso = new Date().toISOString();

  try {
    if (!isFirestoreQuotaExceeded()) {
      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(userDocRef, {
        uid: profile.uid,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        isPro: profile.isPro,
        purchasedApps: profile.purchasedApps,
        purchasedCourses: profile.purchasedCourses,
        companyName: profile.companyName || null,
        phone: profile.phone || null,
        city: profile.city || null,
        country: profile.country || 'South Africa',
        vatNumber: profile.vatNumber || null,
        associate: profile.associate || null,
        notes: profile.notes || null,
        registeredAt: profile.registeredAt || nowIso,
        updatedAt: nowIso,
      }, { merge: true });
    }
  } catch (dbErr: any) {
    if (dbErr?.code === 'resource-exhausted' || String(dbErr?.message || '').includes('quota')) {
      setFirestoreQuotaExceeded();
    }
    console.info('User Firestore creation notice (offline/local fallback):', dbErr);
  }

  // Always record newly registered client in Client Profiles + Cloud Firestore
  if (profile.email) {
    await upsertClientProfile({
      uid: profile.uid,
      name: profile.name,
      email: profile.email,
      companyName: profile.companyName || 'Bizzbean Member Enterprise',
      phone: profile.phone || undefined,
      city: profile.city || undefined,
      country: profile.country || 'South Africa',
      vatNumber: profile.vatNumber || undefined,
      associate: profile.associate || undefined,
      notes: profile.notes || 'Active bizzbean platform member and growing entrepreneur.',
      role: profile.role === 'admin' ? 'admin' : 'member',
      registeredAt: profile.registeredAt || nowIso,
      purchasedApps: profile.purchasedApps,
      purchasedCourses: profile.purchasedCourses,
    }).catch(() => {});
  }

  return { user: fbUser, profile };
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function listenToAuthChanges(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
