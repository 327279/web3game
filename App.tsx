
import React, { useState, useCallback, useEffect } from 'react';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { GameState, Bet, BetResult } from './types';
import useWeb3 from './hooks/useWeb3';
import usePriceFeed from './hooks/usePriceFeed';
import useMarketData from './hooks/useMarketData';
import Header from './components/Header';
import BettingView from './components/BettingView';
import WaitingView from './components/WaitingView';
import ResultView from './components/ResultView';
import { playSound, preloadSounds } from './utils/sound';
import { WALLETCONNECT_PROJECT_ID, MONAD_TESTNET_CONFIG, MONAD_TESTNET_CHAIN_ID } from './constants';
import ConfigurationError from './components/ConfigurationError';

// 1. Get projectID from WalletConnect Cloud
// FIX: Explicitly type projectId as string to avoid a TypeScript error.
// The comparison on the next line would fail at compile time because the compiler knows
// the constant value can never be equal to the placeholder string. This preserves the check.
const projectId: string = WALLETCONNECT_PROJECT_ID;
const isConfigured = projectId && projectId !== 'GET_YOUR_OWN_PROJECT_ID_FROM_WALLETCONNECT_CLOUD';

// Conditionally initialize Web3Modal at the top level
if (isConfigured) {
  // 2. Configure metadata
  const metadata = {
    name: 'ChadFlip Web3 Game',
    description: 'A Web3 betting game on the Monad Testnet.',
    url: 'https://web3game.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  };
  
  // 3. Create modal
  const monadTestnet = {
    chainId: Number(MONAD_TESTNET_CHAIN_ID),
    name: MONAD_TESTNET_CONFIG.chainName,
    currency: MONAD_TESTNET_CONFIG.nativeCurrency.symbol,
    explorerUrl: MONAD_TESTNET_CONFIG.blockExplorerUrls[0] || 'https://monad.xyz',
    rpcUrl: MONAD_TESTNET_CONFIG.rpcUrls[0]
  };
  
  createWeb3Modal({
    ethersConfig: defaultConfig({ metadata }),
    chains: [monadTestnet],
    projectId,
    defaultChain: monadTestnet,
    enableAnalytics: false,
    // FIX: Removed the `siweConfig` property. The type `{ enabled: false }` was incorrect for this version of Web3Modal,
    // causing a compilation error. Since Sign-In with Ethereum (SIWE) is not used, omitting the optional
    // `siweConfig` property is the correct way to disable it.
  });
}
  
function MainApp() {
  const [gameState, setGameState] = useState<GameState>(GameState.BETTING);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [betResult, setBetResult] = useState<BetResult | null>(null);

  const {
    openModal,
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
  const marketData = useMarketData();

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
        return currentBet && <WaitingView bet={currentBet} onResolution={handleResolution} currentPrice={currentPrice} />;
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
            marketData={marketData}
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
        <Header address={address} onConnect={openModal} onDisconnect={disconnect} />
        <main className="mt-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// This component acts as a gate, showing an error if not configured, or the main app if configured.
function App() {
  if (!isConfigured) {
    return <ConfigurationError />;
  }

  return <MainApp />;
}

export default App;
