import React from 'react';
import { BettingStep } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

// Checkmark component for completed steps
const Checkmark: React.FC = () => (
    <svg className="h-5 w-5 text-brand-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

// Individual step component
const Step: React.FC<{ title: string; status: 'pending' | 'in_progress' | 'completed' }> = ({ title, status }) => {
    return (
        <div className={`flex items-center gap-3 transition-colors duration-300 ${status === 'pending' ? 'text-gray-500' : 'text-white'}`}>
            <div className="w-5 h-5 flex items-center justify-center">
                {status === 'in_progress' && <SpinnerIcon className="animate-spin h-5 w-5 text-white" />}
                {status === 'completed' && <Checkmark />}
                {status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-gray-500"></div>}
            </div>
            <span className={`font-semibold ${status === 'in_progress' ? 'text-brand-green' : ''}`}>{title}</span>
        </div>
    );
};

interface ActionStepsProps {
    currentStep: BettingStep;
    hasLeverage: boolean;
}

const ActionSteps: React.FC<ActionStepsProps> = ({ currentStep, hasLeverage }) => {
  const allSteps = [
    { id: 'approving_chad', title: 'Approve CHAD' },
    ...(hasLeverage ? [{ id: 'approving_mon', title: 'Approve MON' }] : []),
    { id: 'placing_bet', title: 'Place Bet' }
  ];

  const getStatus = (stepId: string): 'pending' | 'in_progress' | 'completed' => {
    const stepOrder = allSteps.map(s => s.id);
    const currentIndex = stepOrder.indexOf(currentStep as string);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (currentIndex === -1) { // Current step is not in the list (e.g., 'confirming', 'success')
        return 'pending';
    }

    if (stepIndex < currentIndex) {
      return 'completed';
    }
    if (stepIndex === currentIndex) {
      return 'in_progress';
    }
    return 'pending';
  };

  return (
    <div className="bg-brand-dark p-4 rounded-lg space-y-3">
        <p className="text-sm font-bold text-brand-text mb-2">Transaction Steps:</p>
        {allSteps.map(step => (
            <Step key={step.id} title={step.title} status={getStatus(step.id)} />
        ))}
    </div>
  );
};

export default ActionSteps;
