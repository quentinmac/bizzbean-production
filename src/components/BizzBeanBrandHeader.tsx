import React from 'react';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';

interface BizzBeanBrandHeaderProps {
  iconSize?: string;
  textSize?: string;
  theme?: 'light' | 'dark';
}

export const BizzBeanBrandHeader: React.FC<BizzBeanBrandHeaderProps> = ({
  iconSize = 'w-10 h-10 shrink-0',
  textSize = 'text-2xl sm:text-3xl',
  theme = 'dark',
}) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <BizzbeanLogoIcon className={iconSize} />
      <span
        className={`${textSize} font-light tracking-tight leading-none font-['Raleway'] flex items-baseline ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}
      >
        bizzbean
        <sup className="text-xs font-normal text-slate-400 ml-0.5 -top-2">TM</sup>
      </span>
    </div>
  );
};

export default BizzBeanBrandHeader;
