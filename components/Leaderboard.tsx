import React from 'react';
import TrophyIcon from './icons/TrophyIcon';

const Leaderboard: React.FC = () => {
    return (
        <div className="bg-brand-gray p-4 sm:p-6 rounded-xl border border-brand-light-gray">
            <div className="flex items-center gap-2 mb-4">
                <TrophyIcon className="w-6 h-6 text-brand-green" />
                <h3 className="text-lg font-bold text-white">LEADERBOARD</h3>
            </div>
            <div className="h-64 flex flex-col items-center justify-center text-center text-brand-text">
                <p className="font-bold text-white">Coming Soon!</p>
                <p className="text-sm mt-2">
                    Accurate, on-chain leaderboards require a dedicated backend service to calculate rankings.
                </p>
                <p className="text-sm mt-1">We're working on it!</p>
            </div>
        </div>
    );
};

export default Leaderboard;