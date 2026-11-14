import React from 'react';
import { BizzPlanPitch } from '../../../types';
import {
  Plus,
  Trash2,
  Sparkles,
  DollarSign,
  TrendingUp,
  Users,
  Rocket,
  Target,
  Handshake,
} from 'lucide-react';

interface PitchFormProps {
  data: BizzPlanPitch;
  onChange: (data: BizzPlanPitch) => void;
  theme?: 'light' | 'dark';
}

const BulletInput = ({
  title,
  icon: Icon,
  items,
  onUpdate,
  placeholder,
  isDark,
}: {
  title: string;
  icon: any;
  items: string[];
  onUpdate: (newItems: string[]) => void;
  placeholder: string;
  isDark: boolean;
}) => {
  const handleAdd = () => onUpdate([...items, '']);
  const handleRemove = (index: number) => onUpdate(items.filter((_, i) => i !== index));
  const handleChange = (index: number, val: string) => {
    const next = [...items];
    next[index] = val;
    onUpdate(next);
  };

  const inputClass = `w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none transition-all ${
    isDark
      ? 'bg-[#101626] border-[#222F4C] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
      : 'bg-white border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
  }`;

  return (
    <div
      className={`space-y-3 p-4 border rounded-xl ${
        isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-[#2E5E88] dark:text-[#7FAADC]" />
          <h4 className="text-xs font-bold lowercase text-slate-900 dark:text-white">{title}</h4>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="text-[10px] font-bold lowercase text-[#2E5E88] dark:text-[#7FAADC] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus size={12} /> add bullet
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#2E5E88] dark:text-[#7FAADC]">•</span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder={`${placeholder} #${idx + 1}...`}
              className={inputClass}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PitchForm({ data, onChange, theme = 'light' }: PitchFormProps) {
  const isDark = theme === 'dark';

  const updateField = (field: keyof BizzPlanPitch, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Elevator Pitch */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          the elevator pitch (the 30-second hook)
        </label>
        <textarea
          value={data.elevatorPitch}
          onChange={(e) => updateField('elevatorPitch', e.target.value)}
          placeholder="describe the big picture problem and your unique solution in a compelling way..."
          className={`w-full min-h-[120px] rounded-xl border p-4 text-xs font-mono focus:outline-none resize-y leading-relaxed transition-all ${
            isDark
              ? 'bg-[#141A2E] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
              : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
          }`}
        />
      </div>

      {/* Structured Bullet Sections */}
      <div className="grid grid-cols-1 gap-4">
        <BulletInput
          isDark={isDark}
          title="the value offer"
          icon={Sparkles}
          items={data.valueOffer || ['', '', '']}
          onUpdate={(val) => updateField('valueOffer', val)}
          placeholder="unique value proposition"
        />
        <BulletInput
          isDark={isDark}
          title="the revenue model"
          icon={DollarSign}
          items={data.revenueModel || ['', '', '']}
          onUpdate={(val) => updateField('revenueModel', val)}
          placeholder="revenue stream / pricing mechanism"
        />
        <BulletInput
          isDark={isDark}
          title="the financial outlook"
          icon={TrendingUp}
          items={data.financialOutlook || ['', '', '']}
          onUpdate={(val) => updateField('financialOutlook', val)}
          placeholder="key projection / milestone"
        />
        <BulletInput
          isDark={isDark}
          title="the competitor landscape"
          icon={Users}
          items={data.competitorLandscape || ['', '', '']}
          onUpdate={(val) => updateField('competitorLandscape', val)}
          placeholder="key competitor / competitive moat"
        />
        <BulletInput
          isDark={isDark}
          title="how will you get to market?"
          icon={Rocket}
          items={data.getToMarket || ['', '', '']}
          onUpdate={(val) => updateField('getToMarket', val)}
          placeholder="customer acquisition channel / sales strategy"
        />
        <BulletInput
          isDark={isDark}
          title="how will funding act as a growth lever?"
          icon={Target}
          items={data.growthLeverFunding || ['', '', '']}
          onUpdate={(val) => updateField('growthLeverFunding', val)}
          placeholder="capital allocation / growth impact"
        />
        <BulletInput
          isDark={isDark}
          title="the funding deal"
          icon={Handshake}
          items={data.fundingDeal || ['', '', '']}
          onUpdate={(val) => updateField('fundingDeal', val)}
          placeholder="equity / debt offer terms"
        />
      </div>
    </div>
  );
}
