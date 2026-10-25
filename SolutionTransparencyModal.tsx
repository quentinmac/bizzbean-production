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

  if (!isOpen || !solution) return null;

  const isDark = theme === 'dark';
  const solutionAny = solution as any;

  // Determine if course or platform application
  const isCourse =
    solutionAny.type === 'course' ||
    (solution.id && ['learn-earn-capital', 'how-to-bizzcalc', 'cost-recovery-calculator', 'follow-the-money', 'financial-reports', 'your-first-hire', 'profit-optimizer', 'financial-scenario-planning', 'annual-business-planning-cycle'].includes(solution.id)) ||
    (solution.name && solution.name.toLowerCase().includes('course'));

  // Match CMS product details if available
  const matchingCms = cmsProducts.find((p) => p.id === solution.id || p.name.toLowerCase() === solution.name.toLowerCase());
  const effectiveProd: any = matchingCms || solution;

  const coverImage =
    effectiveProd.canonicalCoverUrl ||
    effectiveProd.imageUrl ||
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80';

  const initialSellingPrice = effectiveProd.sellingPriceZAR ?? (solutionAny.priceZAR || 0);
  const initialTokens = effectiveProd.tokensAllocated ?? (solutionAny.tokensAllocated || Math.round(initialSellingPrice * 0.2));

  // Default course lessons
  const initialLessons: CmsCourseLesson[] =
    effectiveProd.courseLessons && effectiveProd.courseLessons.length > 0
      ? effectiveProd.courseLessons
      : effectiveProd.lessonTitles && effectiveProd.lessonTitles.length > 0
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

  // Editable form state
  const [formName, setFormName] = useState<string>(solution.name || '');
  const [formSubtitle, setFormSubtitle] = useState<string>(solution.subtitle || '');
  const [formPurpose, setFormPurpose] = useState<string>(effectiveProd.purpose || solution.purpose || solution.description || '');
  const [formChallenge, setFormChallenge] = useState<string>(
    effectiveProd.challengeText ||
    'Building in premature scale without unit economics clarity leads to unrecoverable burn. Founders need clear visibility before committing capital.'
  );
  const [formTargetProfile, setFormTargetProfile] = useState<string>(
    effectiveProd.targetProfile || 'Pre-Seed to Series A Founders, Financial Directors, Advisory Teams'
  );
  const [formWhatYouGet, setFormWhatYouGet] = useState<string[]>(
    effectiveProd.whatYouGet && effectiveProd.whatYouGet.length > 0
      ? effectiveProd.whatYouGet
      : [
          'Interactive financial models with live scenario sliders',
          'Downloadable audit-proof reports & export formats',
          'Macro-free Google Workspace spreadsheet connectors',
          'Pre-configured chart of accounts and runway schedules',
        ]
  );
  const [formCapabilities, setFormCapabilities] = useState<string[]>(
    effectiveProd.modules && effectiveProd.modules.length > 0
      ? effectiveProd.modules
      : effectiveProd.features || (solution as any).features || [
          'Live sensitivity forecasting and break-even analysis',
          'Institutional 3-statement model integration',
          'Zero compute overhead on pre-purchase review',
        ]
  );
  const [formCompanionFile, setFormCompanionFile] = useState<string>(
    effectiveProd.companionMaterialFilename || 'Framework_Templates.zip'
  );
  const [formLessons, setFormLessons] = useState<CmsCourseLesson[]>(initialLessons);
  const [formSteps, setFormSteps] = useState(
    effectiveProd.engineSteps && effectiveProd.engineSteps.length > 0
      ? effectiveProd.engineSteps
      : DEFAULT_APP_ENGINE_STEPS
  );
  const [formSellingPrice, setFormSellingPrice] = useState<number>(initialSellingPrice);
  const [formTokens, setFormTokens] = useState<number>(initialTokens);

  // Synchronize state if underlying solution changes
  useEffect(() => {
    setFormName(solution.name || '');
    setFormSubtitle(solution.subtitle || '');
    setFormPurpose(effectiveProd.purpose || solution.purpose || solution.description || '');
    if (effectiveProd.challengeText) setFormChallenge(effectiveProd.challengeText);
    if (effectiveProd.targetProfile) setFormTargetProfile(effectiveProd.targetProfile);
    if (effectiveProd.whatYouGet) setFormWhatYouGet(effectiveProd.whatYouGet);
    if (effectiveProd.modules) setFormCapabilities(effectiveProd.modules);
    if (effectiveProd.companionMaterialFilename) setFormCompanionFile(effectiveProd.companionMaterialFilename);
    if (effectiveProd.courseLessons && effectiveProd.courseLessons.length > 0) {
      setFormLessons(effectiveProd.courseLessons);
    }
    if (effectiveProd.engineSteps && effectiveProd.engineSteps.length > 0) {
      setFormSteps(effectiveProd.engineSteps);
    }
    setFormSellingPrice(initialSellingPrice);
    setFormTokens(initialTokens);
    setIsEditing(false);
  }, [solution.id]);

  // Calculated pricing metrics
  const sellingPrice = formSellingPrice;
  const tokensCredited = formTokens;
  const exclusivePrice = sellingPrice > 0 ? Math.round((sellingPrice / 1.15) * 100) / 100 : 0;
  const vat = Math.round((sellingPrice - exclusivePrice) * 100) / 100;

  // Handle Save
  const handleSaveViewScreen = () => {
    const updatedProd: CmsProduct = {
      ...effectiveProd,
      id: effectiveProd.id || solution.id,
      seq: effectiveProd.seq || 1,
      type: isCourse ? 'course' : 'app',
      stage: effectiveProd.stage || (solution.stage as any) || 'vi-ability',
      sku: effectiveProd.sku || 'BA-001',
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
      engineSteps: !isCourse ? formSteps : effectiveProd.engineSteps,
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

  // Helper for 7 engine steps
  const handleUpdateStep = (stepNumber: number, field: string, val: any) => {
    setFormSteps(
      formSteps.map((st: any) => (st.step === stepNumber ? { ...st, [field]: val } : st))
    );
  };

  const currentStepData = formSteps.find((s: any) => s.step === activeAppStep) || formSteps[0] || DEFAULT_APP_ENGINE_STEPS[0];

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
              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>SKU: {effectiveProd.sku || 'BZ-001'}</span>
                <span>•</span>
                <span className="text-[#2E5E88] dark:text-[#5584B4] font-medium lowercase">
                  stage: {solution.stage || 'vi-ability'}
                </span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <Cpu className="h-3 w-3" />
                  <span>zero compute consumed</span>
                </span>
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
            { id: 'curriculum', label: isCourse ? '2. SYLLABUS & LESSONS' : '2. 7-STEP ENGINE ARCHITECTURE' },
            { id: 'deliverables', label: '3. DELIVERABLES & EXPORTS' },
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
                /* Platform Application 7-Step Engine Architecture */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-[#2E5E88]" />
                      <span>7-Step Financial & Operational Engine Architecture</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {isEditing ? 'Live Engine Editor' : 'Read-Only Inspection (Zero Compute)'}
                    </span>
                  </div>

                  {/* Step Selector Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                    {formSteps.map((st: any) => {
                      const isSelected = activeAppStep === st.step;
                      return (
                        <button
                          key={st.step}
                          type="button"
                          onClick={() => setActiveAppStep(st.step)}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-xs'
                              : isDark
                              ? 'bg-[#141B2D] border-[#222F4C] text-slate-300 hover:bg-[#1E2548]'
                              : 'bg-white border-[#D8CEBC] text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Layers className="h-4 w-4" />
                          <span className="text-[10px] font-mono font-bold uppercase truncate w-full">
                            Step 0{st.step}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Step Detailed Breakdown */}
                  <div
                    className={`p-4 rounded-2xl border space-y-4 ${
                      isDark ? 'bg-[#141B2D] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="h-8 w-8 rounded-lg bg-[#2E5E88] text-white flex items-center justify-center shrink-0">
                          <Cpu className="h-4 w-4" />
                        </div>
                        {!isEditing ? (
                          <div>
                            <div className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                              Step 0{currentStepData.step}: {currentStepData.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-sans">{currentStepData.desc}</div>
                          </div>
                        ) : (
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              value={currentStepData.title}
                              onChange={(e) => handleUpdateStep(currentStepData.step, 'title', e.target.value)}
                              placeholder="Step Title..."
                              className={`w-full px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
                                isDark ? 'bg-[#0E1322] border-[#252E4A] text-white' : 'bg-white border-[#D8CEBC] text-slate-900'
                              }`}
                            />
                            <textarea
                              rows={2}
                              value={currentStepData.desc}
                              onChange={(e) => handleUpdateStep(currentStepData.step, 'desc', e.target.value)}
                              placeholder="Step Description..."
                              className={`w-full px-2.5 py-1 rounded-lg border text-xs font-sans ${
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
                          Inputs & Assumptions Handled:
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
                                e.target.value.split('\n').filter((x) => x.trim().length > 0)
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
                          Quantitative Outputs & Deliverables:
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
                                e.target.value.split('\n').filter((x) => x.trim().length > 0)
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
                <FileSpreadsheet className="h-4 w-4 text-[#2E5E88]" />
                <span>What Is Included With This License</span>
              </div>

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
