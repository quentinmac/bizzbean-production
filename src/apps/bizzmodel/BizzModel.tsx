import React, { useState, useEffect, useCallback } from 'react';
import { BizzModelLayout } from './BizzModelLayout';
import {
  DEFAULT_BUSINESS_STATE,
  BizzModelState,
  createDefaultRollingForecastState,
} from './constants';
import { SetupStep } from './steps/SetupStep';
import { HiLevelActualsStep } from './steps/HiLevelActualsStep';
import { RevenueStep } from './steps/RevenueStep';
import { EmploymentStep } from './steps/EmploymentStep';
import { OperatingExpensesStep } from './steps/OperatingExpensesStep';
import { FixedAssetsStep } from './steps/FixedAssetsStep';
import { FundingStep } from './steps/FundingStep';
import { ReportsStep } from './steps/ReportsStep';
import { HighLevelForecast } from './components/HighLevelForecast';
import { BizzPlan } from '../bizzplan/BizzPlan';
import PitchDeckStudio from '../bizzplan/components/PitchDeckStudio';
import { BizzCalc } from '../bizzcalc/BizzCalc';
import { BizzDynamics } from '../bizzdynamics/BizzDynamics';
import { BizzModelData } from '../../types';
import { STANDARD_ASSET_CATEGORIES } from './constants';

export function sanitizeBizzModelData(raw: any): BizzModelData {
  if (!raw || typeof raw !== 'object') {
    return sanitizeBizzModelData(DEFAULT_BUSINESS_STATE);
  }

  // Already a V1 BizzModelData shape
  if ((raw.company || raw.setup) && raw.revenue && raw.employment && !raw.businessDetails) {
    const bankRate = Number(raw.company?.assumptions?.bankInterestRate ?? raw.setup?.interestRates?.positiveBase ?? 4.5);
    const odRate = Number(raw.company?.assumptions?.overdraftInterestRate ?? raw.setup?.interestRates?.negativeBase ?? 11.75);
    const vatRate = Number(raw.company?.assumptions?.vatRate ?? raw.setup?.vatRate?.base ?? 15);
    const taxRate = Number(raw.company?.assumptions?.taxRate ?? raw.setup?.taxRate?.base ?? 28);
    const startDate = raw.company?.startDate || raw.setup?.startMonth || '2026-01-01';
    const workingDays = Array.isArray(raw.company?.workingDays)
      ? raw.company.workingDays
      : Array.isArray(raw.setup?.daysWorked?.days)
      ? raw.setup.daysWorked.days
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const holidays = Array.isArray(raw.company?.holidays)
      ? raw.company.holidays
      : Array.isArray(raw.setup?.daysWorked?.holidays)
      ? raw.setup.daysWorked.holidays
      : [];
    const invArr = Array.isArray(raw.workingCapital?.inventoryDays) ? raw.workingCapital.inventoryDays : new Array(60).fill(0);
    const debArr = Array.isArray(raw.workingCapital?.debtorsDays) ? raw.workingCapital.debtorsDays : new Array(60).fill(0);
    const credArr = Array.isArray(raw.workingCapital?.creditorsDays) ? raw.workingCapital.creditorsDays : new Array(60).fill(0);

    return {
      ...raw,
      company: {
        name: raw.company?.name || raw.setup?.businessName || '',
        startDate,
        workingDays,
        holidays,
        assumptions: {
          bankInterestRate: bankRate,
          overdraftInterestRate: odRate,
          vatRate,
          taxRate,
        },
        assetCategories: raw.company?.assetCategories || {},
      },
      setup: raw.setup || {
        businessName: raw.company?.name || '',
        businessType: '',
        startMonth: startDate,
        daysWorked: { days: workingDays, holidays },
        interestRates: {
          positiveBase: bankRate,
          positiveAdjustments: [0, 0, 0, 0, 0],
          negativeBase: odRate,
          negativeAdjustments: [0, 0, 0, 0, 0],
        },
        vatRate: { base: vatRate, adjustments: [0, 0, 0, 0, 0] },
        taxRate: { base: taxRate, adjustments: [0, 0, 0, 0, 0] },
      },
      revenue: {
        productCategories: Array.isArray(raw.revenue?.productCategories) ? raw.revenue.productCategories : [],
      },
      employment: {
        staff: Array.isArray(raw.employment?.staff) ? raw.employment.staff : [],
      },
      fixedAssets: {
        categories: Array.isArray(raw.fixedAssets?.categories)
          ? raw.fixedAssets.categories
          : STANDARD_ASSET_CATEGORIES.map((c) => ({ name: c.name, depreciationRate: c.depreciationRate })),
        assets: Array.isArray(raw.fixedAssets?.assets) ? raw.fixedAssets.assets : [],
      },
      workingCapital: {
        inventoryDays: invArr,
        debtorsDays: debArr,
        creditorsDays: credArr,
      },
      funding: raw.funding || {
        workingCapital: {
          inventoryDays: { base: invArr[0] || 0, annualAdjustments: [0, 0, 0, 0, 0] },
          receivableDays: { base: debArr[0] || 0, annualAdjustments: [0, 0, 0, 0, 0] },
          payableDays: { base: credArr[0] || 0, annualAdjustments: [0, 0, 0, 0, 0] },
        },
      },
      _v2State: raw._v2State,
    };
  }

  // V2 BizzModelState bridge
  const details = raw.businessDetails || {};
  const workingDaysObj = details.workingDays || {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  };
  const dayMap: Record<string, string> = {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  };
  const workingDays = Object.entries(dayMap)
    .filter(([k]) => Boolean(workingDaysObj[k]))
    .map(([, label]) => label);

  const setupAssumptions = Array.isArray(details.setupAssumptions) ? details.setupAssumptions : [];
  const getAssumptionRate = (id: string, fallback: number) => {
    const found = setupAssumptions.find((a: any) => a.id === id);
    return found && typeof found.baseRate === 'number' ? found.baseRate : fallback;
  };

  const bankRate = getAssumptionRate('interest-pos', 4.5);
  const odRate = getAssumptionRate('interest-neg', 11.75);
  const vatRate = getAssumptionRate('vat-rate', 15);
  const taxRate = getAssumptionRate('tax-rate', 28);

  const assetCatSource = Array.isArray(raw.assetCategories) && raw.assetCategories.length > 0
    ? raw.assetCategories
    : STANDARD_ASSET_CATEGORIES;
  const assetCategories: Record<string, number> = {};
  const assetCatArray = assetCatSource.map((cat: any) => ({
    name: cat?.name || '',
    depreciationRate: Number(cat?.depreciationRate ?? 20),
  }));
  assetCatSource.forEach((cat: any) => {
    if (cat?.name) {
      const lower = cat.name.toLowerCase();
      assetCategories[lower] = Number(cat.depreciationRate ?? 20);
      if (lower === 'plat and equipment') assetCategories['plant & equipment'] = Number(cat.depreciationRate ?? 16.67);
      if (lower === 'furniture and fittings') assetCategories['furniture & fittings'] = Number(cat.depreciationRate ?? 16.67);
    }
  });

  const startDate =
    details.startDateFormatted
      ? (details.startDateFormatted.length === 7 ? `${details.startDateFormatted}-01` : details.startDateFormatted)
      : details.startDateYear
      ? `${details.startDateYear}-01-01`
      : '2026-11-01';

  const revItems = Array.isArray(raw.revenueItems) ? raw.revenueItems : [];
  const empItems = Array.isArray(raw.employmentItems) ? raw.employmentItems : [];
  const faItems = Array.isArray(raw.fixedAssets) ? raw.fixedAssets : [];
  const funding = raw.funding || {};
  const holidays = Array.isArray(details.holidaysDeducted)
    ? details.holidaysDeducted.map((h: any) => ({ ...h, recurring: h.recurring ?? true }))
    : [];
  const invArr = Array.isArray(funding.inventoryDaysMonthly)
    ? funding.inventoryDaysMonthly
    : new Array(60).fill(Number(funding.inventoryDays ?? 0));
  const debArr = Array.isArray(funding.debtorDaysMonthly)
    ? funding.debtorDaysMonthly
    : new Array(60).fill(Number(funding.debtorDays ?? 0));
  const credArr = Array.isArray(funding.creditorDaysMonthly)
    ? funding.creditorDaysMonthly
    : new Array(60).fill(Number(funding.creditorDays ?? 0));

  return {
    company: {
      name: details.businessName || '',
      startDate,
      workingDays,
      holidays,
      assumptions: {
        bankInterestRate: bankRate,
        overdraftInterestRate: odRate,
        vatRate,
        taxRate,
      },
      assetCategories,
    },
    setup: {
      businessName: details.businessName || '',
      businessType: details.businessType || '',
      startMonth: startDate,
      daysWorked: {
        days: workingDays,
        holidays,
      },
      interestRates: {
        positiveBase: bankRate,
        positiveAdjustments: [0, 0, 0, 0, 0],
        negativeBase: odRate,
        negativeAdjustments: [0, 0, 0, 0, 0],
      },
      vatRate: { base: vatRate, adjustments: [0, 0, 0, 0, 0] },
      taxRate: { base: taxRate, adjustments: [0, 0, 0, 0, 0] },
    },
    revenue: {
      productCategories: revItems.map((item: any) => {
        const unitPrice = Number(item.unitPrice || 0);
        const unitSales = Number(item.monthlyUnits?.[0] ?? 0);
        return {
          name: item.name || item.category || 'Product',
          pricePerUnit: unitPrice,
          unitSales,
          baseValueSales: unitPrice * unitSales,
          dailyVolume: Number(item.dailyUnitSalesMonthly?.[0] ?? 0),
        };
      }),
    },
    employment: {
      staff: empItems.map((s: any) => ({
        name: s.title,
        title: s.title,
        count: [Number(s.numEmployees || 0)],
        monthlyCost: Number(s.baseRateMonthly || 0),
      })),
    },
    fixedAssets: {
      categories: assetCatArray,
      assets: faItems.map((a: any) => ({
        name: a.name,
        purchaseValue: Number(a.purchaseValue ?? a.purchaseCost ?? ((a.unitCost || 0) * (a.quantity || 1))),
      })),
    },
    workingCapital: {
      inventoryDays: invArr,
      debtorsDays: debArr,
      creditorsDays: credArr,
    },
    funding: {
      workingCapital: {
        inventoryDays: { base: invArr[0] || 0, annualAdjustments: [0, 0, 0, 0, 0] },
        receivableDays: { base: debArr[0] || 0, annualAdjustments: [0, 0, 0, 0, 0] },
        payableDays: { base: credArr[0] || 0, annualAdjustments: [0, 0, 0, 0, 0] },
      },
    },
    _v2State: raw,
  };
}

const STEP_TO_BIZZPLAN_SECTION: Record<string, string> = {
  setup: 'formation',
  revenue: 'products',
  employment: 'employees',
  opex: 'infrastructure',
  'fixed-assets': 'systems',
  funding: 'assumptions',
  reports: 'financial_reports',
};

const STEP_DISPLAY_LABELS: Record<string, string> = {
  setup: 'business details',
  revenue: 'revenue calculator',
  employment: 'employment',
  opex: 'operating expenses',
  'fixed-assets': 'fixed assets',
  funding: 'funding calculator',
  reports: 'reports',
};

export interface BizzModelProps {
  theme?: 'light' | 'dark';
  mode?: 'bizzdynamics' | 'rolling-forecast' | 'bizzmodel';
  initialStep?: string;
  initialAppTab?: 'bizzcalc' | 'bizzdynamics' | 'rolling-forecast' | 'bizzmodel' | 'bizzplan' | 'reports';
  onClose: () => void;
  onContextSwitch?: (appId: string, step?: string) => void;
}

export const BizzModel: React.FC<BizzModelProps> = ({
  theme = 'light',
  mode = 'bizzmodel',
  initialStep = 'setup',
  initialAppTab,
  onClose,
  onContextSwitch,
}) => {
  const [currentMode, setCurrentMode] = useState<'bizzdynamics' | 'rolling-forecast' | 'bizzmodel'>(mode);
  const [activeAppTab, setActiveAppTab] = useState<
    'bizzcalc' | 'bizzdynamics' | 'rolling-forecast' | 'bizzmodel' | 'bizzplan' | 'reports'
  >(initialAppTab || (mode === 'bizzdynamics' ? 'bizzdynamics' : mode === 'rolling-forecast' ? 'rolling-forecast' : 'bizzmodel'));

  const [activeStep, setActiveStep] = useState<string>(initialStep);
  const [isStepBizzPlanActive, setIsStepBizzPlanActive] = useState<boolean>(false);
  const [isStepPitchDeckActive, setIsStepPitchDeckActive] = useState<boolean>(false);
  const [isStepBizzBoxActive, setIsStepBizzBoxActive] = useState<boolean>(false);

  // Synchronized subtab (assumptions | results | charts) persistent across all steps and apps
  const [activeSubTab, setActiveSubTabState] = useState<'assumptions' | 'results' | 'charts'>(() => {
    try {
      const saved = localStorage.getItem('bizz_synchronized_subtab');
      if (saved === 'assumptions' || saved === 'results' || saved === 'charts') return saved;
    } catch {}
    return 'assumptions';
  });

  const setActiveSubTab = useCallback((tab: 'assumptions' | 'results' | 'charts') => {
    setActiveSubTabState(tab);
    try {
      localStorage.setItem('bizz_synchronized_subtab', tab);
      window.dispatchEvent(new CustomEvent('bizz_subtab_change', { detail: tab }));
    } catch {}
  }, []);

  useEffect(() => {
    const handleSubTabChange = (e: any) => {
      if (e.detail === 'assumptions' || e.detail === 'results' || e.detail === 'charts') {
        setActiveSubTabState(e.detail);
      }
    };
    window.addEventListener('bizz_subtab_change', handleSubTabChange);
    return () => window.removeEventListener('bizz_subtab_change', handleSubTabChange);
  }, []);

  // Backwards-compatible aliases for SetupStep and working steps
  const setupTab = activeSubTab;
  const setSetupTab = setActiveSubTab;
  const stepSubTab = activeSubTab;
  const setStepSubTab = setActiveSubTab;

  // Funding subtab ('dynamics' | 'what-if' | 'actions-to-improve')
  const [fundingTab, setFundingTab] = useState<'dynamics' | 'what-if' | 'actions-to-improve'>('dynamics');

  // Storage key based on mode
  const storageKey =
    currentMode === 'bizzdynamics'
      ? 'bizzdynamics_platform_data'
      : currentMode === 'rolling-forecast'
      ? 'rolling_forecast_platform_data'
      : 'bizzmodel_platform_data';

  const [state, setState] = useState<BizzModelState>(() => {
    if (currentMode === 'rolling-forecast') {
      try {
        const saved = localStorage.getItem('rolling_forecast_platform_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          const fallback = createDefaultRollingForecastState();
          return {
            ...fallback,
            ...parsed,
            appMode: 'rolling-forecast',
            businessDetails: {
              ...fallback.businessDetails,
              ...(parsed.businessDetails || {}),
              setupAssumptions:
                parsed.businessDetails?.setupAssumptions?.length > 0
                  ? parsed.businessDetails.setupAssumptions
                  : fallback.businessDetails.setupAssumptions,
            },
            fixedAssets: Array.isArray(parsed.fixedAssets) ? parsed.fixedAssets : fallback.fixedAssets,
            funding: parsed.funding
              ? { ...fallback.funding, ...parsed.funding }
              : fallback.funding,
            hiLevelActuals: parsed.hiLevelActuals
              ? { ...fallback.hiLevelActuals, ...parsed.hiLevelActuals }
              : fallback.hiLevelActuals,
            bizzOptimizer: parsed.bizzOptimizer
              ? {
                  targets: {
                    ...(fallback.bizzOptimizer?.targets || { targetRosPct: null, targetAssetTurn: null }),
                    ...(parsed.bizzOptimizer.targets || {}),
                  },
                  actions: Array.isArray(parsed.bizzOptimizer.actions)
                    ? parsed.bizzOptimizer.actions
                    : [],
                }
              : fallback.bizzOptimizer,
          };
        }
      } catch (e) {
        // ignore
      }
      return createDefaultRollingForecastState();
    }

    try {
      const saved =
        localStorage.getItem(storageKey) ||
        (currentMode === 'bizzdynamics'
          ? localStorage.getItem('bizzdynamics_data')
          : localStorage.getItem('bizzmodel_data'));
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          revenueItems: [],
          employmentItems: [],
          expenses: [],
          fixedAssets: [],
          funding: parsed.funding ? {
            ...parsed.funding,
            founderEquity: 0,
            investorEquity: 0,
            bankLoanAmount: 0,
          } : DEFAULT_BUSINESS_STATE.funding,
        };
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_BUSINESS_STATE;
  });

  // Guard excluded steps when operating in Hi-Level Forecast (rolling-forecast) mode
  useEffect(() => {
    if (currentMode === 'rolling-forecast' && ['revenue', 'employment', 'opex'].includes(activeStep)) {
      setActiveStep('ytd-actuals');
    } else if (currentMode !== 'rolling-forecast' && activeStep === 'ytd-actuals') {
      setActiveStep('setup');
    }
    if (activeStep !== 'revenue') {
      setIsStepBizzBoxActive(false);
    }
    if (currentMode !== 'rolling-forecast' && fundingTab === 'actions-to-improve') {
      setFundingTab('dynamics');
    }
  }, [currentMode, activeStep]);

  // Save to localStorage on state changes and notify live integrated views (e.g. BizzPlan)
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      window.dispatchEvent(new Event('bizzmodel-data-updated'));
    } catch (e) {
      // ignore
    }
  }, [state, storageKey]);

  // Handle switching tabs along the top header bar
  const handleSelectAppTab = (
    tab: 'bizzcalc' | 'bizzdynamics' | 'rolling-forecast' | 'bizzmodel' | 'bizzplan' | 'reports'
  ) => {
    setActiveAppTab(tab);
    if (tab === 'bizzdynamics') {
      setCurrentMode('bizzdynamics');
    } else if (tab === 'rolling-forecast') {
      setCurrentMode('rolling-forecast');
      setIsStepBizzPlanActive(false);
    } else if (tab === 'bizzmodel') {
      setCurrentMode('bizzmodel');
    }
    if (onContextSwitch) {
      onContextSwitch(tab);
    }
  };

  // If user selected BizzCalc from top tab:
  if (activeAppTab === 'bizzcalc') {
    return (
      <BizzCalc
        theme={theme}
        onClose={onClose}
        onContextSwitch={(tab) => handleSelectAppTab(tab as any)}
      />
    );
  }

  // If user selected BizzDynamics from top tab:
  if (activeAppTab === 'bizzdynamics') {
    return (
      <BizzDynamics
        theme={theme}
        onClose={onClose}
        onContextSwitch={(tab) => handleSelectAppTab(tab as any)}
      />
    );
  }

  // If user selected BizzPlan from top tab:
  if (activeAppTab === 'bizzplan') {
    return (
      <BizzPlan
        theme={theme}
        onClose={onClose}
        onContextSwitch={(tab) => handleSelectAppTab(tab as any)}
        bizzModelState={state}
      />
    );
  }

  return (
    <BizzModelLayout
      theme={theme}
      mode={currentMode}
      activeAppTab={activeAppTab}
      onSelectAppTab={handleSelectAppTab}
      activeStep={activeStep}
      onSelectStep={setActiveStep}
      setupTab={setupTab}
      onSelectSetupTab={setSetupTab}
      stepSubTab={stepSubTab}
      onSelectStepSubTab={setStepSubTab}
      fundingTab={fundingTab}
      onSelectFundingTab={setFundingTab}
      isBizzPlanTabActive={currentMode !== 'rolling-forecast' && activeAppTab !== 'rolling-forecast' && isStepBizzPlanActive}
      onSelectBizzPlanTab={currentMode === 'rolling-forecast' || activeAppTab === 'rolling-forecast' ? undefined : setIsStepBizzPlanActive}
      isPitchDeckTabActive={currentMode !== 'rolling-forecast' && activeAppTab !== 'rolling-forecast' && isStepPitchDeckActive}
      onSelectPitchDeckTab={currentMode === 'rolling-forecast' || activeAppTab === 'rolling-forecast' ? undefined : setIsStepPitchDeckActive}
      isBizzBoxTabActive={activeStep === 'revenue' && isStepBizzBoxActive}
      onSelectBizzBoxTab={activeStep === 'revenue' ? setIsStepBizzBoxActive : undefined}
      onClose={onClose}
    >
      {/* 1. PLATFORM FORECAST APP STEPS (bizzmodel, rolling-forecast) */}
      {(activeAppTab === 'bizzmodel' || activeAppTab === 'rolling-forecast') && (
        isStepPitchDeckActive && currentMode !== 'rolling-forecast' && activeAppTab !== 'rolling-forecast' ? (
          <PitchDeckStudio
            theme={theme}
            bizzModelState={state}
            onBackToStep={() => setIsStepPitchDeckActive(false)}
            backLabel={`back to ${STEP_DISPLAY_LABELS[activeStep] || activeStep}`}
          />
        ) : isStepBizzPlanActive && currentMode !== 'rolling-forecast' && activeAppTab !== 'rolling-forecast' ? (
          <BizzPlan
            theme={theme}
            onClose={onClose}
            onContextSwitch={(tab) => handleSelectAppTab(tab as any)}
            bizzModelState={state}
            initialSectionId={STEP_TO_BIZZPLAN_SECTION[activeStep] || 'formation'}
            embeddedInModel={true}
            onBackToModel={() => setIsStepBizzPlanActive(false)}
            backToModelLabel={`back to ${STEP_DISPLAY_LABELS[activeStep] || activeStep}`}
          />
        ) : (
        <>
          {activeStep === 'setup' && (
            <SetupStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
              activeTab={setupTab}
              onSelectTab={setSetupTab}
            />
          )}

          {activeStep === 'ytd-actuals' && (
            <HiLevelActualsStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
              subTab={stepSubTab}
              onSelectSubTab={setStepSubTab}
              onNavigateStep={(step, fTab) => {
                setActiveStep(step);
                if (fTab) {
                  setFundingTab(fTab);
                }
              }}
            />
          )}

          {activeStep === 'revenue' && (
            <RevenueStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
              subTab={isStepBizzBoxActive ? 'bizzbox' : stepSubTab}
              onSelectSubTab={(tab) => {
                setIsStepBizzBoxActive(false);
                setStepSubTab(tab);
              }}
            />
          )}

          {activeStep === 'employment' && (
            <EmploymentStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
              subTab={stepSubTab}
              onSelectSubTab={setStepSubTab}
            />
          )}

          {activeStep === 'opex' && (
            <OperatingExpensesStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
              subTab={stepSubTab}
              onSelectSubTab={setStepSubTab}
            />
          )}

          {activeStep === 'fixed-assets' && (
            <FixedAssetsStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
              subTab={stepSubTab}
              onSelectSubTab={setStepSubTab}
            />
          )}

          {activeStep === 'funding' && (
            <FundingStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
              subTab={fundingTab}
              onSelectSubTab={setFundingTab}
            />
          )}

          {activeStep === 'reports' && (
            <ReportsStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
            />
          )}
        </>
        )
      )}

      {/* 3. REPORTS TAB */}
      {activeAppTab === 'reports' && (
        <ReportsStep
          theme={theme}
          mode={currentMode}
          state={state}
          onUpdateState={setState}
        />
      )}
    </BizzModelLayout>
  );
};
export default BizzModel;
