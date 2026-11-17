import React from 'react';
import { BizzCalculators } from './BizzCalculators';

interface BizzCalculatorsAppProps {
  theme?: 'light' | 'dark';
  onBackToWorkstation?: () => void;
  onNavigateToStage?: (stageId: string, solutionId?: string) => void;
}

export const BizzCalculatorsApp: React.FC<BizzCalculatorsAppProps> = ({
  theme = 'light',
  onBackToWorkstation,
}) => {
  return (
    <BizzCalculators
      theme={theme}
      embedded
      initialCalculatorId="home"
      onClose={() => {
        if (onBackToWorkstation) onBackToWorkstation();
      }}
    />
  );
};

export default BizzCalculatorsApp;
