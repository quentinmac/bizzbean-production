import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  CheckCircle2,
  Lock,
  Play,
  FileSpreadsheet,
  Download,
  Coins,
  ShieldCheck,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  ShoppingCart,
  BookOpen,
  Cpu,
  BarChart3,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Edit3,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  Calculator,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { CmsProduct, CmsCourseLesson } from '../data/cmsConsoleData';
import { CMS_STORAGE_KEYS, safeSaveStorage } from '../utils/imageStorage';
import { BizzSolution } from '../types';

interface SolutionTransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  solution: BizzSolution | CmsProduct;
  cmsProducts?: CmsProduct[];
  isMember?: boolean;
  onBuySolution?: (sol: any) => void;
  onOpenSignUp?: () => void;
  onSaveProduct?: (updatedProduct: CmsProduct) => void;
  theme?: 'light' | 'dark';
}

const DEFAULT_APP_ENGINE_STEPS = [
  {
    step: 1,
    title: 'Business Details & Operating Calendar',
    desc: 'Defines business name, incorporation milestone, 5-day / 6-day operating rhythm, working days, and statutory holiday deductions.',
    inputs: ['Business legal entity name', 'Calendar start month', 'Working days allocation (Mon-Sun)', 'Public holiday deduction flag'],
    outputs: ['Active operating calendar matrix', 'Available productive days per month', 'Schedule synchronization vector'],
  },
  {
    step: 2,
    title: 'Revenue Calculator & Unit Economics',
    desc: 'Models products, direct bill of materials (BOM), indirect labor, gross margin targets, and sales volume trajectories.',
    inputs: ['Product name & SKU', 'Direct material costs per unit', 'Direct manufacturing labor', 'Target selling price', 'Monthly sales volume projection'],
    outputs: ['Gross margin per unit & percentage', 'Clean contribution margin per unit', 'Monthly gross profit forecasts'],
  },
  {
    step: 3,
    title: 'Employment & Organizational Burdens',
    desc: 'Calculates fully burdened headcount economics, executive compensation, operational labor, and payroll tax reserves.',
    inputs: ['Role title & head count', 'Base monthly salary', 'Pension & medical aid contribution', 'Statutory payroll levies (UIF, SDL, PAYE)'],
    outputs: ['Fully burdened cost per employee', 'Departmental labor totals', 'Monthly payroll cash requirements'],
  },
  {
    step: 4,
    title: 'Operating Expenses & Overhead Distribution',
    desc: 'Categorizes fixed overheads (rent, software, insurance, auditing) and variable operational distribution expenses.',
    inputs: ['Standard opex line items', 'Monthly fixed commitment amount', 'Inflation escalation percentage', 'Payment lag & settlement terms'],
    outputs: ['Total monthly opex overhead', 'Operating expenditure waterfall', 'Cost-to-revenue efficiency ratio'],
  },
  {
    step: 5,
    title: 'Fixed Assets & Capital Depreciation',
    desc: 'Schedules machinery, technology hardware, vehicles, and office assets with GAAP straight-line depreciation calculations.',
    inputs: ['Asset category & acquisition date', 'Purchase cost (CapEx)', 'Estimated useful lifespan in years', 'Residual salvage value'],
    outputs: ['Monthly depreciation write-down', 'Cumulative net book value schedule', 'Balance sheet asset register'],
  },
  {
    step: 6,
    title: 'Funding Calculator & Capital Structure',
    desc: 'Structures founder equity, angel/seed venture capital, commercial term debt, interest rates, and loan amortizations.',
    inputs: ['Founder equity contribution', 'External investor capital', 'Bank term loan amount', 'Annual interest rate (%)', 'Repayment tenure in months'],
    outputs: ['Monthly interest & capital amortization', 'Debt-to-equity ratio', 'Available starting venture liquidity buffer'],
  },
  {
    step: 7,
    title: 'Authentic 3-Statement & Break-Even Reports',
    desc: 'Reconciles the 5-year Income Statement, Balance Sheet, Cash Flow Statement, Break-Even Horizon, and Liquidity vs Debt.',
    inputs: ['Dynamic aggregation of Steps 1 through 6', 'Corporate tax rate parameter (27%)', 'Dividend distribution policy'],
    outputs: ['5-Year Annual Income Statement', 'Monthly Cash Flow & Runway Alarm', 'Balance Sheet Stress Test', 'Unit Break-Even Volume Analysis'],
  },
];

const DEFAULT_BIZZCALCULATORS_ITEMS = [
  {
    step: 1,
    title: 'Breakeven Point',
    desc: 'Calculate the exact unit sales volume required to cover fixed expenses and variable unit costs.',
    inputs: ['Fixed cost of sales & overheads', 'Unit selling price', 'Unit material, production & variable overhead costs'],
    outputs: ['Total fixed expenses', 'Unit contribution & GP margin %', 'Exact breakeven sales units'],
  },
  {
    step: 2,
    title: 'Buy vs Lease',
    desc: 'Compare buying an asset outright versus leasing across VAT, deposits, depreciation, and lifetime cashflow.',
    inputs: ['Purchase price, accessories, VAT & deposit', 'Asset lifespan (years) & residual value', 'Lease interest rate %, term & annual payments'],
    outputs: ['Amount financed & lease base', 'Monthly depreciation & lease cashflow', 'Lifetime buy vs. lease cash outlay'],
  },
  {
    step: 3,
    title: 'Cost Benefit Analysis',
    desc: 'Test project or capital investment viability using discounted cash flow (NPV), payback period, and SRI.',
    inputs: ['Initial investment, recovery & scrap value', 'Annual savings & evaluation horizon (up to 10 years)', 'Discount rate %'],
    outputs: ['Year-by-year cashflow schedule', 'Discounted cash flow (NPV) & PV ratios', 'Payback period (PB) & Savings Return Index (SRI)'],
  },
  {
    step: 4,
    title: 'Depreciation',
    desc: 'Calculate straight-line monthly, period, and annual asset depreciation and net balance sheet value.',
    inputs: ['Asset purchase cost', 'Annual depreciation rate % & depreciation months', 'Evaluation period (months)'],
    outputs: ['Monthly & annual depreciation charge', 'Cumulative period depreciation', 'Remaining balance sheet book value'],
  },
  {
    step: 5,
    title: 'Funding Calculator',
    desc: 'Optimize Net Operating Assets (NOA) funding across equity, non-interest-bearing debt, and target debt/equity ratios.',
    inputs: ['Total assets, NIBD & equity', 'Target NIBD % of total assets', 'Target Debt-to-Equity (DE) ratio'],
    outputs: ['Net Operating Assets (NOA) & current DE ratio', 'Current vs. target asset funding mix %', 'Revised balance sheet capital structure'],
  },
  {
    step: 6,
    title: 'Margin vs Markup',
    desc: 'Set an item selling price accurately by comparing Gross Profit Margin against a Markup factor (excl. & incl. VAT).',
    inputs: ['Unit item cost (or import directly from BOM)', 'Target margin / markup % factor', 'Statutory VAT rate %'],
    outputs: ['Selling price excl. & incl. VAT (Margin vs. Markup)', 'Gross profit per unit & effective GP %', 'Revenue factor multiplier'],
  },
  {
    step: 7,
    title: 'Revenue Factor',
    desc: 'Calculate the additional sales revenue required to recover a new expense while protecting target profit margins.',
    inputs: ['Revenue & cost of sales', 'Variable expenses & fixed overheads'],
    outputs: ['Gross profit, net margin & net operating profit', 'Full margin % breakdown', 'Revenue factor multiplier'],
  },
  {
    step: 8,
    title: 'ROA Dynamics',
    desc: 'Model the profit, margin, and working capital adjustments required to achieve a target Return on Net Operating Assets.',
    inputs: ['Trading account & balance sheet figures', 'Target ROS % & target ROA %', 'Percentage adjustments & target working capital days'],
    outputs: ['Current vs. required NOP & NOA', 'Adjusted trading account & balance sheet', 'Adjusted ROS, Asset Turn (AT) & ROA %'],
  },
  {
    step: 9,
    title: 'ROS x AT = ROA',
    desc: 'Optimize business efficiency by linking Return on Sales (ROS) and Asset Turn (AT) to Return on Net Operating Assets.',
    inputs: ['Annual revenue, cost of sales & operating expenses', 'Fixed assets, inventory, receivables & payables'],
    outputs: ['Net Operating Profit (NOP) & Net Operating Assets (NOA)', 'ROS %, Asset Turn & ROA %', 'Verified ROS × AT = ROA check formula'],
  },
  {
    step: 10,
    title: 'Term Loan',
    desc: 'Calculate fixed-term loan repayments, total interest cost, and total value repaid over the life of a loan.',
    inputs: ['Loan advance amount', 'Annual interest rate %', 'Loan term (years) & annual payment frequency'],
    outputs: ['Total number of payments', 'Monthly / periodic repayment amount', 'Total interest paid & total value repaid'],
  },
  {
    step: 11,
    title: 'Working Capital Dynamics',
    desc: 'Measure the cash released or absorbed when adjusting inventory, receivables, and payables turnaround days.',
    inputs: ['Revenue, variable/fixed cost of sales & VAT %', 'Current inventory, receivables & payables', 'Forecast target days for inventory, receivables & payables'],
    outputs: ['Current calculated working capital days', 'Adjusted working capital balances', 'Net cash change in working capital'],
  },
  {
    step: 12,
    title: 'Bill of Materials (BOM)',
    desc: 'Maintain multi-product recipes and unit costs right on your phone — covering ingredients, multi-level packaging, variable costs, and unit cost dynamics.',
    inputs: ['Product cost book (units/batch & batches/day)', 'Ingredients: qty/batch, pack size, pack cost, consumables & waste toggle', 'Multi-level packaging & per-batch / per-unit variable costs'],
    outputs: ['Packs/day & surplus tracking per ingredient', 'Materials, packaging & variable unit cost breakdown', 'One-tap transfer to Margin vs Markup & Breakeven Point'],
  },
];

const AVAILABLE_STAGE_OPTIONS: Array<{ value: CmsProduct['stage']; label: string }> = [
  { value: 'vi-ability', label: 'vi-ability' },
  { value: 'fund-ability', label: 'fund-ability' },
  { value: 'sustain-ability', label: 'sustain-ability' },
  { value: 'invest-ability', label: 'invest-ability' },
  { value: 'operations-sandbox', label: 'operations-sandbox' },
  { value: 'personal-sandbox', label: 'personal-sandbox' },
  { value: 'operations', label: 'operations' },
  { value: 'growth', label: 'growth' },
  { value: 'education', label: 'education' },
];

const padStep = (n: number): string => String(n).padStart(2, '0');

const isLegacySevenStepTemplate = (steps: any[]): boolean =>
  Array.isArray(steps) &&
  steps.length === 7 &&
  steps[0]?.title === 'Business Details & Operating Calendar' &&
  steps[6]?.title === 'Authentic 3-Statement & Break-Even Reports';

export const SolutionTransparencyModal: React.FC<SolutionTransparencyModalProps> = ({
  isOpen,
  onClose,
  solution,
  cmsProducts = [],
  isMember = false,
  onBuySolution,
  onOpenSignUp,
  onSaveProduct,
  theme = 'light',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'deliverables' | 'pricing'>('overview');
  const [activeAppStep, setActiveAppStep] = useState<number>(1);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const isDark = theme === 'dark';
  const defaultFallback: any = (cmsProducts && cmsProducts.length > 0 ? cmsProducts[0] : null) || {
    id: 'bizzcalc',
    name: 'bizzcalc',
    subtitle: 'Cost Recovery, Break-Even & Contribution Margin Simulator',
    purpose: 'Comprehensive cost recovery calculator enabling founders to cost products accurately.',
    description: 'Comprehensive cost recovery calculator enabling founders to cost products accurately.',
    type: 'app',
    stage: 'vi-ability',
    sku: 'BA-001',
    sellingPriceZAR: 229,
    exclusivePriceZAR: 199.13,
    vatZAR: 29.87,
    tokensAllocated: 45.8,
  };

  const safeSolution: any = solution || defaultFallback;
  const solId = safeSolution.id || 'bizzcalc';
  const solName = safeSolution.name || safeSolution.displayName || 'bizzcalc';

  // Match CMS product details if available (defensive search with safe strings)
  const matchingCms = (cmsProducts || []).find(
    (p) =>
      (p?.id && p.id === solId) ||
      (p?.name && solName && p.name.toLowerCase() === solName.toLowerCase())
  );
  const effectiveProd: any = matchingCms || safeSolution;

  // Determine if course or platform application (and detect bizzcalculators suite)
  const isCourse =
    effectiveProd.type === 'course' ||
    safeSolution.type === 'course' ||
    ['learn-earn-capital', 'how-to-bizzcalc', 'cost-recovery-calculator', 'follow-the-money', 'financial-reports', 'your-first-hire', 'profit-optimizer', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(solId) ||
    solName.toLowerCase().includes('course');

  const isBizzCalculators =
    !isCourse &&
    (solId === 'bizzcalculators' ||
      solName.toLowerCase().includes('bizzcalculators') ||
      String(effectiveProd.sku || '').toUpperCase() === 'BA-CALC');

  const getDefaultStepsForSolution = (forCalculators: boolean) =>
    forCalculators ? DEFAULT_BIZZCALCULATORS_ITEMS : DEFAULT_APP_ENGINE_STEPS;

  const resolveInitialSteps = (prod: any, forCalculators: boolean) => {
    if (Array.isArray(prod?.engineSteps) && prod.engineSteps.length > 0) {
      if (forCalculators && isLegacySevenStepTemplate(prod.engineSteps)) {
        return DEFAULT_BIZZCALCULATORS_ITEMS;
      }
      return prod.engineSteps;
    }
    return getDefaultStepsForSolution(forCalculators);
  };

  const coverImage =
    effectiveProd.canonicalCoverUrl ||
    effectiveProd.imageUrl ||
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80';

  const initialSellingPrice = effectiveProd.sellingPriceZAR ?? (safeSolution.priceZAR || 0);
  const initialTokens = effectiveProd.tokensAllocated ?? (safeSolution.tokensAllocated || Math.round(initialSellingPrice * 0.2));

  // Default course lessons
  const initialLessons: CmsCourseLesson[] =
    Array.isArray(effectiveProd.courseLessons) && effectiveProd.courseLessons.length > 0
      ? effectiveProd.courseLessons
      : Array.isArray(effectiveProd.lessonTitles) && effectiveProd.lessonTitles.length > 0
      ? effectiveProd.lessonTitles.map((t: string, idx: number) => ({
          id: `l-${idx}`,
          name: t,
          duration: `${10 + (idx * 3)} min`,
          youtubeUrl: '',
        }))
      : [
          { id: 'l-1', name: 'Module 01: Core Strategic Foundations & Assumptions', duration: '12 min', youtubeUrl: '' },
          { id: 'l-2', name: 'Module 02: Unit Economics & Operational Calibration', duration: '18 min', youtubeUrl: '' },
          { id: 'l-3', name: 'Module 03: Executive Defense & Stress Testing', duration: '15 min', youtubeUrl: '' },
        ];

  const defaultChallengeText = isBizzCalculators
    ? 'Operators and small business owners frequently guess prices, under-cost ingredients or packaging, and commit to loans or leases without checking cashflow impact. They need instant, mobile-ready financial dials in their pocket.'
    : 'Building in premature scale without unit economics clarity leads to unrecoverable burn. Founders need clear visibility before committing capital.';

  const defaultTargetProfile = isBizzCalculators
    ? 'Small Business Owners, Food Truck & Hospitality Operators, Makers, Retailers & Operational Managers'
    : 'Pre-Seed to Series A Founders, Financial Directors, Advisory Teams';

  const defaultWhatYouGet = isBizzCalculators
    ? [
        '12 specialized mobile-ready business & costing calculators',
        'Multi-product Bill of Materials (BOM) recipe & packaging cost book',
        'One-tap unit cost transfer into Margin vs Markup & Breakeven Point',
        'Once-off lifetime browser access on mobile & desktop — zero monthly fees',
      ]
    : [
        'Interactive financial models with live scenario sliders',
        'Downloadable audit-proof reports & export formats',
        'Macro-free Google Workspace spreadsheet connectors',
        'Pre-configured chart of accounts and runway schedules',
      ];

  // Editable form state
  const [formName, setFormName] = useState<string>(effectiveProd.name || safeSolution.name || 'bizzcalc');
  const [formSku, setFormSku] = useState<string>(effectiveProd.sku || 'BA-001');
  const [formStage, setFormStage] = useState<CmsProduct['stage']>(
    (effectiveProd.stage || safeSolution.stage || 'vi-ability') as CmsProduct['stage']
  );
  const [formSubtitle, setFormSubtitle] = useState<string>(effectiveProd.subtitle || safeSolution.subtitle || '');
  const [formPurpose, setFormPurpose] = useState<string>(effectiveProd.purpose || safeSolution.purpose || safeSolution.description || '');
  const [formChallenge, setFormChallenge] = useState<string>(
    effectiveProd.challengeText || defaultChallengeText
  );
  const [formTargetProfile, setFormTargetProfile] = useState<string>(
    effectiveProd.targetProfile || defaultTargetProfile
  );
  const [formWhatYouGet, setFormWhatYouGet] = useState<string[]>(
    Array.isArray(effectiveProd.whatYouGet) && effectiveProd.whatYouGet.length > 0
      ? effectiveProd.whatYouGet
      : defaultWhatYouGet
  );
  const [formCapabilities, setFormCapabilities] = useState<string[]>(
    Array.isArray(effectiveProd.modules) && effectiveProd.modules.length > 0
      ? effectiveProd.modules
      : Array.isArray(effectiveProd.features)
      ? effectiveProd.features
      : Array.isArray((safeSolution as any).features)
      ? (safeSolution as any).features
      : [
          'Live sensitivity forecasting and break-even analysis',
          'Institutional 3-statement model integration',
          'Zero compute overhead on pre-purchase review',
        ]
  );
  const [formCompanionFile, setFormCompanionFile] = useState<string>(
    effectiveProd.companionMaterialFilename || 'Framework_Templates.zip'
  );
  const [formLessons, setFormLessons] = useState<CmsCourseLesson[]>(initialLessons);
  const [formSteps, setFormSteps] = useState(() =>
    resolveInitialSteps(effectiveProd, isBizzCalculators)
  );
  const [formSellingPrice, setFormSellingPrice] = useState<number>(initialSellingPrice);
  const [formTokens, setFormTokens] = useState<number>(initialTokens);

  // Synchronize state whenever the selected solution changes or the modal opens
  useEffect(() => {
    const curProd: any = (cmsProducts || []).find((p) => p.id === solId) || safeSolution;
    const curIsCalc =
      !isCourse &&
      (solId === 'bizzcalculators' ||
        String(curProd.name || safeSolution.name || '').toLowerCase().includes('bizzcalculators') ||
        String(curProd.sku || '').toUpperCase() === 'BA-CALC');

    setFormName(curProd.name || safeSolution.name || 'bizzcalc');
    setFormSku(curProd.sku || (curIsCalc ? 'BA-CALC' : 'BA-001'));
    setFormStage((curProd.stage || safeSolution.stage || 'vi-ability') as CmsProduct['stage']);
    setFormSubtitle(curProd.subtitle || safeSolution.subtitle || '');
    setFormPurpose(curProd.purpose || safeSolution.purpose || safeSolution.description || '');
    setFormChallenge(
      curProd.challengeText ||
        (curIsCalc
          ? 'Operators and small business owners frequently guess prices, under-cost ingredients or packaging, and commit to loans or leases without checking cashflow impact. They need instant, mobile-ready financial dials in their pocket.'
          : 'Building in premature scale without unit economics clarity leads to unrecoverable burn. Founders need clear visibility before committing capital.')
    );
    setFormTargetProfile(
      curProd.targetProfile ||
        (curIsCalc
          ? 'Small Business Owners, Food Truck & Hospitality Operators, Makers, Retailers & Operational Managers'
          : 'Pre-Seed to Series A Founders, Financial Directors, Advisory Teams')
    );
    setFormWhatYouGet(
      Array.isArray(curProd.whatYouGet) && curProd.whatYouGet.length > 0
        ? curProd.whatYouGet
        : curIsCalc
        ? [
            '12 specialized mobile-ready business & costing calculators',
            'Multi-product Bill of Materials (BOM) recipe & packaging cost book',
            'One-tap unit cost transfer into Margin vs Markup & Breakeven Point',
            'Once-off lifetime browser access on mobile & desktop — zero monthly fees',
          ]
        : [
            'Interactive financial models with live scenario sliders',
            'Downloadable audit-proof reports & export formats',
            'Macro-free Google Workspace spreadsheet connectors',
            'Pre-configured chart of accounts and runway schedules',
          ]
    );
    if (Array.isArray(curProd.modules) && curProd.modules.length > 0) {
      setFormCapabilities(curProd.modules);
    } else if (curIsCalc) {
      setFormCapabilities(DEFAULT_BIZZCALCULATORS_ITEMS.map((c) => c.title));
    }
    if (curProd.companionMaterialFilename) setFormCompanionFile(curProd.companionMaterialFilename);
    if (Array.isArray(curProd.courseLessons) && curProd.courseLessons.length > 0) {
      setFormLessons(curProd.courseLessons);
    }
    const nextSteps = resolveInitialSteps(curProd, curIsCalc);
    setFormSteps(nextSteps);
    setActiveAppStep(nextSteps[0]?.step || 1);
    const currentPrice = curProd.sellingPriceZAR ?? (safeSolution.priceZAR || 0);
    setFormSellingPrice(currentPrice);
    setFormTokens(curProd.tokensAllocated ?? (safeSolution.tokensAllocated || Math.round(currentPrice * 0.2)));
    setIsEditing(false);
  }, [solId, isOpen]);

  // Calculated pricing metrics
  const sellingPrice = formSellingPrice;
  const tokensCredited = formTokens;
  const exclusivePrice = sellingPrice > 0 ? Math.round((sellingPrice / 1.15) * 100) / 100 : 0;
  const vat = Math.round((sellingPrice - exclusivePrice) * 100) / 100;

  // Handle Save
  const handleSaveViewScreen = () => {
    const cleanedSteps = formSteps.map((st: any, idx: number) => ({
      ...st,
      step: idx + 1,
      title: String(st.title || '').trim() || (isBizzCalculators ? `Calculator ${idx + 1}` : `Step ${idx + 1}`),
      desc: String(st.desc || '').trim(),
      inputs: Array.isArray(st.inputs)
        ? st.inputs.map((x: string) => x.trim()).filter((x: string) => x.length > 0)
        : [],
      outputs: Array.isArray(st.outputs)
        ? st.outputs.map((x: string) => x.trim()).filter((x: string) => x.length > 0)
        : [],
    }));
    setFormSteps(cleanedSteps);

    const updatedProd: CmsProduct = {
      ...effectiveProd,
      id: effectiveProd.id || solution.id,
      seq: effectiveProd.seq || 1,
      type: isCourse ? 'course' : 'app',
      stage: ['profit-optimizer', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(effectiveProd.id || solution.id)
        ? 'sustain-ability'
        : formStage || effectiveProd.stage || (solution.stage as any) || 'vi-ability',
      sku: formSku.trim() || effectiveProd.sku || 'BA-001',
      name: formName.trim() || effectiveProd.name || solution.name,
      subtitle: formSubtitle.trim() || effectiveProd.subtitle || solution.subtitle,
      purpose: formPurpose.trim() || effectiveProd.purpose || solution.purpose,
      description: formPurpose.trim() || effectiveProd.description || solution.description,
      challengeText: formChallenge.trim(),
      targetProfile: formTargetProfile.trim(),
      whatYouGet: formWhatYouGet,
      modules: formCapabilities,
      companionMaterialFilename: formCompanionFile.trim(),
      courseLessons: isCourse ? formLessons : effectiveProd.courseLessons,
      lessonTitles: isCourse ? formLessons.map((l) => l.name) : effectiveProd.lessonTitles,
      syllabusLessonsCount: isCourse ? formLessons.length : (effectiveProd.syllabusLessonsCount || 0),
      engineSteps: !isCourse ? cleanedSteps : effectiveProd.engineSteps,
      sellingPriceZAR: Number(formSellingPrice) || 0,
      exclusivePriceZAR: exclusivePrice,
      vatZAR: vat,
      tokensAllocated: Number(formTokens) || 0,
      ticketPriceZAR: Math.round(((Number(formSellingPrice) || 0) * 1.20) * 100) / 100,
      isPurchased: effectiveProd.isPurchased ?? true,
      activeInSync: true,
    };

    if (onSaveProduct) {
      onSaveProduct(updatedProd);
    }

    // Direct fallback save to local storage
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed: CmsProduct[] = JSON.parse(stored);
        const idx = parsed.findIndex((p) => p.id === updatedProd.id);
        if (idx >= 0) {
          parsed[idx] = { ...parsed[idx], ...updatedProd };
        } else {
          parsed.push(updatedProd);
        }
        safeSaveStorage(CMS_STORAGE_KEYS.PRODUCTS, parsed);
      }
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
    setIsEditing(false);
  };

  // Helper to add what you get item
  const handleAddWhatYouGet = () => {
    setFormWhatYouGet([...formWhatYouGet, 'New deliverable or framework specification']);
  };

  const handleUpdateWhatYouGet = (index: number, val: string) => {
    const updated = [...formWhatYouGet];
    updated[index] = val;
    setFormWhatYouGet(updated);
  };

  const handleDeleteWhatYouGet = (index: number) => {
    setFormWhatYouGet(formWhatYouGet.filter((_, idx) => idx !== index));
  };

  // Helper for capabilities
  const handleAddCapability = () => {
    setFormCapabilities([...formCapabilities, 'New computational capability or forecast model']);
  };

  const handleUpdateCapability = (index: number, val: string) => {
    const updated = [...formCapabilities];
    updated[index] = val;
    setFormCapabilities(updated);
  };

  const handleDeleteCapability = (index: number) => {
    setFormCapabilities(formCapabilities.filter((_, idx) => idx !== index));
  };

  // Helper for course lessons
  const handleAddLesson = () => {
    const nextNum = formLessons.length + 1;
    setFormLessons([
      ...formLessons,
      {
        id: `cl-new-${Date.now()}`,
        name: `Module 0${nextNum}: Executive Milestone Review`,
        duration: '15 min',
        youtubeUrl: '',
      },
    ]);
  };

  const handleUpdateLesson = (index: number, field: keyof CmsCourseLesson, val: string) => {
    const updated = [...formLessons];
    updated[index] = { ...updated[index], [field]: val };
    setFormLessons(updated);
  };

  const handleDeleteLesson = (index: number) => {
    setFormLessons(formLessons.filter((_, idx) => idx !== index));
  };

  // Helpers for dynamic engine steps / bizzcalculators list (add, edit, reorder, delete, reset)
  const handleUpdateStep = (stepNumber: number, field: string, val: any) => {
    setFormSteps(
      formSteps.map((st: any) => (st.step === stepNumber ? { ...st, [field]: val } : st))
    );
  };

  const handleAddStepOrCalculator = () => {
    const nextStepNum = formSteps.length + 1;
    const newItem = isBizzCalculators
      ? {
          step: nextStepNum,
          title: `New Calculator ${padStep(nextStepNum)}`,
          desc: 'Describe what this calculator solves and who benefits from it.',
          inputs: ['Primary operational or cost assumption'],
          outputs: ['Key financial decision metric or unit cost'],
        }
      : {
          step: nextStepNum,
          title: `Step ${padStep(nextStepNum)} Module`,
          desc: 'Describe what this step models inside the application.',
          inputs: ['Core step assumption'],
          outputs: ['Calculated step deliverable'],
        };
    setFormSteps([...formSteps, newItem]);
    setActiveAppStep(nextStepNum);
  };

  const handleDeleteStepOrCalculator = (stepNumber: number) => {
    if (formSteps.length <= 1) return;
    const renumbered = formSteps
      .filter((st: any) => st.step !== stepNumber)
      .map((st: any, idx: number) => ({ ...st, step: idx + 1 }));
    setFormSteps(renumbered);
    setActiveAppStep(Math.min(stepNumber, renumbered.length));
  };

  const handleMoveStepOrCalculator = (stepNumber: number, direction: -1 | 1) => {
    const idx = formSteps.findIndex((st: any) => st.step === stepNumber);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= formSteps.length) return;
    const copy = [...formSteps];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    const renumbered = copy.map((st: any, i: number) => ({ ...st, step: i + 1 }));
    setFormSteps(renumbered);
    setActiveAppStep(targetIdx + 1);
  };

  const handleResetCalculatorsToDefaults = () => {
    const defaults = getDefaultStepsForSolution(isBizzCalculators);
    setFormSteps(defaults);
    setActiveAppStep(defaults[0]?.step || 1);
  };

  const currentStepData =
    formSteps.find((s: any) => s.step === activeAppStep) ||
    formSteps[0] ||
    getDefaultStepsForSolution(isBizzCalculators)[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none font-sans animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl max-h-[92vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-all ${
          isDark ? 'bg-[#0E1322] border-[#252E4A] text-slate-100' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900'
        }`}
      >
        {/* ===================================================================== */}
        {/* MODAL HEADER                                                          */}
        {/* ===================================================================== */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-[#2E5E88] text-white shadow-xs">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm sm:text-base uppercase tracking-wider text-slate-900 dark:text-white">
                  {formName}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {isCourse ? 'COURSE PREVIEW' : 'APPLICATION PREVIEW'}
                </span>
                {isEditing && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/40">
                    EDITING VIEW SCREEN
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {!isEditing ? (
                  <>
                    <span>SKU: {formSku || 'BZ-001'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#2E5E88] dark:text-[#5584B4] font-medium lowercase">
                      stage: {formStage || 'vi-ability'}
                    </span>
                    {isBizzCalculators && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          {formSteps.length} calculators
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <Cpu className="h-3 w-3" />
                      <span>zero compute consumed</span>
                    </span>
                  </>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <label className="inline-flex items-center gap-1">
                      <span className="text-[10px] uppercase opacity-75">SKU:</span>
                      <input
                        type="text"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        className={`w-24 px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold ${
                          isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <span className="text-[10px] uppercase opacity-75">stage:</span>
                      <select
                        value={formStage}
                        onChange={(e) => setFormStage(e.target.value as CmsProduct['stage'])}
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-mono ${
                          isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      >
                        {AVAILABLE_STAGE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Header Controls: Edit View Screen & Close */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                title="Edit the text, syllabus, engine architecture, and pricing on this view screen"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#5584B4]" />
                <span className="hidden sm:inline">EDIT VIEW SCREEN</span>
                <span className="sm:hidden">EDIT</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSaveViewScreen}
                  className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>SAVE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  CANCEL
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Close transparency preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Save confirmation toast */}
        {saveToast && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-mono font-bold flex items-center justify-between shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>✓ View screen customized and saved to cloud and workstation!</span>
            </div>
            <span className="text-[10px] opacity-80 uppercase">changes synchronized</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* NAVIGATION TABS                                                       */}
        {/* ===================================================================== */}
        <div
          className={`px-5 py-2 border-b flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 ${
            isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-[#EAE3D4]/50 border-[#D8CEBC]'
          }`}
        >
          {[
            { id: 'overview', label: '1. OVERVIEW & MISSION' },
            {
              id: 'curriculum',
              label: isCourse
                ? '2. SYLLABUS & LESSONS'
                : isBizzCalculators
                ? `2. CALCULATOR SUITE (${formSteps.length})`
                : '2. 7-STEP ENGINE ARCHITECTURE',
            },
            {
              id: 'deliverables',
              label: isBizzCalculators ? '3. INCLUDED & ACCESS' : '3. DELIVERABLES & EXPORTS',
            },
            { id: 'pricing', label: '4. TRANSPARENT PRICING' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide uppercase transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#2E5E88] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#1A233A]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===================================================================== */}
        {/* TAB CONTENT (SCROLLABLE)                                              */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: OVERVIEW & MISSION */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Cover Banner */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-[#252E4A] h-44 sm:h-52 bg-slate-900">
                <img
                  src={coverImage}
                  alt={formName}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    <span>FOUNDER TRANSPARENCY ARCHITECTURE</span>
                  </div>
                  {!isEditing ? (
                    <>
                      <h3 className="font-['Outfit'] text-lg sm:text-xl font-bold lowercase">
                        {formName}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 font-light mt-0.5 line-clamp-2">
                        {formSubtitle || formPurpose}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-1.5 max-w-xl">
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Solution Title..."
                        className="w-full px-2.5 py-1 text-sm font-bold bg-black/60 border border-white/30 rounded-lg text-white"
                      />
                      <input
                        type="text"
                        value={formSubtitle}
                        onChange={(e) => setFormSubtitle(e.target.value)}
                        placeholder="Solution Subtitle / Tagline..."
                        className="w-full px-2.5 py-1 text-xs bg-black/60 border border-white/30 rounded-lg text-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Purpose & Mission */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#2E5E88] dark:text-[#5584B4] mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Strategic Venture Purpose & Mission</span>
                  </div>
                  {isEditing && <span className="text-[10px] text-amber-500 font-normal">Editable</span>}
                </div>
                {!isEditing ? (
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {formPurpose}
                  </p>
                ) : (
                  <textarea
                    rows={3}
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    placeholder="Enter strategic venture mission and what this solves..."
                    className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm font-sans focus:outline-none ${
                      isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  />
                )}
              </div>

              {/* The Critical Venture Challenge (Problem) */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#9A7B4F] dark:text-[#D4A373] mb-2 flex items-center justify-between">
                  <span>The Critical Venture Challenge</span>
                  {isEditing && <span className="text-[10px] text-amber-500 font-normal">Editable</span>}
                </div>
                {!isEditing ? (
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {formChallenge}
                  </p>
                ) : (
                  <textarea
                    rows={3}
                    value={formChallenge}
                    onChange={(e) => setFormChallenge(e.target.value)}
                    placeholder="Describe the challenge or problem founders face without this solution..."
                    className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm font-sans focus:outline-none ${
                      isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  />
                )}
              </div>

              {/* Target Profile */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Target Founder & Venture Profile</span>
                  {isEditing && <span className="text-[10px] text-amber-500 font-normal">Editable</span>}
                </div>
                {!isEditing ? (
                  <div className="text-xs sm:text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {formTargetProfile}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formTargetProfile}
                    onChange={(e) => setFormTargetProfile(e.target.value)}
                    placeholder="e.g. Pre-Seed to Series A Founders, Financial Directors..."
                    className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                      isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  />
                )}
              </div>

              {/* What You Get / Core Deliverables */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    What You Receive (Core Deliverables)
                  </span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleAddWhatYouGet}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2E5E88] text-white flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Item</span>
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {formWhatYouGet.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {!isEditing ? (
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-sans">{item}</span>
                      ) : (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleUpdateWhatYouGet(idx, e.target.value)}
                            className={`flex-1 px-2.5 py-1 rounded-lg border text-xs ${
                              isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteWhatYouGet(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Capabilities */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Core Platform Capabilities
                  </span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleAddCapability}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2E5E88] text-white flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Capability</span>
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {formCapabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#5584B4] shrink-0" />
                      {!isEditing ? (
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-sans">{cap}</span>
                      ) : (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={cap}
                            onChange={(e) => handleUpdateCapability(idx, e.target.value)}
                            className={`flex-1 px-2.5 py-1 rounded-lg border text-xs ${
                              isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteCapability(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CURRICULUM (COURSES) OR 7-STEP ENGINE ARCHITECTURE (APPS) */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              {isCourse ? (
                /* Course Syllabus */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#2E5E88]" />
                      <span>Course Syllabus ({formLessons.length} Modules)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <span className="text-[11px] font-mono text-slate-500">
                          Companion workbook: {formCompanionFile}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">Workbook:</span>
                          <input
                            type="text"
                            value={formCompanionFile}
                            onChange={(e) => setFormCompanionFile(e.target.value)}
                            placeholder="Workbook file name..."
                            className={`px-2 py-0.5 rounded text-xs font-mono border ${
                              isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                            }`}
                          />
                        </div>
                      )}

                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleAddLesson}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#2E5E88] text-white flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Module</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {formLessons.map((lesson, idx) => (
                      <div
                        key={lesson.id || idx}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-7 w-7 rounded-lg bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#5584B4] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            0{idx + 1}
                          </div>
                          {!isEditing ? (
                            <div>
                              <div className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white lowercase">
                                {lesson.name}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>Duration: {lesson.duration || '12 min'}</span>
                                <span>•</span>
                                <span>High Definition Video Stream</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={lesson.name}
                                onChange={(e) => handleUpdateLesson(idx, 'name', e.target.value)}
                                placeholder="Module Title..."
                                className={`sm:col-span-2 px-2.5 py-1 rounded-lg border text-xs font-mono ${
                                  isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              />
                              <input
                                type="text"
                                value={lesson.duration}
                                onChange={(e) => handleUpdateLesson(idx, 'duration', e.target.value)}
                                placeholder="e.g. 15 min"
                                className={`px-2.5 py-1 rounded-lg border text-xs font-mono ${
                                  isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(idx)}
                              className="p-1 text-rose-500 hover:text-rose-700"
                              title="Delete Module"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              <span>Preview</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Platform Application: Calculator Suite (bizzcalculators) OR 7-Step Engine Architecture */
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      {isBizzCalculators ? (
                        <Calculator className="h-4 w-4 text-[#2E5E88]" />
                      ) : (
                        <Cpu className="h-4 w-4 text-[#2E5E88]" />
                      )}
                      <span>
                        {isBizzCalculators
                          ? `Included Business & Costing Calculators (${formSteps.length})`
                          : '7-Step Financial & Operational Engine Architecture'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          {isBizzCalculators && (
                            <button
                              type="button"
                              onClick={handleResetCalculatorsToDefaults}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#2E5E88] hover:text-[#2E5E88] flex items-center gap-1 cursor-pointer"
                              title="Load all 12 default bizzcalculators descriptions"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Load 12 Defaults</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleAddStepOrCalculator}
                            className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-[#2E5E88] hover:bg-[#23496B] text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{isBizzCalculators ? 'Add Calculator' : 'Add Step'}</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          Read-Only Inspection (Zero Compute)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selector Grid: Named Calculator Tiles for bizzcalculators, Step Tiles for 7-step apps */}
                  {isBizzCalculators ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {formSteps.map((st: any) => {
                        const isSelected = activeAppStep === st.step;
                        return (
                          <button
                            key={st.step}
                            type="button"
                            onClick={() => setActiveAppStep(st.step)}
                            className={`px-3 py-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-xs'
                                : isDark
                                ? 'bg-[#141B2D] border-[#222F4C] text-slate-300 hover:bg-[#1E2548]'
                                : 'bg-white border-[#D8CEBC] text-slate-700 hover:bg-[#F4EFE6]'
                            }`}
                          >
                            <span
                              className={`text-[10px] font-mono font-bold tabular-nums shrink-0 ${
                                isSelected ? 'text-white/80' : 'text-[#2E5E88] dark:text-[#7FB0DF]'
                              }`}
                            >
                              {padStep(st.step)}
                            </span>
                            <span className="text-[11px] font-mono font-bold truncate">
                              {st.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                      {formSteps.map((st: any) => {
                        const isSelected = activeAppStep === st.step;
                        return (
                          <button
                            key={st.step}
                            type="button"
                            onClick={() => setActiveAppStep(st.step)}
                            className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-xs'
                                : isDark
                                ? 'bg-[#141B2D] border-[#222F4C] text-slate-300 hover:bg-[#1E2548]'
                                : 'bg-white border-[#D8CEBC] text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Layers className="h-4 w-4" />
                            <span className="text-[10px] font-mono font-bold uppercase truncate w-full tabular-nums">
                              Step {padStep(st.step)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected Calculator / Step Detailed Breakdown */}
                  <div
                    className={`p-4 rounded-2xl border space-y-4 ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-[#2E5E88] text-white flex items-center justify-center shrink-0 mt-0.5">
                          {isBizzCalculators ? (
                            <Calculator className="h-4 w-4" />
                          ) : (
                            <Cpu className="h-4 w-4" />
                          )}
                        </div>
                        {!isEditing ? (
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-mono font-bold uppercase text-slate-900 dark:text-white">
                              {isBizzCalculators ? 'Calc' : 'Step'} {padStep(currentStepData.step)}: {currentStepData.title}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 font-sans mt-0.5 leading-relaxed">
                              {currentStepData.desc}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold uppercase text-[#2E5E88] dark:text-[#7FB0DF]">
                                Editing {isBizzCalculators ? 'Calculator' : 'Step'} {padStep(currentStepData.step)} of {padStep(formSteps.length)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveStepOrCalculator(currentStepData.step, -1)}
                                  disabled={currentStepData.step <= 1}
                                  className="p-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Move earlier"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveStepOrCalculator(currentStepData.step, 1)}
                                  disabled={currentStepData.step >= formSteps.length}
                                  className="p-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Move later"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                {formSteps.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStepOrCalculator(currentStepData.step)}
                                    className="px-2 py-1 rounded-md border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                                    title={isBizzCalculators ? 'Remove calculator' : 'Remove step'}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="text"
                              value={currentStepData.title}
                              onChange={(e) => handleUpdateStep(currentStepData.step, 'title', e.target.value)}
                              placeholder={isBizzCalculators ? 'Calculator Name (e.g. Bill of Materials)...' : 'Step Title...'}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                                isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                            <textarea
                              rows={2}
                              value={currentStepData.desc}
                              onChange={(e) => handleUpdateStep(currentStepData.step, 'desc', e.target.value)}
                              placeholder={isBizzCalculators ? 'Describe what this calculator helps the operator calculate...' : 'Step Description...'}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-sans ${
                                isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Inputs Required */}
                      <div
                        className={`p-3 rounded-xl border ${
                          isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
                        }`}
                      >
                        <div className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2">
                          {isBizzCalculators ? 'User Inputs Handled:' : 'Inputs & Assumptions Handled:'}
                        </div>
                        {!isEditing ? (
                          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                            {currentStepData.inputs.map((inp: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{inp}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <textarea
                            rows={4}
                            value={currentStepData.inputs.join('\n')}
                            onChange={(e) =>
                              handleUpdateStep(
                                currentStepData.step,
                                'inputs',
                                e.target.value.split('\n')
                              )
                            }
                            placeholder="Enter inputs (one per line)..."
                            className={`w-full p-2 rounded-lg border text-xs font-mono ${
                              isDark ? 'bg-[#141B2D] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                            }`}
                          />
                        )}
                      </div>

                      {/* Outputs Produced */}
                      <div
                        className={`p-3 rounded-xl border ${
                          isDark ? 'bg-[#0E1322] border-[#222F4C]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
                        }`}
                      >
                        <div className="text-[10px] font-mono font-bold uppercase text-[#2E5E88] dark:text-[#5584B4] mb-2">
                          {isBizzCalculators ? 'Live Outputs & Insights:' : 'Quantitative Outputs & Deliverables:'}
                        </div>
                        {!isEditing ? (
                          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                            {currentStepData.outputs.map((out: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <ArrowRight className="h-3.5 w-3.5 text-[#2E5E88] shrink-0 mt-0.5" />
                                <span>{out}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <textarea
                            rows={4}
                            value={currentStepData.outputs.join('\n')}
                            onChange={(e) =>
                              handleUpdateStep(
                                currentStepData.step,
                                'outputs',
                                e.target.value.split('\n')
                              )
                            }
                            placeholder="Enter outputs (one per line)..."
                            className={`w-full p-2 rounded-lg border text-xs font-mono ${
                              isDark ? 'bg-[#141B2D] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DELIVERABLES & EXPORTS */}
          {activeTab === 'deliverables' && (
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                {isBizzCalculators ? (
                  <Calculator className="h-4 w-4 text-[#2E5E88]" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-[#2E5E88]" />
                )}
                <span>What Is Included With This License</span>
              </div>

              {isBizzCalculators ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase mb-1">
                      <Calculator className="h-4 w-4 text-emerald-500" />
                      <span>All {formSteps.length} Mobile-Ready Calculators</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                      Instant browser-based tools designed for touchscreens and desktops: Breakeven, Margin vs Markup, Bill of Materials (BOM), Working Capital, ROA, Buy vs Lease, and Term Loans.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase mb-1">
                      <Layers className="h-4 w-4 text-[#2E5E88]" />
                      <span>Multi-Product BOM Cost Book</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                      Maintain recipes, pack rounding, multi-level packaging, and variable costs directly on your phone with automatic local save and one-tap handoff to Margin vs Markup and Breakeven.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase mb-1">
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span>20% Token Reinvestment</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                      Instantly earn +{tokensCredited} tokens deposited into your verified bizz-DESK wallet to unlock companion templates, courses, and modeling apps.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase mb-1">
                      <Cpu className="h-4 w-4 text-[#84CC16]" />
                      <span>Once-Off Lifetime Access</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                      Pay once with zero monthly subscription fees. Run unlimited daily pricing, costing, and financing recalculations anywhere from your phone or laptop.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase mb-1">
                      <Download className="h-4 w-4 text-emerald-500" />
                      <span>Unlocked Financial Models</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                      100% unlocked .xlsx and .gsheet financial forecasting sheets with transparent formulas, zero password locks, and audit-ready structure.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase mb-1">
                      <BarChart3 className="h-4 w-4 text-[#2E5E88]" />
                      <span>A4 Investor PDF Export Pack</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                      Executive 5-page PDF board report generation including break-even charts, liquidity vs debt, and GAAP 3-statement reconciliation.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase mb-1">
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span>20% Token Reinvestment</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                      Instantly earn +{tokensCredited} tokens deposited into your verified bizz-DESK wallet to unlock companion templates and services.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase mb-1">
                      <Cpu className="h-4 w-4 text-[#84CC16]" />
                      <span>Unlimited Personal Computations</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                      Once unlocked, run infinite scenario recalculations, rate changes, and break-even simulations in your workstation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRANSPARENT PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#2E5E88]" />
                  <span>Statutory VAT & Transparent Pricing Breakdown</span>
                </div>
                {isEditing && <span className="text-[10px] text-amber-500 font-normal">Pricing & Token Editor</span>}
              </div>

              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Base Selling</div>
                    {!isEditing ? (
                      <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-1">
                        R{sellingPrice.toFixed(2)}
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={formSellingPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFormSellingPrice(val);
                          setFormTokens(Math.round(val * 0.20 * 10) / 10);
                        }}
                        className={`w-full mt-1 p-1 rounded border text-center font-mono font-bold text-sm ${
                          isDark ? 'bg-[#141B2D] border-[#222F4C] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Exclusive Price</div>
                    <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-1">
                      R{exclusivePrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">15% Statutory VAT</div>
                    <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-1">
                      R{vat.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">Tokens Credited</div>
                    {!isEditing ? (
                      <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
                        <Coins className="h-4 w-4" />
                        <span>+{tokensCredited}</span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={formTokens}
                        onChange={(e) => setFormTokens(parseFloat(e.target.value) || 0)}
                        className={`w-full mt-1 p-1 rounded border text-center font-mono font-bold text-sm text-emerald-500 ${
                          isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                        }`}
                      />
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p>
                    <strong>V1 Pricing Policy Rule:</strong> The selling price serves as the definitive calculator base.
                    Statutory VAT (15%) is reconciled transparently, and 20% of every transaction is immediately returned to your verified founder account as reinvestment tokens.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* MODAL FOOTER & ACTION ROW                                             */}
        {/* ===================================================================== */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap ${
            isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-[#F4EFE6] border-[#D8CEBC]'
          }`}
        >
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-emerald-500" />
            <span>Read-only transparency preview. Zero compute charged.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isEditing ? (
              <button
                type="button"
                onClick={handleSaveViewScreen}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>SAVE VIEW SCREEN</span>
              </button>
            ) : (
              <>
                {!isMember && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenSignUp) onOpenSignUp();
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-1.5 border border-[#2B3452] shadow-xs"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-[#5584B4]" />
                    <span>SIGN UP FOR FREE</span>
                  </button>
                )}

                {onBuySolution && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onBuySolution(solution);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#E02475] hover:bg-[#C91A63] text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>BUY SOLUTION (R{sellingPrice.toFixed(2)})</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-xs font-mono font-bold uppercase transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionTransparencyModal;
