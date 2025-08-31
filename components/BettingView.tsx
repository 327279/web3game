import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Balances, DailyLimit, BetDirection, BettingStep, MarketData } from '../types';
import PriceChart from './PriceChart';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import RefreshIcon from './icons/RefreshIcon';
import { playSound } from '../utils/sound';
import Tooltip from './Tooltip';
import ConfirmationModal from './ConfirmationModal';
import SparklineChart from './SparklineChart';

interface BettingViewProps {
  priceHistory: { time: string; price: number }[];
  currentPrice: number;
  balances: Balances;
  dailyLimit: DailyLimit;
  marketData: MarketData;
  onPlaceBet: (bet: { direction: BetDirection; amount: number; leverage: number; duration: number; }) => Promise<boolean>;
  isWalletConnected: boolean;
  loading: boolean;
  error: string | null;
  bettingStep: BettingStep;
  setBettingStep: (step: BettingStep) => void;
}

const BettingView: React.FC<BettingViewProps> = ({ priceHistory, currentPrice, balances, dailyLimit, marketData, onPlaceBet, isWalletConnected, loading, error, bettingStep, setBettingStep }) => {
  const [direction, setDirection] = useState<BetDirection>('UP');
  const [leverage, setLeverage] = useState<number>(1);
  const [duration, setDuration] = useState<number>(60);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    // When a new error comes from the hook, display it.
    setDisplayError(error);
  }, [error]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [betToConfirm, setBetToConfirm] = useState<{ direction: BetDirection, amount: number, leverage: number, duration: number} | null>(null);

  const potentialWin = useMemo(() => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return 0;
    // Assuming 5% house edge
    const profit = (amount * leverage * 0.95);
    return (amount + profit);
  }, [betAmount, leverage]);

  const collateralRequired = useMemo(() => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || leverage <= 1) return 0;
    return amount * (leverage - 1);
  }, [betAmount, leverage]);

  const initiatePlaceBet = () => {
    playSound('click');
    setDisplayError(null);
    const amount = parseFloat(betAmount);
    
    // Client-side validation
    if (isNaN(amount) || amount <= 0) {
        setDisplayError("Please enter a valid bet amount.");
        return;
    }
    if (amount > balances.chad) {
        setDisplayError("Bet amount exceeds your CHAD balance.");
        return;
    }
    if (leverage > 1 && collateralRequired > balances.mon) {
        setDisplayError(`Insufficient MON. You need ${collateralRequired.toFixed(2)} MON for collateral.`);
        return;
    }
    const totalBetToday = dailyLimit.used + amount;
    if (totalBetToday > dailyLimit.limit) {
        setDisplayError(`This bet would exceed your daily limit of ${dailyLimit.limit} CHAD.`);
        return;
    }
    
    setBetToConfirm({ direction, amount, leverage, duration });
    setBettingStep('confirming');
    setIsModalOpen(true);
  };

  const handleConfirmBet = async () => {
    if (betToConfirm) {
      const success = await onPlaceBet(betToConfirm);
      if (success) {
        setIsModalOpen(false);
        setBetToConfirm(null);
      }
    }
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setBettingStep('idle');
  };
  
  const handleUserInteraction = () => {
      if (displayError) {
          setDisplayError(null);
      }
  };

  const setAmountByPercentage = (percentage: number) => {
    playSound('click');
    const newAmount = balances.chad * (percentage / 100);
    setBetAmount(newAmount.toFixed(2));
    handleUserInteraction();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setBetAmount(e.target.value);
      handleUserInteraction();
  }
  
  const handleDirectionChange = (newDirection: BetDirection) => {
      playSound('click');
      setDirection(newDirection);
      handleUserInteraction();
  };

  const handleLeverageChange = (newLeverage: number) => {
      playSound('click');
      setLeverage(newLeverage);
      handleUserInteraction();
  };

  const handleDurationChange = (newDuration: number) => {
    playSound('click');
    setDuration(newDuration);
    handleUserInteraction();
  };

  const isButtonDisabled = !isWalletConnected || loading || parseFloat(betAmount) <= 0;

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    }
    if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    }
    return `$${volume.toLocaleString()}`;
  };

  const isPriceChangePositive = marketData.priceChange24h >= 0;


  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray flex flex-col justify-between h-48">
            <div>
              <p className="text-sm text-brand-text">MARKET OVERVIEW (BTC)</p>
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p 
                    className={`text-2xl font-bold ${isPriceChangePositive ? 'text-brand-green' : 'text-brand-red'}`}
                  >
                    {isPriceChangePositive ? '+' : ''}{marketData.priceChange24h.toFixed(2)}%
                  </p>
                  <p className="text-xs text-brand-text">24h Change</p>
                </div>
                <SparklineChart data={marketData.priceHistory24h} isPositive={isPriceChangePositive} />
              </div>
            </div>
            <div>
              <p className="text-xs text-brand-text mt-4">24h Volume</p>
              <p className="text-xl font-bold text-white">{formatVolume(marketData.volume24h)}</p>
            </div>
          </div>
          <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray">
            <p className="text-sm text-brand-text">BTC PRICE</p>
            <p className="text-2xl font-bold text-white mb-2">${currentPrice.toFixed(4)}</p>
            <PriceChart data={priceHistory} currentPrice={currentPrice} />
          </div>
          <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray">
             <p className="text-sm text-brand-text mb-4">YOUR ASSETS</p>
             <div className="flex justify-around">
                 <div className="text-center">
                     <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                         <svg className="w-full h-full" viewBox="0 0 36 36">
                             <path className="text-brand-light-gray" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                             <path className="text-brand-green" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                         </svg>
                         <span className="absolute text-white font-bold text-base sm:text-lg">{balances.chad.toFixed(2)}</span>
                     </div>
                     <p className="mt-2 text-white font-semibold">CHAD</p>
                 </div>
                 <div className="text-center text-brand-purple">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                          <div className="w-full h-full rounded-full border-2 border-dashed border-brand-purple flex items-center justify-center">
                             <span className="text-white font-bold text-base sm:text-lg">{balances.mon.toFixed(2)}</span>
                          </div>
                     </div>
                     <p className="mt-2 font-semibold">MON</p>
                 </div>
             </div>
          </div>
          <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray">
              <Tooltip text="This is the maximum amount of CHAD you can bet in a 24-hour period. It resets daily.">
                  <div className="flex justify-between items-center cursor-help">
                      <p className="text-sm text-brand-text">Daily Bet Limit</p>
                      <button className="text-brand-text hover:text-white transition transform hover:scale-110" onClick={() => playSound('click')}><RefreshIcon className="w-4 h-4" /></button>
                  </div>
              </Tooltip>
              <p className="text-xl sm:text-2xl font-bold text-white mt-2">{dailyLimit.used.toFixed(2)} / {dailyLimit.limit.toFixed(0)} CHAD</p>
              <div className="w-full bg-brand-light-gray rounded-full h-2.5 mt-2">
                  <div className="bg-brand-green h-2.5 rounded-full" style={{ width: `${(dailyLimit.used / dailyLimit.limit) * 100}%` }}></div>
              </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-2 bg-brand-gray p-4 sm:p-6 lg:p-8 rounded-xl border border-brand-light-gray flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-black text-brand-green tracking-widest mb-6" style={{textShadow: '0 0 8px #a8ff00'}}>PLACE YOUR BET</h2>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <button 
                  onClick={() => handleDirectionChange('UP')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg font-bold text-2xl transition-all duration-200 transform hover:scale-105 ${direction === 'UP' ? 'bg-brand-green text-black shadow-green-glow' : 'bg-brand-light-gray text-white hover:bg-opacity-70'}`}
              >
                  <ArrowUpIcon className="w-6 h-6" /> UP
              </button>
              <button 
                  onClick={() => handleDirectionChange('DOWN')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg font-bold text-2xl transition-all duration-200 transform hover:scale-105 ${direction === 'DOWN' ? 'bg-brand-red text-white shadow-red-glow' : 'bg-brand-light-gray text-white hover:bg-opacity-70'}`}
              >
                  <ArrowDownIcon className="w-6 h-6" /> DOWN
              </button>
          </div>

          <div className="w-full max-w-md mt-8">
              <Tooltip text="Leverage multiplies your potential profit but also the collateral required (MON tokens) for bets over 1x.">
                <p className="text-sm font-semibold text-brand-text mb-2 cursor-help">LEVERAGE</p>
              </Tooltip>
              <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 5, 10].map(val => (
                      <button key={val} onClick={() => handleLeverageChange(val)} className={`p-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 ${leverage === val ? 'bg-brand-green text-black' : 'bg-brand-light-gray text-white hover:bg-opacity-70'}`}>
                          {val}x
                      </button>
                  ))}
              </div>
          </div>

          <div className="w-full max-w-md mt-6">
              <Tooltip text="The duration of the bet round. The outcome is determined at the end of this countdown.">
                <p className="text-sm font-semibold text-brand-text mb-2 cursor-help">DURATION</p>
              </Tooltip>
              <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map(val => (
                      <button key={val} onClick={() => handleDurationChange(val)} className={`p-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 ${duration === val ? 'bg-brand-green text-black' : 'bg-brand-light-gray text-white hover:bg-opacity-70'}`}>
                          {val}s
                      </button>
                  ))}
              </div>
          </div>
          
          <div className="w-full max-w-md mt-6">
              <Tooltip text="Quickly set your bet amount based on a percentage of your available CHAD balance.">
                  <p className="text-sm font-semibold text-brand-text mb-2 cursor-help">QUICK AMOUNT</p>
              </Tooltip>
              <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setAmountByPercentage(25)} className="p-3 rounded-lg font-bold bg-brand-light-gray text-white hover:bg-opacity-70 transition-all duration-200 transform hover:scale-105">25%</button>
                  <button onClick={() => setAmountByPercentage(50)} className="p-3 rounded-lg font-bold bg-brand-light-gray text-white hover:bg-opacity-70 transition-all duration-200 transform hover:scale-105">50%</button>
                  <button onClick={() => setAmountByPercentage(100)} className="p-3 rounded-lg font-bold bg-brand-light-gray text-white hover:bg-opacity-70 transition-all duration-200 transform hover:scale-105">MAX</button>
              </div>
          </div>

          <div className="w-full max-w-md mt-6">
              <p className="text-sm font-semibold text-brand-text mb-2">Bet Amount (in CHAD)</p>
              <input 
                  type="number"
                  value={betAmount}
                  onChange={handleAmountChange}
                  className="w-full p-4 bg-brand-dark border-2 border-brand-light-gray rounded-lg text-white text-xl font-bold text-center focus:border-brand-green outline-none"
                  placeholder="10"
              />
          </div>

          <button 
              onClick={initiatePlaceBet}
              disabled={isButtonDisabled}
              className="w-full max-w-md mt-6 p-4 rounded-lg bg-brand-green text-black text-2xl font-black tracking-wider transition-all duration-200 disabled:bg-brand-light-gray disabled:text-gray-500 disabled:cursor-not-allowed enabled:hover:scale-105 enabled:shadow-green-glow"
          >
              {loading ? 'Processing...' : 'PLACE BET'}
          </button>
          
          <div className="w-full max-w-md mt-6 text-center min-h-[4.5rem] flex flex-col justify-center">
            {displayError ? (
                <div className="p-3 bg-red-900/50 border border-brand-red rounded-lg animate-fade-in">
                    <p className="text-brand-red text-sm font-semibold">{displayError}</p>
                </div>
            ) : !isWalletConnected ? (
                <p className="text-yellow-400">Please connect your wallet to place a bet.</p>
            ) : (
                <>
                    <p className="text-brand-text">Potential Win: <span className="text-brand-green font-bold">{potentialWin.toFixed(2)} CHAD</span></p>
                    {collateralRequired > 0 && <p className="text-xs text-brand-purple">({collateralRequired.toFixed(2)} MON collateral)</p>}
                </>
            )}
          </div>
        </div>
      </div>
      {betToConfirm && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmBet}
          betDetails={betToConfirm}
          potentialWin={potentialWin}
          collateral={collateralRequired}
          bettingStep={bettingStep}
          error={error}
          loading={loading}
        />
      )}
    </>
  );
};

export default BettingView;