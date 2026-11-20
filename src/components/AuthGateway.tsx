import React, { useState, useEffect } from 'react';
import { BizzBeanBrandHeader } from './BizzBeanLogo';
import { 
  LogIn, 
  Gift, 
  Tag, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Lock, 
  Mail, 
  CheckCircle, 
  RefreshCw, 
  X, 
  FileText, 
  Globe,
  ArrowRight
} from 'lucide-react';
import { 
  signInUser, 
  registerUser, 
  sendPasswordReset, 
  formatAuthErrorMessage, 
  determineUserRole,
  resolveDisplayName,
  AuthProfileData
} from '../services/firebaseAuthService';
import SandboxWelcomeLetter from './SandboxWelcomeLetter';
import { getFile } from '../utils/idb';
import { COUNTRY_OPTIONS } from '../data/countryData';
import { validateCouponCode, redeemCouponCode } from '../services/promotionService';
import { PromotionCoupon } from '../types';
import { sendWelcomeEmail } from '../services/emailService';
import { upsertClientProfile } from '../services/transactionJournalService';
import {
  checkClientExists,
  evaluateOnboardingDecision,
  markWelcomeEmailDispatched,
} from '../services/onboardingAuditService';

export interface AuthCompletionMeta {
  mode: 'signin' | 'signup' | 'guest';
  welcomeEmailAlreadySent?: boolean;
}

interface AuthGatewayProps {
  onAuthenticated: (
    destination: 'splash' | 'dashboard' | 'bizzbot',
    userProfile?: any,
    authMeta?: AuthCompletionMeta
  ) => void;
  onClose?: () => void;
}

export default function AuthGateway({ onAuthenticated, onClose }: AuthGatewayProps) {
  const [isRegistering, setIsRegistering] = useState(() => {
    const forced = typeof window !== 'undefined' && localStorage.getItem('bizz_auth_register_mode') === 'true';
    if (forced) {
      localStorage.removeItem('bizz_auth_register_mode');
    }
    return forced;
  });

  // Registration Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+27');
  const [country, setCountry] = useState('South Africa');
  const [mobileCode, setMobileCode] = useState('+27');
  const [mobile, setMobile] = useState('');
  const [associate, setAssociate] = useState('');
  const [town, setTown] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState<'tos' | 'privacy' | 'licenses' | 'market'>('tos');

  // Promotion / Corporate Voucher Code state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<PromotionCoupon | null>(null);
  const [promoValidationMsg, setPromoValidationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-detect promo / coupon code from URL parameters (?promo=... or ?code=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryCode = params.get('promo') || params.get('code') || params.get('coupon');
      if (queryCode) {
        setIsRegistering(true);
        setPromoCodeInput(queryCode.toUpperCase());
        (async () => {
          setValidatingPromo(true);
          try {
            const res = await validateCouponCode(queryCode);
            if (res.valid && res.coupon) {
              setAppliedCoupon(res.coupon);
              setPromoValidationMsg({ type: 'success', text: res.message });
              if (res.coupon.type === 'personal_promotion') {
                setAssociate('promotion');
              } else if (res.coupon.type === 'corporate_sponsorship') {
                setAssociate(res.coupon.associate || res.coupon.corporateName || 'Corporate Sponsorship');
              }
            } else {
              setPromoValidationMsg({ type: 'error', text: res.message });
            }
          } catch (e) {
            console.error('Auto promo validation error:', e);
          } finally {
            setValidatingPromo(false);
          }
        })();
      }
    }
  }, []);

  const handleValidatePromo = async (codeToTest?: string) => {
    const code = (codeToTest || promoCodeInput).trim();
    if (!code) {
      setPromoValidationMsg({ type: 'error', text: 'Please enter a promotion or corporate coupon code.' });
      return;
    }
    setValidatingPromo(true);
    setPromoValidationMsg(null);
    try {
      const res = await validateCouponCode(code);
      if (res.valid && res.coupon) {
        setAppliedCoupon(res.coupon);
        setPromoValidationMsg({ type: 'success', text: res.message });
        if (res.coupon.type === 'personal_promotion') {
          setAssociate('promotion');
        } else if (res.coupon.type === 'corporate_sponsorship') {
          setAssociate(res.coupon.associate || res.coupon.corporateName || 'Corporate Sponsorship');
        }
      } else {
        setAppliedCoupon(null);
        setPromoValidationMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setPromoValidationMsg({ type: 'error', text: 'Error validating code. Please try again.' });
    } finally {
      setValidatingPromo(false);
    }
  };

  // Login State
  const [loginEmail, setLoginEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bizzbean_last_login_email');
      if (saved && saved !== 'quentinmac@bizzbean.com' && saved !== 'quentin@bizzbean.com') {
        return saved;
      }
    }
    return 'example@bizzbean.com';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [destination] = useState<'splash' | 'dashboard' | 'bizzbot'>('splash');
  const [signInRole, setSignInRole] = useState<'member' | 'admin'>('member');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [canQuickRegister, setCanQuickRegister] = useState(false);

  // Loading & Welcome Modal state
  const [isSimulating, setIsSimulating] = useState(false);
  const [registeredProfileForWelcome, setRegisteredProfileForWelcome] = useState<any | null>(null);

  const handleDownloadBookBundle = async () => {
    try {
      const customBundleBlob = await getFile('custom_book_bundle.zip');
      if (customBundleBlob) {
        const url = URL.createObjectURL(customBundleBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'bizzbean_getting_to_value_secured_bundle.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      const content = `============================================================
BIZZBEAN - GETTING TO VALUE & MODELING TEMPLATES
============================================================
Author: Quentin G. McCullough

In this bundle, you will explore:
1. "Getting to Value" complete operational book
2. Interactive pricing spreadsheet ledger for startup founders.
3. Overheads Cost Recovery matrix setup values.
4. Annual Planning cycle roadmaps.

Welcome to the bizzbean Sandbox environment!
`;
      const blob = new Blob([content], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bizzbean_getting_to_value_bundle.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading bundle:', err);
    }
  };

  // Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Email address is required.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    if (!country || !country.trim()) {
      alert('Country of association is mandatory. Please select your country.');
      return;
    }
    if (!acceptedTerms) {
      alert('Please accept the terms and conditions.');
      return;
    }

    setIsSimulating(true);
    
    setTimeout(async () => {

      const fullName = firstName ? `${firstName} ${lastName}`.trim() : (email.split('@')[0] || 'Jane Member');
      
      let finalPurchasedApps: string[] = [];
      let finalPurchasedCourses: string[] = [];
      let finalTokens = 0;
      let finalGoogleWalletBalance = 25.00;
      let finalAssociate = associate.trim();
      let profileNotes = associate.trim() ? `Registered via Associate: ${associate.trim()}` : 'Active bizzbean platform member and growing entrepreneur.';

      if (appliedCoupon) {
        finalPurchasedApps = [...(appliedCoupon.grantedApps || [])];
        finalPurchasedCourses = [...(appliedCoupon.grantedCourses || [])];
        finalTokens = appliedCoupon.tokenAllocation || 0;
        finalGoogleWalletBalance = 25.00 + (appliedCoupon.tokenAllocation || 0);

        if (appliedCoupon.type === 'personal_promotion') {
          finalAssociate = 'promotion';
          profileNotes = `Special Personal Promotion VIP invite. Granted Apps: ${appliedCoupon.grantedApps.join(', ') || 'Standard Suite'}. Granted Courses: ${appliedCoupon.grantedCourses.join(', ') || 'None'}. Tokens: ${appliedCoupon.tokenAllocation}.`;
        } else if (appliedCoupon.type === 'corporate_sponsorship') {
          finalAssociate = appliedCoupon.associate || appliedCoupon.corporateName || 'Corporate Sponsorship';
          profileNotes = `Corporate Sponsorship by ${appliedCoupon.corporateName || 'Corporate Partner'} (Stage 1 vi-ABILITY). Tokens: ${appliedCoupon.tokenAllocation}.`;
        }

        redeemCouponCode(appliedCoupon.code, email.trim(), fullName).catch((err) => {
          console.warn('Coupon redemption logging warning:', err);
        });
      }

      const newProfile = {
        id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'member' as const,
        isPro: true,
        purchasedApps: finalPurchasedApps,
        purchasedCourses: finalPurchasedCourses,
        tokens: finalTokens,
        googleWalletAllocation: 15,
        googleWalletBalance: finalGoogleWalletBalance,
        email: email.trim(),
        country: country.trim(),
        phone: mobile ? `${mobileCode} ${mobile}` : (country === 'United Kingdom' ? '+44 7700 900000' : '+27 82 987 6543'),
        companyName: appliedCoupon?.corporateName ? `${appliedCoupon.corporateName} (Sponsored Entrepreneur)` : 'Bizzbean Member Enterprise',
        vatNumber: country === 'South Africa' ? '4990157233' : '',
        city: town || (country === 'United Kingdom' ? 'London' : 'Johannesburg'),
        associate: finalAssociate || undefined,
        registeredAt: new Date().toISOString(),
        notes: profileNotes,
        appliedCoupon: appliedCoupon ? {
          code: appliedCoupon.code,
          type: appliedCoupon.type,
          corporateName: appliedCoupon.corporateName,
          tokenAllocation: appliedCoupon.tokenAllocation,
          grantedApps: appliedCoupon.grantedApps,
          grantedCourses: appliedCoupon.grantedCourses
        } : undefined
      };

      // Check whether this email already belongs to a registered client BEFORE upserting or sending welcome email
      const cleanRegEmail = email.trim();
      const preCheck = await checkClientExists(cleanRegEmail);
      const decision = evaluateOnboardingDecision({
        action: 'signup',
        email: cleanRegEmail,
        displayName: fullName,
        companyName: newProfile.companyName,
        clientLookup: preCheck,
      });

      try {
        localStorage.setItem('bizzbean_sandbox_registered', 'true');
        localStorage.setItem('bizzbean_sandbox_name', fullName);
        localStorage.setItem('bizzbean_sandbox_email', cleanRegEmail);
        localStorage.setItem(`bizzbean_registered_name_${cleanRegEmail.toLowerCase()}`, fullName);

        await upsertClientProfile({
          id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          companyName: newProfile.companyName,
          vatNumber: newProfile.vatNumber || undefined,
          phone: newProfile.phone,
          city: newProfile.city,
          country: newProfile.country,
          associate: newProfile.associate,
          registeredAt: preCheck.existingProfile?.registeredAt || newProfile.registeredAt,
          notes: preCheck.existingProfile?.notes || newProfile.notes,
          role: newProfile.role,
          purchasedApps: newProfile.purchasedApps,
          purchasedCourses: newProfile.purchasedCourses,
        });
      } catch (err) {
        console.error('Error logging registered sandbox profile:', err);
      }

      try {
        await registerUser(cleanRegEmail, password, fullName, newProfile);
      } catch (fbRegErr) {
        console.info('Firebase auth registration notice:', fbRegErr);
      }

      // Dispatch official "your SANDBOX is ready" welcome email ONLY for genuine brand-new clients (never duplicates/existing users)
      if (decision.shouldDispatchWelcomeEmail) {
        sendWelcomeEmail({
          recipientEmail: cleanRegEmail,
          recipientName: fullName,
          firstName: firstName.trim() || undefined,
          companyName: newProfile.companyName,
          isNewClientSignup: true,
        })
          .then((res) => {
            if (res.success && !res.suppressed) {
              markWelcomeEmailDispatched(cleanRegEmail).catch(() => {});
            }
          })
          .catch((e) => {
            console.warn('Welcome email error:', e);
          });
      }

      setTimeout(() => {
        setIsSimulating(false);
        if (decision.shouldShowWelcomeLetterModal) {
          setRegisteredProfileForWelcome(newProfile);
        } else {
          onAuthenticated(destination, newProfile, {
            mode: 'signin',
            welcomeEmailAlreadySent: true,
          });
        }
      }, 1000);
    }, 1500);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    setAuthError(null);
    setAuthSuccess(null);
    setIsSimulating(true);
    setCanQuickRegister(false);

    try {
      const { user: fbUser, profile } = await signInUser(loginEmail.trim(), loginPassword);
      localStorage.setItem('bizzbean_last_login_email', loginEmail.trim());
      setAuthSuccess(`Welcome back! Successfully signed in as ${fbUser.email}`);

      setTimeout(() => {
        setIsSimulating(false);
        // Existing client sign-in: explicitly mark mode='signin' so welcome email is NEVER dispatched
        onAuthenticated(destination, profile, {
          mode: 'signin',
          welcomeEmailAlreadySent: true,
        });
      }, 700);
    } catch (err: any) {
      console.info('Authentication note:', err?.message || err);
      const friendly = formatAuthErrorMessage(err);
      setAuthError(friendly);
      setIsSimulating(false);
      setCanQuickRegister(true);
    }
  };

  const handleContinueAsSandboxUser = () => {
    const role = determineUserRole(loginEmail);
    const resolvedName = resolveDisplayName(loginEmail);
    const profile: AuthProfileData = {
      uid: 'sandbox_' + Date.now(),
      email: loginEmail.trim() || 'founder@bizzbean.com',
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
      companyName: role === 'admin' ? 'BizzBean Admin Headquarters' : 'Apex Cloud Dynamics',
      city: role === 'admin' ? 'Cape Town' : 'Johannesburg',
    };
    onAuthenticated(destination, profile, {
      mode: 'signin',
      welcomeEmailAlreadySent: true,
    });
  };

  const handleQuickRegister = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Please enter both your email and password to create an account.');
      return;
    }
    if (loginPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    setAuthError(null);
    setAuthSuccess(null);
    setIsSimulating(true);

    try {
      const cleanEmail = loginEmail.trim();
      const defaultName = resolveDisplayName(cleanEmail);
      const preCheck = await checkClientExists(cleanEmail);
      const decision = evaluateOnboardingDecision({
        action: 'signup',
        email: cleanEmail,
        displayName: defaultName,
        clientLookup: preCheck,
      });

      const { user: fbUser, profile } = await registerUser(cleanEmail, loginPassword, defaultName);
      localStorage.setItem('bizzbean_last_login_email', cleanEmail);
      await upsertClientProfile({
        uid: fbUser.uid,
        name: profile.name,
        email: profile.email,
        companyName: profile.companyName || 'Bizzbean Member Enterprise',
        country: profile.country || 'South Africa',
        city: profile.city || 'Johannesburg',
        role: profile.role === 'admin' ? 'admin' : 'member',
        registeredAt: preCheck.existingProfile?.registeredAt || new Date().toISOString(),
        notes: preCheck.existingProfile?.notes || 'Registered via Quick Registration.',
      }).catch(() => {});

      if (decision.shouldDispatchWelcomeEmail) {
        sendWelcomeEmail({
          recipientEmail: cleanEmail,
          recipientName: profile.name,
          firstName: profile.name.split(' ')[0] || undefined,
          companyName: profile.companyName || 'Bizzbean Member Enterprise',
          isNewClientSignup: true,
        })
          .then((res) => {
            if (res.success && !res.suppressed) {
              markWelcomeEmailDispatched(cleanEmail).catch(() => {});
            }
          })
          .catch(() => {});
      }

      setAuthSuccess(`Account created successfully! Signed in as ${fbUser.email}`);

      setTimeout(() => {
        setIsSimulating(false);
        onAuthenticated(destination, profile, {
          mode: 'signup',
          welcomeEmailAlreadySent: true,
        });
      }, 700);
    } catch (regErr: any) {
      console.warn('Registration notice:', regErr?.code || regErr);
      const friendly = formatAuthErrorMessage(regErr);
      setAuthError(friendly);
      setIsSimulating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!loginEmail.trim()) {
      setAuthError('Please enter your email address above to receive password reset instructions.');
      return;
    }
    setAuthError(null);
    setAuthSuccess(null);
    setIsSimulating(true);
    try {
      await sendPasswordReset(loginEmail.trim());
      setAuthSuccess(`A password reset link has been dispatched to ${loginEmail.trim()}. Please check your email inbox.`);
    } catch (err: any) {
      console.warn('Password reset notice:', err?.code || err);
      const friendly = formatAuthErrorMessage(err);
      setAuthError(friendly);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col md:flex-row text-slate-800">
      
      <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        
        {/* Background ambient accents */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/5 rounded-full filter blur-xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-lime-500/5 rounded-full filter blur-xl pointer-events-none" />

        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 md:p-12 relative z-10">
          
          {/* Back to Live Website Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Return to Live Splash Page"
            >
              <span>←</span>
              <span>live website</span>
            </button>
          )}

          {/* Logo Element */}
          <div className="flex flex-col items-center mb-8 mt-2">
            <BizzBeanBrandHeader iconSize="w-11 h-11" textSize="text-3xl" />
          </div>

          {!isRegistering ? (
            /* ==================== SIGN IN ==================== */
            <div className="space-y-6">
              
              {/* First-Time Visitor On-Ramp Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 via-[#FAF8F5] to-emerald-50/80 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      New to Bizzbean?
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    No account or password needed. Jump straight into the live illuminated sandbox to explore freely.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onAuthenticated(
                      'splash',
                      {
                        name: '',
                        role: 'public',
                        isPro: false,
                        purchasedApps: [],
                        purchasedCourses: [],
                        googleWalletAllocation: 15,
                        googleWalletBalance: 0
                      },
                      { mode: 'guest', welcomeEmailAlreadySent: true }
                    );
                  }}
                  className="shrink-0 w-full sm:w-auto px-4 py-2.5 bg-[#12172A] hover:bg-[#1E2548] text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Enter Sandbox</span>
                  <ArrowRight size={14} className="text-[#C59B63]" />
                </button>
              </div>

              {/* Role Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-sm gap-1 mb-3 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setSignInRole('member');
                    if (loginEmail === 'admin@bizzbean.com' || loginEmail === 'quentinmac@bizzbean.com' || loginEmail === 'quentin@bizzbean.com') {
                      setLoginEmail('example@bizzbean.com');
                    }
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2 text-[11px] font-black tracking-widest uppercase rounded-sm transition-all cursor-pointer ${
                    signInRole === 'member' 
                      ? 'bg-[#5085b6] text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  client member
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSignInRole('admin');
                    if (loginEmail === 'example@bizzbean.com' || loginEmail === 'demo@bizzbean.com') {
                      setLoginEmail('admin@bizzbean.com');
                    }
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2 text-[11px] font-black tracking-widest uppercase rounded-sm transition-all cursor-pointer ${
                    signInRole === 'admin' 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-amber-700'
                  }`}
                >
                  administration
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className={`py-3 px-6 text-center text-white text-lg font-black tracking-widest lowercase rounded-sm shadow-sm select-none transition-colors duration-200 ${
                  signInRole === 'admin' ? 'bg-amber-500' : 'bg-[#5085b6]'
                }`}>
                  {signInRole === 'admin' ? 'administration log in' : 'member log in'}
                </div>

                {authError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-sm text-rose-800 text-xs flex flex-col gap-2.5 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{authError}</span>
                    </div>
                    {canQuickRegister && (
                      <div className="pt-2 border-t border-rose-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-rose-700">Account not created yet?</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleContinueAsSandboxUser}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-[10px] font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer"
                            title="Enter directly in Sandbox Mode without Firebase credentials"
                          >
                            Enter in Sandbox
                          </button>
                          <button
                            type="button"
                            onClick={handleQuickRegister}
                            disabled={isSimulating}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer"
                          >
                            Create Account
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    <span className="font-medium">{authSuccess}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Email Address
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const exampleAccount = signInRole === 'admin' ? 'admin@bizzbean.com' : 'example@bizzbean.com';
                        setLoginEmail(exampleAccount);
                        setAuthError(null);
                      }}
                      className="text-[10px] font-bold text-[#5085b6] hover:underline cursor-pointer lowercase"
                    >
                      fill: {signInRole === 'admin' ? 'admin@bizzbean.com' : 'example@bizzbean.com'}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder={signInRole === 'admin' ? "e.g. admin@bizzbean.com" : "e.g. example@bizzbean.com"}
                      className="w-full bg-[#DDebf7] border-[0.5px] border-slate-300 py-3.5 px-4 pl-10 rounded-sm focus:outline-none focus:border-[#5085b6] transition-all text-[14px] text-slate-800 font-medium"
                    />
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="enter your password"
                      className="w-full bg-[#DDebf7] border-[0.5px] border-slate-300 py-3.5 px-4 pl-10 pr-10 rounded-sm focus:outline-none focus:border-[#5085b6] transition-all text-[14px] text-slate-800 font-medium"
                    />
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-0.5">
                  <span className="text-[11px] text-slate-400 font-medium">Session auto-saved</span>
                  <button 
                    type="button" 
                    onClick={handlePasswordReset}
                    disabled={isSimulating}
                    className="text-[#5085b6] hover:underline transition-colors lowercase italic tracking-wide cursor-pointer font-medium"
                  >
                    reset password
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button 
                    type="submit"
                    disabled={isSimulating}
                    className={`w-full py-3.5 px-6 font-bold tracking-widest uppercase rounded-sm shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-white cursor-pointer ${
                      signInRole === 'admin' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#9fc754] hover:bg-[#8ab83e]'
                    } ${isSimulating ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="animate-spin text-white" size={16} />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={16} />
                        <span>Log In</span>
                      </>
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="w-full bg-[#5085b6] text-white py-3.5 px-6 font-bold tracking-widest lowercase rounded-sm shadow-md hover:bg-[#4677a5] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    create a SANDBOX account
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-black tracking-widest select-none">or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      onAuthenticated(
                        'splash',
                        {
                          name: '',
                          role: 'public',
                          isPro: false,
                          purchasedApps: [],
                          purchasedCourses: [],
                          googleWalletAllocation: 15,
                          googleWalletBalance: 0
                        },
                        { mode: 'guest', welcomeEmailAlreadySent: true }
                      );
                    }}
                    className="w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-[#5085b6] py-3.5 px-6 font-bold tracking-wider uppercase text-xs rounded-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Globe size={16} className="text-[#5085b6]" />
                    <span>Jump Straight Into Sandbox (No Account) →</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ==================== REGISTRATION ==================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
              <div className="bg-[#5085b6] py-3 px-6 text-center text-white text-lg font-black tracking-widest lowercase rounded-sm shadow-sm select-none">
                create a SANDBOX account
              </div>

              {/* Email */}
              <div className="space-y-1">
                <input 
                  type="email"
                  required
                  placeholder="email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#DDebf7] border-[0.5px] border-slate-300 py-2.5 px-4 rounded-sm focus:outline-none text-[13px] text-slate-800 font-medium"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 lowercase">password*</label>
                <input 
                  type="password"
                  required
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#DDebf7] border-[0.5px] border-slate-300 py-2.5 px-4 rounded-sm focus:outline-none text-[13px] text-slate-800 font-medium"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 lowercase">confirm password*</label>
                <input 
                  type="password"
                  required
                  placeholder="confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#DDebf7] border-[0.5px] border-slate-300 py-2.5 px-4 rounded-sm focus:outline-none text-[13px] text-slate-800 font-medium"
                />
              </div>

              {/* First Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 lowercase">first name</label>
                <input 
                  type="text"
                  placeholder="first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#DDebf7] border-[0.5px] border-slate-300 py-2.5 px-4 rounded-sm focus:outline-none text-[13px] text-slate-800 font-medium"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 lowercase">last name</label>
                <input 
                  type="text"
                  placeholder="last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#DDebf7] border-[0.5px] border-slate-300 py-2.5 px-4 rounded-sm focus:outline-none text-[13px] text-slate-800 font-medium"
                />
              </div>

              {/* Country Selection */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-600 lowercase flex items-center justify-between">
                  <span>select country <strong className="text-red-600 font-bold">*</strong></span>
                  <span className="text-[9px] text-slate-400 font-mono">mandatory</span>
                </label>
                <div className="grid grid-cols-[105px_1fr] gap-2">
                  <div className="relative bg-[#DDebf7] border-[0.5px] border-slate-300 rounded-sm">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        setCountryCode(newCode);
                        setMobileCode(newCode);
                        const matched = COUNTRY_OPTIONS.find(c => c.dialCode === newCode);
                        if (matched) setCountry(matched.name);
                      }}
                      className="w-full bg-transparent py-2.5 px-2.5 text-[13px] text-slate-800 font-medium appearance-none focus:outline-none cursor-pointer pr-6"
                    >
                      {COUNTRY_OPTIONS.map(c => (
                        <option key={c.code} value={c.dialCode}>
                          {c.flag} {c.code} {c.dialCode}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-2 top-3 text-[9px] text-slate-500 pointer-events-none">▼</span>
                  </div>
                  <div className="relative bg-[#DDebf7] border-[0.5px] border-slate-300 rounded-sm">
                    <select
                      value={country}
                      onChange={(e) => {
                        const newCountry = e.target.value;
                        setCountry(newCountry);
                        const matched = COUNTRY_OPTIONS.find(c => c.name === newCountry);
                        if (matched) {
                          setCountryCode(matched.dialCode);
                          setMobileCode(matched.dialCode);
                        }
                      }}
                      className="w-full bg-transparent py-2.5 px-3 text-[13px] text-slate-800 font-medium appearance-none focus:outline-none cursor-pointer pr-7"
                      required
                    >
                      <option value="">-- select country (required) --</option>
                      {COUNTRY_OPTIONS.map(c => (
                        <option key={c.name} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-2.5 top-3 text-[9px] text-slate-500 pointer-events-none">▼</span>
                  </div>
                </div>
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 lowercase block">code / number</label>
                <div className="grid grid-cols-[105px_1fr] gap-2">
                  <div className="relative bg-[#DDebf7] border-[0.5px] border-slate-300 rounded-sm">
                    <select
                      value={mobileCode}
                      onChange={(e) => setMobileCode(e.target.value)}
                      className="w-full bg-transparent py-2.5 px-2.5 text-[13px] text-slate-800 font-medium appearance-none focus:outline-none cursor-pointer pr-6"
                    >
                      {COUNTRY_OPTIONS.map(c => (
                        <option key={c.code} value={c.dialCode}>
                          {c.flag} {c.code} {c.dialCode}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-2 top-3 text-[9px] text-slate-500 pointer-events-none">▼</span>
                  </div>
                  <input 
                    type="tel"
                    placeholder="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-[#DDebf7] border-[0.5px] border-slate-300 py-2.5 px-4 rounded-sm focus:outline-none text-[13px] text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Promotion / Corporate Voucher Code (Optional) */}
              <div className="space-y-1.5 p-3.5 rounded-md border border-dashed border-indigo-300 bg-gradient-to-r from-indigo-50/70 to-sky-50/70">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#134063] flex items-center gap-1.5 lowercase">
                    <Gift size={13} className="text-indigo-600 shrink-0" />
                    <span>promotion / corporate voucher code (optional)</span>
                  </label>
                  {appliedCoupon && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-850 border border-emerald-300">
                      ✓ active
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <input 
                    type="text"
                    placeholder="e.g. PROMO-VIP-... or CORP-..."
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value.toUpperCase());
                      if (appliedCoupon) {
                        setAppliedCoupon(null);
                        setPromoValidationMsg(null);
                      }
                    }}
                    className="flex-1 bg-white border border-indigo-200 py-2 px-3 rounded-sm font-mono text-[12px] uppercase text-[#134063] font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={validatingPromo || !promoCodeInput.trim()}
                    onClick={() => handleValidatePromo()}
                    className="bg-[#134063] hover:bg-[#0e2a42] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-sm disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {validatingPromo ? <RefreshCw size={12} className="animate-spin" /> : <Tag size={12} />}
                    <span>verify</span>
                  </button>
                </div>

                {promoValidationMsg && (
                  <div className={`p-2 rounded text-[11px] font-medium flex items-start gap-1.5 leading-snug ${
                    promoValidationMsg.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {promoValidationMsg.type === 'success' ? (
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <X size={13} className="text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{promoValidationMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Associate */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 lowercase">associate</label>
                <input 
                  type="text"
                  placeholder="associate"
                  value={associate}
                  readOnly={appliedCoupon?.type === 'personal_promotion'}
                  onChange={(e) => setAssociate(e.target.value)}
                  className="w-full bg-[#DDebf7] border-[0.5px] border-slate-300 py-2.5 px-4 rounded-sm focus:outline-none text-[13px] font-medium"
                />
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between bg-[#9fc754] px-5 py-3.5 rounded-sm shadow-sm">
                  <span className="text-white text-[13px] font-bold">I accept the terms and conditions</span>
                  <label className="relative flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-6 h-6 bg-white rounded-full border-2 border-white flex items-center justify-center peer-checked:bg-[#9fc754] transition-all">
                      {acceptedTerms && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                  </label>
                </div>
                <div className="flex justify-end px-1">
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-[11.5px] text-[#5085b6] hover:text-[#38628b] font-bold underline cursor-pointer flex items-center gap-1"
                  >
                    <FileText size={13} />
                    read terms and conditions
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="space-y-3 pt-2">
                <button 
                  type="submit"
                  disabled={isSimulating}
                  className="w-full bg-[#5085b6] text-white py-3.5 px-6 font-bold tracking-widest lowercase rounded-sm shadow-md hover:bg-[#4677a5] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSimulating && <RefreshCw className="animate-spin text-white" size={16} />}
                  <span>{isSimulating ? 'creating account...' : 'submit'}</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="w-full bg-gray-100 text-slate-700 border border-gray-200 py-2.5 px-6 font-bold tracking-widest lowercase rounded-sm hover:bg-gray-200 transition-all text-xs cursor-pointer"
                >
                  cancel & sign in
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-[#134063] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-[#9fc754]" />
                <h3 className="text-sm font-black uppercase tracking-wider">bizzbean™ terms and conditions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider">
              {(['tos', 'privacy', 'licenses', 'market'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTermsModalTab(tab)}
                  className={`flex-1 py-3 px-2 text-center border-b-2 cursor-pointer ${
                    termsModalTab === tab
                      ? 'border-[#5085b6] text-[#134063] bg-white font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'tos' ? 'terms of service' : tab === 'privacy' ? 'privacy & popia' : tab === 'licenses' ? 'licenses' : 'disclaimers'}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-slate-700 text-xs leading-relaxed space-y-4 text-left">
              {termsModalTab === 'tos' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase">Terms of Service</h4>
                  <p>Welcome to <strong>bizzbean™</strong>. By using our services and applications (bizzcalc, bizzdynamics, bizzmodel, bizzplan, bizzcalculators), you agree to these terms.</p>
                </div>
              )}
              {termsModalTab === 'privacy' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase">Privacy Policy (POPIA / GDPR)</h4>
                  <p>We process personal data in strict compliance with South African POPIA and international standards. Your financial simulations remain strictly private.</p>
                </div>
              )}
              {termsModalTab === 'licenses' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase">Software Licenses</h4>
                  <p>All intellectual property rights in the bizzbean algorithms, formulas, and publications remain the exclusive property of bizzbean.</p>
                </div>
              )}
              {termsModalTab === 'market' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase">Market & Simulation Disclaimers</h4>
                  <p>Outputs are financial simulations to assist decision-making and do not constitute formal audited statements or guaranteed funding approvals.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
                className="bg-[#9fc754] hover:bg-[#8eb248] text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                accept & close
              </button>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Post-Registration Welcome Modal */}
      {registeredProfileForWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl my-auto">
            <SandboxWelcomeLetter 
              recipientName={registeredProfileForWelcome.name}
              promoDetails={registeredProfileForWelcome.appliedCoupon}
              onClose={() => {
                const profile = registeredProfileForWelcome;
                setRegisteredProfileForWelcome(null);
                onAuthenticated(destination, profile, {
                  mode: 'signup',
                  welcomeEmailAlreadySent: true,
                });
              }}
              onDownloadBook={handleDownloadBookBundle}
              onSignIn={() => {
                const profile = registeredProfileForWelcome;
                setRegisteredProfileForWelcome(null);
                onAuthenticated(destination, profile, {
                  mode: 'signup',
                  welcomeEmailAlreadySent: true,
                });
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
