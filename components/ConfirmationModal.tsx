import React from 'react';
import { BetDirection, BettingStep } from '../types';
import ActionSteps from './ActionSteps';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  betDetails: {
    direction: BetDirection;
    amount: number;
    leverage: number;
    duration: number;
  };
  potentialWin: number;
  collateral: number;
  bettingStep: BettingStep;
  error: string | null;
  loading: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  betDetails,
  potentialWin,
  collateral,
  bettingStep,
  error,
  loading
}) => {
  if (!isOpen) return null;

  const { direction, amount, leverage } = betDetails;
  const isProcessing = bettingStep !== 'confirming' && bettingStep !== 'error' && bettingStep !== 'idle';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity animate-fade-in" aria-hidden="true" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative bg-brand-gray border border-brand-light-gray rounded-xl shadow-lg transform transition-all animate-scale-in w-full max-w-md p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white" id="modal-title">Confirm Your Bet</h3>
          <button onClick={onClose} disabled={isProcessing} className="text-gray-400 hover:text-white text-3xl leading-none disabled:opacity-50">&times;</button>
        </div>
        
        <div className="space-y-4">
            <div className={`flex items-center justify-center gap-2 p-4 rounded-lg font-bold text-2xl sm:text-3xl ${direction === 'UP' ? 'bg-brand-green text-black' : 'bg-brand-red text-white'}`}>
                {direction === 'UP' ? <ArrowUpIcon className="w-7 h-7 sm:w-8 sm:h-8"/> : <ArrowDownIcon className="w-7 h-7 sm:w-8 sm:h-8" />}
                {direction}
            </div>
            
            <div className="bg-brand-dark p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-baseline">
                    <span className="text-brand-text">Bet Amount:</span>
                    <span className="text-white font-bold text-base sm:text-lg">{amount.toFixed(2)} CHAD</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <span className="text-brand-text">Leverage:</span>
                    <span className="text-white font-bold text-base sm:text-lg">{leverage}x</span>
                </div>
                 {collateral > 0 && (
                    <div className="flex justify-between items-baseline">
                        <span className="text-brand-text">Collateral:</span>
                        <span className="text-brand-purple font-bold text-base sm:text-lg">{collateral.toFixed(2)} MON</span>
                    </div>
                 )}
                <div className="border-t border-brand-light-gray my-2"></div>
                <div className="flex justify-between items-baseline">
                    <span className="text-brand-text sm:text-lg">Potential Win:</span>
                    <span className="text-brand-green font-bold text-xl sm:text-2xl">{potentialWin.toFixed(2)} CHAD</span>
                </div>
            </div>

            {isProcessing && <ActionSteps currentStep={bettingStep} hasLeverage={leverage > 1} />}

            {error && bettingStep === 'error' && (
                <div className="bg-red-900/50 border border-brand-red text-brand-red text-center p-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-4 mt-6">
                <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="w-full p-3 rounded-lg bg-brand-light-gray text-white font-bold transition-colors duration-200 hover:bg-opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="w-full p-3 rounded-lg bg-brand-green text-black font-bold transition-colors duration-200 hover:bg-opacity-80 disabled:bg-brand-light-gray disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Processing...' : 'Confirm Bet'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
