import { useMemo } from 'react';
import { LeaderboardEntry } from '../types';

// More realistic address generation
const generateAddress = () => `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

const MOCK_USERNAMES = [
  'ChadGigaBrain', 'DiamondHands', 'ApeIn', 'ToTheMoon', 'LeverageLarry',
  'CryptoKing', 'DeFiDon', 'EtherElliott', 'SatoshiJr', 'LamboDreams',
  'VolatilityVince', 'GasFeeGamer', 'YieldYoda', 'WhaleWatcher', 'PumpPrince'
];

// Generates scores with a power-law distribution (few high scores, many lower scores)
const generateRealisticScores = (count: number, baseValue: number, exponent: number): number[] => {
  const scores: number[] = [];
  for (let i = 0; i < count; i++) {
    const rankFactor = Math.pow(i + 1, -exponent);
    const score = baseValue * rankFactor * (0.8 + Math.random() * 0.4); // Add some noise
    scores.push(score);
  }
  return scores;
};

// Generate a pool of mock players
const MOCK_PLAYERS = Array.from({ length: 50 }, (_, i) => ({
  address: generateAddress(),
  username: i < MOCK_USERNAMES.length ? MOCK_USERNAMES[i] : null,
}));

const generateLeaderboard = (
  scores: number[], 
  formatter: (val: number) => string, 
  currentUserAddress?: string | null | undefined
): LeaderboardEntry[] => {
  const data = MOCK_PLAYERS.map((player, i) => ({
    rank: i + 1,
    player: player.username || `${player.address.substring(0, 6)}...${player.address.substring(38)}`,
    value: formatter(scores[i]),
    isCurrentUser: false,
  }));

  // Realistically insert the current user if they are connected
  if (currentUserAddress) {
    const userRank = Math.floor(Math.random() * 20) + 5; // Rank between 5 and 25
    const userScore = (scores[userRank - 2] + scores[userRank - 1]) / 2; // Average of players around them
    
    data.splice(userRank - 1, 0, {
      rank: userRank,
      player: `${currentUserAddress.substring(0, 6)}...${currentUserAddress.substring(currentUserAddress.length - 4)}`,
      value: formatter(userScore),
      isCurrentUser: true,
    });
    
    // Re-rank and trim to 50
    return data.slice(0, 50).map((entry, i) => ({ ...entry, rank: i + 1 }));
  }

  return data;
};

export const useLeaderboardData = (currentUserAddress?: string | null | undefined) => {
    // useMemo ensures this data is generated only once per component instance
    const leaderboardData = useMemo(() => {
        const pnlScores = generateRealisticScores(50, 500000, 1.2);
        const streakScores = generateRealisticScores(50, 50, 0.8);
        const volumeScores = generateRealisticScores(50, 10000000, 1.1);

        const pnlData = generateLeaderboard(pnlScores, val => `${(val / 1000).toFixed(2)}k CHAD`, currentUserAddress);
        const streakData = generateLeaderboard(streakScores, val => `${Math.floor(val)} Wins`, currentUserAddress);
        const volumeData = generateLeaderboard(volumeScores, val => `$${(val / 1000000).toFixed(2)}M`, currentUserAddress);
        
        return { pnlData, streakData, volumeData };

    }, [currentUserAddress]);

    return leaderboardData;
};
