import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LiveBet } from '../types';

const useLiveBets = (contract: ethers.Contract | null, decimals: number): LiveBet[] => {
    const [liveBets, setLiveBets] = useState<LiveBet[]>([]);

    useEffect(() => {
        if (!contract) return;

        const listener = (betId: bigint, player: string, amount: bigint, leverage: bigint, predictionUp: boolean, entryPrice: bigint) => {
            const newBet: LiveBet = {
                player: `${player.substring(0, 6)}...${player.substring(player.length - 4)}`,
                amount: parseFloat(ethers.formatUnits(amount, decimals)),
                leverage: Number(leverage),
                direction: predictionUp ? 'UP' : 'DOWN',
                timestamp: Date.now(),
            };
            setLiveBets(prev => [newBet, ...prev.slice(0, 19)]); // Keep the list to the last 20 bets
        };

        contract.on('BetPlaced', listener);

        return () => {
            contract.off('BetPlaced', listener);
        };
    }, [contract, decimals]);

    return liveBets;
};

export default useLiveBets;
