import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Send,
  Play,
  RefreshCw,
  UserPlus,
  LogIn,
  CopyX,
  Globe,
  Eye,
  FileText,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { ClientProfile } from '../types';
import {
  checkClientExists,
  evaluateOnboardingDecision,
  OnboardingActionType,
  OnboardingDecisionReport,
} from '../services/onboardingAuditService';
import {
  fetchWelcomeEmailPreview,
  getEmailStatus,
  sendWelcomeEmail,
} from '../services/emailService';
import {
  getCachedClientProfiles,
  loadMergedClientProfilesFromCloud,
} from '../services/transactionJournalService';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

interface OnboardingAuditSimulatorProps {
  theme?: 'light' | 'dark';
  defaultTestEmail?: string;
  onNotify?: (message: string) => void;
}

type ScenarioPresetId = 'new-client' | 'existing-signin' | 'duplicate-signup' | 'guest-sandbox';

export const OnboardingAuditSimulator: React.FC<OnboardingAuditSimulatorProps> = ({
  theme = 'dark',
  defaultTestEmail = 'thebizzbeanchannel@gmail.com',
  onNotify,
}) => {
  const isDark = theme === 'dark';

  const [registeredClients, setRegisteredClients] = useState<ClientProfile[]>(() =>
    getCachedClientProfiles()
  );
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPresetId>('existing-signin');
  const [simAction, setSimAction] = useState<OnboardingActionType>('signin');
  const [simEmail, setSimEmail] = useState<string>(defaultTestEmail);
  const [simName, setSimName] = useState<string>('Quentin McCullough');
  const [simCompany, setSimCompany] = useState<string>('BizzBean Holdings (Pty) Ltd');

  const [isRunningAudit, setIsRunningAudit] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<OnboardingDecisionReport | null>(null);

  // Live Email HTML preview from /api/email/preview-welcome
  const [previewTab, setPreviewTab] = useState<'email-html' | 'in-app-modal'>('email-html');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewSubject, setPreviewSubject] = useState<string>(
    'your SANDBOX is ready — welcome to bizzbean'
  );
  const [previewLogoReady, setPreviewLogoReady] = useState<boolean>(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // SMTP channel status & live test send
  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    host: string;
    port: number;
    sender: string;
    logoAssetReady?: boolean;
  } | null>(null);
  const [liveTestRecipient, setLiveTestRecipient] = useState<string>(defaultTestEmail);
  const [isSendingLiveTest, setIsSendingLiveTest] = useState<boolean>(false);
  const [liveSendResult, setLiveSendResult] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadMergedClientProfilesFromCloud()
      .then((clients) => {
        if (clients.length > 0) {
          setRegisteredClients(clients);
        }
      })
      .catch(() => {});

    getEmailStatus()
      .then((status) => setSmtpStatus(status))
      .catch(() => {});
  }, []);

  const loadEmailPreview = useCallback(async (email: string, name: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetchWelcomeEmailPreview({
        recipientEmail: email || 'founder@example.com',
        recipientName: name || 'Founder',
        firstName: (name || 'Founder').trim().split(' ')[0],
        isSimulationTest: false,
      });
      if (res.success && res.html) {
        setPreviewHtml(res.html);
        if (res.subject) setPreviewSubject(res.subject);
        setPreviewLogoReady(Boolean(res.logoFoundOnDisk));
      }
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  const runSimulationAudit = useCallback(
    async (
      overrideAction?: OnboardingActionType,
      overrideEmail?: string,
      overrideName?: string,
      overrideCompany?: string
    ) => {
      const actionToRun = overrideAction ?? simAction;
      const emailToRun = (overrideEmail ?? simEmail).trim();
      const nameToRun = (overrideName ?? simName).trim() || 'Entrepreneur';
      const companyToRun = (overrideCompany ?? simCompany).trim() || 'Bizzbean Member Enterprise';

      setIsRunningAudit(true);
      try {
        const lookup =
          actionToRun === 'guest'
            ? {
                emailNormalized: '',
                exists: false,
                source: 'none' as const,
                welcomeEmailAlreadySent: false,
              }
            : await checkClientExists(emailToRun);

        const report = evaluateOnboardingDecision({
          action: actionToRun,
          email: emailToRun,
          displayName: nameToRun,
          companyName: companyToRun,
          clientLookup: lookup,
        });

        setAuditReport(report);
        await loadEmailPreview(emailToRun || 'guest@sandbox.bizzbean.com', report.displayName);
      } finally {
        setIsRunningAudit(false);
      }
    },
    [simAction, simEmail, simName, simCompany, loadEmailPreview]
  );

  // Run initial audit on mount so the user sees live results immediately
  useEffect(() => {
    runSimulationAudit('signin', defaultTestEmail, 'Quentin McCullough', 'BizzBean Holdings (Pty) Ltd');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (preset: ScenarioPresetId) => {
    setSelectedPreset(preset);
    if (preset === 'new-client') {
      const uniqueTag = Math.floor(1000 + Math.random() * 9000);
      const freshEmail = `thabo.burgers.${uniqueTag}@streetfood.co.za`;
      const freshName = 'Thabo Mokoena';
      const freshCompany = 'Kasi Flame Burgers';
      setSimAction('signup');
      setSimEmail(freshEmail);
      setSimName(freshName);
      setSimCompany(freshCompany);
      runSimulationAudit('signup', freshEmail, freshName, freshCompany);
    } else if (preset === 'existing-signin') {
      const firstReal =
        registeredClients.find((c) => c.email?.toLowerCase().includes('quentin')) ||
        registeredClients.find((c) => c.email) ||
        null;
      const existingEmail = firstReal?.email || defaultTestEmail;
      const existingName = firstReal?.name || 'Quentin McCullough';
      const existingCompany = firstReal?.companyName || 'BizzBean Holdings (Pty) Ltd';
      setSimAction('signin');
      setSimEmail(existingEmail);
      setSimName(existingName);
      setSimCompany(existingCompany);
      runSimulationAudit('signin', existingEmail, existingName, existingCompany);
    } else if (preset === 'duplicate-signup') {
      const firstReal =
        registeredClients.find((c) => c.email?.toLowerCase().includes('quentin')) ||
        registeredClients.find((c) => c.email) ||
        null;
      const existingEmail = firstReal?.email || defaultTestEmail;
      const existingName = firstReal?.name || 'Quentin McCullough';
      const existingCompany = firstReal?.companyName || 'BizzBean Holdings (Pty) Ltd';
      setSimAction('signup');
      setSimEmail(existingEmail);
      setSimName(existingName);
      setSimCompany(existingCompany);
      runSimulationAudit('signup', existingEmail, existingName, existingCompany);
    } else {
      setSimAction('guest');
      setSimEmail('');
      setSimName('Guest Explorer');
      setSimCompany('Public Sandbox');
      runSimulationAudit('guest', '', 'Guest Explorer', 'Public Sandbox');
    }
  };

  const handleSelectExistingClient = (email: string) => {
    const found = registeredClients.find((c) => c.email === email);
    if (!found) return;
    setSimEmail(found.email);
    setSimName(found.name);
    setSimCompany(found.companyName || 'Bizzbean Member Enterprise');
    runSimulationAudit(simAction, found.email, found.name, found.companyName || '');
  };

  const handleSendLiveTestWelcomeEmail = async () => {
    const target = liveTestRecipient.trim();
    if (!target || !target.includes('@')) {
      setLiveSendResult({ type: 'error', text: 'Enter a valid destination email address first.' });
      return;
    }
    setIsSendingLiveTest(true);
    setLiveSendResult(null);
    try {
      const res = await sendWelcomeEmail({
        recipientEmail: target,
        recipientName: simName || 'Quentin',
        firstName: (simName || 'Quentin').trim().split(' ')[0],
        companyName: simCompany || 'BizzBean',
        isNewClientSignup: true,
        isSimulationTest: true,
      });
      if (res.success && !res.suppressed) {
        const msg = `Live test "your SANDBOX is ready" email sent to ${target} with inline bizzbean-favicon.jpg logo.`;
        setLiveSendResult({ type: 'success', text: msg });
        onNotify?.(msg);
      } else {
        setLiveSendResult({
          type: 'error',
          text: res.error || res.reason || 'Failed to dispatch test welcome email.',
        });
      }
    } catch (err: any) {
      setLiveSendResult({
        type: 'error',
        text: err?.message || 'Error dispatching live test welcome email.',
      });
    } finally {
      setIsSendingLiveTest(false);
    }
  };

  const cardSurface = isDark
    ? 'bg-[#141A2E] border-[#222F4C] text-slate-100'
    : 'bg-white border-[#D8CEBC] text-slate-800';
  const subSurface = isDark
    ? 'bg-[#0E1220] border-[#252E4A] text-slate-200'
    : 'bg-[#FAF8F5] border-[#E8E2D8] text-slate-800';
  const inputSurface = isDark
    ? 'bg-[#0B0F1C] border-[#2B3759] text-white placeholder-slate-500'
    : 'bg-white border-[#D8CEBC] text-slate-900 placeholder-slate-400';

  const statusStyle = (status: string) => {
    switch (status) {
      case 'DISPATCH':
        return isDark
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
          : 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'PASS':
        return isDark
          ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
          : 'bg-sky-50 text-sky-800 border-sky-300';
      case 'PRESERVED':
        return isDark
          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35'
          : 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case 'BLOCKED':
        return isDark
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
          : 'bg-amber-50 text-amber-800 border-amber-300';
      default:
        return isDark
          ? 'bg-slate-700/40 text-slate-300 border-slate-600/50'
          : 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Summary Bar */}
      <div className={`p-4 sm:p-5 rounded-xl border ${cardSurface} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#5584B4]" />
            <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider">
              ONBOARDING PROCESS AUDIT &amp; SIGN-UP / SIGN-IN SIMULATOR
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                isDark
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              DRY-RUN SAFE
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Executes the exact production onboarding rules engine used by Sign-Up, Sign-In, Firestore lookup, and Xneelo SMTP without creating fake accounts or sending unintended emails.
          </p>
        </div>

        {/* Live SMTP & Logo Asset Status */}
        <div className={`px-3.5 py-2.5 rounded-lg border text-[11px] font-mono shrink-0 ${subSurface}`}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-bold">
              {smtpStatus ? `${smtpStatus.host}:${smtpStatus.port}` : 'smtp.bizzbean.com:465'}
            </span>
          </div>
          <div className={`mt-0.5 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Welcome Logo:{' '}
            <strong className={previewLogoReady ? 'text-emerald-500' : 'text-amber-500'}>
              bizzbean-favicon.jpg (inline CID)
            </strong>
          </div>
        </div>
      </div>

      {/* Scenario Selector Presets */}
      <div className={`p-4 rounded-xl border ${cardSurface} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#5584B4]">
            1. SELECT TEST SCENARIO (OR TEST ANY CLIENT EMAIL BELOW)
          </div>
          <div className="flex items-center gap-2">
            <label className={`text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Quick-Pick Registered Client:
            </label>
            <select
              value=""
              onChange={(e) => handleSelectExistingClient(e.target.value)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer ${inputSurface}`}
            >
              <option value="">-- Choose from Client Directory ({registeredClients.length}) --</option>
              {registeredClients.map((c) => (
                <option key={c.id || c.email} value={c.email}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Scenario Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {[
            {
              id: 'new-client' as ScenarioPresetId,
              title: 'New Client Sign-Up',
              subtitle: 'Fresh email · Welcome mail SENT once',
              icon: UserPlus,
              accent: 'emerald',
            },
            {
              id: 'existing-signin' as ScenarioPresetId,
              title: 'Existing Client Sign-In',
              subtitle: 'Known member · Welcome mail SUPPRESSED',
              icon: LogIn,
              accent: 'sky',
            },
            {
              id: 'duplicate-signup' as ScenarioPresetId,
              title: 'Duplicate Sign-Up Guard',
              subtitle: 'Known email re-registers · Mail BLOCKED',
              icon: CopyX,
              accent: 'amber',
            },
            {
              id: 'guest-sandbox' as ScenarioPresetId,
              title: 'Public Guest Preview',
              subtitle: 'No account · Zero email / zero sign_up',
              icon: Globe,
              accent: 'slate',
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = selectedPreset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => applyPreset(item.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? isDark
                      ? 'bg-[#1D2745] border-[#5584B4] shadow-sm'
                      : 'bg-[#EEF5FB] border-[#5584B4] shadow-xs'
                    : isDark
                    ? 'bg-[#0E1220] border-[#252E4A] hover:border-[#3D4E7A]'
                    : 'bg-[#FAF8F5] border-[#E8E2D8] hover:border-[#C7BBA7]'
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold">
                  <Icon className="h-3.5 w-3.5 text-[#5584B4] shrink-0" />
                  <span>{item.title}</span>
                </div>
                <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {item.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Inputs + Run Audit Button */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
          <div className="md:col-span-2">
            <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Auth Action
            </label>
            <select
              value={simAction}
              onChange={(e) => setSimAction(e.target.value as OnboardingActionType)}
              className={`w-full px-2.5 py-2 rounded-lg border text-xs font-mono ${inputSurface}`}
            >
              <option value="signup">New Sign-Up</option>
              <option value="signin">Member Sign-In</option>
              <option value="guest">Public Guest</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Test Email Address
            </label>
            <input
              type="email"
              value={simEmail}
              disabled={simAction === 'guest'}
              onChange={(e) => setSimEmail(e.target.value)}
              placeholder="client@venture.co.za"
              className={`w-full px-3 py-2 rounded-lg border text-xs font-mono disabled:opacity-50 ${inputSurface}`}
            />
          </div>

          <div className="md:col-span-3">
            <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Founder Name
            </label>
            <input
              type="text"
              value={simName}
              disabled={simAction === 'guest'}
              onChange={(e) => setSimName(e.target.value)}
              placeholder="e.g. Thabo Mokoena"
              className={`w-full px-3 py-2 rounded-lg border text-xs font-mono disabled:opacity-50 ${inputSurface}`}
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={() => runSimulationAudit()}
              disabled={isRunningAudit}
              className="w-full px-4 py-2 rounded-lg bg-[#2E5E88] hover:bg-[#234E73] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {isRunningAudit ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span>{isRunningAudit ? 'Auditing...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split View: Left = Step-by-Step Pipeline Trace | Right = Live Email & Letter Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Pipeline Audit Trace */}
        <div className={`xl:col-span-6 p-4 sm:p-5 rounded-xl border ${cardSurface} space-y-4`}>
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-500/20">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#5584B4]">
              2. STEP-BY-STEP ONBOARDING AUDIT TRACE
            </div>
            {auditReport && (
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Checked at {new Date(auditReport.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {auditReport ? (
            <>
              {/* High-Level Verdict Summary */}
              <div
                className={`p-3.5 rounded-xl border space-y-3 ${
                  auditReport.shouldDispatchWelcomeEmail
                    ? isDark
                      ? 'bg-emerald-950/35 border-emerald-500/40'
                      : 'bg-emerald-50 border-emerald-300'
                    : isDark
                    ? 'bg-sky-950/35 border-sky-500/40'
                    : 'bg-sky-50 border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase">
                    {auditReport.shouldDispatchWelcomeEmail ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-[#5584B4] shrink-0" />
                    )}
                    <span>
                      VERDICT: {auditReport.classification.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase opacity-75">
                    {auditReport.email || 'public guest'}
                  </span>
                </div>

                {/* 4 Decision Gate Readouts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                  <div className={`p-2 rounded-lg border ${subSurface}`}>
                    <div className="opacity-65 uppercase">Welcome Email</div>
                    <div
                      className={`font-bold mt-0.5 ${
                        auditReport.shouldDispatchWelcomeEmail ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    >
                      {auditReport.shouldDispatchWelcomeEmail ? 'DISPATCH ONCE' : 'SUPPRESSED'}
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg border ${subSurface}`}>
                    <div className="opacity-65 uppercase">Welcome Modal</div>
                    <div
                      className={`font-bold mt-0.5 ${
                        auditReport.shouldShowWelcomeLetterModal ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    >
                      {auditReport.shouldShowWelcomeLetterModal ? 'SHOW LETTER' : 'SKIPPED'}
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg border ${subSurface}`}>
                    <div className="opacity-65 uppercase">Client Tokens</div>
                    <div className="font-bold mt-0.5 text-[#5584B4]">
                      {auditReport.shouldCreditWelcomeTokens ? 'CREDIT NEW' : 'PRESERVED'}
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg border ${subSurface}`}>
                    <div className="opacity-65 uppercase">GA4 Event</div>
                    <div className="font-bold mt-0.5">{auditReport.ga4EventName}</div>
                  </div>
                </div>
              </div>

              {/* 5 Pipeline Steps */}
              <div className="space-y-2.5">
                {auditReport.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className={`p-3 rounded-xl border ${subSurface} space-y-1`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold">
                        <span className="w-5 h-5 rounded-md bg-[#5584B4]/20 text-[#5584B4] flex items-center justify-center text-[10px]">
                          0{step.stepNumber}
                        </span>
                        <span>{step.gate}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${statusStyle(
                          step.status
                        )}`}
                      >
                        {step.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold pl-7">{step.summary}</div>
                    <p
                      className={`text-[11px] pl-7 leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs font-mono text-slate-400">
              Select a scenario and click Run Simulation to audit the onboarding pipeline.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Welcome Email & Logo Verification Preview */}
        <div className={`xl:col-span-6 p-4 sm:p-5 rounded-xl border ${cardSurface} space-y-4 flex flex-col`}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-500/20">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#5584B4]">
              <Mail className="h-3.5 w-3.5" />
              <span>3. &lsquo;YOUR SANDBOX IS READY&rsquo; LETTER &amp; LOGO VERIFICATION</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setPreviewTab('email-html')}
                className={`px-2.5 py-1 rounded-md border cursor-pointer transition-colors flex items-center gap-1 ${
                  previewTab === 'email-html'
                    ? 'bg-[#2E5E88] text-white border-[#5584B4] font-bold'
                    : isDark
                    ? 'bg-[#0E1220] text-slate-400 border-[#252E4A]'
                    : 'bg-[#FAF8F5] text-slate-600 border-[#D8CEBC]'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>SMTP Email</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('in-app-modal')}
                className={`px-2.5 py-1 rounded-md border cursor-pointer transition-colors flex items-center gap-1 ${
                  previewTab === 'in-app-modal'
                    ? 'bg-[#2E5E88] text-white border-[#5584B4] font-bold'
                    : isDark
                    ? 'bg-[#0E1220] text-slate-400 border-[#252E4A]'
                    : 'bg-[#FAF8F5] text-slate-600 border-[#D8CEBC]'
                }`}
              >
                <FileText className="h-3 w-3" />
                <span>In-App Modal</span>
              </button>
            </div>
          </div>

          {/* Notice banner when selected scenario suppresses email */}
          {auditReport && !auditReport.shouldDispatchWelcomeEmail && (
            <div
              className={`px-3 py-2 rounded-lg border text-[11px] font-mono flex items-center gap-2 ${
                isDark
                  ? 'bg-amber-500/10 border-amber-500/35 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>
                In this simulated scenario ({auditReport.classification.replace(/_/g, ' ')}), this letter is <strong>NOT sent</strong>. Preview shown below for visual logo &amp; copy inspection.
              </span>
            </div>
          )}

          {/* Subject Line Bar */}
          <div className={`px-3 py-2 rounded-lg border text-[11px] font-mono flex items-center justify-between gap-2 ${subSurface}`}>
            <span className="truncate">
              <strong className="opacity-70">Subject:</strong> {previewSubject}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold shrink-0">
              bizzbean-favicon.jpg ✓
            </span>
          </div>

          {/* Preview Viewport */}
          <div className="flex-1 min-h-[420px] rounded-xl border border-[#D8CEBC] overflow-hidden bg-[#EBF1F6]">
            {previewTab === 'email-html' ? (
              isLoadingPreview ? (
                <div className="h-[440px] flex items-center justify-center text-xs font-mono text-slate-500">
                  Rendering live SMTP HTML template...
                </div>
              ) : (
                <iframe
                  title="Welcome Email HTML Preview"
                  srcDoc={previewHtml}
                  className="w-full h-[460px] border-0 bg-[#EBF1F6]"
                />
              )
            ) : (
              <div className="p-5 bg-[#EBF1F6] h-[460px] overflow-y-auto flex items-start justify-center">
                <div className="w-full max-w-lg bg-white border border-[#D8CEBC] rounded-2xl shadow-md overflow-hidden font-sans text-slate-800">
                  <div className="h-5 bg-[#5584B4] w-full" />
                  <div className="px-7 py-5 space-y-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <BizzbeanLogoIcon className="h-10 w-10 object-contain" />
                        <div className="flex items-baseline text-3xl text-[#707070] tracking-tight font-['Raleway']">
                          <span style={{ fontWeight: 300 }}>bizz</span>
                          <span style={{ fontWeight: 100 }}>bean</span>
                          <sup className="text-[10px] font-normal text-[#707070] ml-0.5 -top-2.5">TM</sup>
                        </div>
                      </div>
                      <h4 className="text-xl font-light font-['Raleway'] text-[#3E74A6]">
                        your SANDBOX is ready
                      </h4>
                    </div>
                    <div className="text-[#3E74A6] font-['Raleway'] text-sm">
                      Hi, {(auditReport?.displayName || simName || 'Entrepreneur').split(' ')[0]}
                    </div>
                    <p className="text-xs text-[#3E74A6] font-['Raleway'] leading-relaxed">
                      Thank you for creating a SANDBOX account with us at bizzbean. We hope that by doing this we can help you discover, build, grow and even enable investment in your entrepreneurial ABILITY.
                    </p>
                    <p className="text-xs text-[#3E74A6] font-['Raleway'] leading-relaxed">
                      Please download your free copy of our book &lsquo;getting to value&rsquo;. Also, keep an eye out for any message notifications.
                    </p>
                    <div className="pt-1">
                      <p className="italic text-[#4A7DAA] font-serif text-xs">sincerely,</p>
                      <p className="font-bold text-[#20476E] text-sm font-['Raleway']">the bizzbean team</p>
                    </div>
                  </div>
                  <div className="bg-[#9FC754] py-2.5 px-4 text-center text-white text-xs font-['Raleway'] lowercase">
                    instant viability. infinite wisdom. always on.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Optional Live Inbox Test Dispatch */}
          <div className={`p-3.5 rounded-xl border ${subSurface} space-y-2.5`}>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-[#5584B4]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Optional: Send Live Test Email to Verify Logo in Your Inbox</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={liveTestRecipient}
                onChange={(e) => setLiveTestRecipient(e.target.value)}
                placeholder="your.email@gmail.com"
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-mono ${inputSurface}`}
              />
              <button
                type="button"
                onClick={handleSendLiveTestWelcomeEmail}
                disabled={isSendingLiveTest}
                className="px-4 py-2 rounded-lg bg-[#9FC754] hover:bg-[#8AB63E] text-slate-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
              >
                {isSendingLiveTest ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{isSendingLiveTest ? 'Sending...' : 'Send Live Test Mail'}</span>
              </button>
            </div>
            {liveSendResult && (
              <div
                className={`text-[11px] font-mono px-2.5 py-1.5 rounded-lg border ${
                  liveSendResult.type === 'success'
                    ? isDark
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : isDark
                    ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                {liveSendResult.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingAuditSimulator;
