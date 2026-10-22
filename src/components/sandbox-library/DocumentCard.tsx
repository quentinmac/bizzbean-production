import React from 'react';
import {
  Bookmark,
  Edit3,
  Trash2,
  PlaySquare,
  Video,
  Headphones,
  BookOpen,
  Mail,
  Globe,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  Bell
} from 'lucide-react';
import { SandboxDocument, SandboxSourceType } from '../../types/sandboxLibrary';
import { getFrequencyLabel, calculateReminderState } from '../../services/sandboxLibraryService';

interface DocumentCardProps {
  doc: SandboxDocument;
  onOpenCitation: (doc: SandboxDocument) => void;
  onEdit: (doc: SandboxDocument) => void;
  onDelete: (id: string) => void;
  onTogglePin?: (id: string) => void;
  theme?: 'light' | 'dark';
}

export function getSourceTypeIcon(type: SandboxSourceType) {
  switch (type) {
    case 'video_file':
    case 'video_url':
      return <Video className="w-3.5 h-3.5 text-rose-400" />;
    case 'podcast_url':
    case 'voice_audio':
      return <Headphones className="w-3.5 h-3.5 text-purple-400" />;
    case 'book':
      return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
    case 'newsletter_email':
      return <Mail className="w-3.5 h-3.5 text-emerald-400" />;
    case 'web_article':
      return <Globe className="w-3.5 h-3.5 text-sky-400" />;
    case 'financial_statement':
      return <FileSpreadsheet className="w-3.5 h-3.5 text-[#C59B63]" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  }
}

export function getSourceTypeLabel(type: SandboxSourceType): string {
  switch (type) {
    case 'video_url': return 'YouTube / Video';
    case 'video_file': return 'Video File';
    case 'podcast_url': return 'Podcast / Audio';
    case 'book': return 'Book Reference';
    case 'newsletter_email': return 'Email / Newsletter';
    case 'web_article': return 'Web Article';
    case 'financial_statement': return 'Financial Model / Tax';
    case 'policy_governance': return 'Statutory / Policy';
    default: return 'Document';
  }
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  onOpenCitation,
  onEdit,
  onDelete,
  onTogglePin,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const reminderState = doc.reminder ? calculateReminderState(doc.reminder) : null;

  return (
    <div
      className={`group rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border cursor-default ${
        isDark
          ? 'bg-[#101424] border-[#252E4A] hover:border-[#5584B4] hover:shadow-xl hover:shadow-black/50'
          : 'bg-white border-[#E8E2D8] hover:border-[#C59B63] hover:shadow-md'
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
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

          <div className="flex items-center gap-1">
            {onTogglePin && (
              <button
                onClick={() => onTogglePin(doc.id)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  doc.isPinned
                    ? 'text-[#C59B63] bg-[#C59B63]/15'
                    : isDark
                    ? 'text-slate-500 hover:text-slate-300 hover:bg-[#161C30]'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Pin document"
              >
                <Bookmark className="w-3.5 h-3.5" fill={doc.isPinned ? 'currentColor' : 'none'} />
              </button>
            )}
            <button
              onClick={() => onEdit(doc)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-500 hover:text-slate-300 hover:bg-[#161C30]'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Edit document"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(doc.id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="Delete document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenCitation(doc)}
          className={`text-base font-bold transition-colors cursor-pointer line-clamp-2 mb-2 ${
            isDark
              ? 'text-slate-100 hover:text-[#C59B63]'
              : 'text-slate-900 hover:text-[#C59B63]'
          }`}
        >
          {doc.title}
        </h3>

        {/* YouTube / Media banner if applicable */}
        {doc.videoEmbedId && (
          <div
            onClick={() => onOpenCitation(doc)}
            className={`mb-3 relative rounded-xl overflow-hidden border group/thumb cursor-pointer aspect-video bg-black flex items-center justify-center ${
              isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
            }`}
          >
            <img
              src={`https://img.youtube.com/vi/${doc.videoEmbedId}/mqdefault.jpg`}
              alt={doc.title}
              className="w-full h-full object-cover opacity-85 group-hover/thumb:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                <PlaySquare className="w-5 h-5 ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Why it Matters & Action Step */}
        <div className="space-y-2 mb-4">
          {doc.whyItMatters && (
            <div
              className={`p-2.5 rounded-xl border ${
                isDark
                  ? 'bg-[#161C30]/80 border-[#252E4A]'
                  : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5 text-[#C59B63]">
                Strategic Rationale
              </span>
              <p
                className={`text-xs leading-relaxed line-clamp-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {doc.whyItMatters}
              </p>
            </div>
          )}

          {doc.actionStep && (
            <div
              className={`p-2.5 rounded-xl border ${
                isDark
                  ? 'bg-[#16203A]/70 border-[#2B3D66]'
                  : 'bg-sky-50/70 border-sky-100'
              }`}
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5 text-sky-400">
                Action Step
              </span>
              <p
                className={`text-xs leading-relaxed line-clamp-2 ${
                  isDark ? 'text-sky-200' : 'text-sky-900'
                }`}
              >
                {doc.actionStep}
              </p>
            </div>
          )}
        </div>

        {/* Reminder Pill if enabled */}
        {doc.reminder && doc.reminder.enabled && reminderState && (
          <div
            className={`mb-3 p-2 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              reminderState.isOverdue
                ? isDark
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
                : reminderState.isDue
                ? isDark
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
                : isDark
                ? 'bg-[#161C30] border-[#252E4A] text-slate-300'
                : 'bg-[#FAF8F5] border-[#E8E2D8] text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#C59B63]" />
              <span>{reminderState.formattedDueText} ({doc.reminder.targetDate})</span>
            </div>
            <span className="text-[10px] opacity-75 font-mono">{getFrequencyLabel(doc.reminder.frequency)}</span>
          </div>
        )}
      </div>

      {/* Footer / Citation CTA */}
      <div
        className={`pt-3 border-t flex items-center justify-between ${
          isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          {doc.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
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

        <button
          onClick={() => onOpenCitation(doc)}
          className={`flex items-center gap-1 text-xs font-bold font-mono uppercase tracking-wider group-hover:translate-x-0.5 transition-all cursor-pointer ${
            isDark
              ? 'text-[#C59B63] hover:text-[#D4A373]'
              : 'text-[#C59B63] hover:text-[#12172A]'
          }`}
        >
          <span>Ground Source</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
