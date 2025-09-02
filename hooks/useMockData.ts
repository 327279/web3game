import { useState, useEffect } from 'react';
import { LeaderboardEntry, LiveBet, BetDirection } from '../types';

const generatePlayerAddress = () => `0x${[...Array(4)].map(() => Math.floor(Math.random() * 0xff).toString(16).padStart(2, '0')).join('')}...${[...Array(4)].map(() => Math.floor(Math.random() * 0xff).toString(16).padStart(2, '0')).join('')}`;

const generateLeaderboardData = (count: number, formatter: (val: number) => string): LeaderboardEntry[] => {
    return Array.from({ length: count }, (_, i) => ({
        rank: i + 1,
        player: generatePlayerAddress(),
        value: formatter(100000 / (i + 1) * (Math.random() + 0.5)),
    }));
};

export const useLeaderboardData = (currentUserAddress?: string | null) => {
    const [pnlData, setPnlData] = useState<LeaderboardEntry[]>([]);
    const [streakData, setStreakData] = useState<LeaderboardEntry[]>([]);
    const [volumeData, setVolumeData] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        const pnl = generateLeaderboardData(50, val => `${(val / 1000).toFixed(2)}k`);
        const streak = generateLeaderboardData(50, val => `${Math.floor(val / 10000)} wins`);
        const volume = generateLeaderboardData(50, val => `$${(val * 10).toLocaleString()}`);
        
        // Insert current user mock data
        if (currentUserAddress) {
            pnl.splice(7, 0, { rank: 8, player: currentUserAddress, value: "12.34k", isCurrentUser: true });
            pnl.length = 50;
            pnl.forEach((d, i) => d.rank = i + 1);
        }

        setPnlData(pnl);
        setStreakData(streak);
        setVolumeData(volume);
    }, [currentUserAddress]);

    return { pnlData, streakData, volumeData };
};


export const useLiveFeedData = () => {
    const [liveBets, setLiveBets] = useState<LiveBet[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newBet: LiveBet = {
                player: generatePlayerAddress(),
                amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
                leverage: [1, 2, 5, 10][Math.floor(Math.random() * 4)],
                direction: Math.random() > 0.5 ? 'UP' : 'DOWN',
                timestamp: Date.now(),
            };

            setLiveBets(prev => [newBet, ...prev.slice(0, 19)]);
        }, 3000); // New bet every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return liveBets;
};
