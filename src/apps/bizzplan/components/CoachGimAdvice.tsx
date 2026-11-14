import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Coins,
  BarChart3,
  GitMerge,
  Calculator,
  FileCheck,
  BookOpen,
  Users,
  Copy,
  Check,
  Lock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CoachGimAdviceProps {
  pageId: string;
  pageTitle: string;
  businessName: string;
  businessType: string;
  theme?: 'light' | 'dark';
  onDeductTokens?: (amount: number, description: string) => void;
}

interface OrganogramNode {
  id: string;
  label: string;
  description: string;
  parentId: string | null;
}

interface OrganogramData {
  title: string;
  nodes: OrganogramNode[];
}

export default function CoachGimAdvice({
  pageId,
  pageTitle,
  businessName,
  businessType,
  theme = 'light',
  onDeductTokens,
}: CoachGimAdviceProps) {
  const isDark = theme === 'dark';
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'statistical' | 'organogram' | 'calculator' | 'policies' | 'reading' | 'advisors'>('statistical');
  const [loading, setLoading] = useState(false);
  const [adviceContent, setAdviceContent] = useState<string>('');
  const [organogramData, setOrganogramData] = useState<OrganogramData | null>(null);
  const [copied, setCopied] = useState(false);

  const [tamUnits, setTamUnits] = useState<number>(50000);
  const [sellingPrice, setSellingPrice] = useState<number>(150);
  const [marketSharePercent, setMarketSharePercent] = useState<number>(2.5);
  const [grossMarginPercent, setGrossMarginPercent] = useState<number>(60);

  const tabs: Array<{ id: 'statistical' | 'organogram' | 'calculator' | 'policies' | 'reading' | 'advisors'; label: string; icon: any }> = [
    { id: 'statistical', label: 'statistical data', icon: BarChart3 },
    { id: 'organogram', label: 'organograms', icon: GitMerge },
    { id: 'calculator', label: 'calculators', icon: Calculator },
    { id: 'policies', label: 'policies', icon: FileCheck },
    { id: 'reading', label: 'further reading', icon: BookOpen },
    { id: 'advisors', label: 'external advisors', icon: Users },
  ];

  useEffect(() => {
    const unlockedPages = JSON.parse(localStorage.getItem('gim_unlocked_pages') || '{}');
    if (unlockedPages[pageId]) {
      setIsUnlocked(true);
      fetchAdvice(activeTab);
    } else {
      setIsUnlocked(false);
      setAdviceContent('');
      setOrganogramData(null);
    }
  }, [pageId]);

  const handleUnlock = () => {
    if (onDeductTokens) {
      onDeductTokens(100, `Coach GIM Advisory Access: ${pageTitle}`);
    } else {
      window.dispatchEvent(
        new CustomEvent('bizz-token-deduction', {
          detail: { amount: 100, description: `Coach GIM Advisory Access: ${pageTitle}` },
        })
      );
    }

    const unlockedPages = JSON.parse(localStorage.getItem('gim_unlocked_pages') || '{}');
    unlockedPages[pageId] = true;
    localStorage.setItem('gim_unlocked_pages', JSON.stringify(unlockedPages));

    setIsUnlocked(true);
    fetchAdvice(activeTab);
  };

  const fetchAdvice = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/engagement/gim-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          pageTitle,
          businessName: businessName || 'BizzBean Venture',
          businessType: businessType || 'Enterprise Operations',
          adviceType: type,
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch Coach GIM advice');
      const data = await response.json();
      setAdviceContent(data.markdown || '');
      if (data.organogram) {
        setOrganogramData(data.organogram);
      } else {
        setOrganogramData(null);
      }
    } catch (err) {
      console.error('Coach GIM advice error:', err);
      setAdviceContent('### Coach GIM Temporarily Unavailable\n\nPlease retry in a moment or inspect your live model metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId: 'statistical' | 'organogram' | 'calculator' | 'policies' | 'reading' | 'advisors') => {
    setActiveTab(tabId);
    if (isUnlocked) {
      fetchAdvice(tabId);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(adviceContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderOrganogramNode = (node: OrganogramNode, allNodes: OrganogramNode[], depth = 0) => {
    const children = allNodes.filter((n) => n.parentId === node.id);
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div
          className={`border rounded-xl p-3 text-center max-w-[210px] ${
            isDark
              ? 'bg-[#101626] border-[#252E4A]'
              : 'bg-white border-[#D8CEBC] shadow-2xs'
          }`}
        >
          <div className="text-[11px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
            {node.label}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {node.description}
          </div>
        </div>
        {children.length > 0 && (
          <>
            <div className="w-[1px] h-4 bg-[#D8CEBC] dark:bg-[#252E4A]" />
            <div className="flex flex-wrap justify-center gap-4 pt-2 border-t border-[#D8CEBC] dark:border-[#252E4A]">
              {children.map((child) => renderOrganogramNode(child, allNodes, depth + 1))}
            </div>
          </>
        )}
      </div>
    );
  };

  const targetUnits = Math.round(tamUnits * (marketSharePercent / 100));
  const estAnnualRevenue = targetUnits * sellingPrice;
  const estGrossProfit = estAnnualRevenue * (grossMarginPercent / 100);

  return (
    <div
      className={`border rounded-2xl overflow-hidden font-mono transition-colors ${
        isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC] shadow-2xs'
      }`}
    >
      {/* Header matching V2 left-hand panel cards */}
      <div
        className={`border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#161C30] border-[#222F4C]' : 'bg-[#F4EFE6]/90 border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2E5E88] text-white flex items-center justify-center shrink-0">
            <Sparkles size={15} />
          </div>
          <div>
            <h4 className="text-xs font-bold lowercase tracking-tight text-slate-900 dark:text-white">
              coach gim executive advice
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 lowercase">
              bespoke guidance for {pageTitle} · {businessName || 'your venture'}
            </p>
          </div>
        </div>

        {isUnlocked && (
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold lowercase transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#101626] border-[#252E4A] text-slate-200 hover:border-[#5584B4]'
                : 'bg-white border-[#D8CEBC] text-[#2E5E88] hover:border-[#2E5E88]'
            }`}
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copied ? 'copied' : 'copy advice'}</span>
          </button>
        )}
      </div>

      {!isUnlocked ? (
        <div className="p-6 text-center space-y-4">
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center mx-auto ${
              isDark
                ? 'bg-[#141A2E] border-[#252E4A] text-[#7FAADC]'
                : 'bg-[#FAF8F5] border-[#D8CEBC] text-[#2E5E88]'
            }`}
          >
            <Lock size={18} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h5 className="text-xs font-bold lowercase text-slate-900 dark:text-white">
              unlock tailored advisory intelligence for {pageTitle}
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              access sector statistics, interactive market share calculators, hr organograms, policy templates, executive reading, and advisor recommendations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleUnlock}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E5E88] hover:bg-[#244c70] text-white text-xs font-bold lowercase transition-colors cursor-pointer shadow-2xs"
          >
            <Coins size={13} />
            <span>unlock section advice (100 tokens)</span>
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap gap-1.5 border-b border-[#D8CEBC] dark:border-[#222F4C] pb-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold lowercase transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-[#2E5E88] text-white border-[#2E5E88] shadow-2xs'
                      : isDark
                      ? 'bg-[#141A2E] text-slate-400 border-[#252E4A] hover:text-white'
                      : 'bg-[#FAF8F5] text-slate-600 border-[#D8CEBC] hover:text-slate-900'
                  }`}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'calculator' && (
            <div
              className={`p-4 rounded-xl border space-y-4 ${
                isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC]">
                <TrendingUp size={14} /> market share & unit economic simulator
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'tam (units/yr)', val: tamUnits, setter: setTamUnits, step: '1' },
                  { label: 'unit price (r)', val: sellingPrice, setter: setSellingPrice, step: '1' },
                  { label: 'target share (%)', val: marketSharePercent, setter: setMarketSharePercent, step: '0.1' },
                  { label: 'gross margin (%)', val: grossMarginPercent, setter: setGrossMarginPercent, step: '1' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-[10px] font-bold lowercase text-slate-500 dark:text-slate-400 block mb-1">
                      {f.label}
                    </label>
                    <input
                      type="number"
                      step={f.step}
                      value={f.val}
                      onChange={(e) => f.setter(Number(e.target.value) || 0)}
                      className={`w-full px-2.5 py-2 rounded-xl border text-xs font-mono focus:outline-none ${
                        isDark
                          ? 'bg-[#101626] border-[#222F4C] text-white focus:border-[#5584B4]'
                          : 'bg-white border-[#D8CEBC] text-slate-900 focus:border-[#2E5E88]'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  <div className="text-[10px] lowercase text-slate-500 dark:text-slate-400">
                    target sales volume
                  </div>
                  <div className="text-sm font-bold text-[#2E5E88] dark:text-[#7FAADC] mt-0.5 tabular-nums">
                    {targetUnits.toLocaleString()} units
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  <div className="text-[10px] lowercase text-slate-500 dark:text-slate-400">
                    annual revenue
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    R {estAnnualRevenue.toLocaleString()}
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#101626] border-[#222F4C]' : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  <div className="text-[10px] lowercase text-slate-500 dark:text-slate-400">
                    est. gross profit
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                    R {estGrossProfit.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 lowercase">
              synthesizing coach gim strategic intelligence...
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {organogramData && organogramData.nodes && organogramData.nodes.length > 0 && (
                <div
                  className={`p-4 rounded-xl border overflow-x-auto ${
                    isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                  }`}
                >
                  <div className="text-xs font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC] mb-4 text-center">
                    {organogramData.title}
                  </div>
                  <div className="flex justify-center">
                    {organogramData.nodes
                      .filter((n) => n.parentId === null)
                      .map((root) => renderOrganogramNode(root, organogramData.nodes))}
                  </div>
                </div>
              )}

              {adviceContent && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <ReactMarkdown>{adviceContent}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
