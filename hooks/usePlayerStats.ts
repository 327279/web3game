import { useState, useEffect, useCallback } from 'react';
// Fix: Import AchievementDef from '../types' where it is defined, not from '../constants'.
import { PlayerStats, Bet, BetResult, AchievementDef } from '../types';
import { ACHIEVEMENTS_LIST } from '../constants';
import { playSound } from '../utils/sound';

const STORAGE_KEY = 'chadflip_player_stats';

const defaultStats: PlayerStats = {
  pnl: 0,
  winStreak: 0,
  totalVolume: 0,
  totalWins: 0,
  totalLosses: 0,
  highestLeverageWin: 0,
  achievements: {},
};

const usePlayerStats = () => {
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const savedStats = localStorage.getItem(STORAGE_KEY);
      return savedStats ? JSON.parse(savedStats) : defaultStats;
    } catch (error) {
      console.error("Error reading player stats from localStorage", error);
      return defaultStats;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error("Error saving player stats to localStorage", error);
    }
  }, [stats]);

  const checkAndUnlockAchievements = useCallback((updatedStats: PlayerStats, bet: Bet, result: BetResult) => {
    const newlyUnlocked: AchievementDef[] = [];
    
    ACHIEVEMENTS_LIST.forEach(achievement => {
        if (!updatedStats.achievements[achievement.id]) {
            let metricValue = 0;
            switch(achievement.metric) {
                case 'totalWins': metricValue = updatedStats.totalWins; break;
                case 'winStreak': metricValue = updatedStats.winStreak; break;
                case 'totalVolume': metricValue = updatedStats.totalVolume; break;
                case 'highestLeverageWin': metricValue = updatedStats.highestLeverageWin; break;
                case 'singleBetAmount': metricValue = bet.amount; break;
            }

            if (metricValue >= achievement.goal) {
                updatedStats.achievements[achievement.id] = true;
                newlyUnlocked.push(achievement);
            }
        }
    });

    if (newlyUnlocked.length > 0) {
        playSound('achievement');
        // Here you could trigger a notification
        console.log("Achievements unlocked:", newlyUnlocked.map(a => a.name));
    }
  }, []);

  const updateOnWin = useCallback((bet: Bet, result: BetResult) => {
    setStats(prevStats => {
      const newStats = { ...prevStats };
      newStats.pnl += (result.payout - bet.amount);
      newStats.winStreak += 1;
      newStats.totalWins += 1;
      newStats.totalVolume += bet.amount;
      if (bet.leverage > newStats.highestLeverageWin) {
          newStats.highestLeverageWin = bet.leverage;
      }
      
      if (newStats.winStreak > 1) {
          playSound('streak');
      }

      checkAndUnlockAchievements(newStats, bet, result);
      return newStats;
    });
  }, [checkAndUnlockAchievements]);

  const updateOnLoss = useCallback((bet: Bet, result: BetResult) => {
    setStats(prevStats => {
      const newStats = { ...prevStats };
      newStats.pnl -= bet.amount;
      newStats.winStreak = 0;
      newStats.totalLosses += 1;
      newStats.totalVolume += bet.amount;

      checkAndUnlockAchievements(newStats, bet, result);
      return newStats;
    });
  }, [checkAndUnlockAchievements]);
  
  const getAchievements = useCallback(() => {
      return ACHIEVEMENTS_LIST.map(def => ({
          ...def,
          unlocked: !!stats.achievements[def.id]
      }));
  }, [stats.achievements]);

  return { stats, updateOnWin, updateOnLoss, getAchievements };
};

export default usePlayerStats;