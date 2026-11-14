import React from 'react';
import { BizzPlanGovernance } from '../../../types';
import {
  Plus,
  Trash2,
  Building2,
  Calendar,
  ShieldCheck,
  Users,
  UserCheck,
  Briefcase,
} from 'lucide-react';

interface GovernanceFormProps {
  data: BizzPlanGovernance;
  onChange: (data: BizzPlanGovernance) => void;
  theme?: 'light' | 'dark';
}

export default function GovernanceForm({
  data,
  onChange,
  theme = 'light',
}: GovernanceFormProps) {
  const isDark = theme === 'dark';
  const corporate = data.corporate || {};
  const boardMembers = data.boardMembers || [{ name: '', shareholding: '' }];
  const keyPersonnel = data.keyPersonnel || [{ name: '', position: '' }];
  const professionalSupport = data.professionalSupport || [{ name: '', serviceType: '' }];

  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-all ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
  }`;

  const compactInputClass = `w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none transition-all ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
  }`;

  const labelClass =
    'text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1';

  const sectionHeaderClass =
    'flex items-center justify-between border-b border-[#D8CEBC] dark:border-[#222F4C] pb-2';

  const updateCorporate = (
    field: keyof NonNullable<BizzPlanGovernance['corporate']>,
    val: string
  ) => {
    onChange({
      ...data,
      corporate: { ...corporate, [field]: val },
    });
  };

  const addBoardMember = () => {
    onChange({
      ...data,
      boardMembers: [...boardMembers, { name: '', shareholding: '' }],
    });
  };

  const removeBoardMember = (idx: number) => {
    onChange({
      ...data,
      boardMembers: boardMembers.filter((_, i) => i !== idx),
    });
  };

  const updateBoardMember = (idx: number, field: 'name' | 'shareholding', val: string) => {
    const next = [...boardMembers];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, boardMembers: next });
  };

  const addKeyPersonnel = () => {
    onChange({
      ...data,
      keyPersonnel: [...keyPersonnel, { name: '', position: '' }],
    });
  };

  const removeKeyPersonnel = (idx: number) => {
    onChange({
      ...data,
      keyPersonnel: keyPersonnel.filter((_, i) => i !== idx),
    });
  };

  const updateKeyPersonnel = (idx: number, field: 'name' | 'position', val: string) => {
    const next = [...keyPersonnel];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, keyPersonnel: next });
  };

  const addSupport = () => {
    onChange({
      ...data,
      professionalSupport: [...professionalSupport, { name: '', serviceType: '' }],
    });
  };

  const removeSupport = (idx: number) => {
    onChange({
      ...data,
      professionalSupport: professionalSupport.filter((_, i) => i !== idx),
    });
  };

  const updateSupport = (idx: number, field: 'name' | 'serviceType', val: string) => {
    const next = [...professionalSupport];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...data, professionalSupport: next });
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Corporate Governance */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#D8CEBC] dark:border-[#222F4C] pb-2">
          <Building2 size={14} className="text-[#2E5E88] dark:text-[#7FAADC]" />
          <h4 className="text-xs font-bold lowercase text-slate-900 dark:text-white">
            corporate governance
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>legal form</label>
            <input
              type="text"
              value={corporate.legalForm || ''}
              onChange={(e) => updateCorporate('legalForm', e.target.value)}
              placeholder="e.g. (pty) ltd, llc, sole prop"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>
              <Calendar size={10} /> start date
            </label>
            <input
              type="date"
              value={corporate.startDate || ''}
              onChange={(e) => updateCorporate('startDate', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>financial month end</label>
            <input
              type="text"
              value={corporate.financialMonthEnd || ''}
              onChange={(e) => updateCorporate('financialMonthEnd', e.target.value)}
              placeholder="e.g. february, december"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>board size</label>
            <input
              type="text"
              value={corporate.boardSize || ''}
              onChange={(e) => updateCorporate('boardSize', e.target.value)}
              placeholder="e.g. 3 directors"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>board quorum</label>
            <input
              type="text"
              value={corporate.boardQuorum || ''}
              onChange={(e) => updateCorporate('boardQuorum', e.target.value)}
              placeholder="e.g. 2 directors (66%)"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>board meeting frequency</label>
            <input
              type="text"
              value={corporate.boardMeetingFrequency || ''}
              onChange={(e) => updateCorporate('boardMeetingFrequency', e.target.value)}
              placeholder="e.g. quarterly"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>financial reporting frequency</label>
            <input
              type="text"
              value={corporate.financialReportingFrequency || ''}
              onChange={(e) => updateCorporate('financialReportingFrequency', e.target.value)}
              placeholder="e.g. monthly management accounts"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>
              <ShieldCheck size={10} /> shareholders agreement
            </label>
            <input
              type="text"
              value={corporate.shareholdersAgreement || ''}
              onChange={(e) => updateCorporate('shareholdersAgreement', e.target.value)}
              placeholder="e.g. executed & dated / in progress"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Board Members */}
      <div className="space-y-3">
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#2E5E88] dark:text-[#7FAADC]" />
            <h4 className="text-xs font-bold lowercase text-slate-900 dark:text-white">
              board members
            </h4>
          </div>
          <button
            type="button"
            onClick={addBoardMember}
            className="text-[10px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} /> add member
          </button>
        </div>

        <div className="space-y-2">
          {boardMembers.map((member, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-7">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateBoardMember(idx, 'name', e.target.value)}
                  placeholder="director / shareholder name"
                  className={compactInputClass}
                />
              </div>
              <div className="col-span-4">
                <input
                  type="text"
                  value={member.shareholding}
                  onChange={(e) => updateBoardMember(idx, 'shareholding', e.target.value)}
                  placeholder="shareholding %"
                  className={compactInputClass}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                {boardMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBoardMember(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Personnel */}
      <div className="space-y-3">
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-[#2E5E88] dark:text-[#7FAADC]" />
            <h4 className="text-xs font-bold lowercase text-slate-900 dark:text-white">
              key personnel
            </h4>
          </div>
          <button
            type="button"
            onClick={addKeyPersonnel}
            className="text-[10px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} /> add personnel
          </button>
        </div>

        <div className="space-y-2">
          {keyPersonnel.map((person, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updateKeyPersonnel(idx, 'name', e.target.value)}
                  placeholder="full name"
                  className={compactInputClass}
                />
              </div>
              <div className="col-span-5">
                <input
                  type="text"
                  value={person.position}
                  onChange={(e) => updateKeyPersonnel(idx, 'position', e.target.value)}
                  placeholder="position / title"
                  className={compactInputClass}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                {keyPersonnel.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKeyPersonnel(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Professional Support */}
      <div className="space-y-3">
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-[#2E5E88] dark:text-[#7FAADC]" />
            <h4 className="text-xs font-bold lowercase text-slate-900 dark:text-white">
              professional support
            </h4>
          </div>
          <button
            type="button"
            onClick={addSupport}
            className="text-[10px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} /> add partner
          </button>
        </div>

        <div className="space-y-2">
          {professionalSupport.map((support, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <input
                  type="text"
                  value={support.name}
                  onChange={(e) => updateSupport(idx, 'name', e.target.value)}
                  placeholder="firm / advisor name"
                  className={compactInputClass}
                />
              </div>
              <div className="col-span-5">
                <input
                  type="text"
                  value={support.serviceType}
                  onChange={(e) => updateSupport(idx, 'serviceType', e.target.value)}
                  placeholder="service type (legal, tax, accounting)"
                  className={compactInputClass}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                {professionalSupport.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSupport(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
