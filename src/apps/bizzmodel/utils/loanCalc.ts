/**
 * Term Loan & Amortization Engine (V1 Reference & Mathematical Core)
 * Calculates monthly interest, capital repayment (principal), and loan balance curves.
 * Directly maps to COA Liability: 4-8-1-30 (term loans) and Expense: 2-7-1-x (interest paid).
 */

export interface TermLoan {
  advanceMonth: number;
  advanceValue: number;
  advanceRate: number; // annual rate in percent, e.g., 10.5 for 10.5%
  termYears: number;
  name?: string;
  coaLiabilityCode?: string; // e.g. "4-8-1-30"
  coaInterestCode?: string;  // e.g. "2-7-1-1"
}

export interface LoanMetrics {
  balance: number;
  repayment: number;
  interest: number;
}

export interface LoanScheduleEntry {
  month: number;
  openingBalance: number;
  payment: number;
  principal: number;
  interest: number;
  closingBalance: number;
}

/**
 * Calculates term loan metrics for a specific month m.
 * Uses standard annuity actuarial formula (PMT) with compound monthly rates.
 */
export function calculateTermLoanMetrics(tl: TermLoan, m: number): LoanMetrics {
  const advanceMonth = tl.advanceMonth || 1;
  const advanceValue = tl.advanceValue || 0;
  const advanceRate = tl.advanceRate || 0;
  const termYears = tl.termYears || 5;

  const totalRepayMonths = Math.round(termYears * 12);
  const r = (advanceRate / 100) / 12;

  // Before advance month
  if (m < advanceMonth) {
    return { balance: 0, repayment: 0, interest: 0 };
  }

  const paymentIndex = m - advanceMonth + 1;

  // Fully repaid
  if (paymentIndex > totalRepayMonths) {
    return { balance: 0, repayment: 0, interest: 0 };
  }

  // Calculate PMT (constant monthly payment)
  let pmt = 0;
  if (r === 0) {
    pmt = advanceValue / totalRepayMonths;
  } else {
    pmt = (advanceValue * r) / (1 - Math.pow(1 + r, -totalRepayMonths));
  }

  // Calculate starting balance of current month
  let startingBalance = advanceValue;
  if (paymentIndex > 1) {
    const tMinus1 = paymentIndex - 1;
    if (r === 0) {
      startingBalance = advanceValue - (advanceValue / totalRepayMonths) * tMinus1;
    } else {
      startingBalance = advanceValue * Math.pow(1 + r, tMinus1) - pmt * ((Math.pow(1 + r, tMinus1) - 1) / r);
    }
  }

  const interest = startingBalance * r;
  let repayment = 0;
  let balance = 0;

  if (paymentIndex === totalRepayMonths) {
    repayment = startingBalance;
    balance = 0;
  } else {
    repayment = pmt - interest;
    balance = Math.max(0, startingBalance - repayment);
  }

  return { balance, repayment, interest };
}

/**
 * Full multi-year schedule generator for term loan amortization
 */
export function calculateLoanSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  startMonth: number = 1
): LoanScheduleEntry[] {
  if (principal <= 0 || termMonths <= 0) return [];

  const tl: TermLoan = {
    advanceMonth: startMonth,
    advanceValue: principal,
    advanceRate: annualRatePct,
    termYears: termMonths / 12,
  };

  const schedule: LoanScheduleEntry[] = [];
  let prevBalance = principal;

  for (let m = startMonth; m < startMonth + termMonths; m++) {
    const metrics = calculateTermLoanMetrics(tl, m);
    schedule.push({
      month: m,
      openingBalance: Math.round(prevBalance),
      payment: Math.round(metrics.repayment + metrics.interest),
      principal: Math.round(metrics.repayment),
      interest: Math.round(metrics.interest),
      closingBalance: Math.round(metrics.balance),
    });
    prevBalance = metrics.balance;
  }

  return schedule;
}
