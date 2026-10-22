import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, Check, ArrowRight } from 'lucide-react';

interface IlluminatedSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterWorkspace?: () => void;
}

const SLIDES = [
  {
    slideNumber: 1,
    title: 'the illuminated sandbox',
    tagline: 'bizzbean · official concept deck',
    quote: 'infinite wisdom. instant viability. always on.',
    type: 'cover',
  },
  {
    slideNumber: 2,
    title: 'What if the next Usain Bolt was an entrepreneur, but was never given a track?',
    body: 'We celebrate world-class talent when it has a track to run on. Yet millions of brilliant young minds with game-changing ideas never reach the start line.',
    takeaway: 'The missing element is infrastructure, not drive.',
    metaphor: 'The Starting Blocks',
  },
  {
    slideNumber: 3,
    title: 'Dismantling the Barrier to Entry',
    barrierPoints: [
      'Expensive, inaccessible advisors',
      'Intimidating, rigid academic applications',
      'Complex, difficult-to-understand spreadsheets',
    ],
    startLinePoints: [
      'Gentle AI coach powered by Google\'s Gemini',
      'Risk-free, 24/7 Virtual Sandbox',
      'Dynamic dials providing real-time clarity',
    ],
    footer: 'We decided to change the paradigm completely to help entrepreneurs learn, model, and plan their businesses so they can earn access to capital.',
  },
  {
    slideNumber: 4,
    title: 'The Virtual Sandbox',
    body: 'Instead of static templates, we provide a continuous, risk-free digital environment. Entrepreneurs can test, model, and refine their ideas 24 hours a day, 7 days a week.',
    pillars: [
      { label: 'Always On', desc: 'Constant access to modeling tools.' },
      { label: 'Safe Environment', desc: 'Test assumptions without financial ruin.' },
      { label: 'Iterative Learning', desc: 'Refine mechanics through immediate feedback.' },
    ],
  },
  {
    slideNumber: 5,
    title: 'Clarity Over Complexity',
    body: 'Complex financial modeling becomes as simple as moving dynamic dials. No spreadsheets. No long-winded justifications. Just real-time clarity.',
    callout: 'Gemini AI processing complex variables into intuitive visual feedback in real time.',
  },
  {
    slideNumber: 6,
    title: 'The Four-Stage Filter',
    body: 'This structured filter ensures only businesses built on solid foundations get to market.',
    stages: [
      { step: 'Step 1', name: 'Viability (Discovery)', desc: 'Testing the financial viability of the startup idea.' },
      { step: 'Step 2', name: 'Fundability (Build)', desc: 'Learning to model and plan capital requirements with absolute precision.' },
      { step: 'Step 3', name: 'Sustainability (Growth)', desc: 'Embedding operational resilience and compliance into the business model.' },
      { step: 'Step 4', name: 'Investability (Final)', desc: 'Experiencing exponential growth and preparing for rigorous investor scrutiny.' },
    ],
  },
  {
    slideNumber: 7,
    title: 'Phase 2: Growing the Entrepreneur',
    body: 'Filtering and validating the business is only phase one. Phase two is integrating world-class expertise to build the leader behind the business.',
    pillars: [
      { label: 'Strategy', desc: 'Navigating market realities.' },
      { label: 'Critical Thinking', desc: 'Evaluating risks and opportunities.' },
      { label: 'Machine-Based Systems', desc: 'Leveraging Gemini and advanced tech for scale.' },
    ],
  },
  {
    slideNumber: 8,
    title: 'The Societal Impact Equation',
    equation: '[ Validated Businesses + Grown Entrepreneurs ] x Scaled AI Sandbox = The Solution to Youth Unemployment',
    body: 'Youth unemployment is one of the greatest challenges of our time. We believe scaled, fundamental entrepreneurship is the definitive answer.',
  },
  {
    slideNumber: 9,
    title: 'Build an Asset of Value',
    cards: [
      {
        target: 'For Leaders',
        text: 'If you are committed to economic transformation, bring your expertise and become a Champion.',
      },
      {
        target: 'For Founders',
        text: 'Head to bizzbean.com. Discover, build, grow, and invest in your true ability. Create your own sandbox.',
      },
    ],
    closing: "Every journey has a roadmap. Don't chase capital. Build a business that deserves it.",
  },
];

export const IlluminatedSandboxModal: React.FC<IlluminatedSandboxModalProps> = ({
  isOpen,
  onClose,
  onEnterWorkspace,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!isOpen) return null;

  const current = SLIDES[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-[#D8CEBC] bg-[#FAF8F5] p-6 sm:p-10 shadow-2xl my-8 flex flex-col justify-between min-h-[500px] text-slate-800 font-sans">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <span className="font-['Raleway'] font-bold text-slate-900 text-sm lowercase">bizzbean</span>
            <span>·</span>
            <span className="text-[#9A7B4F] lowercase">the illuminated sandbox presentation</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Slide Content Area (Architectural grid background) */}
        <div className="my-auto py-6">
          
          {/* SLIDE 1: Cover */}
          {current.slideNumber === 1 && (
            <div className="text-center space-y-4 py-8">
              <div className="font-['Raleway'] text-4xl sm:text-5xl font-light text-slate-900 tracking-wide lowercase">
                bizzbean
              </div>
              <div className="text-sm font-mono text-[#9A7B4F] uppercase tracking-widest font-semibold">
                the illuminated sandbox
              </div>
              <div className="text-xs font-mono text-slate-500 pt-6 lowercase">
                {current.quote}
              </div>
            </div>
          )}

          {/* SLIDE 2: Usain Bolt / Starting Blocks */}
          {current.slideNumber === 2 && (
            <div className="space-y-6">
              <h3 className="font-sans text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {current.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                {current.body}
              </p>
              <div className="p-5 rounded-2xl bg-white border border-[#D8CEBC] shadow-xs max-w-md">
                <div className="text-sm sm:text-base font-semibold text-slate-900">
                  {current.takeaway}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: The Barrier vs The Start Line */}
          {current.slideNumber === 3 && (
            <div className="space-y-6">
              <h3 className="font-sans text-xl font-bold text-slate-900">
                {current.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800">
                  <div className="font-mono text-xs text-rose-400 font-bold uppercase">The Barrier</div>
                  {current.barrierPoints?.map((p, i) => (
                    <div key={i} className="text-xs text-slate-300">
                      • {p}
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 text-slate-900 space-y-2">
                  <div className="font-mono text-xs text-[#9A7B4F] font-bold uppercase">The Start Line</div>
                  {current.startLinePoints?.map((p, i) => (
                    <div key={i} className="text-xs text-slate-800 font-medium flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E2D8] text-xs text-slate-700 italic">
                "{current.footer}"
              </div>
            </div>
          )}

          {/* SLIDE 6: The Four-Stage Filter */}
          {current.slideNumber === 6 && (
            <div className="space-y-4">
              <h3 className="font-sans text-xl font-bold text-slate-900">
                {current.title}
              </h3>
              <p className="text-xs text-slate-600">
                {current.body}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {current.stages?.map((stg, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-[#E8E2D8] shadow-xs">
                    <div className="text-[11px] font-mono text-[#9A7B4F] font-bold uppercase">{stg.step}</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{stg.name}</div>
                    <div className="text-[11px] text-slate-600 mt-1">{stg.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 8: Equation */}
          {current.slideNumber === 8 && (
            <div className="space-y-6 text-center py-4">
              <div className="p-6 rounded-2xl bg-white border-2 border-slate-900 shadow-sm max-w-xl mx-auto">
                <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                  {current.equation}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {current.body}
              </p>
            </div>
          )}

          {/* SLIDE 9: Build an Asset of Value */}
          {current.slideNumber === 9 && (
            <div className="space-y-6">
              <h3 className="font-sans text-xl font-bold text-slate-900">
                {current.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {current.cards?.map((card, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-[#D8CEBC] shadow-xs space-y-1">
                    <div className="font-bold text-xs uppercase font-mono text-slate-900">{card.target}</div>
                    <div className="text-xs text-slate-600 leading-relaxed">{card.text}</div>
                  </div>
                ))}
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-mono text-center">
                "{current.closing}"
              </div>
            </div>
          )}

          {/* Default for Other Slides */}
          {current.slideNumber !== 1 && current.slideNumber !== 2 && current.slideNumber !== 3 && current.slideNumber !== 6 && current.slideNumber !== 8 && current.slideNumber !== 9 && (
            <div className="space-y-4">
              <h3 className="font-sans text-xl font-bold text-slate-900">
                {current.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {current.body}
              </p>
              {current.callout && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-slate-800 font-medium">
                  {current.callout}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
          <div className="text-xs font-mono text-slate-500">
            Slide {currentSlideIndex + 1} of {SLIDES.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="p-2 rounded-xl bg-white border border-[#D8CEBC] text-slate-700 hover:bg-[#F4EFE6] disabled:opacity-40 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.min(SLIDES.length - 1, prev + 1))}
              disabled={currentSlideIndex === SLIDES.length - 1}
              className="p-2 rounded-xl bg-white border border-[#D8CEBC] text-slate-700 hover:bg-[#F4EFE6] disabled:opacity-40 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {onEnterWorkspace && (
              <button
                onClick={() => {
                  onClose();
                  onEnterWorkspace();
                }}
                className="ml-3 px-4 py-2 bg-[#12172A] hover:bg-[#1E2548] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 lowercase"
              >
                <span>enter bizz-desk</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#C59B63]" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
