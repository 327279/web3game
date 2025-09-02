import React, { useEffect } from 'react';
import { BetResult } from '../types';
import { playSound } from '../utils/sound';
import SocialShareButton from './SocialShareButton';

interface ResultViewProps {
  result: BetResult;
  onPlayAgain: () => void;
}

const Coin: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute rounded-full bg-brand-green/70 w-4 h-4" style={style}></div>
);

const ResultView: React.FC<ResultViewProps> = ({ result, onPlayAgain }) => {
  useEffect(() => {
    playSound(result.won ? 'win' : 'lose');
  }, [result.won]);

  const coins = result.won ? Array.from({ length: 50 }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}%`,
      animation: `coin-fall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s forwards`,
      opacity: 0,
    };
    return <Coin key={i} style={style} />;
  }) : null;

  return (
    <div className="relative flex justify-center items-center py-10 overflow-hidden">
      {result.won && coins}
      {result.won === false && <div className="absolute inset-0 screen-crack animate-screen-crack" />}
      
      <div className="relative w-full max-w-md bg-brand-gray p-6 sm:p-10 rounded-xl border border-brand-light-gray text-center animate-fade-in z-20">
        {result.won ? (
          <>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-green mb-4" style={{textShadow: '0 0 15px #a8ff00'}}>YOU WON!</h2>
            <p className="text-xl text-white">Congratulations, Chad!</p>
            <p className="text-3xl font-bold text-brand-green mt-6">
              +{result.payout.toFixed(2)} CHAD
            </p>
          </>
        ) : (
          <>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-red mb-4" style={{textShadow: '0 0 15px #f84339'}}>YOU LOST</h2>
            <p className="text-xl text-white">Better luck next time!</p>
            <p className="text-3xl font-bold text-brand-red mt-6">
              -{result.betAmount.toFixed(2)} CHAD
            </p>
          </>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                playSound('click');
                onPlayAgain();
              }}
              className="w-full p-4 rounded-lg bg-brand-green text-black text-xl font-black tracking-wider transition-all duration-200 hover:scale-105 shadow-green-glow"
            >
              PLAY AGAIN
            </button>
            {result.won && <SocialShareButton result={result} />}
        </div>
      </div>
    </div>
  );
};

export default ResultView;
