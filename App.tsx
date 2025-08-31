
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GameState, Bet, BetResult, BettingStep } from './types';
import useWeb3 from './hooks/useWeb3';
import usePriceFeed from './hooks/usePriceFeed';
import Header from './components/Header';
import BettingView from './components/BettingView';
import WaitingView from './components/WaitingView';
import ResultView from './components/ResultView';
import { playSound, preloadSounds } from './utils/sound';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.BETTING);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [betResult, setBetResult] = useState<BetResult | null>(null);

  const {
    connectWallet,
    disconnect,
    address,
    balances,
    dailyLimit,
    placeBet,
    loading,
    error,
    refreshData,
    bettingStep,
    setBettingStep,
  } = useWeb3();

  const { priceHistory, currentPrice } = usePriceFeed(108540.00);

  useEffect(() => {
    preloadSounds();
  }, []);

  const handlePlaceBet = useCallback(async (bet: Omit<Bet, 'entryPrice' | 'id'>): Promise<boolean> => {
    const betWithPrice: Bet = { ...bet, entryPrice: currentPrice, id: Date.now() };
    const success = await placeBet(betWithPrice);
    if (success) {
      playSound('placeBet');
      setCurrentBet(betWithPrice);
      setGameState(GameState.WAITING);
    }
    return success;
  }, [currentPrice, placeBet]);

  const handleResolution = useCallback((finalPrice: number) => {
    if (!currentBet) return;
    
    const priceWentUp = finalPrice > currentBet.entryPrice;
    const playerWon = (currentBet.direction === 'UP' && priceWentUp) || (currentBet.direction === 'DOWN' && !priceWentUp);
    
    let payout = 0;
    if(playerWon) {
        // Mocking payout calculation (95% return on win)
        payout = currentBet.amount + (currentBet.amount * currentBet.leverage * 0.95);
    }

    setBetResult({ won: playerWon, payout });
    setGameState(GameState.RESULT);
    refreshData(); // Refresh user balances and limits after a bet resolves
  }, [currentBet, refreshData]);

  const handlePlayAgain = useCallback(() => {
    setCurrentBet(null);
    setBetResult(null);
    setGameState(GameState.BETTING);
  }, []);

  const renderContent = () => {
    switch (gameState) {
      case GameState.WAITING:
        return currentBet && <WaitingView bet={currentBet} onResolution={handleResolution} />;
      case GameState.RESULT:
        return betResult && <ResultView result={betResult} onPlayAgain={handlePlayAgain} />;
      case GameState.BETTING:
      default:
        return (
          <BettingView
            priceHistory={priceHistory}
            currentPrice={currentPrice}
            balances={balances}
            dailyLimit={dailyLimit}
            onPlaceBet={handlePlaceBet}
            isWalletConnected={!!address}
            loading={loading}
            error={error}
            bettingStep={bettingStep}
            setBettingStep={setBettingStep}
          />
        );
    }
  };

  return (
    <div className="bg-brand-dark min-h-screen text-brand-text font-sans flex flex-col items-center p-4 selection:bg-brand-green selection:text-black">
      <div className="w-full max-w-7xl">
        <Header address={address} onConnect={connectWallet} onDisconnect={disconnect} />
        <main className="mt-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
