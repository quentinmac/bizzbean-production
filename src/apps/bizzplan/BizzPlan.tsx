import React, { useState, useEffect, useMemo } from 'react';
import BizzPlanLayout from './components/BizzPlanLayout';
import { BizzPlanData, BizzModelData, BizzModelStep, TouchPointAnswer } from '../../types';
import { INITIAL_PLAN_DATA } from './constants';
import { sanitizeBizzModelData } from '../bizzmodel/BizzModel';
import { BizzModelState } from '../bizzmodel/constants';
import { FileText, Sparkles, ArrowDown } from 'lucide-react';
import CoverPageForm from './components/CoverPageForm';
import PitchForm from './components/PitchForm';
import GovernanceForm from './components/GovernanceForm';
import { TouchPointMenu, TouchPointReport } from './components/TouchPointEvaluation';
import PrintReview from './components/PrintReview';
import ScorecardForm from './components/ScorecardForm';
import ScorecardReport from './components/ScorecardReport';
import AssumptionsReport from './components/AssumptionsReport';
import FinancialReports from './components/FinancialReports';
import CoachGimAdvice from './components/CoachGimAdvice';
import PitchDeckStudio from './components/PitchDeckStudio';

interface BizzPlanProps {
  theme?: 'light' | 'dark';
  onClose: () => void;
  onContextSwitch?: (context: any, step?: string) => void;
  bizzModelState?: BizzModelState;
  isMember?: boolean;
  initialSectionId?: string;
  embeddedInModel?: boolean;
  onBackToModel?: () => void;
  backToModelLabel?: string;
}

export function BizzPlan({
  theme = 'light',
  onClose,
  onContextSwitch,
  bizzModelState,
  initialSectionId,
  embeddedInModel = false,
  onBackToModel,
  backToModelLabel,
}: BizzPlanProps) {
  const isDark = theme === 'dark';
  const [data, setData] = useState<BizzPlanData>(() => {
    const saved = localStorage.getItem('bizzplan_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
          const mergedSections = INITIAL_PLAN_DATA.sections.map((initSec) => {
            const savedSec = parsed.sections.find((s: any) => s.id === initSec.id);
            if (!savedSec) return initSec;
            if (initSec.categories && (!savedSec.categories || savedSec.categories.length === 0)) {
              return { ...initSec, content: savedSec.content || '', isCompleted: savedSec.isCompleted };
            }
            return { ...initSec, ...savedSec };
          });
          return {
            ...INITIAL_PLAN_DATA,
            ...parsed,
            coverPage: { ...INITIAL_PLAN_DATA.coverPage, ...(parsed.coverPage || {}) },
            pitch: { ...INITIAL_PLAN_DATA.pitch, ...(parsed.pitch || {}) },
            governance: {
              corporate: { ...INITIAL_PLAN_DATA.governance!.corporate, ...(parsed.governance?.corporate || {}) },
              boardMembers: parsed.governance?.boardMembers || INITIAL_PLAN_DATA.governance!.boardMembers,
              keyPersonnel: parsed.governance?.keyPersonnel || INITIAL_PLAN_DATA.governance!.keyPersonnel,
              professionalSupport: parsed.governance?.professionalSupport || INITIAL_PLAN_DATA.governance!.professionalSupport,
            },
            sections: mergedSections,
          };
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse bizzplan_data', e);
      }
    }
    return INITIAL_PLAN_DATA;
  });

  const [currentSectionId, setCurrentSectionId] = useState<string>(initialSectionId || 'formation');
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [standalonePitchDeck, setStandalonePitchDeck] = useState<boolean>(false);

  useEffect(() => {
    if (initialSectionId) {
      setCurrentSectionId(initialSectionId);
    }
  }, [initialSectionId]);

  const loadSyncedModelData = (): BizzModelData | null => {
    try {
      if (bizzModelState) {
        return sanitizeBizzModelData(bizzModelState);
      }
      const candidates = [
        localStorage.getItem('bizzmodel_platform_data'),
        localStorage.getItem('bizzdynamics_platform_data'),
        localStorage.getItem('rolling_forecast_platform_data'),
        localStorage.getItem('bizzdynamics_data'),
        localStorage.getItem('bizzmodel_data'),
      ];
      for (const rawStr of candidates) {
        if (rawStr) {
          return sanitizeBizzModelData(JSON.parse(rawStr));
        }
      }
    } catch (e) {
      console.error('Failed to sync model data in BizzPlan', e);
    }
    return null;
  };

  const [modelData, setModelData] = useState<BizzModelData | null>(() => loadSyncedModelData());

  useEffect(() => {
    const syncModelData = () => {
      const next = loadSyncedModelData();
      if (next) {
        setModelData(next);
        const syncedName = next.company?.name;
        if (syncedName) {
          setData((prev) => ({
            ...prev,
            businessName: syncedName,
            coverPage: prev.coverPage
              ? { ...prev.coverPage, companyName: syncedName }
              : prev.coverPage,
          }));
        }
      }
    };

    syncModelData();

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'bizzmodel_platform_data' ||
        e.key === 'bizzdynamics_platform_data' ||
        e.key === 'rolling_forecast_platform_data' ||
        e.key === 'bizzdynamics_data' ||
        e.key === 'bizzmodel_data'
      ) {
        syncModelData();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('bizzmodel-data-updated', syncModelData);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('bizzmodel-data-updated', syncModelData);
    };
  }, [bizzModelState]);

  useEffect(() => {
    try {
      localStorage.setItem('bizzplan_data', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist bizzplan_data', e);
    }
  }, [data]);

  const activeSection = useMemo(() => {
    return data.sections.find((s) => s.id === currentSectionId) || data.sections[0];
  }, [data.sections, currentSectionId]);

  const STEPS: BizzModelStep[] = useMemo(() => {
    const list: BizzModelStep[] = [];
    data.sections.forEach((s) => {
      list.push({
        id: s.id,
        label: s.title,
        title: s.title,
        subtitle: s.type === 'touchpoint' ? 'touchpoint check' : s.type === 'scorecard' ? 'scorecard' : 'narrative',
        isCompleted: s.isCompleted,
        isValid: true,
      });
      if (s.id === 'assumptions') {
        list.push({
          id: 'financial_reports',
          label: 'financial reports',
          title: 'financial reports',
          subtitle: 'financial projections',
          isCompleted: true,
          isValid: true,
        });
      }
    });
    return list;
  }, [data.sections]);

  const updateSectionContent = (content: string) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === currentSectionId
          ? { ...s, content, isCompleted: content.trim().length > 20 || s.isCompleted }
          : s
      ),
    }));
  };

  const handleAnswerChange = (catId: string, itemId: string, answer: TouchPointAnswer) => {
    const score = answer === 'yes' ? 1 : answer === 'no' ? -1 : 0;
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== currentSectionId || !s.categories) return s;
        return {
          ...s,
          categories: s.categories.map((c) => {
            if (c.id !== catId) return c;
            return {
              ...c,
              items: c.items.map((item) =>
                item.id === itemId ? { ...item, answer, score } : item
              ),
            };
          }),
          isCompleted: true,
        };
      }),
    }));
  };

  const handleCommentChange = (catId: string, comment: string) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== currentSectionId || !s.categories) return s;
        return {
          ...s,
          categories: s.categories.map((c) => (c.id === catId ? { ...c, comment } : c)),
        };
      }),
    }));
  };

  const handleSwitchContext = (context: string) => {
    if (context === 'bizzplan') {
      return;
    }
    if (onContextSwitch) {
      onContextSwitch(context);
    }
  };

  const handleSavePlan = () => {
    try {
      localStorage.setItem('bizzplan_data', JSON.stringify(data));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch {}
  };

  const currentStepIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.id === currentSectionId)
  );

  const v2InputClass = `w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-all ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
  }`;

  const v2TextareaClass = `w-full min-h-[120px] rounded-xl border p-4 text-xs font-mono focus:outline-none resize-y leading-relaxed transition-all ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
  }`;

  const renderSectionEditor = () => {
    if (currentSectionId === 'formation' && data.coverPage) {
      return (
        <CoverPageForm
          data={data.coverPage}
          lockedCompanyName={modelData?.company?.name || data.businessName}
          theme={theme}
          onChange={(coverPage) =>
            setData((prev) => ({
              ...prev,
              coverPage,
              businessName: coverPage.companyName || prev.businessName,
            }))
          }
        />
      );
    }

    if (currentSectionId === 'pitch' && data.pitch) {
      return (
        <PitchForm
          data={data.pitch}
          theme={theme}
          onChange={(pitch) => setData((prev) => ({ ...prev, pitch }))}
        />
      );
    }

    if (currentSectionId === 'governance' && data.governance) {
      return (
        <GovernanceForm
          data={data.governance}
          theme={theme}
          onChange={(governance) => setData((prev) => ({ ...prev, governance }))}
        />
      );
    }

    if (currentSectionId === 'assumptions') {
      return (
        <div className="space-y-6">
          <AssumptionsReport
            planData={data}
            modelData={modelData}
            activeSectionId="assumptions"
          />
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
              economic & operational assumptions narrative
            </label>
            <textarea
              value={activeSection.content}
              onChange={(e) => updateSectionContent(e.target.value)}
              placeholder="document inflation, regulatory, or operational notes backing your financial assumptions..."
              className={v2TextareaClass}
            />
          </div>
        </div>
      );
    }

    if (currentSectionId === 'financial_reports') {
      return <FinancialReports data={data} modelData={modelData} theme={theme} />;
    }

    if (activeSection.type === 'touchpoint' && activeSection.categories) {
      return (
        <div className="space-y-8">
          <TouchPointMenu
            categories={activeSection.categories}
            onAnswerChange={handleAnswerChange}
            onCommentChange={handleCommentChange}
            sectionTitle={activeSection.title}
            theme={theme}
          />
          <div className="space-y-2 pt-4 border-t border-[#D8CEBC] dark:border-[#222F4C]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
              {activeSection.title} executive narrative & summary
            </label>
            <textarea
              value={activeSection.content}
              onChange={(e) => updateSectionContent(e.target.value)}
              placeholder={`write your strategic plan and operational summary for ${activeSection.title}...`}
              className={v2TextareaClass}
            />
          </div>
          <TouchPointReport
            categories={activeSection.categories}
            sectionTitle={activeSection.title}
            theme={theme}
          />
        </div>
      );
    }

    if (currentSectionId === 'viability_scorecard') {
      return (
        <div className="space-y-8">
          <ScorecardForm data={data} onUpdate={setData} theme={theme} />
          <ScorecardReport data={data} />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <textarea
          value={activeSection.content}
          onChange={(e) => updateSectionContent(e.target.value)}
          placeholder={`write your ${activeSection.title} narrative...`}
          className={`${v2TextareaClass} min-h-[240px]`}
        />
      </div>
    );
  };

  const resolvedBusinessName =
    data.coverPage?.companyName || data.businessName || modelData?.company?.name || '';

  return (
    <div className="relative w-full h-full flex flex-col">
      <BizzPlanLayout
        theme={theme}
        appName="bizzplan"
        currentStepId={currentSectionId}
        steps={STEPS}
        onStepChange={(id) => setCurrentSectionId(id)}
        onContextSwitch={handleSwitchContext}
        onClose={onClose}
        onSave={handleSavePlan}
        savedNotice={savedNotice}
        businessName={resolvedBusinessName}
        embeddedInModel={embeddedInModel}
        onBackToModel={onBackToModel}
        backToModelLabel={backToModelLabel}
        isPitchDeckActive={standalonePitchDeck}
        onTogglePitchDeck={!embeddedInModel ? setStandalonePitchDeck : undefined}
        rightPanel={
          <PrintReview
            planData={data}
            modelData={modelData}
            activeSectionId={currentSectionId}
            theme={theme}
          />
        }
      >
        {standalonePitchDeck && !embeddedInModel ? (
          <PitchDeckStudio
            theme={theme}
            bizzModelState={bizzModelState}
            onBackToStep={() => setStandalonePitchDeck(false)}
            backLabel="back to bizzplan editor"
          />
        ) : (
        <div className="space-y-6 pb-12">
          {/* Compact V2 Section Context Banner */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-2xs'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <FileText size={12} className="text-[#2E5E88] dark:text-[#5584B4]" />
                <span>
                  bizzplan workspace · section {currentStepIdx + 1} of {STEPS.length}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
                {STEPS[currentStepIdx]?.title || activeSection.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById('coach-gim-advisor')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                title="Jump to Coach GIM guidance for this section"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] lowercase transition-colors cursor-pointer whitespace-nowrap ${
                  isDark
                    ? 'text-[#7FAADC]/85 hover:text-[#7FAADC] hover:bg-[#161C30]'
                    : 'text-[#2E5E88]/80 hover:text-[#2E5E88] hover:bg-[#FAF8F5]'
                }`}
              >
                <Sparkles size={12} className="shrink-0 opacity-80" />
                <span>need guidance? gim is available below</span>
                <ArrowDown size={11} className="shrink-0 opacity-75" />
              </button>

              <span
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold lowercase whitespace-nowrap ${
                  isDark
                    ? 'bg-[#161C30] border-[#252E4A] text-slate-300'
                    : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'
                }`}
              >
                {STEPS[currentStepIdx]?.subtitle || 'editorial'}
              </span>
            </div>
          </div>

          {/* Business Identity Quick Bar on Formation */}
          {currentSectionId === 'formation' && (
            <div
              className={`rounded-2xl border p-5 grid grid-cols-1 md:grid-cols-2 gap-4 ${
                isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-2xs'
              }`}
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  vision statement
                </label>
                <input
                  type="text"
                  value={data.vision}
                  onChange={(e) => setData((prev) => ({ ...prev, vision: e.target.value }))}
                  placeholder="long-term institutional vision..."
                  className={v2InputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  mission statement
                </label>
                <input
                  type="text"
                  value={data.mission}
                  onChange={(e) => setData((prev) => ({ ...prev, mission: e.target.value }))}
                  placeholder="core operational mission..."
                  className={v2InputClass}
                />
              </div>
            </div>
          )}

          {/* Main Section Form / Content */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 ${
              isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-2xs'
            }`}
          >
            {renderSectionEditor()}
          </div>

          {/* Coach GIM Section Advisor */}
          <div id="coach-gim-advisor">
            <CoachGimAdvice
              pageId={currentSectionId}
              pageTitle={STEPS[currentStepIdx]?.title || activeSection.title}
              businessName={resolvedBusinessName || 'Your Venture'}
              businessType={data.coverPage?.businessType || 'Private Enterprise'}
              theme={theme}
            />
          </div>
        </div>
        )}
      </BizzPlanLayout>
    </div>
  );
}

export default BizzPlan;
