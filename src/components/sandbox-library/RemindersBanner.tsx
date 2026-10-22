import React from 'react';
import { Bell, ArrowRight, AlertTriangle } from 'lucide-react';
import { SandboxDocument } from '../../types/sandboxLibrary';
import { getUpcomingReminders } from '../../services/sandboxLibraryService';

interface RemindersBannerProps {
  documents: SandboxDocument[];
  onOpenDocument: (doc: SandboxDocument) => void;
  onOpenQuickStash?: () => void;
  theme?: 'light' | 'dark';
}

export default function RemindersBanner({
  documents,
  onOpenDocument,
  theme = 'dark'
}: RemindersBannerProps) {
  const isDark = theme === 'dark';
  const upcoming = getUpcomingReminders(documents);

  if (upcoming.length === 0) return null;

  const topReminder = upcoming[0];
  const isOverdue = topReminder.state.isOverdue;

  return (
    <div
      className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-between gap-3 text-xs transition-colors ${
        isOverdue
          ? isDark
            ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
            : 'bg-rose-50 border-rose-200 text-rose-900'
          : isDark
          ? 'bg-[#C59B63]/10 border-[#C59B63]/25 text-[#D4A373]'
          : 'bg-[#F4EFE6] border-[#E8E2D8] text-[#12172A]'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            isOverdue
              ? 'bg-rose-600/30 text-rose-300'
              : isDark
              ? 'bg-[#C59B63]/25 text-[#D4A373]'
              : 'bg-[#C59B63]/20 text-[#C59B63]'
          }`}
        >
          {isOverdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
        </div>
        <div className="truncate">
          <span
            className={`font-mono font-bold uppercase tracking-wider text-[10px] mr-2 px-1.5 py-0.5 rounded border ${
              isDark
                ? 'bg-black/30 border-white/10 text-white'
                : 'bg-white/80 border-slate-200 text-slate-800'
            }`}
          >
            {topReminder.state.formattedDueText}
          </span>
          <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {topReminder.doc.title}
          </span>
          {topReminder.reminder.note && (
            <span className={`hidden md:inline ml-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              — {topReminder.reminder.note}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {upcoming.length > 1 && (
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              isDark ? 'bg-black/40 text-slate-300' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            +{upcoming.length - 1} more
          </span>
        )}
        <button
          onClick={() => onOpenDocument(topReminder.doc)}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold font-mono tracking-wider uppercase cursor-pointer transition-colors shadow-xs ${
            isOverdue
              ? 'bg-rose-600 text-white hover:bg-rose-500'
              : isDark
              ? 'bg-[#C59B63] text-[#12172A] hover:bg-[#D4A373] font-black'
              : 'bg-[#12172A] text-white hover:bg-[#1E2548]'
          }`}
        >
          <span>View Action</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
