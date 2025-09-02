import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
import TrophyIcon from './icons/TrophyIcon';

interface LeaderboardProps {
    pnlData: LeaderboardEntry[];
    streakData: LeaderboardEntry[];
    volumeData: LeaderboardEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ pnlData, streakData, volumeData }) => {
    const [activeTab, setActiveTab] = useState<'pnl' | 'streak' | 'volume'>('pnl');

    const dataMap = {
        pnl: pnlData,
        streak: streakData,
        volume: volumeData,
    };
    
    const currentData = dataMap[activeTab];

    const TabButton: React.FC<{ tabId: 'pnl' | 'streak' | 'volume'; children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${
                activeTab === tabId ? 'bg-brand-green text-black' : 'bg-brand-light-gray text-brand-text hover:bg-opacity-70'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray">
            <div className="flex items-center gap-2 mb-4">
                <TrophyIcon className="w-6 h-6 text-brand-green" />
                <h3 className="text-lg font-bold text-white">LEADERBOARD</h3>
            </div>
            <div className="flex gap-2 mb-4">
                <TabButton tabId="pnl">Top P&L</TabButton>
                <TabButton tabId="streak">Win Streaks</TabButton>
                <TabButton tabId="volume">Volume</TabButton>
            </div>
            <div className="h-64 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {currentData && currentData.length > 0 ? (
                    currentData.map((entry) => (
                        <div 
                            key={entry.rank}
                            className={`flex items-center justify-between p-2 rounded-md ${entry.isCurrentUser ? 'bg-brand-green/20 border border-brand-green' : 'bg-brand-dark'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-brand-text w-6 text-center">{entry.rank}</span>
                                <span className="font-mono text-xs text-white">{entry.player}</span>
                            </div>
                            <span className="font-bold text-sm text-brand-green">{entry.value}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-brand-text py-10">Loading leaderboard...</div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
