import React from 'react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

interface BizzBeanBrandHeaderProps {
  iconSize?: string;
  textSize?: string;
  showSubtitle?: boolean;
  stacked?: boolean;
}

export const BizzBeanBrandHeader: React.FC<BizzBeanBrandHeaderProps> = ({
  iconSize = 'w-10 h-10',
  textSize = 'text-2xl',
  showSubtitle = true,
  stacked = true,
}) => {
  if (stacked) {
    return (
      <div className="flex flex-col items-center select-none text-center">
        <BizzbeanLogoIcon className={`${iconSize} mb-1`} />
        <div className="inline-flex items-baseline">
          <span className={`font-['Raleway'] text-[#707070] tracking-tight ${textSize}`} style={{ fontWeight: 300 }}>
            bizz
          </span>
          <span className={`font-['Raleway'] text-[#707070] tracking-tight ${textSize}`} style={{ fontWeight: 100 }}>
            bean
            <sup className="text-[10px] font-normal text-[#707070] ml-0.5 -top-2 font-['Raleway']">
              TM
            </sup>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-1">
            the illuminated sandbox
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center select-none text-center">
      <div className="flex items-center gap-2">
        <BizzbeanLogoIcon className={iconSize} />
        <span className={`font-['Raleway'] font-bold tracking-tight text-slate-900 ${textSize} lowercase`}>
          bizzbean
        </span>
      </div>
      {showSubtitle && (
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-1">
          the illuminated sandbox
        </span>
      )}
    </div>
  );
};

export const BizzBeanLogo = BizzBeanBrandHeader;
export default BizzBeanBrandHeader;

