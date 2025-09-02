export enum GameState {
  BETTING = 'BETTING',
  WAITING = 'WAITING',
  RESULT = 'RESULT',
}

export type BetDirection = 'UP' | 'DOWN';

export interface Bet {
  id: number;
  direction: BetDirection;
  amount: number;
  leverage: number;
  entryPrice: number;
  duration: number;
  contractBetId?: bigint; // The ID of the bet from the smart contract
}

export interface BetResult {
  won: boolean;
  payout: number;
  betAmount: number; // Add betAmount to result for stat tracking
  leverage: number; // Add leverage to result for stat tracking
  finalPrice?: number; // The final price at resolution
}

export interface Balances {
  chad: number;
  mon: number;
}

export interface DailyLimit {
  used: number;
  limit: number;
}

export interface MarketData {
  volume24h: number;
  priceChange24h: number;
  priceHistory24h: { value: number }[];
}

export type BettingStep = 
  | 'idle'
  | 'confirming'
  | 'approving_chad'
  | 'approving_mon'
  | 'placing_bet'
  | 'success'
  | 'error';

// --- Gamification Types ---

export interface LeaderboardEntry {
  rank: number;
  player: string; // e.g., "0x123...abc"
  value: string; // Formatted value
  isCurrentUser?: boolean;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  goal: number;
  metric: 'totalWins' | 'singleBetAmount' | 'winStreak' | 'highestLeverageWin' | 'totalVolume';
}

export interface PlayerStats {
  pnl: number;
  winStreak: number;
  totalVolume: number;
  totalWins: number;
  totalLosses: number;
  highestLeverageWin: number;
  achievements: { [key: string]: boolean }; // e.g., { 'first_win': true }
}

export interface LiveBet {
  player: string;
  amount: number;
  leverage: number;
  direction: BetDirection;
  timestamp: number;
}