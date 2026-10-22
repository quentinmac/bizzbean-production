import React from 'react';

interface BizzbeanLogoIconProps {
  className?: string;
}

export const BizzbeanLogoIcon: React.FC<BizzbeanLogoIconProps> = ({ className = 'h-10 w-10' }) => {
  return (
    <img
      src="/bizzbean-favicon.jpg"
      alt="bizzbean favicon"
      className={`${className} object-contain select-none pointer-events-none drop-shadow-xs`}
      onError={(e) => {
        const target = e.currentTarget;
        if (!target.dataset.triedFavicon) {
          target.dataset.triedFavicon = 'true';
          target.src = '/favicon.jpg';
        } else if (!target.dataset.triedPng) {
          target.dataset.triedPng = 'true';
          target.src = '/bizzbean-favicon.png';
        } else if (!target.dataset.triedSvg) {
          target.dataset.triedSvg = 'true';
          target.src = '/bizzbean-favicon.svg';
        }
      }}
    />
  );
};
