import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
import TrophyIcon from './icons/TrophyIcon';

interface LeaderboardProps {
    data: {
        pnlData: LeaderboardEntry[];
        streakData: LeaderboardEntry[];
        volumeData: LeaderboardEntry[];
    }
}

type Category = 'pnl' | 'streak' | 'volume';
type Timeframe = 'daily' | 'weekly' | 'allTime';

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
    const [category, setCategory] = useState<Category>('pnl');
    const [timeframe, setTimeframe] = useState<Timeframe>('daily');

    const categoryMap: { [key in Category]: { title: string; data: LeaderboardEntry[] } } = {
        pnl: { title: "Top P&L", data: data.pnlData },
        streak: { title: "Win Streaks", data: data.streakData },
        volume: { title: "Highest Volume", data: data.volumeData },
    };

    const currentData = categoryMap[category].data;

    const renderRow = (entry: LeaderboardEntry) => (
        <tr key={entry.rank} className={`border-b border-brand-light-gray ${entry.isCurrentUser ? 'bg-brand-green/10' : ''}`}>
            <td className="p-2 text-center">{entry.rank}</td>
            <td className="p-2 font-mono text-xs">{entry.player}</td>
            <td className={`p-2 text-right font-bold ${entry.isCurrentUser ? 'text-brand-green' : 'text-white'}`}>{entry.value}</td>
        </tr>
    );

    return (
        <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray">
            <div className="flex items-center gap-2 mb-4">
                <TrophyIcon className="w-6 h-6 text-brand-green" />
                <h3 className="text-lg font-bold text-white">LEADERBOARD</h3>
            </div>
            <div className="flex flex-col gap-3">
                {/* Category Tabs */}
                <div className="grid grid-cols-3 gap-2 bg-brand-dark p-1 rounded-md">
                    {(Object.keys(categoryMap) as Category[]).map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setCategory(cat)} 
                            className={`px-2 py-1 text-xs font-bold rounded ${category === cat ? 'bg-brand-green text-black' : 'text-brand-text hover:bg-brand-light-gray'}`}
                        >
                            {categoryMap[cat].title}
                        </button>
                    ))}
                </div>

                {/* Main content */}
                <div className="h-64 overflow-y-auto custom-scrollbar pr-2">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-brand-gray">
                            <tr>
                                <th className="p-2 text-left text-brand-text font-semibold w-1/6">Rank</th>
                                <th className="p-2 text-left text-brand-text font-semibold w-3/6">Player</th>
                                <th className="p-2 text-right text-brand-text font-semibold w-2/6">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map(renderRow)}
                        </tbody>
                    </table>
                </div>
                 {/* Timeframe Tabs (simplified for this component) */}
                 <div className="grid grid-cols-3 gap-2 bg-brand-dark p-1 rounded-md mt-2">
                    {(['daily', 'weekly', 'allTime'] as Timeframe[]).map(tf => (
                        <button 
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-2 py-1 text-xs font-bold rounded capitalize ${timeframe === tf ? 'bg-brand-light-gray text-white' : 'text-brand-text hover:bg-brand-light-gray'}`}
                        >
                            {tf === 'allTime' ? 'All Time' : tf}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
