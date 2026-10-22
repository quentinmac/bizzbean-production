import React, { useState, useEffect } from 'react';
import { BizzModelLayout } from './BizzModelLayout';
import { DEFAULT_BUSINESS_STATE, BizzModelState } from './constants';
import { SetupStep } from './steps/SetupStep';
import { RevenueStep } from './steps/RevenueStep';
import { EmploymentStep } from './steps/EmploymentStep';
import { OperatingExpensesStep } from './steps/OperatingExpensesStep';
import { FixedAssetsStep } from './steps/FixedAssetsStep';
import { FundingStep } from './steps/FundingStep';
import { ReportsStep } from './steps/ReportsStep';
import { HighLevelForecast } from './components/HighLevelForecast';
import { BizzPlan } from '../bizzplan/BizzPlan';
import { BizzCalc } from '../bizzcalc/BizzCalc';
import { BizzDynamics } from '../bizzdynamics/BizzDynamics';

export interface BizzModelProps {
  theme?: 'light' | 'dark';
  mode?: 'bizzdynamics' | 'bizzmodel';
  initialStep?: string;
  initialAppTab?: 'bizzcalc' | 'bizzdynamics' | 'bizzmodel' | 'hi-level-forecast' | 'bizzplan' | 'reports';
  onClose: () => void;
  onContextSwitch?: (appId: string, step?: string) => void;
}

export const BizzModel: React.FC<BizzModelProps> = ({
  theme = 'light',
  mode = 'bizzmodel',
  initialStep = 'setup',
  initialAppTab,
  onClose,
  onContextSwitch,
}) => {
  const [currentMode, setCurrentMode] = useState<'bizzdynamics' | 'bizzmodel'>(mode);
  const [activeAppTab, setActiveAppTab] = useState<
    'bizzcalc' | 'bizzdynamics' | 'bizzmodel' | 'hi-level-forecast' | 'bizzplan' | 'reports'
  >(initialAppTab || (mode === 'bizzdynamics' ? 'bizzdynamics' : 'bizzmodel'));

  const [activeStep, setActiveStep] = useState<string>(initialStep);

  // Storage key based on mode
  const storageKey =
    currentMode === 'bizzdynamics'
      ? 'bizzdynamics_platform_data'
      : 'bizzmodel_platform_data';

  const [state, setState] = useState<BizzModelState>(() => {
    try {
      const saved =
        localStorage.getItem(storageKey) ||
        (currentMode === 'bizzdynamics'
          ? localStorage.getItem('bizzdynamics_data')
          : localStorage.getItem('bizzmodel_data'));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_BUSINESS_STATE;
  });

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [state, storageKey]);

  // Handle switching tabs along the top header bar
  const handleSelectAppTab = (
    tab: 'bizzcalc' | 'bizzdynamics' | 'bizzmodel' | 'hi-level-forecast' | 'bizzplan' | 'reports'
  ) => {
    setActiveAppTab(tab);
    if (tab === 'bizzdynamics') {
      setCurrentMode('bizzdynamics');
    } else if (tab === 'bizzmodel') {
      setCurrentMode('bizzmodel');
    }
    if (onContextSwitch) {
      onContextSwitch(tab);
    }
  };

  // If user selected BizzCalc from top tab:
  if (activeAppTab === 'bizzcalc') {
    return (
      <BizzCalc
        theme={theme}
        onClose={onClose}
        onContextSwitch={(tab) => handleSelectAppTab(tab as any)}
      />
    );
  }

  // If user selected BizzDynamics from top tab:
  if (activeAppTab === 'bizzdynamics') {
    return (
      <BizzDynamics
        theme={theme}
        onClose={onClose}
        onContextSwitch={(tab) => handleSelectAppTab(tab as any)}
      />
    );
  }

  // If user selected BizzPlan from top tab:
  if (activeAppTab === 'bizzplan') {
    return (
      <BizzPlan
        theme={theme}
        onClose={onClose}
        onContextSwitch={(tab) => handleSelectAppTab(tab as any)}
        bizzModelState={state}
      />
    );
  }

  return (
    <BizzModelLayout
      theme={theme}
      mode={currentMode}
      activeAppTab={activeAppTab}
      onSelectAppTab={handleSelectAppTab}
      activeStep={activeStep}
      onSelectStep={setActiveStep}
      onClose={onClose}
    >
      {/* 1. HI-LEVEL FORECAST */}
      {activeAppTab === 'hi-level-forecast' && (
        <HighLevelForecast
          theme={theme}
          modelState={state}
          onUpdateState={setState}
          onSwitchToBizzModel={() => handleSelectAppTab('bizzmodel')}
          onSwitchToBizzPlan={() => handleSelectAppTab('bizzplan')}
        />
      )}

      {/* 2. BIZZMODEL STEPS */}
      {activeAppTab === 'bizzmodel' && (
        <>
          {activeStep === 'setup' && (
            <SetupStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
            />
          )}

          {activeStep === 'revenue' && (
            <RevenueStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
            />
          )}

          {activeStep === 'employment' && (
            <EmploymentStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
            />
          )}

          {activeStep === 'opex' && (
            <OperatingExpensesStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
            />
          )}

          {activeStep === 'fixed-assets' && (
            <FixedAssetsStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
            />
          )}

          {activeStep === 'funding' && (
            <FundingStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
            />
          )}

          {activeStep === 'reports' && (
            <ReportsStep
              theme={theme}
              mode={currentMode}
              state={state}
              onUpdateState={setState}
            />
          )}
        </>
      )}

      {/* 3. REPORTS TAB */}
      {activeAppTab === 'reports' && (
        <ReportsStep
          theme={theme}
          mode={currentMode}
          state={state}
          onUpdateState={setState}
        />
      )}
    </BizzModelLayout>
  );
};
export default BizzModel;
