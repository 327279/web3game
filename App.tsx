import React, { useState, useCallback, useEffect } from 'react';
import { init } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import walletConnectModule from '@web3-onboard/walletconnect';
import { GameState, Bet, BetResult } from './types';
import useWeb3 from './hooks/useWeb3';
import usePriceFeed from './hooks/usePriceFeed';
import useMarketData from './hooks/useMarketData';
import Header from './components/Header';
import BettingView from './components/BettingView';
import WaitingView from './components/WaitingView';
import ResultView from './components/ResultView';
import { playSound, preloadSounds } from './utils/sound';
import { WALLETCONNECT_PROJECT_ID, MONAD_TESTNET_CONFIG, MONAD_TESTNET_CHAIN_ID, MONAD_TESTNET_HEX_CHAIN_ID } from './constants';
import ConfigurationError from './components/ConfigurationError';

const projectId: string = WALLETCONNECT_PROJECT_ID;
const isConfigured = projectId && projectId !== 'GET_YOUR_OWN_PROJECT_ID_FROM_WALLETCONNECT_CLOUD';

if (isConfigured) {
  const injected = injectedModule();
  const walletConnect = walletConnectModule({
    projectId,
    requiredChains: [Number(MONAD_TESTNET_CHAIN_ID)],
  });
  
  const monadTestnetChain = {
    id: MONAD_TESTNET_HEX_CHAIN_ID,
    token: MONAD_TESTNET_CONFIG.nativeCurrency.symbol,
    label: MONAD_TESTNET_CONFIG.chainName,
    rpcUrl: MONAD_TESTNET_CONFIG.rpcUrls[0],
  };

  const appIcon = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 6C14.0589 6 6 14.0589 6 24C6 33.9411 14.0589 42 24 42C33.9411 42 42 33.9411 42 24C42 14.0589 33.9411 6 24 6Z" fill="#1e1f22"></path><path d="M24 38C16.268 38 10 31.732 10 24C10 16.268 16.268 10 24 10C31.732 10 38 16.268 38 24C38 31.732 31.732 38 24 38Z" fill="#a8ff00"></path><path d="M24 34C18.4772 34 14 29.5228 14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24C34 29.5228 29.5228 34 24 34Z" fill="#131313"></path><path d="M27 18H21V24H27V30H21" stroke="#a8ff00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;

  init({
    wallets: [injected, walletConnect],
    chains: [monadTestnetChain],
    appMetadata: {
      name: 'ChadFlip Web3 Game',
      icon: appIcon,
      description: 'A Web3 betting game on the Monad Testnet.',
      recommendedInjectedWallets: [
        { name: 'MetaMask', url: 'https://metamask.io' },
      ]
    },
    accountCenter: {
      desktop: { enabled: false },
      mobile: { enabled: false }
    },
    connect: {
        autoConnectLastWallet: true
    }
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
    resolveBetFrontend,
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
    
    const result = resolveBetFrontend(currentBet, finalPrice);
    setBetResult(result);
    setGameState(GameState.RESULT);
  }, [currentBet, resolveBetFrontend]);

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
            onRefresh={refreshData}
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