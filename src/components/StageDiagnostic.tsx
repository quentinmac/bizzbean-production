import React, { useState } from 'react';
import { DIAGNOSTIC_QUESTIONS, VENTURE_STAGES } from '../data/bizzbeanData';
import { VentureStageId } from '../types';
import { ArrowRight, CheckCircle2, RotateCcw, Award, Sparkles, Layers } from 'lucide-react';

interface StageDiagnosticProps {
  onSelectRecommendedService: (serviceId: string, stageId: VentureStageId) => void;
}

export const StageDiagnostic: React.FC<StageDiagnosticProps> = ({ onSelectRecommendedService }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const currentQ = DIAGNOSTIC_QUESTIONS[currentQuestionIndex];

  const handleSelectOption = (optionIndex: number) => {
    const updatedAnswers = { ...answers, [currentQuestionIndex]: optionIndex };
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const resetDiagnostic = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
  };

  // Calculate scores
  const scores = React.useMemo(() => {
    const totals = {
      viability: 0,
      fundability: 0,
      sustainability: 0,
      investability: 0,
    };

    Object.entries(answers).forEach(([qIdxStr, optIdx]) => {
      const qIdx = Number(qIdxStr);
      const question = DIAGNOSTIC_QUESTIONS[qIdx];
      if (question && question.options[optIdx]) {
        const pts = question.options[optIdx].points;
        totals.viability += pts.viability;
        totals.fundability += pts.fundability;
        totals.sustainability += pts.sustainability;
        totals.investability += pts.investability;
      }
    });

    return totals;
  }, [answers]);

  // Determine highest priority stage
  const recommendedStageId: VentureStageId = React.useMemo(() => {
    let topStage: VentureStageId = 'fundability';
    let maxScore = -1;

    (Object.entries(scores) as [VentureStageId, number][]).forEach(([stg, score]) => {
      if (score > maxScore) {
        maxScore = score;
        topStage = stg;
      }
    });

    return topStage;
  }, [scores]);

  const recommendedStage = VENTURE_STAGES.find((s) => s.id === recommendedStageId) || VENTURE_STAGES[1];

  return (
    <section id="diagnostic" className="py-20 lg:py-28 border-b border-[#222F4C]/50 bg-[#0A0D14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <span>Client Onboarding Engine</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>60-Second Venture Assessment</span>
          </div>
          <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Identify your venture maturity and immediate bottleneck.
          </h2>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Answer 4 diagnostic questions to receive an instant analysis of where your enterprise sits across the 4 Stages and which quantitative deliverable will generate the highest ROI.
          </p>
        </div>

        {/* Diagnostic Container */}
        <div className="mt-10 rounded-2xl border border-[#222F4C] bg-[#111726] p-6 sm:p-10 shadow-2xl">
          {!isCompleted ? (
            <div>
              {/* Progress Indicator */}
              <div className="flex items-center justify-between pb-6 border-b border-[#222F4C] mb-8">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-amber-400">
                    Question {currentQuestionIndex + 1} of {DIAGNOSTIC_QUESTIONS.length}
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-400">Takes less than 1 minute</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {DIAGNOSTIC_QUESTIONS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 w-6 rounded-full transition-all ${
                        idx === currentQuestionIndex
                          ? 'bg-amber-400'
                          : idx < currentQuestionIndex
                          ? 'bg-emerald-500'
                          : 'bg-[#222F4C]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Question */}
              <div className="max-w-2xl mb-8">
                <h3 className="font-['Outfit'] text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {currentQ.question}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400">
                  {currentQ.context}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3.5">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQuestionIndex] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-4 sm:p-5 rounded-xl text-left border transition-all flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        isSelected
                          ? 'bg-[#151D30] border-amber-400/80 text-white shadow-md'
                          : 'bg-[#0A0D14]/70 border-[#222F4C] text-slate-300 hover:text-white hover:border-slate-500 hover:bg-[#151D30]/50'
                      }`}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 shrink-0 mt-0.5 text-xs font-mono text-slate-400">
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <div className="text-sm sm:text-base font-medium leading-relaxed">
                        {opt.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Back button if not at first */}
              {currentQuestionIndex > 0 && (
                <div className="mt-8 pt-4 border-t border-[#222F4C] flex justify-between">
                  <button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline-none"
                  >
                    ← Previous Question
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Results Screen */
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Diagnostic Synthesis Complete</span>
              </div>

              <h3 className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Recommended Focus: Stage {recommendedStage.index} — {recommendedStage.name}
              </h3>

              <p className="mt-3 text-base text-slate-300 max-w-2xl leading-relaxed">
                Based on your operational inputs, your highest-leverage priority is <span className="text-amber-400 font-semibold">{recommendedStage.tagline}</span>. Securing this milestone provides the quantitative foundation for subsequent funding and scaling.
              </p>

              {/* Stage Scores Breakdown */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#0A0D14] rounded-xl border border-[#222F4C]">
                {VENTURE_STAGES.map((stg) => {
                  const score = scores[stg.id];
                  const isTop = stg.id === recommendedStageId;
                  return (
                    <div key={stg.id} className="p-3 rounded-lg bg-[#151D30]/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-slate-400">{stg.index}. {stg.name}</span>
                        {isTop && <span className="text-[10px] text-amber-400 font-semibold uppercase">Focus</span>}
                      </div>
                      <div className="mt-2 font-mono text-xl font-bold text-white tabular-nums">
                        {score} pts
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommended Action Card */}
              <div className="mt-8 rounded-xl border border-amber-500/30 bg-[#151D30] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-xs font-mono text-amber-400 font-medium">Recommended Immediate Service</div>
                  <h4 className="font-['Outfit'] text-xl font-bold text-white mt-1">
                    {recommendedStage.name} Strategic Engagement
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">
                    {recommendedStage.metricsTarget}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={resetDiagnostic}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-slate-400 hover:text-white border border-[#222F4C] rounded-lg transition-colors focus-visible:outline-none"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retake</span>
                  </button>

                  <button
                    onClick={() =>
                      onSelectRecommendedService(recommendedStage.recommendedServiceId, recommendedStageId)
                    }
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <span>Request {recommendedStage.name} Service</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
