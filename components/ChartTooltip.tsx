import React from 'react';
import { Bet } from '../types';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  priceDecimalPlaces?: number;
  bet?: Bet | null;
  isPreview?: boolean;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label, priceDecimalPlaces = 2, bet, isPreview = false }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0];
    const price = dataPoint.value as number;
    // Be more robust in finding the time. Use `label` if available, otherwise fallback to the data payload.
    const time = label || dataPoint.payload?.time;

    let pnl: number | null = null;
    if (bet) {
        const priceWentUp = price > bet.entryPrice;
        const playerPredictedUp = bet.direction === 'UP';
        const isWin = (priceWentUp && playerPredictedUp) || (!priceWentUp && !playerPredictedUp);

        if (price === bet.entryPrice) {
            pnl = 0;
        } else if (isWin) {
            // Profit = (Bet Amount * Leverage * (1 - House Edge))
            pnl = bet.amount * bet.leverage * 0.95;
        } else {
            pnl = -bet.amount;
        }
    }

    const pnlPrefix = isPreview ? 'Preview' : 'Potential';

    return (
      <div className="p-2 bg-brand-dark border border-brand-light-gray rounded-md shadow-lg text-sm">
        <p className="text-brand-text">{`Time: ${time}`}</p>
        <p className="font-bold text-white">{`Price: $${Number(price).toFixed(priceDecimalPlaces)}`}</p>
        {bet && (
          <div className="mt-1 pt-1 border-t border-brand-light-gray space-y-1">
            <div className="flex justify-between items-center gap-4">
              <span className="text-brand-text text-xs">Direction:</span>
              <span className={`font-bold text-xs ${bet.direction === 'UP' ? 'text-brand-green' : 'text-brand-red'}`}>{bet.direction}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-brand-text text-xs">Entry:</span>
              <span className="font-bold text-white text-xs">${bet.entryPrice.toFixed(priceDecimalPlaces)}</span>
            </div>
            {pnl !== null && (
              <div className={`flex justify-between items-center gap-4 font-bold ${pnl >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                <span className="text-brand-text text-xs">{pnlPrefix} P&L:</span>
                <span>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} CHAD</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default ChartTooltip;