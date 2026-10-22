import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  Bell
} from 'lucide-react';
import {
  SandboxDocument,
  SandboxSourceType,
  JournalCategory,
  StashReminder,
  ReminderFrequency,
  ReminderLeadTime
} from '../../types/sandboxLibrary';
import { extractYouTubeEmbedId } from '../../services/sandboxLibraryService';

interface QuickStashModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: JournalCategory[];
  onSaveDoc: (doc: SandboxDocument) => void;
  editingDoc?: SandboxDocument | null;
  theme?: 'light' | 'dark';
}

export const QuickStashModal: React.FC<QuickStashModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveDoc,
  editingDoc,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<SandboxSourceType>('web_article');
  const [sourceNameOrUrl, setSourceNameOrUrl] = useState('');
  const [category, setCategory] = useState('Strategy');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [actionStep, setActionStep] = useState('');
  const [content, setContent] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  // Reminder State
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('09:00');
  const [frequency, setFrequency] = useState<ReminderFrequency>('one_off');
  const [leadTime, setLeadTime] = useState<ReminderLeadTime>('1_day');
  const [reminderNote, setReminderNote] = useState('');

  useEffect(() => {
    if (editingDoc) {
      setTitle(editingDoc.title);
      setSourceType(editingDoc.sourceType);
      setSourceNameOrUrl(editingDoc.sourceUrl || editingDoc.sourceName);
      setCategory(editingDoc.category);
      setWhyItMatters(editingDoc.whyItMatters);
      setActionStep(editingDoc.actionStep);
      setContent(editingDoc.content);
      setTagsStr(editingDoc.tags.join(', '));
      if (editingDoc.reminder) {
        setReminderEnabled(editingDoc.reminder.enabled);
        setTargetDate(editingDoc.reminder.targetDate);
        setTargetTime(editingDoc.reminder.targetTime || '09:00');
        setFrequency(editingDoc.reminder.frequency);
        setLeadTime(editingDoc.reminder.leadTime);
        setReminderNote(editingDoc.reminder.note || '');
      }
    } else {
      setTitle('');
      setSourceType('web_article');
      setSourceNameOrUrl('');
      setCategory(categories[0]?.name || 'Strategy');
      setWhyItMatters('');
      setActionStep('');
      setContent('');
      setTagsStr('');
      setReminderEnabled(false);
      setTargetDate('');
      setReminderNote('');
    }
  }, [editingDoc, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const embedId = extractYouTubeEmbedId(sourceNameOrUrl);
    const tags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const docReminder: StashReminder | undefined = reminderEnabled && targetDate ? {
      enabled: true,
      targetDate,
      targetTime: targetTime || '09:00',
      frequency,
      leadTime,
      note: reminderNote.trim() || undefined
    } : undefined;

    const savedDoc: SandboxDocument = {
      id: editingDoc ? editingDoc.id : `doc-${Date.now()}`,
      title: title.trim(),
      sourceType,
      sourceUrl: sourceNameOrUrl.startsWith('http') ? sourceNameOrUrl.trim() : undefined,
      sourceName: !sourceNameOrUrl.startsWith('http') ? sourceNameOrUrl.trim() : (sourceType === 'video_url' ? 'YouTube' : 'Web Link'),
      videoEmbedId: embedId || undefined,
      category,
      whyItMatters: whyItMatters.trim(),
      actionStep: actionStep.trim(),
      content: content.trim() || `Reference captured: ${title.trim()}`,
      tags: tags.length > 0 ? tags : ['Stashed'],
      fileSizeKb: editingDoc ? editingDoc.fileSizeKb : 24,
      createdAt: editingDoc ? editingDoc.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenCost: editingDoc ? editingDoc.tokenCost : 18,
      isPinned: editingDoc?.isPinned || false,
      reminder: docReminder
    };

    onSaveDoc(savedDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 my-8 border ${
          isDark
            ? 'bg-[#101424] border-[#252E4A] text-slate-100'
            : 'bg-white border-[#E8E2D8] text-slate-900'
        }`}
      >
        <div className={`flex items-center justify-between pb-4 border-b ${
          isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C59B63]/20 text-[#C59B63] flex items-center justify-center border border-[#C59B63]/30">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingDoc ? 'Edit Stashed Document' : 'Stash to Knowledge Vault'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Curate knowledge for grounded AI decision making & Firebase storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-[#161C30]' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-6">
          <div>
            <label className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. SARS Section 12E SBC Exemption Guide"
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] ${
                isDark
                  ? 'bg-[#161C30] text-slate-100 border-[#252E4A] placeholder-slate-500'
                  : 'bg-[#FAF8F5] text-slate-900 border-[#E8E2D8] placeholder-slate-400'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Source Type
              </label>
              <select
                value={sourceType}
                onChange={e => setSourceType(e.target.value as SandboxSourceType)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] ${
                  isDark
                    ? 'bg-[#161C30] text-slate-100 border-[#252E4A]'
                    : 'bg-[#FAF8F5] text-slate-900 border-[#E8E2D8]'
                }`}
              >
                <option value="web_article">Web Article / URL</option>
                <option value="video_url">YouTube / Video URL</option>
                <option value="financial_statement">Financial Model / Tax Filing</option>
                <option value="policy_governance">Statutory / Legal / Policy</option>
                <option value="podcast_url">Podcast / Audio Episode</option>
                <option value="book">Book / Case Study</option>
                <option value="course_notes">BizzBean Course Notes</option>
              </select>
            </div>

            <div>
              <label className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Section / Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] ${
                  isDark
                    ? 'bg-[#161C30] text-slate-100 border-[#252E4A]'
                    : 'bg-[#FAF8F5] text-slate-900 border-[#E8E2D8]'
                }`}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Source URL or File Reference
            </label>
            <input
              type="text"
              value={sourceNameOrUrl}
              onChange={e => setSourceNameOrUrl(e.target.value)}
              placeholder="e.g. https://youtube.com/watch?v=... or SARS_VAT_Guide.pdf"
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] ${
                isDark
                  ? 'bg-[#161C30] text-slate-100 border-[#252E4A] placeholder-slate-500'
                  : 'bg-[#FAF8F5] text-slate-900 border-[#E8E2D8] placeholder-slate-400'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider block mb-1.5 text-[#C59B63]">
                Strategic Rationale (Why It Matters)
              </label>
              <textarea
                value={whyItMatters}
                onChange={e => setWhyItMatters(e.target.value)}
                placeholder="Operational relevance, margin impact, or rationale..."
                rows={3}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] resize-none ${
                  isDark
                    ? 'bg-[#161C30] text-slate-100 border-[#252E4A] placeholder-slate-500'
                    : 'bg-[#FAF8F5] text-slate-900 border-[#E8E2D8] placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider block mb-1.5 text-sky-400">
                Action Step
              </label>
              <textarea
                value={actionStep}
                onChange={e => setActionStep(e.target.value)}
                placeholder="What immediate task should you or your team take next..."
                rows={3}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-sky-400 resize-none ${
                  isDark
                    ? 'bg-[#161C30] text-slate-100 border-[#252E4A] placeholder-slate-500'
                    : 'bg-[#FAF8F5] text-slate-900 border-[#E8E2D8] placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Content / Key Excerpts (Used for Grounded Gemini AI)
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste relevant excerpts, figures, rules, or formulas for Gemini grounding..."
              rows={4}
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] ${
                isDark
                  ? 'bg-[#161C30] text-slate-100 border-[#252E4A] placeholder-slate-500'
                  : 'bg-[#FAF8F5] text-slate-900 border-[#E8E2D8] placeholder-slate-400'
              }`}
            />
          </div>

          <div>
            <label className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              placeholder="e.g. SARS, SBC Tax, Break-even, Pricing"
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#C59B63] ${
                isDark
                  ? 'bg-[#161C30] text-slate-100 border-[#252E4A] placeholder-slate-500'
                  : 'bg-[#FAF8F5] text-slate-900 border-[#E8E2D8] placeholder-slate-400'
              }`}
            />
          </div>

          {/* Reminder Trigger Accordion */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#161C30]/70 border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#C59B63]" />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Attach Calendar / Action Reminder
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={e => setReminderEnabled(e.target.checked)}
                className="rounded accent-[#C59B63] w-4 h-4 cursor-pointer"
              />
            </div>

            {reminderEnabled && (
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t ${
                isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
              }`}>
                <div>
                  <label className={`text-[10px] font-mono font-bold block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    required={reminderEnabled}
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${
                      isDark
                        ? 'bg-[#101424] text-slate-100 border-[#252E4A]'
                        : 'bg-white text-slate-900 border-[#E8E2D8]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[10px] font-mono font-bold block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as ReminderFrequency)}
                    className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${
                      isDark
                        ? 'bg-[#101424] text-slate-100 border-[#252E4A]'
                        : 'bg-white text-slate-900 border-[#E8E2D8]'
                    }`}
                  >
                    <option value="one_off">One-off event</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                <div>
                  <label className={`text-[10px] font-mono font-bold block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Lead Time Alert
                  </label>
                  <select
                    value={leadTime}
                    onChange={e => setLeadTime(e.target.value as ReminderLeadTime)}
                    className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${
                      isDark
                        ? 'bg-[#101424] text-slate-100 border-[#252E4A]'
                        : 'bg-white text-slate-900 border-[#E8E2D8]'
                    }`}
                  >
                    <option value="none">At time of event</option>
                    <option value="1_day">1 day before</option>
                    <option value="3_days">3 days before</option>
                    <option value="1_week">1 week before</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
            isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#C59B63] hover:bg-[#D4A373] text-[#12172A] font-black font-mono text-xs rounded-xl uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
            >
              {editingDoc ? 'Save Changes' : 'Stash Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
