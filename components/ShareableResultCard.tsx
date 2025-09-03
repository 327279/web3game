import React from 'react';
import { Bet, BetResult } from '../types';
import ChadCharacterPlaceholder from './icons/ChadCharacterPlaceholder';
import XIcon from './icons/XIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import { playSound } from '../utils/sound';

interface ShareableResultCardProps {
  bet: Bet;
  result: BetResult;
  onPlayAgain: () => void;
}

const ShareableResultCard: React.FC<ShareableResultCardProps> = ({ bet, result, onPlayAgain }) => {
  const pnl = result.won ? result.payout : -result.betAmount;
  const pnlColor = result.won ? 'text-brand-green' : 'text-brand-red';
  const pnlPrefix = result.won ? '+' : '';

  const tweetText = `I just ${result.won ? 'won' : 'lost'} a ${bet.leverage}x ${bet.direction} bet on #ChadFlip! My P&L: ${pnl.toFixed(2)} CHAD. Think you can do better?`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent('https://bet-chad.vercel.app')}`;

  return (
    <div className="bg-brand-gray p-6 rounded-2xl border-2 border-brand-light-gray animate-fade-in-slide-up w-full max-w-sm mx-auto">
      <h3 className="text-center text-lg font-black text-white tracking-tighter">
        CHAD<span className="text-brand-green">FLIP</span>
      </h3>
      
      <div className="flex items-center justify-between my-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28">
            <ChadCharacterPlaceholder />
        </div>
        <div className="text-right">
            <p className={`text-3xl sm:text-4xl font-black ${pnlColor}`}>{result.won ? 'YOU WON' : 'YOU LOST'}</p>
            <p className={`text-2xl sm:text-3xl font-bold mt-1 ${pnlColor}`}>{pnlPrefix}{pnl.toFixed(2)}</p>
            <p className="text-sm text-brand-text">CHAD P&L</p>
        </div>
      </div>

      <div className="bg-brand-dark p-4 rounded-lg space-y-2 text-sm">
        <div className="flex justify-between items-center">
            <span className="text-brand-text">Direction</span>
            <span className={`flex items-center gap-1 font-bold ${bet.direction === 'UP' ? 'text-brand-green' : 'text-brand-red'}`}>
                {bet.direction} {bet.direction === 'UP' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
            </span>
        </div>
         <div className="flex justify-between items-center">
            <span className="text-brand-text">Leverage</span>
            <span className="font-bold text-white">{bet.leverage}x</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-brand-text">Entry Price</span>
            <span className="font-bold text-white">${bet.entryPrice.toFixed(4)}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-brand-text">Final Price</span>
            <span className="font-bold text-white">${result.finalPrice?.toFixed(4) ?? 'N/A'}</span>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => {
            playSound('click');
            onPlayAgain();
          }}
          className="w-full p-3 rounded-lg bg-brand-green text-black text-lg font-black tracking-wider transition-all duration-200 hover:scale-105 shadow-green-glow"
        >
          PLAY AGAIN
        </button>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playSound('click')}
          className="w-full p-3 rounded-lg bg-[#1DA1F2] text-white font-bold transition-all duration-200 hover:bg-opacity-80 flex items-center justify-center gap-2 transform hover:scale-105"
        >
          <XIcon className="w-5 h-5" />
          <span>SHARE ON X</span>
        </a>
      </div>
    </div>
  );
};

export default ShareableResultCard;
