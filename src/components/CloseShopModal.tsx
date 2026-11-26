import React, { useState } from 'react';
import { X, CheckSquare, Square, ArrowRight, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

export interface DailyObjective {
  id: string;
  text: string;
  completed: boolean;
}

interface CloseShopModalProps {
  isOpen: boolean;
  isMember: boolean;
  objectives: DailyObjective[];
  onUpdateObjectives: (objs: DailyObjective[]) => void;
  onConfirmCloseShop: () => void;
  onCloseModal: () => void;
  onOpenSignUp?: () => void;
}

export const CloseShopModal: React.FC<CloseShopModalProps> = ({
  isOpen,
  isMember,
  objectives,
  onUpdateObjectives,
  onConfirmCloseShop,
  onCloseModal,
  onOpenSignUp,
}) => {
  const [localObjectives, setLocalObjectives] = useState<DailyObjective[]>(objectives);
  const [nextObjectives, setNextObjectives] = useState<string[]>([
    'Stress-test debtor collection lag in bizzmoney',
    'Finalize Series A forecast deck in fund-ability',
    'Review unit economics gross margin in vi-ability',
  ]);

  if (!isOpen) return null;

  const toggleObjective = (id: string) => {
    const updated = localObjectives.map((o) =>
      o.id === id ? { ...o, completed: !o.completed } : o
    );
    setLocalObjectives(updated);
    onUpdateObjectives(updated);
  };

  const handleSaveAndClose = () => {
    // Save next objectives if needed
    const newObjs: DailyObjective[] = nextObjectives
      .filter((t) => t.trim().length > 0)
      .map((t, i) => ({ id: `obj-${Date.now()}-${i}`, text: t.trim(), completed: false }));

    if (newObjs.length > 0) {
      onUpdateObjectives(newObjs);
    }
    onConfirmCloseShop();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#D8CEBC] bg-[#FAF8F5] p-6 sm:p-8 shadow-2xl text-slate-800 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
          <div className="flex items-center gap-2.5">
            <BizzbeanLogoIcon className="h-6 w-6" />
            <div>
              <span className="font-['Raleway'] font-light tracking-wide text-slate-900 text-sm lowercase block">
                bizzbean
              </span>
              <span className="text-[11px] font-mono text-[#9A7B4F] lowercase block -mt-0.5">
                {isMember ? 'close shop · daily session review' : 'workspace session'}
              </span>
            </div>
          </div>

          <button
            onClick={onCloseModal}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* MEMBER EXPERIENCE: REVIEW WORK & SET 3 WORK OBJECTIVES */}
        {isMember ? (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                TODAY'S WORK OBJECTIVES REVIEW
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take a moment to check off the milestones you achieved during this session:
              </p>

              <div className="mt-2.5 space-y-2">
                {localObjectives.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => toggleObjective(obj.id)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#E8E2D8] hover:border-[#DDEBF7] cursor-pointer transition-all shadow-2xs"
                  >
                    {obj.completed ? (
                      <CheckSquare className="h-4 w-4 text-[#5584B4] shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        obj.completed
                          ? 'line-through text-slate-400 font-normal'
                          : 'text-slate-800 font-medium'
                      }`}
                    >
                      {obj.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Set 3 Objectives for Next Work Session */}
            <div className="pt-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                SET 3 FOCUS OBJECTIVES FOR NEXT WORK SESSION
              </div>
              <p className="text-xs text-slate-600 mb-2">
                Define the 3 priorities on which you will focus when you next open your bizz-DESK:
              </p>

              <div className="space-y-1.5">
                {nextObjectives.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#9A7B4F] w-4 font-bold">0{idx + 1}.</span>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => {
                        const updated = [...nextObjectives];
                        updated[idx] = e.target.value;
                        setNextObjectives(updated);
                      }}
                      className="flex-grow px-3 py-1.5 rounded-lg border border-[#D8CEBC] bg-white text-xs font-mono focus:outline-none focus:border-[#5584B4]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-3">
              <button
                onClick={onCloseModal}
                className="px-3.5 py-2 text-xs font-mono text-slate-600 hover:text-slate-900 lowercase"
              >
                continue working
              </button>

              <button
                onClick={handleSaveAndClose}
                className="px-4 py-2.5 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 lowercase"
              >
                <span>save objectives & close shop</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#C59B63]" />
              </button>
            </div>
          </div>
        ) : (
          /* VISITOR / GUEST EXPERIENCE */
          <div className="space-y-5 py-2">
            <div className="p-5 rounded-2xl bg-[#DDEBF7]/40 border border-[#DDEBF7] shadow-2xs space-y-2">
              <div className="text-sm font-bold text-slate-900 leading-snug tracking-tight">
                Are you ready to LEARN how to EARN access to CAPITAL?
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Most businesses fail to raise capital because they lack defensible quantitative models and disciplined double-entry systems. 
                In your personal bizz-DESK sandbox, you can stress-test unit economics, build institutional 3-statement forecasts, and de-risk your venture with guidance from GIM.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  onCloseModal();
                  if (onOpenSignUp) onOpenSignUp();
                  else onConfirmCloseShop();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs lowercase"
              >
                <span>sign up to discover your bizz-ability</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#C59B63]" />
              </button>

              <button
                onClick={onConfirmCloseShop}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#F4EFE6] border border-[#D8CEBC] text-slate-700 text-xs font-medium transition-colors lowercase"
              >
                <span>back to website</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
