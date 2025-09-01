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
}

export interface BetResult {
  won: boolean;
  payout: number;
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
