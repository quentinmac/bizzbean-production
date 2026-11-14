import React, { useRef } from 'react';
import { BizzPlanCoverPage } from '../../../types';
import { Upload, X, Building, MapPin, User, Calendar, Mail, Phone, Lock } from 'lucide-react';

interface CoverPageFormProps {
  data: BizzPlanCoverPage;
  onChange: (data: BizzPlanCoverPage) => void;
  lockedCompanyName?: string;
  theme?: 'light' | 'dark';
}

export default function CoverPageForm({
  data,
  onChange,
  lockedCompanyName,
  theme = 'light',
}: CoverPageFormProps) {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-all ${
    isDark
      ? 'bg-[#141A2E] border-[#252E4A] text-white placeholder:text-slate-500 focus:border-[#5584B4]'
      : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 placeholder:text-slate-400 focus:border-[#2E5E88]'
  }`;

  const labelClass =
    'text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, companyLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field: keyof BizzPlanCoverPage, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Company Logo Upload */}
      <div className="space-y-2">
        <label className={labelClass}>company logo</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative group border border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
            isDark
              ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]'
              : 'bg-[#FAF8F5] border-[#D8CEBC] hover:border-[#2E5E88]'
          }`}
        >
          {data.companyLogo ? (
            <div className="relative flex flex-col items-center">
              <img
                src={data.companyLogo}
                alt="Company Logo"
                className="max-h-24 max-w-[200px] object-contain rounded-lg"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChange('companyLogo', '');
                }}
                className="mt-2 text-[10px] text-rose-500 font-bold lowercase flex items-center gap-1 hover:underline cursor-pointer"
              >
                <X size={12} /> remove logo
              </button>
            </div>
          ) : (
            <>
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${
                  isDark
                    ? 'bg-[#101626] border-[#222F4C] text-[#7FAADC]'
                    : 'bg-white border-[#D8CEBC] text-[#2E5E88]'
                }`}
              >
                <Upload size={17} />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#2E5E88] dark:text-[#7FAADC] lowercase">
                  click to upload brand logo
                </p>
                <p className="text-[10px] text-slate-400 lowercase mt-0.5">
                  png, jpg or svg recommended
                </p>
              </div>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className={labelClass}>
              <Building size={12} /> name of company
            </label>
            <span
              className={`text-[9px] px-2 py-0.5 rounded-md border flex items-center gap-1 lowercase ${
                isDark
                  ? 'bg-[#141A2E] border-[#252E4A] text-[#7FAADC]'
                  : 'bg-[#FAF8F5] border-[#D8CEBC] text-[#2E5E88]'
              }`}
            >
              <Lock size={9} /> synced
            </span>
          </div>
          <input
            type="text"
            value={lockedCompanyName || data.companyName}
            readOnly
            placeholder="enter company name in bizzmodel..."
            className={`${inputClass} opacity-75 cursor-not-allowed`}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            <Building size={12} /> type of business
          </label>
          <input
            type="text"
            value={data.businessType}
            onChange={(e) => handleChange('businessType', e.target.value)}
            placeholder="e.g. manufacturing, saas, retail..."
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            <MapPin size={12} /> location of business
          </label>
          <input
            type="text"
            value={data.businessLocation}
            onChange={(e) => handleChange('businessLocation', e.target.value)}
            placeholder="city, country"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            <User size={12} /> preparation principal
          </label>
          <input
            type="text"
            value={data.preparationPrincipal}
            onChange={(e) => handleChange('preparationPrincipal', e.target.value)}
            placeholder="name of preparer"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            <Calendar size={12} /> date of preparation
          </label>
          <input
            type="date"
            value={data.preparationDate}
            onChange={(e) => handleChange('preparationDate', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            <Mail size={12} /> preparation principal email
          </label>
          <input
            type="email"
            value={data.principalEmail}
            onChange={(e) => handleChange('principalEmail', e.target.value)}
            placeholder="email@example.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className={labelClass}>
            <Phone size={12} /> preparation principal mobile number
          </label>
          <input
            type="tel"
            value={data.principalMobile}
            onChange={(e) => handleChange('principalMobile', e.target.value)}
            placeholder="+27 00 000 0000"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
