import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Download,
  Video,
  Play,
  ExternalLink,
  Link as LinkIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  RefreshCw,
  Film,
} from 'lucide-react';
import { CmsProduct, CmsCourseLesson } from '../data/cmsConsoleData';
import { safeSaveStorage, getDeletedProductIds, MASTER_COURSE_CURRICULA, findMasterCurriculum, getCanonicalCourseId, findMatchingCourse, isBogusLessonUrl } from '../utils/imageStorage';
import { saveCmsProductsToFirestore } from '../services/cmsFirestoreService';

interface BizzClassProps {
  theme?: string;
  cmsProducts: CmsProduct[];
  userProfile?: { founderName?: string; companyName?: string };
  initialCourseId?: string;
  onBackToWorkstation: () => void;
  onSyncProductsToWebsite: (products: CmsProduct[]) => void;
}

// Fallback courses matching bizzclass.jpg if not present in products
const DEFAULT_COURSES: CmsProduct[] = [
  {
    id: 'learn-earn-capital',
    seq: 1,
    type: 'course',
    stage: 'vi-ability',
    sku: 'BC-001',
    name: 'learn how to earn access to capital',
    subtitle: 'earn access to capital',
    description: 'This free course will teach you how to earn access to capital.',
    purpose: 'This free course will teach you how to earn access to capital.',
    billingModel: 'once-off',
    exclusivePriceZAR: 0,
    vatZAR: 0,
    sellingPriceZAR: 0,
    tokensAllocated: 0,
    ticketPriceZAR: 0,
    isPurchased: true,
    activeInSync: true,
    syllabusLessonsCount: 3,
    lessonTitles: [
      '1 - THE FOUNDER HYPOTHESIS VS. REALITY',
      '2 - CALCULATING CLEAN CAC',
      '3 - CAPITAL ACCESS GATEWAY CHECKLIST',
    ],
    courseLessons: [
      { id: 'cl-1', name: '1 - THE FOUNDER HYPOTHESIS VS. REALITY', duration: '14 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
      { id: 'cl-2', name: '2 - CALCULATING CLEAN CAC', duration: '18 min', youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads' },
      { id: 'cl-3', name: '3 - CAPITAL ACCESS GATEWAY CHECKLIST', duration: '12 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    ],
    canonicalCoverUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    companionMaterialFilename: 'Capital_Access_Framework_Workbook.zip',
  },
  {
    id: 'how-to-bizzcalc',
    seq: 2,
    type: 'course',
    stage: 'vi-ability',
    sku: 'BC-002',
    name: 'how to use bizzcalc',
    subtitle: 'Practical Walkthrough & Cost Recovery Case Studies',
    canonicalCoverUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    description: 'Step-by-step masterclass demonstrating how to enter bills of materials (BOM), assign indirect labor, and audit gross margins.',
    purpose: 'Ensure every team member uses standardized cost-accounting formulas across quoting and invoicing.',
    billingModel: 'once-off',
    exclusivePriceZAR: 150.00,
    vatZAR: 22.50,
    sellingPriceZAR: 172.50,
    tokensAllocated: 35.0,
    ticketPriceZAR: 207.00,
    isPurchased: true,
    activeInSync: true,
    syllabusLessonsCount: 2,
    lessonTitles: [
      '1 - MAPPING FIXED VS VARIABLE ALLOCATIONS',
      '2 - REAL-WORLD PRICING AUDITS',
    ],
    courseLessons: [
      { id: 'cl-b1', name: '1 - MAPPING FIXED VS VARIABLE ALLOCATIONS', duration: '11 min', youtubeUrl: 'https://www.youtube.com/watch?v=0--AvwZabIQ' },
      { id: 'cl-b2', name: '2 - REAL-WORLD PRICING AUDITS', duration: '16 min', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
    ],
    companionMaterialFilename: 'Bizzcalc_Companion_Templates.zip',
  },
  {
    id: 'cost-recovery-calculator',
    seq: 3,
    type: 'course',
    stage: 'fund-ability',
    sku: 'BC-003',
    name: 'cost recovery calculator',
    subtitle: 'Cost Recovery, Break-Even & Contribution Margin Masterclass',
    description: 'Master practical production costing, employee rates, material dynamics, and fixed asset depreciation to ensure 100% cost recovery.',
    purpose: 'Learn how to accurately cost products and ensure sustainable break-even unit sales.',
    billingModel: 'once-off',
    exclusivePriceZAR: 199.13,
    vatZAR: 29.87,
    sellingPriceZAR: 229.00,
    tokensAllocated: 45.8,
    ticketPriceZAR: 274.80,
    isPurchased: true,
    activeInSync: true,
    syllabusLessonsCount: 7,
    lessonTitles: [
      '1 - INTRODUCTION',
      '2 - PRODUCTION CALCULATOR',
      '3 - EMPLOYEE CALCULATOR',
      '4 - MATERIALS COSTING',
      '5 - EXPENSE DYNAMICS',
      '6 - FIXED ASSETS',
      '7 - EMPLOYMENT EXPENSES',
    ],
    courseLessons: [
      { id: 'crc-1', name: '1 - INTRODUCTION', duration: '4 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
      { id: 'crc-2', name: '2 - PRODUCTION CALCULATOR', duration: '7 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
      { id: 'crc-3', name: '3 - EMPLOYEE CALCULATOR', duration: '9 min', youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads' },
      { id: 'crc-4', name: '4 - MATERIALS COSTING', duration: '6 min', youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc' },
      { id: 'crc-5', name: '5 - EXPENSE DYNAMICS', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=r6h0R1sDx50' },
      { id: 'crc-6', name: '6 - FIXED ASSETS', duration: '7 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
      { id: 'crc-7', name: '7 - EMPLOYMENT EXPENSES', duration: '10 min', youtubeUrl: 'https://www.youtube.com/watch?v=DiVPAjgmnj0' },
    ],
    canonicalCoverUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    companionMaterialFilename: 'Cost_Recovery_Calculator_Workbook.zip',
  },
  {
    id: 'follow-the-money',
    seq: 4,
    type: 'course',
    stage: 'fund-ability',
    sku: 'BC-004',
    name: 'follow the money',
    subtitle: 'Cash Conversion Cycles & Capital Velocity',
    canonicalCoverUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
    description: 'Track venture cash burn, debtor lag, and working capital recovery curves.',
    purpose: 'Understand how cash velocity determines venture solvency.',
    billingModel: 'once-off',
    exclusivePriceZAR: 249.00,
    vatZAR: 37.35,
    sellingPriceZAR: 286.35,
    tokensAllocated: 50.0,
    ticketPriceZAR: 343.62,
    isPurchased: true,
    activeInSync: true,
    syllabusLessonsCount: 3,
    lessonTitles: ['1 - CASH CONVERSION CYCLE', '2 - WORKING CAPITAL RECOVERY', '3 - RECEIVABLES VELOCITY'],
    courseLessons: [
      { id: 'ftm-1', name: '1 - CASH CONVERSION CYCLE', duration: '5 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
      { id: 'ftm-2', name: '2 - WORKING CAPITAL RECOVERY', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=DiVPAjgmnj0' },
      { id: 'ftm-3', name: '3 - RECEIVABLES VELOCITY', duration: '12 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    ],
    companionMaterialFilename: 'Follow_The_Money_Workbook.zip',
  },
  {
    id: 'financial-reports',
    seq: 5,
    type: 'course',
    stage: 'fund-ability',
    sku: 'BC-005',
    name: 'financial reports',
    subtitle: 'Auditing 3-Statement Forecasting & Dilution Scenarios',
    canonicalCoverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    description: 'Master Income Statement, Balance Sheet, and Cash Flow reconciliation for investor defense.',
    purpose: 'Prepare audit-proof 3-statement financial models.',
    billingModel: 'once-off',
    exclusivePriceZAR: 299.00,
    vatZAR: 44.85,
    sellingPriceZAR: 343.85,
    tokensAllocated: 60.0,
    ticketPriceZAR: 412.62,
    isPurchased: true,
    activeInSync: true,
    syllabusLessonsCount: 3,
    lessonTitles: ['1 - 3-STATEMENT RECONCILIATION', '2 - EBITDA VS FREE CASH FLOW', '3 - BALANCE SHEET STRESS TEST'],
    courseLessons: [
      { id: 'fr-1', name: '1 - 3-STATEMENT RECONCILIATION', duration: '6 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
      { id: 'fr-2', name: '2 - EBITDA VS FREE CASH FLOW', duration: '10 min', youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc' },
      { id: 'fr-3', name: '3 - BALANCE SHEET STRESS TEST', duration: '14 min', youtubeUrl: 'https://www.youtube.com/watch?v=r6h0R1sDx50' },
    ],
    companionMaterialFilename: 'Financial_Reports_Model.zip',
  },
  {
    id: 'your-first-hire',
    seq: 6,
    type: 'course',
    stage: 'operations',
    sku: 'BC-006',
    name: 'your first hire',
    subtitle: 'Labor Costing, Quotas & Contribution Economics',
    canonicalCoverUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80',
    description: 'Calculate fully burdened salary rates, onboarding lag, and revenue contribution quotas before recruiting.',
    purpose: 'Prevent premature scaling and headcount-driven cash burn.',
    billingModel: 'once-off',
    exclusivePriceZAR: 199.00,
    vatZAR: 29.85,
    sellingPriceZAR: 228.85,
    tokensAllocated: 40.0,
    ticketPriceZAR: 274.62,
    isPurchased: true,
    activeInSync: true,
    syllabusLessonsCount: 3,
    lessonTitles: ['1 - FULLY BURDENED LABOR RATE', '2 - HIRING REVENUE MULTIPLE', '3 - EMPLOYEE CONTRIBUTION QUOTA'],
    courseLessons: [
      { id: 'yfh-1', name: '1 - FULLY BURDENED LABOR RATE', duration: '5 min', youtubeUrl: 'https://www.youtube.com/watch?v=0--AvwZabIQ' },
      { id: 'yfh-2', name: '2 - HIRING REVENUE MULTIPLE', duration: '9 min', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
      { id: 'yfh-3', name: '3 - EMPLOYEE CONTRIBUTION QUOTA', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
    ],
    companionMaterialFilename: 'First_Hire_Costing_Template.zip',
  },
  {
    id: 'profit-optimizer',
    seq: 7,
    type: 'course',
    stage: 'growth',
    sku: 'BC-007',
    name: 'profit dynamics',
    subtitle: 'Operational Margin Defense & Contribution Discipline',
    canonicalCoverUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    description: 'Analyze operational expenditures, SaaS sprawl, and departmental contribution margins.',
    purpose: 'Protect margins and prevent operational bleed.',
    billingModel: 'once-off',
    exclusivePriceZAR: 199.13,
    vatZAR: 29.87,
    sellingPriceZAR: 229.00,
    tokensAllocated: 45.8,
    ticketPriceZAR: 274.80,
    isPurchased: true,
    activeInSync: true,
    syllabusLessonsCount: 3,
    lessonTitles: ['1 - CONTRIBUTION MARGIN WATERFALL', '2 - VOLUME SENSITIVITY MATRIX', '3 - PRICING POWER EXPERIMENTS'],
    courseLessons: [
      { id: 'pd-1', name: '1 - CONTRIBUTION MARGIN WATERFALL', duration: '6 min', youtubeUrl: 'https://www.youtube.com/watch?v=vUT8lZLZpKg' },
      { id: 'pd-2', name: '2 - VOLUME SENSITIVITY MATRIX', duration: '11 min', youtubeUrl: 'https://www.youtube.com/watch?v=3wyZYsk8OTY' },
      { id: 'pd-3', name: '3 - PRICING POWER EXPERIMENTS', duration: '13 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
    ],
    companionMaterialFilename: 'Profit_Dynamics_Workbook.zip',
  },
  {
    id: 'financial-scenario-planning',
    seq: 8,
    type: 'course',
    stage: 'sustain-ability',
    sku: 'BC-008',
    name: 'financial scenario planning',
    subtitle: 'venture growth engine',
    canonicalCoverUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    description: 'Dynamic operational drivers, headcount scaling, runway alarm thresholds, and multi-scenario forecasting.',
    purpose: 'Model venture sensitivity across base, bear, and bull operating environments.',
    billingModel: 'once-off',
    exclusivePriceZAR: 299.00,
    vatZAR: 44.85,
    sellingPriceZAR: 343.85,
    tokensAllocated: 60.0,
    ticketPriceZAR: 412.62,
    isPurchased: true,
    activeInSync: true,
    syllabusLessonsCount: 3,
    lessonTitles: [
      '1 - BASE, BULL & BEAR SCENARIO MATRIX',
      '2 - RUNWAY ALARM & WORKING CAPITAL DRIFT',
      '3 - REVENUE DRIVERS & SENSITIVITY MODELING',
    ],
    courseLessons: [
      { id: 'fsp-1', name: '1 - BASE, BULL & BEAR SCENARIO MATRIX', duration: '8 min', youtubeUrl: 'https://www.youtube.com/watch?v=9dwqCG-vnVA' },
      { id: 'fsp-2', name: '2 - RUNWAY ALARM & WORKING CAPITAL DRIFT', duration: '12 min', youtubeUrl: 'https://www.youtube.com/watch?v=DiVPAjgmnj0' },
      { id: 'fsp-3', name: '3 - REVENUE DRIVERS & SENSITIVITY MODELING', duration: '15 min', youtubeUrl: 'https://www.youtube.com/watch?v=5L0wwsNFads' },
    ],
    companionMaterialFilename: 'Financial_Scenario_Modeler.zip',
  },
  {
    id: 'annual-business-planning-cycle',
    seq: 9,
    type: 'course',
    stage: 'sustain-ability',
    sku: 'BC-009',
    name: 'annual business planning cycle',
    subtitle: 'professionalize your business',
    canonicalCoverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    description: 'Annual operating cadence, departmental budget reconciliation, CapEx allocations, and quarterly variance audits.',
    purpose: 'Standardize quarterly executive board packs and annual budget reviews.',
    billingModel: 'once-off',
    exclusivePriceZAR: 299.00,
    vatZAR: 44.85,
    sellingPriceZAR: 343.85,
    tokensAllocated: 60.0,
    ticketPriceZAR: 412.62,
    isPurchased: true,
    activeInSync: true,
    syllabusLessonsCount: 3,
    lessonTitles: [
      '1 - ANNUAL OPERATING CADENCE & MILESTONES',
      '2 - DEPARTMENTAL BUDGET RECONCILIATION',
      '3 - QUARTERLY VARIANCE AUDITS & BOARD PACK',
    ],
    courseLessons: [
      { id: 'abp-1', name: '1 - ANNUAL OPERATING CADENCE & MILESTONES', duration: '7 min', youtubeUrl: 'https://www.youtube.com/watch?v=YiUirHhqBoc' },
      { id: 'abp-2', name: '2 - DEPARTMENTAL BUDGET RECONCILIATION', duration: '11 min', youtubeUrl: 'https://www.youtube.com/watch?v=r6h0R1sDx50' },
      { id: 'abp-3', name: '3 - QUARTERLY VARIANCE AUDITS & BOARD PACK', duration: '14 min', youtubeUrl: 'https://www.youtube.com/watch?v=xbasHzq2fL0' },
    ],
    companionMaterialFilename: 'Annual_Planning_Cycle_Playbook.zip',
  },
];

export const BizzClass: React.FC<BizzClassProps> = ({
  theme = 'light',
  cmsProducts = [],
  userProfile,
  initialCourseId = 'cost-recovery-calculator',
  onBackToWorkstation,
  onSyncProductsToWebsite,
}) => {
  const isDark = theme === 'dark';

  // Extract all available course products from cmsProducts merged with master catalog
  const availableCourses = useMemo(() => {
    const deletedIds = getDeletedProductIds();

    // 1. Gather all course candidates from cmsProducts
    const cmsCourses = (cmsProducts || []).filter((p) => {
      if (!p) return false;
      const isKnownCourse =
        p.type === 'course' ||
        (p.courseLessons && p.courseLessons.length > 0) ||
        (p.sku && p.sku.startsWith('BC-')) ||
        Boolean(getCanonicalCourseId(p.id || '')) ||
        Boolean(getCanonicalCourseId(p.name || ''));
      if (!isKnownCourse) return false;

      // Never hide core master courses even if accidentally in deletedIds
      const isCoreMaster =
        p.id === 'cost-recovery-calculator' ||
        (p.name || '').toLowerCase().includes('cost recovery') ||
        p.id === 'learn-earn-capital' ||
        p.id === 'profit-optimizer';
      if (isCoreMaster) return true;

      return !deletedIds.has(p.id);
    }).map((p) => {
      if (p.type !== 'course') return { ...p, type: 'course' as const };
      return p;
    });

    // 2. Map keyed by canonical ID / ID to guarantee full master curriculum availability
    const courseMap = new Map<string, CmsProduct>();

    // Seed master catalog courses first
    DEFAULT_COURSES.forEach((dc) => {
      courseMap.set(dc.id, { ...dc });
    });

    // Overlay user CMS products (incorporating user edited lessons, companion workbooks, etc.)
    cmsCourses.forEach((c) => {
      const canonId = getCanonicalCourseId(c.id) || getCanonicalCourseId(c.name) || c.id;
      const existing = courseMap.get(canonId) || courseMap.get(c.id);
      if (existing) {
        const rawLessons = (c.courseLessons && c.courseLessons.length > 0) ? c.courseLessons : existing.courseLessons;
        const cleanedLessons = (rawLessons || []).map((l, idx) => {
          const fallbackLesson = existing.courseLessons?.[idx];
          const url = (l.youtubeUrl || '').trim();
          const effectiveUrl = (!url || isBogusLessonUrl(url)) ? (fallbackLesson?.youtubeUrl || '') : url;
          return {
            ...l,
            youtubeUrl: effectiveUrl,
          };
        });

        courseMap.set(existing.id, {
          ...existing,
          ...c,
          id: existing.id,
          name: c.name || existing.name,
          subtitle: c.subtitle || existing.subtitle,
          courseLessons: cleanedLessons,
          syllabusLessonsCount: cleanedLessons.length,
          lessonTitles: cleanedLessons.map((l) => l.name),
          companionMaterialFilename: c.companionMaterialFilename || existing.companionMaterialFilename,
          stage: c.stage || existing.stage,
        });
      } else {
        courseMap.set(c.id, { ...c });
      }
    });

    // Ensure cost-recovery-calculator is definitely present with its 7 lessons
    if (!courseMap.has('cost-recovery-calculator')) {
      courseMap.set('cost-recovery-calculator', { ...DEFAULT_COURSES[2] });
    }

    return Array.from(courseMap.values()).sort((a, b) => (a.seq || 0) - (b.seq || 0));
  }, [cmsProducts]);

  // Selected Course - perfectly resolving initialCourseId
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    const match = findMatchingCourse(initialCourseId, availableCourses);
    if (match) return match.id;
    if (initialCourseId) {
      const lower = initialCourseId.toLowerCase();
      if (lower.includes('cost') || lower.includes('fund') || lower.includes('recovery')) {
        const costMatch = findMatchingCourse('cost-recovery-calculator', availableCourses);
        if (costMatch) return costMatch.id;
      }
    }
    return availableCourses.find((c) => c.id === 'cost-recovery-calculator')?.id || availableCourses[0]?.id || 'cost-recovery-calculator';
  });

  // Keep selectedCourseId perfectly synced whenever initialCourseId changes (e.g. from flashcard LAUNCH or PINBOARD)
  useEffect(() => {
    if (!initialCourseId) return;
    const match = findMatchingCourse(initialCourseId, availableCourses);
    if (match && match.id !== selectedCourseId) {
      setSelectedCourseId(match.id);
      setActiveLessonIdx(0);
      setIsPlaying(false);
    }
  }, [initialCourseId, availableCourses]);

  const activeCourse = useMemo(() => {
    return (
      availableCourses.find((c) => c.id === selectedCourseId) ||
      availableCourses[0] ||
      DEFAULT_COURSES[2]
    );
  }, [availableCourses, selectedCourseId]);

  // Lessons of current active course
  const lessons: CmsCourseLesson[] = useMemo(() => {
    const raw = activeCourse.courseLessons || [];
    const normName = (activeCourse.name || '').toLowerCase().trim();
    const master = MASTER_COURSE_CURRICULA[normName] || findMasterCurriculum(activeCourse.name || activeCourse.id || '');

    const hasBogus = raw.some((l) => isBogusLessonUrl(l.youtubeUrl));
    const isPlaceholder =
      raw.length === 0 ||
      hasBogus ||
      (raw.length === 1 &&
        (!raw[0].youtubeUrl || raw[0].youtubeUrl.trim() === '') &&
        raw[0].name.toLowerCase().includes('strategic foundations'));

    if (master && master.length > 0 && (isPlaceholder || raw.length === 0)) {
      return master.map((m, idx) => {
        const existingLesson = raw[idx];
        const userUrl = existingLesson?.youtubeUrl?.trim() || '';
        const effectiveUrl = (!userUrl || isBogusLessonUrl(userUrl)) ? m.youtubeUrl : userUrl;
        return {
          ...m,
          ...(existingLesson || {}),
          name: existingLesson?.name || m.name,
          duration: existingLesson?.duration || m.duration,
          youtubeUrl: effectiveUrl,
        };
      });
    }

    if (raw.length > 0) {
      return raw.map((l) => ({ ...l }));
    }
    if (activeCourse.lessonTitles && activeCourse.lessonTitles.length > 0) {
      return activeCourse.lessonTitles.map((title, idx) => ({
        id: `gen-lesson-${idx + 1}`,
        name: title,
        duration: `${(idx + 1) * 3 + 1} min`,
        youtubeUrl: '',
      }));
    }
    return [
      { id: 'lsn-1', name: '1 - INTRODUCTION', duration: '4 min', youtubeUrl: '' },
      { id: 'lsn-2', name: '2 - PRODUCTION CALCULATOR', duration: '7 min', youtubeUrl: '' },
    ];
  }, [activeCourse]);

  // Active Lesson
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  const currentLesson: CmsCourseLesson = lessons[activeLessonIdx] || lessons[0];

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Toggle "INCLUDE ALL COURSES"
  const [includeAllCourses, setIncludeAllCourses] = useState<boolean>(true);

  // Link Manager Modal for testing links
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [editingLessonUrl, setEditingLessonUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync editingLessonUrl when active lesson changes
  useEffect(() => {
    setEditingLessonUrl(currentLesson.youtubeUrl || '');
    setIsPlaying(false);
  }, [activeLessonIdx, selectedCourseId, currentLesson.youtubeUrl]);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const courseScrollRef = useRef<HTMLDivElement>(null);
  const handleScrollCourses = (direction: 'left' | 'right') => {
    if (courseScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      courseScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Helper: Extract stream embed URL across YouTube (watch, shorts, embed, share), Vimeo, Loom, and MP4
  const getEmbedUrl = (rawUrl?: string): string | null => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (!trimmed || isBogusLessonUrl(trimmed)) return null;

    if (trimmed.includes('youtube.com/embed/')) return trimmed;

    // Standard YouTube watch?v=, youtu.be/, shorts/, or embed/
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
    }

    // Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    // Loom
    const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
    if (loomMatch && loomMatch[1]) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }

    // Direct MP4 or video link
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return null;
  };

  const currentEmbedUrl = getEmbedUrl(currentLesson?.youtubeUrl);

  // Save updated lesson URL to course and persist safely to entire product catalog
  const handleSaveLessonUrl = (newUrl: string) => {
    const updatedLessons = lessons.map((l, idx) =>
      idx === activeLessonIdx ? { ...l, youtubeUrl: newUrl.trim() } : l
    );

    const updatedCourseObj: CmsProduct = {
      ...activeCourse,
      courseLessons: updatedLessons,
      syllabusLessonsCount: updatedLessons.length,
      lessonTitles: updatedLessons.map((l) => l.name),
    };

    // Ensure we preserve the entire cmsProducts collection (excluding deleted products)
    const deletedIds = getDeletedProductIds();
    const currentBase =
      cmsProducts && cmsProducts.length > 0
        ? cmsProducts.filter((p) => !deletedIds.has(p.id))
        : DEFAULT_COURSES.filter((p) => !deletedIds.has(p.id));
    const exists = currentBase.some((p) => p.id === activeCourse.id);
    const updatedAllProducts = exists
      ? currentBase.map((p) => (p.id === activeCourse.id ? updatedCourseObj : p))
      : [...currentBase, updatedCourseObj];

    onSyncProductsToWebsite(updatedAllProducts);
    safeSaveStorage('bizzdesk_cms_products_v1', updatedAllProducts);
    saveCmsProductsToFirestore(updatedAllProducts).catch((err) =>
      console.warn('Firestore BizzClass product sync note:', err)
    );

    setToastMessage(`Saved & linked video for "${currentLesson.name}".`);
    setIsLinkModalOpen(false);
  };

  // Quick download mock companion workbook
  const handleDownloadMaterial = () => {
    const filename = activeCourse.companionMaterialFilename || `${activeCourse.id}_course_workbook.zip`;
    const dummyContent = `BIZZCLASS COURSE MASTER SUITE: ${activeCourse.name.toUpperCase()}\n\nModule: ${activeCourse.subtitle || ''}\nLessons count: ${lessons.length}\nDate: ${new Date().toLocaleDateString()}\n\nAuthorized for: ${userProfile?.founderName || 'Quentin McCullough'}`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.zip$/i, '.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage(`Downloaded course companion material: ${filename}`);
  };

  const studentName = userProfile?.founderName || 'Quentin McCullough';

  return (
    <div
      className={`w-full h-full flex flex-col font-sans select-none overflow-hidden transition-colors ${
        isDark ? 'bg-[#0E1322] text-slate-100' : 'bg-[#EBF1F6] text-slate-900'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in border border-emerald-400">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER BAR (Directly matching bizzclass.jpg with generous vertical headroom & clear button visibility matching BizzDynamics) */}
      <header
        className={`px-4 sm:px-6 py-3.5 sm:py-4.5 min-h-[64px] sm:min-h-[72px] border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#141B2D] border-[#252F4A]' : 'bg-[#3A5D7C] border-[#2C4A65] text-white shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Back button (circular button with left arrow) */}
          <button
            type="button"
            onClick={onBackToWorkstation}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white shadow-xs shrink-0"
            title="Return to Workstation"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* bizzclass — course master suite */}
          <div className="flex items-center gap-2 ml-1">
            <span className="font-logo font-bold text-base sm:text-lg lowercase tracking-wide text-white leading-none">
              bizzclass
            </span>
            <span className="text-white/70 text-xs sm:text-sm font-sans">
              — course master suite
            </span>
          </div>
        </div>

        {/* Right side: Welcome, Quentin McCullough */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono shrink-0">
          <BookOpen className="h-4 w-4 text-white/80" />
          <span className="text-white/80">Welcome,</span>
          <span className="text-[#84CC16] font-bold tracking-wide">
            {studentName}
          </span>
        </div>
      </header>

      {/* COURSE CAROUSEL / NAVIGATION ROW (Matching bizzclass.jpg) */}
      <div
        className={`px-4 py-2 border-b flex items-center gap-3 shrink-0 ${
          isDark ? 'bg-[#111728] border-[#202942]' : 'bg-[#F4F7FA] border-[#D2DCE6]'
        }`}
      >
        {/* INCLUDE ALL COURSES Toggle */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-300 dark:border-[#202942] shrink-0">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            INCLUDE ALL COURSES
          </span>
          <button
            type="button"
            onClick={() => setIncludeAllCourses(!includeAllCourses)}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
              includeAllCourses ? 'bg-[#2E5E88]' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                includeAllCourses ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Carousel Scroll Left */}
        <button
          type="button"
          onClick={() => handleScrollCourses('left')}
          className="h-7 w-7 rounded-lg flex items-center justify-center bg-slate-200 dark:bg-[#1A233A] hover:bg-slate-300 dark:hover:bg-[#253254] text-slate-700 dark:text-slate-300 transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Horizontal Scrollable Course Tabs */}
        <div
          ref={courseScrollRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
        >
          {availableCourses.map((c) => {
            const isSelected = c.id === activeCourse.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCourseId(c.id);
                  setActiveLessonIdx(0);
                  setIsPlaying(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide uppercase whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#2E5E88] text-white shadow-md border border-[#457C9F]'
                    : isDark
                    ? 'bg-[#182035] text-slate-300 hover:text-white hover:bg-[#212C48]'
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-[#D5DEE6]'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Carousel Scroll Right */}
        <button
          type="button"
          onClick={() => handleScrollCourses('right')}
          className="h-7 w-7 rounded-lg flex items-center justify-center bg-slate-200 dark:bg-[#1A233A] hover:bg-slate-300 dark:hover:bg-[#253254] text-slate-700 dark:text-slate-300 transition-colors shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* MAIN BODY: 2-COLUMN LAYOUT (Course Details & Lessons on Left, Simulator Stream on Right) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        
        {/* LEFT COLUMN: SELECTED COURSE, COURSE MATERIAL, LESSONS */}
        <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0 overflow-y-auto">
          
          {/* 1. SELECTED COURSE CARD */}
          <div
            className={`p-4 rounded-2xl border text-center ${
              isDark
                ? 'bg-[#141B2D] border-[#252F4A]'
                : 'bg-[#2E5579] border-[#244360] text-white shadow-xs'
            }`}
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/70">
              SELECTED COURSE
            </div>
            <div className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wide text-white mt-1">
              {activeCourse.name}
            </div>
          </div>

          {/* 2. COURSE MATERIAL CARD */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#141B2D] border-[#252F4A]' : 'bg-[#2E5579] border-[#244360] text-white'
            }`}
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2 text-center">
              COURSE MATERIAL
            </div>
            <button
              type="button"
              onClick={handleDownloadMaterial}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-[#234563] font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.99]"
            >
              <Download className="h-4 w-4" />
              <span>DOWNLOAD COURSE MATERIAL</span>
            </button>
          </div>

          {/* 3. LESSONS LIST CARD */}
          <div
            className={`flex-1 rounded-2xl border flex flex-col overflow-hidden min-h-[300px] ${
              isDark ? 'bg-[#141B2D] border-[#252F4A]' : 'bg-[#2E5579] border-[#244360] text-white'
            }`}
          >
            <div className="p-3 text-[10px] font-mono font-bold uppercase tracking-wider text-white/80 border-b border-white/15 text-center">
              LESSONS ({lessons.length})
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {lessons.map((lesson, idx) => {
                const isActive = idx === activeLessonIdx;
                const hasUrl = Boolean(lesson.youtubeUrl && lesson.youtubeUrl.trim());

                return (
                  <button
                    key={lesson.id || idx}
                    onClick={() => {
                      setActiveLessonIdx(idx);
                      setIsPlaying(true);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-white text-[#20405E] font-bold shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <span className="text-xs font-mono uppercase truncate">
                        {lesson.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                      <span className={isActive ? 'text-[#20405E]' : 'text-white/70'}>
                        {lesson.duration || '6 min'}
                      </span>
                      {hasUrl ? (
                        <Video className={`h-3.5 w-3.5 ${isActive ? 'text-[#20405E]' : 'text-[#84CC16]'}`} />
                      ) : (
                        <Film className={`h-3 w-3 ${isActive ? 'text-slate-400' : 'text-white/40'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT AREA: THE SIMULATION STREAM DELIVERY PLAYER (Matching bizzclass.jpg) */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-[#2B4E73] bg-[#224467] dark:bg-[#122438] relative min-h-[420px] shadow-xl">
          
          {/* Top Badges & Controls inside Player */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Left: SECURE SIMULATION STREAM */}
            <div className="pointer-events-auto px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SECURE SIMULATION STREAM</span>
            </div>

            {/* Right: Direct Watch Link & HLS 1080p */}
            <div className="pointer-events-auto flex items-center gap-2">
              {currentLesson?.youtubeUrl && (
                <a
                  href={currentLesson.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 hover:bg-black/80 backdrop-blur-md text-[#DDEBF7] hover:text-white border border-white/20 transition-all flex items-center gap-1 shadow-sm"
                  title="Open lesson stream directly in a new browser tab / YouTube"
                >
                  <ExternalLink className="h-3 w-3 text-[#D48B28]" />
                  <span>Open in Tab</span>
                </a>
              )}
              <div className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white/90 border border-white/20">
                HLS 1080p
              </div>
            </div>
          </div>

          {/* Player Display Area */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center p-4">
            {isPlaying && currentEmbedUrl ? (
              <div className="w-full h-full rounded-xl overflow-hidden bg-black shadow-2xl flex items-center justify-center relative">
                {currentEmbedUrl.includes('youtube.com/embed') || currentEmbedUrl.includes('player.vimeo.com') || currentEmbedUrl.includes('loom.com') ? (
                  <iframe
                    src={currentEmbedUrl}
                    title={currentLesson.name}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={currentEmbedUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              /* Sleek Lesson Placeholder matching bizzclass.jpg */
              <div
                className="w-full h-full flex flex-col items-center justify-center text-center group select-none"
              >
                {/* Large Circular Play Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (currentEmbedUrl) {
                      setIsPlaying(true);
                    } else {
                      setIsLinkModalOpen(true);
                    }
                  }}
                  className="w-20 h-20 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 mb-4 cursor-pointer"
                  title={currentEmbedUrl ? 'Play stream lesson' : 'Configure stream link'}
                >
                  <Play className="h-8 w-8 ml-1 fill-white" />
                </button>

                {/* Lesson Title */}
                <h3 className="text-xl sm:text-2xl font-bold font-mono lowercase tracking-wide text-white drop-shadow-sm">
                  {currentLesson.name.toLowerCase()}
                </h3>

                {/* Subtitle & Quick Link Actions */}
                <p className="text-xs sm:text-sm font-sans text-white/70 lowercase mt-1.5 flex items-center gap-1.5">
                  <span>{activeCourse.name.toLowerCase()}</span>
                  <span>•</span>
                  <span>click play to launch simulation lesson</span>
                </p>

                {/* Action Buttons Row under Placeholder */}
                <div className="mt-4 flex items-center gap-2.5 flex-wrap justify-center">
                  {currentEmbedUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsPlaying(true)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#20405E] font-mono text-xs font-bold uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-[#20405E]" />
                        <span>Play Lesson</span>
                      </button>

                      {currentLesson?.youtubeUrl && (
                        <a
                          href={currentLesson.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-mono text-xs font-semibold uppercase transition-all border border-white/30 flex items-center gap-1.5 shadow-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-[#D48B28]" />
                          <span>Watch on YouTube / Tab</span>
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsLinkModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse transition-colors"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>Configure Lesson Stream Link</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FLOATING GOLD LINK ICON IN BOTTOM RIGHT (Matching bizzclass.jpg) */}
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="absolute bottom-5 right-5 z-30 h-11 w-11 rounded-full bg-[#D48B28] hover:bg-[#EAA13D] text-[#111628] flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 border-2 border-white/30"
            title="Lesson Video Stream Link Manager (Upload & Test Links)"
          >
            <LinkIcon className="h-5 w-5 font-bold" />
            {currentEmbedUrl && (
              <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#111628]" />
            )}
          </button>

        </div>

      </div>

      {/* LINK MANAGER & URL TESTER MODAL (Allows user to test and upload video links) */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 space-y-5 shadow-2xl ${
              isDark ? 'bg-[#12182B] border-[#2A375E] text-white' : 'bg-white border-[#D0DAE5] text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#D48B28] text-black flex items-center justify-center font-bold">
                  <LinkIcon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-mono text-sm font-bold uppercase tracking-wide">
                    Lesson Video Stream Link
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                    {activeCourse.name} · {currentLesson.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <label className="block text-slate-600 dark:text-slate-300 font-bold uppercase">
                Video Stream URL (YouTube, Vimeo, MP4, HLS)
              </label>
              <input
                type="text"
                value={editingLessonUrl}
                onChange={(e) => setEditingLessonUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className={`w-full px-3 py-2.5 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#2E5E88] ${
                  isDark
                    ? 'bg-[#182038] border-[#2B385D] text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Paste any standard YouTube watch link, short link, or raw video stream to test playback in the suite.
              </p>
            </div>

            {/* Quick Test Preview */}
            {editingLessonUrl.trim() && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#1A233D] border border-slate-200 dark:border-[#2C3B63] flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Sparkles className="h-4 w-4 text-[#D48B28]" />
                  <span>Stream URL is ready for immediate test.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveLessonUrl(editingLessonUrl);
                    setIsPlaying(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#2E5E88] hover:bg-[#244B6D] text-white font-bold transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Play className="h-3 w-3" />
                  <span>Test & Play</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              {editingLessonUrl.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingLessonUrl('');
                    handleSaveLessonUrl('');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-mono text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  Clear Link
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveLessonUrl(editingLessonUrl)}
                className="px-5 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#254C6F] text-white font-mono font-bold text-xs shadow-md transition-all"
              >
                Save & Deploy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
