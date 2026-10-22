import React, { useState } from 'react';
import { MasterclassItem } from '../types';
import { X, Play, Download, CheckCircle2, ArrowRight, Clock, BookOpen, FileSpreadsheet } from 'lucide-react';

interface MasterclassModalProps {
  item: MasterclassItem | null;
  onClose: () => void;
  onRequestWalkthrough: (serviceId: string) => void;
}

export const MasterclassModal: React.FC<MasterclassModalProps> = ({
  item,
  onClose,
  onRequestWalkthrough,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!item) return null;

  const handleSimulateDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#222F4C] bg-[#111726] p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151D30] transition-colors focus-visible:outline-none"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 font-mono">
          <span>{item.format}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{item.duration}</span>
        </div>

        <h3 className="font-['Outfit'] text-2xl font-bold text-white tracking-tight leading-snug">
          {item.title}
        </h3>

        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          {item.description}
        </p>

        {/* Video / Interactive Player Mock */}
        <div className="mt-6 rounded-xl border border-[#222F4C] bg-[#0A0D14] p-8 text-center flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="h-16 w-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg cursor-pointer group-hover:scale-105 transition-transform">
            <Play className="h-7 w-7 fill-slate-950 ml-1" />
          </div>
          <div className="mt-4 text-xs font-mono text-slate-300">
            Click to Stream 4K Masterclass Lesson
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Instructor: {item.instructor}
          </div>
        </div>

        {/* Included Resources */}
        <div className="mt-6 p-4 rounded-xl bg-[#151D30] border border-[#222F4C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Deliverable Asset Package</div>
              <div className="text-xs text-slate-400">{item.takeaway}</div>
            </div>
          </div>

          <button
            onClick={handleSimulateDownload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{downloadSuccess ? 'Template Prepared!' : 'Download Assets'}</span>
          </button>
        </div>

        {/* Footer Handover */}
        <div className="mt-6 pt-5 border-t border-[#222F4C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            Need a custom version built for your exact enterprise numbers?
          </span>

          <button
            onClick={() => {
              onClose();
              onRequestWalkthrough('financial-model-engine');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Book Private Quantitative Walkthrough</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
