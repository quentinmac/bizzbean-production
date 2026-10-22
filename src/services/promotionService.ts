import { PromotionCoupon } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Default static coupon catalog
const DEFAULT_COUPONS: Record<string, PromotionCoupon> = {
  'BIZZBEANVIP': {
    code: 'BIZZBEANVIP',
    type: 'personal_promotion',
    tokenAllocation: 1000,
    grantedApps: ['bizzcalc', 'bizzdynamics', 'bizzmodel'],
    grantedCourses: ['access_cap', 'cost_rec'],
    discountPercent: 100,
    description: 'Exclusive Founder VIP Access Bundle'
  },
  'PROMO2026': {
    code: 'PROMO2026',
    type: 'personal_promotion',
    tokenAllocation: 500,
    grantedApps: ['bizzcalc', 'bizzmodel'],
    grantedCourses: ['access_cap'],
    discountPercent: 100,
    description: 'Special 2026 Entrepreneur Promotion'
  },
  'CORPSPONSOR': {
    code: 'CORPSPONSOR',
    type: 'corporate_sponsorship',
    corporateName: 'Enterprise Growth Fund',
    associate: 'Enterprise Growth Fund Partner',
    tokenAllocation: 2500,
    grantedApps: ['bizzcalc', 'bizzdynamics', 'bizzmodel', 'bizzplan', 'bizzcalculators'],
    grantedCourses: ['access_cap', 'use_bizzcalc', 'cost_rec', 'annual_cycle'],
    discountPercent: 100,
    description: 'Corporate Sponsored Entrepreneur Grant'
  },
  'STARTUP': {
    code: 'STARTUP',
    type: 'personal_promotion',
    tokenAllocation: 300,
    grantedApps: ['bizzcalc'],
    grantedCourses: ['access_cap'],
    discountPercent: 100,
    description: 'Early Stage Startup Voucher'
  }
};

export interface ValidateCouponResult {
  valid: boolean;
  message: string;
  coupon?: PromotionCoupon;
}

/**
 * Validate a promotion or corporate sponsorship coupon code
 */
export async function validateCouponCode(code: string): Promise<ValidateCouponResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'Please enter a coupon code.' };
  }

  // 1. Check local static catalog first
  if (DEFAULT_COUPONS[cleanCode]) {
    const coupon = DEFAULT_COUPONS[cleanCode];
    const typeLabel = coupon.type === 'corporate_sponsorship' 
      ? `Corporate Sponsorship (${coupon.corporateName || 'Partner'})` 
      : 'Personal Promotion Voucher';
    return {
      valid: true,
      message: `Verified! ${typeLabel}: +${coupon.tokenAllocation} Runway Tokens & unlocked applications.`,
      coupon
    };
  }

  // 2. Check Firestore coupons collection if available
  try {
    const couponDocRef = doc(db, 'coupons', cleanCode);
    const snap = await getDoc(couponDocRef);
    if (snap.exists()) {
      const data = snap.data() as PromotionCoupon;
      return {
        valid: true,
        message: `Verified! Coupon applied: +${data.tokenAllocation || 0} Runway Tokens.`,
        coupon: { ...data, code: cleanCode }
      };
    }
  } catch (err) {
    console.info('Firestore coupon check skipped/offline:', err);
  }

  return {
    valid: false,
    message: 'Invalid or expired coupon code. Please verify and try again.'
  };
}

/**
 * Record coupon redemption in Firestore and local storage
 */
export async function redeemCouponCode(code: string, userEmail: string, userName: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  try {
    const redemptionRef = doc(db, 'coupon_redemptions', `${cleanCode}_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
    await setDoc(redemptionRef, {
      code: cleanCode,
      userEmail,
      userName,
      redeemedAt: new Date().toISOString()
    });
  } catch (err) {
    console.info('Coupon redemption log notice:', err);
  }
}
