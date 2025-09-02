import React, { useState, useMemo, useEffect } from 'react';
import { Balances, DailyLimit, BetDirection, BettingStep, MarketData, Bet, PlayerStats, LiveBet } from '../types';
import PriceChart from './PriceChart';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import RefreshIcon from './icons/RefreshIcon';
import { playSound } from '../utils/sound';
import Tooltip from './Tooltip';
import ConfirmationModal from './ConfirmationModal';
import SparklineChart from './SparklineChart';
import SpinnerIcon from './icons/SpinnerIcon';
import ZoomOutIcon from './icons/ZoomOutIcon';
import Leaderboard from './Leaderboard';
import LiveActivityFeed from './LiveActivityFeed';
import WinStreakIndicator from './WinStreakIndicator';

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
  onRefresh: () => void;
  playerStats: PlayerStats;
  liveBets: LiveBet[];
}

const BettingView: React.FC<BettingViewProps> = ({ priceHistory, currentPrice, balances, dailyLimit, marketData, onPlaceBet, isWalletConnected, loading, error, bettingStep, setBettingStep, onRefresh, playerStats, liveBets }) => {
  const [direction, setDirection] = useState<BetDirection>('UP');
  const [leverage, setLeverage] = useState<number>(1);
  const [duration, setDuration] = useState<number>(60);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [submittedDirection, setSubmittedDirection] = useState<BetDirection | null>(null);

  const [zoomedData, setZoomedData] = useState(priceHistory);
  const [isZoomed, setIsZoomed] = useState(false);
  const [brushKey, setBrushKey] = useState(0);

  useEffect(() => {
    // When a new error comes from the hook, display it.
    setDisplayError(error);
  }, [error]);

  useEffect(() => {
    if (!isZoomed) {
      setZoomedData(priceHistory);
    }
  }, [priceHistory, isZoomed]);

  const handleZoom = (domain: { startIndex?: number, endIndex?: number }) => {
    if (domain && typeof domain.startIndex === 'number' && typeof domain.endIndex === 'number') {
        setZoomedData(priceHistory.slice(domain.startIndex, domain.endIndex + 1));
        setIsZoomed(true);
    }
  };

  const resetZoom = () => {
      playSound('click');
      setIsZoomed(false);
      setBrushKey(k => k + 1);
  };
  
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
    // New, more affordable collateral calculation
    return amount * (leverage - 1);
  }, [betAmount, leverage]);

  const draftBet = useMemo<Bet | null>(() => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0 || !isWalletConnected) {
        return null;
    }
    
    return {
        id: -1,
        direction,
        amount,
        leverage,
        entryPrice: currentPrice,
        duration,
    };
  }, [betAmount, isWalletConnected, direction, leverage, currentPrice, duration]);

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
    
    setSubmittedDirection(direction);
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
        setSubmittedDirection(null);
      }
    }
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setBettingStep('idle');
      setSubmittedDirection(null);
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

  const handleRefreshData = () => {
    playSound('click');
    onRefresh();
  };

  const isButtonDisabled = !isWalletConnected || loading || parseFloat(betAmount) <= 0 || isNaN(parseFloat(betAmount));

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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Price Chart Card */}
          <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <p className="text-sm text-brand-text">BTC PRICE</p>
                    <p className="text-3xl md:text-4xl font-bold text-white">${currentPrice.toFixed(4)}</p>
                </div>
                {isZoomed && (
                    <button 
                        onClick={resetZoom} 
                        className="flex items-center gap-2 text-brand-text hover:text-white bg-brand-light-gray px-3 py-1 rounded-lg transition-colors text-sm animate-fade-in"
                        aria-label="Reset chart zoom"
                    >
                        <ZoomOutIcon className="w-4 h-4" />
                        Reset
                    </button>
                )}
            </div>
            <PriceChart 
              data={zoomedData} 
              fullData={priceHistory}
              currentPrice={currentPrice}
              onZoom={handleZoom}
              brushKey={brushKey}
              draftBet={draftBet}
            />
          </div>

          {/* Betting Controls Card */}
          <div className="bg-brand-gray p-4 sm:p-6 lg:p-8 rounded-xl border border-brand-light-gray flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-black text-brand-green tracking-widest mb-6" style={{textShadow: '0 0 8px #a8ff00'}}>PLACE YOUR BET</h2>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <button 
                    onClick={() => handleDirectionChange('UP')}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg font-bold text-2xl transition-all duration-200 transform hover:scale-105 ${direction === 'UP' ? 'bg-brand-green text-black shadow-green-glow' : 'bg-brand-light-gray text-white hover:bg-opacity-70'} disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}
                >
                    {loading && submittedDirection === 'UP' ? <SpinnerIcon className="animate-spin w-6 h-6" /> : <ArrowUpIcon className="w-6 h-6" />} UP
                </button>
                <button 
                    onClick={() => handleDirectionChange('DOWN')}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg font-bold text-2xl transition-all duration-200 transform hover:scale-105 ${direction === 'DOWN' ? 'bg-brand-red text-white shadow-red-glow' : 'bg-brand-light-gray text-white hover:bg-opacity-70'} disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}
                >
                    {loading && submittedDirection === 'DOWN' ? <SpinnerIcon className="animate-spin w-6 h-6" /> : <ArrowDownIcon className="w-6 h-6" />} DOWN
                </button>
            </div>

            <div className="w-full max-w-md mt-8">
                <Tooltip text="Leverage multiplies your potential profit but also the collateral required (MON tokens) for bets over 1x.">
                  <p className="text-sm font-semibold text-brand-text mb-2 cursor-help">LEVERAGE</p>
                </Tooltip>
                <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 5, 10].map(val => (
                        <button key={val} onClick={() => handleLeverageChange(val)} disabled={loading} className={`p-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 ${leverage === val ? 'bg-brand-green text-black' : 'bg-brand-light-gray text-white hover:bg-opacity-70'} disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}>
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
                        <button key={val} onClick={() => handleDurationChange(val)} disabled={loading} className={`p-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 ${duration === val ? 'bg-brand-green text-black' : 'bg-brand-light-gray text-white hover:bg-opacity-70'} disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}>
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
                    <button onClick={() => setAmountByPercentage(25)} disabled={loading} className="p-3 rounded-lg font-bold bg-brand-light-gray text-white hover:bg-opacity-70 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">25%</button>
                    <button onClick={() => setAmountByPercentage(50)} disabled={loading} className="p-3 rounded-lg font-bold bg-brand-light-gray text-white hover:bg-opacity-70 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">50%</button>
                    <button onClick={() => setAmountByPercentage(100)} disabled={loading} className="p-3 rounded-lg font-bold bg-brand-light-gray text-white hover:bg-opacity-70 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">MAX</button>
                </div>
            </div>

            <div className="w-full max-w-md mt-6">
                <p className="text-sm font-semibold text-brand-text mb-2">Bet Amount (in CHAD)</p>
                <input 
                    type="number"
                    value={betAmount}
                    onChange={handleAmountChange}
                    disabled={loading}
                    className="w-full p-4 bg-brand-dark border-2 border-brand-light-gray rounded-lg text-white text-xl font-bold text-center focus:border-brand-green outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {collateralRequired > 0 && <p className="text-xs text-brand-purple">({collateralRequired.toFixed(2)} MON collateral required)</p>}
                  </>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Market Overview Card */}
          <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray flex flex-col justify-between">
            <div>
              <p className="text-sm text-brand-text">MARKET OVERVIEW (BTC)</p>
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p 
                    className={`text-3xl md:text-4xl font-bold ${isPriceChangePositive ? 'text-brand-green' : 'text-brand-red'}`}
                  >
                    {isPriceChangePositive ? '+' : ''}{marketData.priceChange24h.toFixed(2)}%
                  </p>
                  <p className="text-xs text-brand-text">24h Change</p>
                </div>
                <SparklineChart data={marketData.priceHistory24h} isPositive={isPriceChangePositive} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-brand-text">24h Volume</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{formatVolume(marketData.volume24h)}</p>
            </div>
          </div>

          {/* Player Hub Card */}
          <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray">
             <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-brand-text">PLAYER HUB</p>
                <WinStreakIndicator streak={playerStats.winStreak} />
             </div>
             
             <div className="flex justify-center gap-12 sm:justify-around mb-6">
                 <div className="text-center">
                     <p className="text-white font-bold text-lg sm:text-xl">{balances.chad.toFixed(2)}</p>
                     <p className="mt-1 text-sm font-semibold text-brand-green">CHAD</p>
                 </div>
                 <div className="text-center">
                     <p className="text-white font-bold text-lg sm:text-xl">{balances.mon.toFixed(2)}</p>
                     <p className="mt-1 text-sm font-semibold text-brand-purple">MON</p>
                 </div>
             </div>

              <Tooltip text="This is the maximum amount of CHAD you can bet in a 24-hour period. It resets daily.">
                  <div className="flex justify-between items-center cursor-help mb-2">
                      <p className="text-sm text-brand-text">Daily Bet Limit</p>
                      <button className="text-brand-text hover:text-white transition transform hover:scale-110" onClick={handleRefreshData}><RefreshIcon className="w-4 h-4" /></button>
                  </div>
              </Tooltip>
              <p className="text-lg md:text-xl font-bold text-white">{dailyLimit.used.toFixed(2)} / {dailyLimit.limit.toFixed(0)} CHAD</p>
              <div className="w-full bg-brand-light-gray rounded-full h-2.5 mt-2">
                  <div className="bg-brand-green h-2.5 rounded-full" style={{ width: `${(dailyLimit.used / dailyLimit.limit) * 100}%` }}></div>
              </div>
          </div>

          <Leaderboard />

          <LiveActivityFeed bets={liveBets} />

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