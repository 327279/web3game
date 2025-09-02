import React from 'react';
import { LiveBet } from '../types';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';

interface LiveActivityFeedProps {
    bets: LiveBet[];
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ bets }) => {
    return (
        <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray">
            <h3 className="text-lg font-bold text-white mb-4">LIVE BETS</h3>
            <div className="h-48 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {bets.map(bet => (
                    <div key={bet.timestamp} className="bg-brand-dark p-2 rounded-md animate-fade-in text-xs">
                        <div className="flex justify-between items-center">
                            <span className="font-mono">{bet.player}</span>
                            <span className="font-bold text-white">{bet.amount} CHAD</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-brand-text">{bet.leverage}x Leverage</span>
                             <span className={`flex items-center gap-1 font-bold ${bet.direction === 'UP' ? 'text-brand-green' : 'text-brand-red'}`}>
                                {bet.direction === 'UP' ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>}
                                {bet.direction}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveActivityFeed;
