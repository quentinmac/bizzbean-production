import React, { useState } from 'react';
import { LibraryItem } from '../types';
import { X, Download, FileText, Check, ShieldCheck, ArrowRight } from 'lucide-react';

interface LibraryItemModalProps {
  item: LibraryItem | null;
  onClose: () => void;
}

export const LibraryItemModal: React.FC<LibraryItemModalProps> = ({ item, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!item) return null;

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#222F4C] bg-[#111726] p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151D30] transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
          <span>{item.type}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{item.date}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{item.size}</span>
        </div>

        <h3 className="font-['Outfit'] text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
          {item.title}
        </h3>

        <div className="mt-4 p-4 rounded-xl bg-[#0A0D14] border border-[#222F4C]">
          <div className="text-[11px] font-mono text-slate-400 uppercase mb-2">Stored Content Synopsis:</div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono">
            {item.contentSnippet}
          </p>
        </div>

        <div className="mt-4 space-y-2 text-xs font-mono text-slate-400">
          <div className="flex justify-between py-1 border-b border-[#222F4C]">
            <span>Venture Milestone:</span>
            <span className="text-amber-400 font-bold">{item.stage}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#222F4C]">
            <span>Google Workspace Format:</span>
            <span className="text-emerald-400 font-bold">Native Cloud Synchronized</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Formula Lock Status:</span>
            <span className="text-white font-bold">100% Unlocked (Client Owned)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#222F4C] flex justify-between items-center">
          <span className="text-[11px] font-mono text-slate-500">
            Encrypted in Bizzbean Virtual Vault
          </span>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors font-mono"
          >
            {downloaded ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            <span>{downloaded ? 'Downloaded to Drive' : 'Download Document'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
