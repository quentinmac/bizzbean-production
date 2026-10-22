import React from 'react';
import { BizzSolution } from '../types';
import { X, Play, Clock, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

interface VideoModalProps {
  solution: BizzSolution | null;
  onClose: () => void;
  onLaunchSolution: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  solution,
  onClose,
  onLaunchSolution,
}) => {
  if (!solution) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#222F4C] bg-[#111726] p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151D30] transition-colors"
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Video Header */}
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
          <span>Explainer Masterclass</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{solution.name}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{solution.explainerDuration}</span>
        </div>

        <h3 className="font-['Outfit'] text-xl sm:text-2xl font-bold text-white tracking-tight">
          How {solution.name} Enables Business Growth
        </h3>

        {/* Video Canvas Simulation */}
        <div className="mt-5 rounded-xl border border-[#222F4C] bg-[#0A0D14] aspect-video flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer shadow-inner">
          <div className="h-16 w-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
            <Play className="h-7 w-7 fill-slate-950 ml-1" />
          </div>

          <div className="mt-4 text-xs font-mono text-slate-300">
            Click to Stream High-Definition Explainer Walkthrough
          </div>

          <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Machine-Readable Transcript Linked</span>
            <span>Duration: {solution.explainerDuration}</span>
          </div>
        </div>

        {/* Video Takeaways */}
        <div className="mt-5 p-4 rounded-xl bg-[#0A0D14] border border-[#222F4C] space-y-2">
          <div className="text-xs font-mono text-amber-400 font-bold uppercase">
            Curriculum Takeaways & Implementation Checkpoints:
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Core driver breakdown: understanding the mathematical inputs of {solution.name}.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Google Sheets & Google Workspace direct synchronization walkthrough.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Socratic defense preparation: how to present these metrics to institutional investors.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#222F4C] flex justify-between items-center">
          <span className="text-xs font-mono text-slate-400">
            Transcripts automatically indexed in Knowledge Base Library.
          </span>

          <button
            onClick={() => {
              onClose();
              onLaunchSolution();
            }}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors font-['Outfit']"
          >
            Launch Solution Now
          </button>
        </div>

      </div>
    </div>
  );
};
