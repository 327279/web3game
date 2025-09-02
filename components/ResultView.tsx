import React, { useEffect, useState } from 'react';
import { Bet, BetResult } from '../types';
import { playSound } from '../utils/sound';
import ShareableResultCard from './ShareableResultCard';

interface ResultViewProps {
  result: BetResult;
  bet: Bet;
  onPlayAgain: () => void;
}

const Coin: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute top-0 left-0 rounded-full bg-brand-green/70 w-3 h-3 sm:w-4 sm:h-4" style={style}></div>
);

const ResultView: React.FC<ResultViewProps> = ({ result, bet, onPlayAgain }) => {
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    playSound(result.won ? 'win' : 'lose');
    
    const timer = setTimeout(() => {
        setShowCard(true);
    }, 2000); // Wait for the initial animation to have an impact

    return () => clearTimeout(timer);
  }, [result.won]);

  const coins = result.won ? Array.from({ length: 50 }).map((_, i) => {
    // Fix: Add custom property '--x-drift' to the style type to satisfy TypeScript's strict checking.
    const style: React.CSSProperties & { '--x-drift': string } = {
      left: `${Math.random() * 100}%`,
      '--x-drift': `${(Math.random() - 0.5) * 150}px`,
      animation: `coin-fall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s forwards`,
      opacity: 0,
    };
    return <Coin key={i} style={style} />;
  }) : null;

  const initialText = result.won ? (
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-green" style={{textShadow: '0 0 25px #a8ff00'}}>YOU WON!</h2>
  ) : (
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-red" style={{textShadow: '0 0 25px #f84339'}}>YOU LOST</h2>
  );

  return (
    <div className={`relative flex justify-center items-center py-10 min-h-[50vh] overflow-hidden transition-all duration-500 ${!result.won && 'animate-grayscale-in'}`}>
      {result.won && coins}
      {!result.won && <div className="absolute inset-0 screen-crack animate-screen-crack z-10" />}
      
      <div className="relative w-full max-w-md text-center z-20">
        {showCard ? (
            <ShareableResultCard bet={bet} result={result} onPlayAgain={onPlayAgain} />
        ) : (
            <div className="animate-fade-in">{initialText}</div>
        )}
      </div>
    </div>
  );
};

export default ResultView;