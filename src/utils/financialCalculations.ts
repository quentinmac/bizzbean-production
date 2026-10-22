import { FinancialModelInputs, FinancialModelOutputs } from '../types';

export function calculateFinancialModel(inputs: FinancialModelInputs): FinancialModelOutputs {
  const {
    currentMonthlyRevenue,
    expectedMonthlyGrowthRate,
    grossMarginPercentage,
    monthlyOpEx,
    currentCashReserve,
    targetRunwayMonths,
    valuationMultiple,
  } = inputs;

  const marginFraction = Math.max(0.01, Math.min(1, grossMarginPercentage / 100));
  const monthlyGrowthFraction = expectedMonthlyGrowthRate / 100;

  const monthlyGrossProfit = currentMonthlyRevenue * marginFraction;
  const currentNetCashFlow = monthlyGrossProfit - monthlyOpEx;
  const currentNetBurn = currentNetCashFlow < 0 ? Math.abs(currentNetCashFlow) : 0;

  // Simulate 36 months forward to calculate projections, break-even point, and cumulative capital burn
  let runningCash = currentCashReserve;
  let revenue = currentMonthlyRevenue;
  let breakEvenMonth: number | null = currentNetCashFlow >= 0 ? 0 : null;
  let maxCumulativeBurn = 0;
  let cumulativeBurnAtTargetRunway = 0;

  let rev12 = 0;
  let rev24 = 0;
  let rev36 = 0;

  for (let m = 1; m <= 36; m++) {
    // Compound monthly revenue
    revenue = revenue * (1 + monthlyGrowthFraction);
    const grossProfit = revenue * marginFraction;
    const netFlow = grossProfit - monthlyOpEx;

    if (breakEvenMonth === null && netFlow >= 0) {
      breakEvenMonth = m;
    }

    runningCash += netFlow;
    if (runningCash < 0) {
      const deficit = Math.abs(runningCash);
      if (deficit > maxCumulativeBurn) {
        maxCumulativeBurn = deficit;
      }
    }

    if (m <= targetRunwayMonths && runningCash < 0) {
      cumulativeBurnAtTargetRunway = Math.abs(runningCash);
    }

    if (m === 12) rev12 = Math.round(revenue);
    if (m === 24) rev24 = Math.round(revenue);
    if (m === 36) rev36 = Math.round(revenue);
  }

  // Calculate immediate runway
  let runwayMonths = 999;
  if (currentNetBurn > 0) {
    runwayMonths = Math.max(0, Number((currentCashReserve / currentNetBurn).toFixed(1)));
  }

  // Annualized Run Rate (ARR)
  const annualizedRunRate = currentMonthlyRevenue * 12;
  const estimatedValuation = annualizedRunRate * valuationMultiple;

  // Capital requirement: Needed to sustain the venture through target runway without going negative
  let capitalRequirement = 0;
  if (currentNetBurn > 0) {
    const rawTargetBurn = currentNetBurn * targetRunwayMonths;
    capitalRequirement = Math.max(0, Math.round(rawTargetBurn - currentCashReserve));
  }

  return {
    monthlyGrossProfit: Math.round(monthlyGrossProfit),
    monthlyNetBurn: Math.round(currentNetBurn),
    runwayMonths: runwayMonths > 99 ? 99 : runwayMonths,
    breakEvenMonthEstimate: breakEvenMonth,
    annualizedRunRate: Math.round(annualizedRunRate),
    estimatedValuation: Math.round(estimatedValuation),
    capitalRequirement,
    projectedRevenue12M: rev12,
    projectedRevenue24M: rev24,
    projectedRevenue36M: rev36,
  };
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  if (amount >= 1_000_000) {
    return `${currency}${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${currency}${(amount / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${currency}${amount.toLocaleString('en-US')}`;
}
