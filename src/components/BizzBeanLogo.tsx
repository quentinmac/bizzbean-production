import React from 'react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

interface BizzBeanBrandHeaderProps {
  iconSize?: string;
  textSize?: string;
  showSubtitle?: boolean;
}

export const BizzBeanBrandHeader: React.FC<BizzBeanBrandHeaderProps> = ({
  iconSize = 'w-10 h-10',
  textSize = 'text-2xl',
  showSubtitle = true,
}) => {
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
