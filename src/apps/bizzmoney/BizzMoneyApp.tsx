import React, { useState } from 'react';
import {
  DollarSign,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  ListFilter,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { CoaManagementView } from '../../components/coa/CoaManagementView';

interface BizzMoneyAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  vatAmount: number;
  status: 'posted' | 'draft';
}

export const BizzMoneyApp: React.FC<BizzMoneyAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
  onNavigateToStage,
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'voice-logger' | 'general-journal' | 'chart-of-accounts' | 'trial-balance'>('voice-logger');

  // Voice simulation
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceQuery, setVoiceQuery] = useState<string>('Billed Apex Logistics $4,500 plus 15% VAT for financial advisory services.');
  const [feedback, setFeedback] = useState<string>('');

  // Form states
  const [clientName, setClientName] = useState<string>('Apex Global Logistics');
  const [txAmount, setTxAmount] = useState<number>(4500);
  const [debitAcc, setDebitAcc] = useState<string>('1200 ACCOUNTS RECEIVABLE');
  const [creditAcc, setCreditAcc] = useState<string>('4000 PROFESSIONAL SERVICES REVENUE');
  const [applyVat, setApplyVat] = useState<boolean>(true);

  // Journal entries
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: 'je-1',
      date: 'Today, 09:30',
      description: 'Invoice #1042 - Apex Global Logistics Advisory',
      debitAccount: '1200 ACCOUNTS RECEIVABLE',
      creditAccount: '4000 PROFESSIONAL SERVICES REVENUE',
      amount: 4500,
      vatAmount: 675,
      status: 'posted',
    },
    {
      id: 'je-2',
      date: 'Yesterday, 14:15',
      description: 'Monthly Cloud Infrastructure Hosting (AWS)',
      debitAccount: '6100 SOFTWARE & CLOUD INFRASTRUCTURE',
      creditAccount: '1000 OPERATING CASH ACCOUNT',
      amount: 1850,
      vatAmount: 277.5,
      status: 'posted',
    },
    {
      id: 'je-3',
      date: 'Oct 08, 11:00',
      description: 'Senior Engineering Team Sprint Drawdown',
      debitAccount: '6000 CORE SALARIES & PAYROLL',
      creditAccount: '1000 OPERATING CASH ACCOUNT',
      amount: 22000,
      vatAmount: 0,
      status: 'posted',
    },
  ]);

  const handlePostEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0) return;

    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      date: 'Just now',
      description: `Manual Entry - ${clientName}`,
      debitAccount: debitAcc,
      creditAccount: creditAcc,
      amount: txAmount,
      vatAmount: applyVat ? txAmount * 0.15 : 0,
      status: 'posted',
    };

    setEntries([newEntry, ...entries]);
    setFeedback('Entry posted successfully to the 62-account double-entry ledger.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const simulateVoiceRecording = () => {
    setIsListening(true);
    setFeedback('Listening for accounting voice instruction...');
    setTimeout(() => {
      setIsListening(false);
      setVoiceQuery('Received $12,500 from Retail Corp for custom dashboard license into bank account.');
      setClientName('Retail Corp');
      setTxAmount(12500);
      setDebitAcc('1000 OPERATING CASH ACCOUNT');
      setCreditAcc('4000 PROFESSIONAL SERVICES REVENUE');
      setFeedback('Voice instruction parsed into double-entry debit & credit!');
      setTimeout(() => setFeedback(''), 4000);
    }, 2200);
  };

  // Chart of accounts categories
  const chartOfAccounts = [
    { code: '1000-1999', name: 'Assets', count: 18, examples: '1000 Operating Cash, 1200 Accounts Receivable, 1500 Fixed Equipment' },
    { code: '2000-2999', name: 'Liabilities', count: 12, examples: '2000 Accounts Payable, 2200 VAT Output Tax, 2500 Convertible Debt' },
    { code: '3000-3999', name: 'Equity', count: 8, examples: '3000 Founder Capital, 3200 Retained Earnings, 3400 Safe Notes' },
    { code: '4000-4999', name: 'Revenue', count: 10, examples: '4000 Platform Licensing, 4200 Consulting Advisory, 4500 Digital Sandbox' },
    { code: '5000-5999', name: 'Direct COGS', count: 6, examples: '5000 Direct Labor, 5200 Hosting Compute, 5400 Merchant Fees' },
    { code: '6000-6999', name: 'Operating OpEx', count: 8, examples: '6000 Payroll Salaries, 6200 Rent & Facilities, 6400 Sales & Marketing' },
  ];

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Top Sub-Navigation Tabs */}
      <div
        className={`p-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#12172A] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'voice-logger', label: '1. Voice Transaction Logger' },
            { id: 'general-journal', label: '2. General Journal Ledger' },
            { id: 'chart-of-accounts', label: '3. 62-Account Chart of Accounts' },
            { id: 'trial-balance', label: '4. Live Trial Balance' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all lowercase whitespace-nowrap ${
                  isActive
                    ? isDark
                      ? 'bg-[#1E2548] text-[#DDEBF7] border border-[#5584B4] shadow-xs'
                      : 'bg-[#12172A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* MODULE 1: VOICE TRANSACTION LOGGER */}
      {activeTab === 'voice-logger' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Voice Input Box */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
                SPEECH & TEXT TRANSACTION INGESTION
              </span>
              <button
                type="button"
                onClick={simulateVoiceRecording}
                className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-mono font-bold transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-[#5584B4] hover:bg-[#436D99] text-white'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span>{isListening ? 'Recording...' : 'Click to Speak'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={voiceQuery}
              onChange={(e) => setVoiceQuery(e.target.value)}
              placeholder="e.g. Invoiced Client Acme $5,000 for consulting services..."
              className="w-full p-3 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-transparent text-xs font-mono resize-none focus:outline-none focus:border-[#5584B4]"
            />

            <form onSubmit={handlePostEntry} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Entity / Memo</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-transparent text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] bg-transparent text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Debit Account (Increase Asset / Expense)</label>
                <select
                  value={debitAcc}
                  onChange={(e) => setDebitAcc(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] text-xs font-mono ${isDark ? 'bg-[#0E1322]' : 'bg-white'}`}
                >
                  <option value="1000 OPERATING CASH ACCOUNT">1000 OPERATING CASH ACCOUNT</option>
                  <option value="1200 ACCOUNTS RECEIVABLE">1200 ACCOUNTS RECEIVABLE</option>
                  <option value="6000 CORE SALARIES & PAYROLL">6000 CORE SALARIES & PAYROLL</option>
                  <option value="6100 SOFTWARE & CLOUD INFRASTRUCTURE">6100 SOFTWARE & CLOUD INFRASTRUCTURE</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Credit Account (Increase Liability / Revenue)</label>
                <select
                  value={creditAcc}
                  onChange={(e) => setCreditAcc(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] text-xs font-mono ${isDark ? 'bg-[#0E1322]' : 'bg-white'}`}
                >
                  <option value="4000 PROFESSIONAL SERVICES REVENUE">4000 PROFESSIONAL SERVICES REVENUE</option>
                  <option value="1000 OPERATING CASH ACCOUNT">1000 OPERATING CASH ACCOUNT</option>
                  <option value="2000 ACCOUNTS PAYABLE">2000 ACCOUNTS PAYABLE</option>
                  <option value="2200 VAT OUTPUT TAX PAYABLE">2200 VAT OUTPUT TAX PAYABLE</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-mono text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyVat}
                    onChange={(e) => setApplyVat(e.target.checked)}
                    className="accent-[#5584B4]"
                  />
                  <span>Apply standard 15% VAT calculation</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white font-mono font-bold text-xs uppercase"
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </div>

          {/* Recent Posted Entries */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
            <span className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              RECENT JOURNAL POSTINGS
            </span>

            <div className="space-y-2.5">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] space-y-1.5 text-xs font-mono"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">{entry.description}</span>
                    <span className="font-bold text-[#5584B4]">${entry.amount.toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>DR: {entry.debitAccount}</span>
                    <span>CR: {entry.creditAccount}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>{entry.date}</span>
                    <span className="text-emerald-500 font-bold">● {entry.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: CHART OF ACCOUNTS */}
      {activeTab === 'chart-of-accounts' && (
        <div className="space-y-4">
          <CoaManagementView theme={theme} isAdmin={true} onNavigateToApp={(app) => onNavigateToStage?.('vi-ability', app)} />
        </div>
      )}

      {/* MODULE 4: TRIAL BALANCE */}
      {activeTab === 'trial-balance' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'}`}>
          <div className="flex justify-between items-center">
            <h3 className="font-mono text-xs font-bold uppercase text-slate-900 dark:text-white">
              TRIAL BALANCE BALANCE SHEET & P&L CHECK
            </h3>
            <span className="text-xs font-mono text-emerald-500 font-bold">Balanced: Debits = Credits</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${isDark ? 'bg-[#0E1322] border-[#252E4A] text-slate-400' : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-600'}`}>
                <tr>
                  <th className="p-2.5">Account Code & Title</th>
                  <th className="p-2.5 text-right">Debit ($)</th>
                  <th className="p-2.5 text-right">Credit ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#252E4A]">
                <tr>
                  <td className="p-2.5">1000 Operating Cash Account</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">185,400.00</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="p-2.5">1200 Accounts Receivable</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">42,600.00</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="p-2.5">2000 Accounts Payable</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">18,000.00</td>
                </tr>
                <tr>
                  <td className="p-2.5">4000 Professional Services Revenue</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">210,000.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
