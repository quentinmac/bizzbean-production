import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Edit2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  DEFAULT_PLATFORM_HELP,
  PLATFORM_HELP_APPS,
  PLATFORM_HELP_STEPS,
  PLATFORM_HELP_UPDATED_EVENT,
  PlatformHelpAppId,
  PlatformHelpEntry,
  PlatformHelpMap,
  PlatformHelpStepId,
  checkIsHelpAdmin,
  fetchPlatformHelpFromCloud,
  getCachedPlatformHelp,
  getPlatformHelpEntry,
  resetPlatformHelpEntry,
  savePlatformHelpEntry,
} from '../services/platformHelpService';

interface PlatformHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: PlatformHelpAppId;
  stepId: PlatformHelpStepId;
  stepIcon?: string;
  theme?: 'light' | 'dark';
  isAdmin?: boolean;
}

export const PlatformHelpModal: React.FC<PlatformHelpModalProps> = ({
  isOpen,
  onClose,
  appId,
  stepId,
  stepIcon,
  theme = 'light',
  isAdmin: isAdminProp,
}) => {
  const isDark = theme === 'dark';
  const [helpMap, setHelpMap] = useState<PlatformHelpMap>(getCachedPlatformHelp);
  const [isEditing, setIsEditing] = useState(false);

  // Target screen inside modal (defaults to opened appId & stepId, switchable in edit mode)
  const [editAppId, setEditAppId] = useState<PlatformHelpAppId>(appId);
  const [editStepId, setEditStepId] = useState<PlatformHelpStepId>(stepId);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftPurposeLabel, setDraftPurposeLabel] = useState('');
  const [draftPurpose, setDraftPurpose] = useState('');
  const [draftSectionHeading, setDraftSectionHeading] = useState('');
  const [draftBullets, setDraftBullets] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  const canEdit = isAdminProp !== undefined ? isAdminProp : checkIsHelpAdmin();

  const loadDraftFromMap = (
    targetApp: PlatformHelpAppId,
    targetStep: PlatformHelpStepId,
    mapSource: PlatformHelpMap
  ) => {
    const entry = getPlatformHelpEntry(targetApp, targetStep, mapSource);
    setDraftTitle(entry.title);
    setDraftPurposeLabel(entry.purposeLabel);
    setDraftPurpose(entry.purpose);
    setDraftSectionHeading(entry.sectionHeading);
    setDraftBullets(entry.bullets.length > 0 ? [...entry.bullets] : ['']);
  };

  useEffect(() => {
    const handleHelpUpdate = (e: Event) => {
      const detail = (e as CustomEvent<PlatformHelpMap>).detail;
      setHelpMap(detail || getCachedPlatformHelp());
    };
    window.addEventListener(PLATFORM_HELP_UPDATED_EVENT, handleHelpUpdate);
    return () => window.removeEventListener(PLATFORM_HELP_UPDATED_EVENT, handleHelpUpdate);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setStatusNotice(null);
      return;
    }

    setEditAppId(appId);
    setEditStepId(stepId);
    const localSnapshot = getCachedPlatformHelp();
    setHelpMap(localSnapshot);
    loadDraftFromMap(appId, stepId, localSnapshot);

    fetchPlatformHelpFromCloud().then((cloudMap) => {
      setHelpMap(cloudMap);
      loadDraftFromMap(appId, stepId, cloudMap);
    });
  }, [isOpen, appId, stepId]);

  if (!isOpen) return null;

  const activeAppId = isEditing ? editAppId : appId;
  const activeStepId = isEditing ? editStepId : stepId;
  const activeStepMeta =
    PLATFORM_HELP_STEPS.find((s) => s.id === activeStepId) || PLATFORM_HELP_STEPS[0];
  const resolvedIcon = isEditing ? activeStepMeta.icon : stepIcon || activeStepMeta.icon;

  const currentEntry: PlatformHelpEntry = getPlatformHelpEntry(activeAppId, activeStepId, helpMap);

  const handleEnterEdit = () => {
    setEditAppId(appId);
    setEditStepId(stepId);
    loadDraftFromMap(appId, stepId, helpMap);
    setStatusNotice(null);
    setIsEditing(true);
  };

  const handleSelectEditTarget = (nextApp: PlatformHelpAppId, nextStep: PlatformHelpStepId) => {
    setEditAppId(nextApp);
    setEditStepId(nextStep);
    loadDraftFromMap(nextApp, nextStep, helpMap);
    setStatusNotice(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusNotice(null);
    try {
      const cleanedBullets = draftBullets.map((b) => b.trim()).filter(Boolean);
      const fallback = DEFAULT_PLATFORM_HELP[editAppId][editStepId];
      const result = await savePlatformHelpEntry(editAppId, editStepId, {
        title: draftTitle.trim() || fallback.title,
        purposeLabel: draftPurposeLabel.trim() || fallback.purposeLabel,
        purpose: draftPurpose.trim() || fallback.purpose,
        sectionHeading: draftSectionHeading.trim() || fallback.sectionHeading,
        bullets: cleanedBullets.length > 0 ? cleanedBullets : [...fallback.bullets],
      });
      setHelpMap(result.map);
      loadDraftFromMap(editAppId, editStepId, result.map);
      setStatusNotice(
        result.syncedToCloud
          ? { type: 'success', text: 'saved & published to cloud for all users.' }
          : {
              type: 'warn',
              text: result.error || 'saved locally on this device (cloud sync skipped).',
            }
      );
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = async () => {
    setIsSaving(true);
    setStatusNotice(null);
    try {
      const result = await resetPlatformHelpEntry(editAppId, editStepId);
      setHelpMap(result.map);
      loadDraftFromMap(editAppId, editStepId, result.map);
      setStatusNotice(
        result.syncedToCloud
          ? { type: 'success', text: 'restored default copy & synced to cloud.' }
          : { type: 'warn', text: 'restored default copy locally.' }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulletChange = (index: number, value: string) => {
    setDraftBullets((prev) => prev.map((b, idx) => (idx === index ? value : b)));
  };

  const handleAddBullet = () => {
    setDraftBullets((prev) => [...prev, '']);
  };

  const handleRemoveBullet = (index: number) => {
    setDraftBullets((prev) => (prev.length <= 1 ? [''] : prev.filter((_, idx) => idx !== index)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={`${currentEntry.title}`}
    >
      <div
        className={`w-full ${
          isEditing ? 'max-w-2xl' : 'max-w-lg'
        } max-h-[90vh] flex flex-col rounded-3xl border shadow-xl overflow-hidden font-mono transition-all ${
          isDark
            ? 'bg-[#0E1322] border-[#222F4C] text-slate-200'
            : 'bg-white border-[#D8CEBC] text-slate-800'
        }`}
      >
        {/* Modal Header matching reference help.PNG */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between gap-2 shrink-0 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs lowercase font-bold text-[#2E5E88] dark:text-[#5584B4] min-w-0">
            <img
              src="/help.jpg"
              alt="help"
              className="w-4 h-4 shrink-0 object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5"
            />
            <span className="text-slate-400 shrink-0">/</span>
            <img
              src={encodeURI(resolvedIcon)}
              alt={activeStepMeta.name}
              className="w-4 h-4 shrink-0 object-contain mix-blend-multiply dark:bg-white dark:rounded-xs dark:p-0.5"
            />
            <span className="truncate">
              {isEditing ? `editing: ${draftTitle || currentEntry.title}` : currentEntry.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={handleEnterEdit}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#2B3B60] bg-[#161F36] text-slate-200 hover:bg-[#1E2B4A]'
                    : 'border-[#D8CEBC] bg-[#FAF8F5] text-[#2E5E88] hover:bg-[#EFE9DF]'
                }`}
                title="Edit help screen copy for this page"
              >
                <Edit2 className="h-3 w-3" />
                <span>edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              aria-label="close assistance"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed overflow-y-auto">
          {statusNotice && (
            <div
              className={`px-3 py-2 rounded-xl border text-[11px] flex items-center gap-2 ${
                statusNotice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{statusNotice.text}</span>
            </div>
          )}

          {!isEditing ? (
            <>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#2E5E88] dark:text-blue-300">
                <strong>{currentEntry.purposeLabel}:</strong> {currentEntry.purpose}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase mb-1.5">
                  {currentEntry.sectionHeading}:
                </h4>
                <ul className="space-y-1.5 list-disc pl-4">
                  {currentEntry.bullets.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>

              <div
                className={`pt-2.5 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <span className="text-[11px] text-slate-400 truncate">
                  {PLATFORM_HELP_APPS.find((a) => a.id === activeAppId)?.label} ·{' '}
                  {activeStepMeta.num.toString().padStart(2, '0')}. {activeStepMeta.name}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl bg-[#2E5E88] text-white text-xs font-bold hover:bg-[#254d70] transition-colors cursor-pointer shrink-0"
                >
                  understood
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3.5">
              {/* Target App & Step Selector so admin can jump across pages while editing */}
              <div
                className={`p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${
                  isDark ? 'bg-[#13192D] border-[#253252]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                }`}
              >
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Platform App
                  </label>
                  <select
                    value={editAppId}
                    onChange={(e) =>
                      handleSelectEditTarget(e.target.value as PlatformHelpAppId, editStepId)
                    }
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                      isDark
                        ? 'bg-[#0B0F1C] border-[#2B3B60] text-slate-100'
                        : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  >
                    {PLATFORM_HELP_APPS.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    App Page / Step
                  </label>
                  <select
                    value={editStepId}
                    onChange={(e) =>
                      handleSelectEditTarget(editAppId, e.target.value as PlatformHelpStepId)
                    }
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                      isDark
                        ? 'bg-[#0B0F1C] border-[#2B3B60] text-slate-100'
                        : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  >
                    {PLATFORM_HELP_STEPS.map((step) => (
                      <option key={step.id} value={step.id}>
                        {step.num.toString().padStart(2, '0')}. {step.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Header Title
                  </label>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="e.g. funding calculator assistance"
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                      isDark
                        ? 'bg-[#0B0F1C] border-[#2B3B60] text-slate-100'
                        : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Purpose Badge Prefix
                  </label>
                  <input
                    type="text"
                    value={draftPurposeLabel}
                    onChange={(e) => setDraftPurposeLabel(e.target.value)}
                    placeholder="e.g. BIZZMODEL Purpose"
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                      isDark
                        ? 'bg-[#0B0F1C] border-[#2B3B60] text-slate-100'
                        : 'bg-white border-[#D8CEBC] text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Purpose Callout Copy
                </label>
                <textarea
                  rows={3}
                  value={draftPurpose}
                  onChange={(e) => setDraftPurpose(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                    isDark
                      ? 'bg-[#0B0F1C] border-[#2B3B60] text-slate-100'
                      : 'bg-white border-[#D8CEBC] text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Guidance Section Heading
                </label>
                <input
                  type="text"
                  value={draftSectionHeading}
                  onChange={(e) => setDraftSectionHeading(e.target.value)}
                  placeholder="e.g. HOW TO NAVIGATE STEPS"
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                    isDark
                      ? 'bg-[#0B0F1C] border-[#2B3B60] text-slate-100'
                      : 'bg-white border-[#D8CEBC] text-slate-900'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Bullet Points ({draftBullets.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBullet}
                    className="px-2 py-0.5 rounded-lg bg-[#2E5E88]/15 text-[#2E5E88] dark:text-[#7EB2E2] hover:bg-[#2E5E88]/25 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>add bullet</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {draftBullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="pt-2 text-[11px] text-slate-400 w-5 shrink-0">
                        {idx + 1}.
                      </span>
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => handleBulletChange(idx, e.target.value)}
                        className={`flex-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#2E5E88] ${
                          isDark
                            ? 'bg-[#0B0F1C] border-[#2B3B60] text-slate-100'
                            : 'bg-white border-[#D8CEBC] text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(idx)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                        title="Remove bullet"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={handleResetDefault}
                  disabled={isSaving}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-[#D8CEBC] text-slate-600 hover:bg-[#EFE9DF]'
                  }`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>reset default</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-[#D8CEBC] text-slate-600 hover:bg-[#EFE9DF]'
                    }`}
                  >
                    cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSaving ? 'saving...' : 'save & publish'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
