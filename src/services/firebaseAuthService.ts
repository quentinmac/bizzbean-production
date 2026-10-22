import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
 * Determine admin or member role based on email address
 */
export function determineUserRole(email: string | null | undefined): 'admin' | 'member' {
  if (!email) return 'member';
  const clean = email.trim().toLowerCase();
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
          const assignedRole = determineUserRole(fbUser.email);
          const defaultName = assignedRole === 'admin' ? 'Quentin McCullough' : 'BizzBean Member';
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

  const profile: AuthProfileData = {
    uid: fbUser.uid,
    email: fbUser.email || email.trim(),
    name: fbUser.displayName || (role === 'admin' ? 'Quentin McCullough' : 'BizzBean Member'),
    role: role,
    isPro: true,
    purchasedApps: role === 'admin' 
      ? [
          'bizzcalc',
          'bizzdynamics',
          'bizzmodel',
          'bizzplan',
          'bizzcalculators',
          'hl_forecast',
          'buy_up_hi_level_forecast',
          'buy_up_bizzdynamics',
          'buy_up_bizzmodel',
          'bizzbudget',
          'bizzoptimizer',
          'bizzvaluation',
          'bizzbot',
          'bizzy'
        ]
      : [],
    purchasedCourses: role === 'admin' 
      ? [
          'access_cap',
          'use_bizzcalc',
          'cost_rec',
          'annual_cycle',
          'fin_rep',
          'first_hire',
          'raise_cap',
          'lead_turn',
          'sustain_biz',
          'val_bus',
          'equity_split',
          'follow_money'
        ] 
      : [],
    googleWalletAllocation: 15,
    googleWalletBalance: role === 'admin' ? 325.50 : 25.00,
    tokens: role === 'admin' ? 15000 : 500,
    phone: role === 'admin' ? '+27 82 123 4567' : '',
    companyName: role === 'admin' ? 'BizzBean Admin Headquarters' : '',
    city: role === 'admin' ? 'Cape Town' : 'Johannesburg',
  };

  // Synchronize with Firestore users collection if available
  try {
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
        updatedAt: new Date().toISOString()
      });
    }
  } catch (dbErr) {
    console.info('User Firestore profile sync notice (offline/local fallback):', dbErr);
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
  const finalName = displayName?.trim() || (role === 'admin' ? 'Quentin McCullough' : 'New Entrepreneur');

  try {
    await updateProfile(fbUser, { displayName: finalName });
  } catch {}

  const profile: AuthProfileData = {
    uid: fbUser.uid,
    email: fbUser.email || email.trim(),
    name: finalName,
    role: role,
    isPro: true,
    purchasedApps: role === 'admin' 
      ? ['bizzcalc', 'bizzdynamics', 'bizzmodel', 'bizzplan', 'bizzcalculators']
      : [],
    purchasedCourses: role === 'admin' 
      ? ['access_cap', 'use_bizzcalc', 'cost_rec', 'annual_cycle', 'fin_rep', 'first_hire']
      : [],
    googleWalletAllocation: 15,
    googleWalletBalance: role === 'admin' ? 325.50 : 25.00,
    tokens: role === 'admin' ? 15000 : 500,
    ...extraProfileData
  };

  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    await setDoc(userDocRef, {
      uid: profile.uid,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      isPro: profile.isPro,
      purchasedApps: profile.purchasedApps,
      purchasedCourses: profile.purchasedCourses,
      updatedAt: new Date().toISOString()
    });
  } catch (dbErr) {
    console.info('User Firestore creation notice (offline/local fallback):', dbErr);
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
