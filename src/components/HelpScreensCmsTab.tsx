import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_PLATFORM_HELP,
  PLATFORM_HELP_APPS,
  PLATFORM_HELP_STEPS,
  PLATFORM_HELP_UPDATED_EVENT,
  PlatformHelpAppId,
  PlatformHelpMap,
  PlatformHelpStepId,
  fetchPlatformHelpFromCloud,
  getCachedPlatformHelp,
  getPlatformHelpEntry,
  resetPlatformHelpEntry,
  savePlatformHelpEntry,
} from '../services/platformHelpService';

export const HelpScreensCmsTab: React.FC = () => {
  const [helpMap, setHelpMap] = useState<PlatformHelpMap>(getCachedPlatformHelp);
  const [selectedApp, setSelectedApp] = useState<PlatformHelpAppId>('bizzmodel');
  const [selectedStep, setSelectedStep] = useState<PlatformHelpStepId>('setup');

  const [draftTitle, setDraftTitle] = useState('');
  const [draftPurposeLabel, setDraftPurposeLabel] = useState('');
  const [draftPurpose, setDraftPurpose] = useState('');
  const [draftSectionHeading, setDraftSectionHeading] = useState('');
  const [draftBullets, setDraftBullets] = useState<string[]>([]);

  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  const syncDrafts = (
    appId: PlatformHelpAppId,
    stepId: PlatformHelpStepId,
    sourceMap: PlatformHelpMap
  ) => {
    const entry = getPlatformHelpEntry(appId, stepId, sourceMap);
    setDraftTitle(entry.title);
    setDraftPurposeLabel(entry.purposeLabel);
    setDraftPurpose(entry.purpose);
    setDraftSectionHeading(entry.sectionHeading);
    setDraftBullets(entry.bullets.length > 0 ? [...entry.bullets] : ['']);
  };

  useEffect(() => {
    const initial = getCachedPlatformHelp();
    setHelpMap(initial);
    syncDrafts('bizzmodel', 'setup', initial);

    setIsLoadingCloud(true);
    fetchPlatformHelpFromCloud()
      .then((cloudMap) => {
        setHelpMap(cloudMap);
        syncDrafts('bizzmodel', 'setup', cloudMap);
      })
      .finally(() => setIsLoadingCloud(false));

    const handleExternalUpdate = (e: Event) => {
      const updated = (e as CustomEvent<PlatformHelpMap>).detail || getCachedPlatformHelp();
      setHelpMap(updated);
    };
    window.addEventListener(PLATFORM_HELP_UPDATED_EVENT, handleExternalUpdate);
    return () => window.removeEventListener(PLATFORM_HELP_UPDATED_EVENT, handleExternalUpdate);
  }, []);

  const handleSelectTarget = (appId: PlatformHelpAppId, stepId: PlatformHelpStepId) => {
    setSelectedApp(appId);
    setSelectedStep(stepId);
    syncDrafts(appId, stepId, helpMap);
    setNotice(null);
  };

  const handleRefreshFromCloud = async () => {
    setIsLoadingCloud(true);
    setNotice(null);
    try {
      const cloudMap = await fetchPlatformHelpFromCloud();
      setHelpMap(cloudMap);
      syncDrafts(selectedApp, selectedStep, cloudMap);
      setNotice({ type: 'success', text: 'Refreshed help screens from Firestore cloud.' });
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleSaveEntry = async () => {
    setIsSaving(true);
    setNotice(null);
    try {
      const fallback = DEFAULT_PLATFORM_HELP[selectedApp][selectedStep];
      const cleanedBullets = draftBullets.map((b) => b.trim()).filter(Boolean);
      const res = await savePlatformHelpEntry(selectedApp, selectedStep, {
        title: draftTitle.trim() || fallback.title,
        purposeLabel: draftPurposeLabel.trim() || fallback.purposeLabel,
        purpose: draftPurpose.trim() || fallback.purpose,
        sectionHeading: draftSectionHeading.trim() || fallback.sectionHeading,
        bullets: cleanedBullets.length > 0 ? cleanedBullets : [...fallback.bullets],
      });
      setHelpMap(res.map);
      syncDrafts(selectedApp, selectedStep, res.map);
      setNotice(
        res.syncedToCloud
          ? { type: 'success', text: 'Saved & published help screen to live Firestore cloud.' }
          : {
              type: 'warn',
              text: res.error || 'Saved locally (Firestore sync temporarily unavailable).',
            }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetEntry = async () => {
    setIsSaving(true);
    setNotice(null);
    try {
      const res = await resetPlatformHelpEntry(selectedApp, selectedStep);
      setHelpMap(res.map);
      syncDrafts(selectedApp, selectedStep, res.map);
      setNotice(
        res.syncedToCloud
          ? { type: 'success', text: 'Reset screen to curated default & synced to cloud.' }
          : { type: 'warn', text: 'Reset screen locally.' }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const activeStepMeta =
    PLATFORM_HELP_STEPS.find((s) => s.id === selectedStep) || PLATFORM_HELP_STEPS[0];
  const activeAppMeta =
    PLATFORM_HELP_APPS.find((a) => a.id === selectedApp) || PLATFORM_HELP_APPS[0];

  const isCustomized = (appId: PlatformHelpAppId, stepId: PlatformHelpStepId) => {
    const cur = getPlatformHelpEntry(appId, stepId, helpMap);
    const def = DEFAULT_PLATFORM_HELP[appId][stepId];
    return (
      cur.title !== def.title ||
      cur.purposeLabel !== def.purposeLabel ||
      cur.purpose !== def.purpose ||
      cur.sectionHeading !== def.sectionHeading ||
      JSON.stringify(cur.bullets) !== JSON.stringify(def.bullets)
    );
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto font-mono text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141A2E] border border-[#222F4C]">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#5584B4]" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              PLATFORM APP HELP SCREENS (28 PAGES · FIRESTORE SYNCED)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Edit the ? assistance modal for every page across bizzcalc, bizzdynamics, bizzmodel, and rolling forecast. You can also edit inline inside any app&apos;s ? dialog.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefreshFromCloud}
            disabled={isLoadingCloud || isSaving}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingCloud ? 'animate-spin' : ''}`} />
            <span>Pull Cloud</span>
          </button>
          <button
            type="button"
            onClick={handleResetEntry}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Step Default</span>
          </button>
          <button
            type="button"
            onClick={handleSaveEntry}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* Main Two-Column Selector + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: App & 7-Page Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-[#12172A] border border-[#222F4C] space-y-2.5">
            <div className="text-[11px] font-bold uppercase text-amber-400">
              1. Select Platform App
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {PLATFORM_HELP_APPS.map((app) => {
                const isActive = app.id === selectedApp;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelectTarget(app.id, selectedStep)}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2E5E88]/25 border-[#5584B4] text-white'
                        : 'bg-[#0E1220] border-[#1F2945] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold lowercase">{app.label}</div>
                    <div className="text-[11px] text-slate-400 truncate">{app.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#12172A] border border-[#222F4C] space-y-2.5">
            <div className="text-[11px] font-bold uppercase text-amber-400">
              2. Select App Page (1 – 7)
            </div>
            <div className="space-y-1.5">
              {PLATFORM_HELP_STEPS.map((step) => {
                const isActive = step.id === selectedStep;
                const customized = isCustomized(selectedApp, step.id);
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleSelectTarget(selectedApp, step.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2E5E88]/25 border-[#5584B4] text-white'
                        : 'bg-[#0E1220] border-[#1F2945] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={encodeURI(step.icon)}
                        alt={step.name}
                        className="w-4 h-4 rounded-xs bg-white p-0.5 object-contain shrink-0"
                      />
                      <span className="text-xs truncate">
                        {step.num.toString().padStart(2, '0')}. {step.name}
                      </span>
                    </div>
                    {customized && (
                      <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                        edited
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Editor Form + Live Modal Preview */}
        <div className="lg:col-span-8 space-y-4">
          {/* Live Preview Card matching help.PNG */}
          <div className="rounded-2xl border border-[#222F4C] bg-[#0E1322] overflow-hidden shadow-md">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-[#5584B4] font-bold">
              <div className="flex items-center gap-2">
                <img
                  src="/help.jpg"
                  alt="help"
                  className="w-4 h-4 bg-white rounded-xs p-0.5 object-contain"
                />
                <span className="text-slate-500">/</span>
                <img
                  src={encodeURI(activeStepMeta.icon)}
                  alt={activeStepMeta.name}
                  className="w-4 h-4 bg-white rounded-xs p-0.5 object-contain"
                />
                <span>{draftTitle || activeStepMeta.name}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                live modal preview · {activeAppMeta.label}
              </span>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 leading-relaxed">
                <strong>{draftPurposeLabel}:</strong> {draftPurpose}
              </div>
              <div>
                <h4 className="font-bold text-white uppercase mb-1">
                  {draftSectionHeading}:
                </h4>
                <ul className="space-y-1 list-disc pl-4">
                  {draftBullets.filter((b) => b.trim()).map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-5 rounded-2xl bg-[#12172A] border border-[#222F4C] space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Modal Header Title
                </label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0F1C] border border-[#2B3B60] text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5584B4]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Purpose Callout Prefix
                </label>
                <input
                  type="text"
                  value={draftPurposeLabel}
                  onChange={(e) => setDraftPurposeLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0F1C] border border-[#2B3B60] text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5584B4]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Purpose Summary Box Text
              </label>
              <textarea
                rows={3}
                value={draftPurpose}
                onChange={(e) => setDraftPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0F1C] border border-[#2B3B60] text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5584B4]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Bullet Section Heading
              </label>
              <input
                type="text"
                value={draftSectionHeading}
                onChange={(e) => setDraftSectionHeading(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0F1C] border border-[#2B3B60] text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5584B4]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Guidance Bullet Points ({draftBullets.length})
                </label>
                <button
                  type="button"
                  onClick={() => setDraftBullets((prev) => [...prev, ''])}
                  className="px-2.5 py-1 rounded-lg bg-[#2E5E88]/25 text-[#7EB2E2] hover:bg-[#2E5E88]/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Bullet</span>
                </button>
              </div>

              <div className="space-y-2">
                {draftBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="pt-2 text-[11px] text-slate-500 w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) =>
                        setDraftBullets((prev) =>
                          prev.map((item, i) => (i === idx ? e.target.value : item))
                        )
                      }
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#0B0F1C] border border-[#2B3B60] text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5584B4]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraftBullets((prev) =>
                          prev.length <= 1 ? [''] : prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                      title="Remove bullet"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
