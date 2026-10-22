import React from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { SandboxDocument } from '../../types/sandboxLibrary';
import { getSourceTypeIcon, getSourceTypeLabel } from './DocumentCard';
import { calculateReminderState, getFrequencyLabel } from '../../services/sandboxLibraryService';

interface CitationModalProps {
  doc: SandboxDocument | null;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const CitationModal: React.FC<CitationModalProps> = ({ doc, onClose, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = React.useState(false);

  if (!doc) return null;

  const reminderState = doc.reminder ? calculateReminderState(doc.reminder) : null;

  const handleCopySnippet = () => {
    const textToCopy = `[Source Citation: ${doc.title}]\nURL/Source: ${doc.sourceUrl || doc.sourceName}\nCategory: ${doc.category}\nWhy It Matters: ${doc.whyItMatters}\nAction Step: ${doc.actionStep}\n\nExcerpt:\n${doc.content}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-3xl rounded-3xl shadow-2xl p-6 md:p-8 my-8 border ${
          isDark
            ? 'bg-[#101424] border-[#252E4A] text-slate-100'
            : 'bg-white border-[#E8E2D8] text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between pb-4 border-b gap-4 ${
          isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
        }`}>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                  isDark
                    ? 'bg-[#161C30] text-slate-300 border-[#252E4A]'
                    : 'bg-[#F4EFE6] text-slate-700 border-[#E8E2D8]'
                }`}
              >
                {getSourceTypeIcon(doc.sourceType)}
                <span>{getSourceTypeLabel(doc.sourceType)}</span>
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'bg-[#C59B63]/15 text-[#D4A373] border-[#C59B63]/30'
                    : 'bg-[#FAF8F5] text-[#C59B63] border-[#C59B63]/40'
                }`}
              >
                {doc.category}
              </span>
            </div>
            <h2 className={`text-xl font-black leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {doc.title}
            </h2>
            {doc.authorOrHost && (
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                By <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{doc.authorOrHost}</span>
                {doc.publicationOrShow && ` • ${doc.publicationOrShow}`}
              </p>
            )}
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

        {/* Video Embed if YouTube */}
        {doc.videoEmbedId && (
          <div className={`mt-4 rounded-2xl overflow-hidden aspect-video border bg-black shadow-lg ${
            isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
          }`}>
            <iframe
              src={`https://www.youtube.com/embed/${doc.videoEmbedId}?autoplay=0`}
              title={doc.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="space-y-4 my-6">
          {/* Why It Matters */}
          {doc.whyItMatters && (
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#161C30]/80 border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
            }`}>
              <span className="text-[10px] font-mono font-bold uppercase text-[#C59B63] tracking-wider block mb-1">
                Strategic Rationale (Why It Matters)
              </span>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {doc.whyItMatters}
              </p>
            </div>
          )}

          {/* Action Step */}
          {doc.actionStep && (
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#16203A]/70 border-[#2B3D66]' : 'bg-sky-50/70 border-sky-100'
            }`}>
              <span className="text-[10px] font-mono font-bold uppercase text-sky-400 tracking-wider block mb-1">
                Operational Action Step
              </span>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-sky-200' : 'text-sky-900'}`}>
                {doc.actionStep}
              </p>
            </div>
          )}

          {/* Stashed Excerpt / Grounding Content */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isDark ? 'bg-[#161C30]/50 border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-[#C59B63]" />
                Grounding Excerpt & Technical Context
              </span>
              <button
                onClick={handleCopySnippet}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border ${
                  isDark
                    ? 'bg-[#101424] hover:bg-[#1E2548] text-slate-300 border-[#252E4A]'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-[#E8E2D8]'
                }`}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Citation'}</span>
              </button>
            </div>
            <div className={`text-xs font-mono p-3.5 rounded-xl border whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed ${
              isDark
                ? 'bg-[#0A0D14] text-slate-300 border-[#252E4A]'
                : 'bg-white text-slate-800 border-[#E8E2D8]'
            }`}>
              {doc.content}
            </div>
          </div>

          {/* Reminder Info */}
          {doc.reminder && doc.reminder.enabled && reminderState && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
            }`}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C59B63]" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  Reminder: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{reminderState.formattedDueText}</strong> ({doc.reminder.targetDate})
                </span>
              </div>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {getFrequencyLabel(doc.reminder.frequency)}
              </span>
            </div>
          )}

          {/* Source Link & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {doc.tags.map((tag, i) => (
                <span
                  key={i}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                    isDark
                      ? 'text-slate-400 bg-[#161C30] border-[#252E4A]'
                      : 'text-slate-600 bg-[#F4EFE6] border-[#E8E2D8]'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {doc.sourceUrl && (
              <a
                href={doc.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#C59B63] hover:text-[#D4A373] cursor-pointer"
              >
                <span>Open External Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end pt-4 border-t ${
          isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
        }`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 font-bold font-mono text-xs rounded-xl cursor-pointer transition-colors border ${
              isDark
                ? 'bg-[#161C30] hover:bg-[#1E2548] text-white border-[#252E4A]'
                : 'bg-[#12172A] hover:bg-[#1E2548] text-white border-[#12172A]'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
