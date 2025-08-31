
import React, { useEffect } from 'react';
import { BetResult } from '../types';
import { playSound } from '../utils/sound';

interface ResultViewProps {
  result: BetResult;
  onPlayAgain: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onPlayAgain }) => {
  useEffect(() => {
    playSound(result.won ? 'win' : 'lose');
  }, [result.won]);

  return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="w-full max-w-md bg-brand-gray p-6 sm:p-10 rounded-xl border border-brand-light-gray text-center animate-fade-in">
        {result.won ? (
          <>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-green mb-4" style={{textShadow: '0 0 15px #a8ff00'}}>YOU WON!</h2>
            <p className="text-xl text-white">Congratulations!</p>
            <p className="text-3xl font-bold text-brand-green mt-6">
              +{result.payout.toFixed(2)} CHAD
            </p>
          </>
        ) : (
          <>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-red mb-4" style={{textShadow: '0 0 15px #f84339'}}>YOU LOST</h2>
            <p className="text-xl text-white">Better luck next time!</p>
            <p className="text-3xl font-bold text-brand-red mt-6">
              0.00 CHAD
            </p>
          </>
        )}

        <button
          onClick={() => {
            playSound('click');
            onPlayAgain();
          }}
          className="mt-10 w-full p-4 rounded-lg bg-brand-green text-black text-xl font-black tracking-wider transition-all duration-200 hover:scale-105 shadow-green-glow"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};

export default ResultView;