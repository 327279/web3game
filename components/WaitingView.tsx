import React, { useState, useEffect, useRef } from 'react';
import { Bet } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ChartTooltip from './ChartTooltip';
import SpinnerIcon from './icons/SpinnerIcon';

interface WaitingViewProps {
  bet: Bet;
  onResolution: (finalPrice: number) => Promise<void>;
  currentPrice: number;
}

const WaitingView: React.FC<WaitingViewProps> = ({ bet, onResolution, currentPrice }) => {
  const [countdown, setCountdown] = useState(bet.duration);
  const [isResolving, setIsResolving] = useState(false);
  const [priceHistory, setPriceHistory] = useState([{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), price: bet.entryPrice }]);
  
  // Use a ref to store the latest currentPrice without causing re-renders or effect re-runs.
  const latestPriceRef = useRef(currentPrice);
  useEffect(() => {
      latestPriceRef.current = currentPrice;
  }, [currentPrice]);


  const latestChartPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : bet.entryPrice;

  // This effect updates the chart history whenever a new price comes from the parent
  useEffect(() => {
    // Only add a new point if the price has actually changed to avoid duplicate points
    if (currentPrice !== latestChartPrice) {
      setPriceHistory(prev => [
        ...prev, 
        { 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          price: currentPrice 
        }
      ]);
    }
  }, [currentPrice, latestChartPrice]);

  // This effect handles the countdown and final resolution.
  // It should only run once on mount to set up the interval.
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsResolving(true);
          // Use the absolute latest price from the ref for resolution.
          onResolution(latestPriceRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  // The dependency array is empty on purpose so this effect only runs once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isPriceUp = currentPrice > bet.entryPrice;
  const chartColor = isPriceUp ? '#a8ff00' : '#f84339';

  return (
    <div className="flex justify-center py-10">
      <div className="w-full max-w-4xl bg-brand-gray p-4 sm:p-8 rounded-xl border border-brand-light-gray animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center mb-8">
          <div className="bg-brand-dark p-3 sm:p-4 rounded-lg flex flex-col">
            <p className="text-sm text-brand-text">Countdown</p>
            <div className="flex-grow flex items-center justify-center min-h-10">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{formatCountdown(countdown)}</p>
            </div>
          </div>
          <div className="bg-brand-dark p-3 sm:p-4 rounded-lg flex flex-col">
            <p className="text-sm text-brand-text">Bet Size</p>
            <div className="flex-grow flex items-center justify-center min-h-10">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{bet.amount} CHAD</p>
            </div>
          </div>
          <div className="bg-brand-dark p-3 sm:p-4 rounded-lg flex flex-col">
            <p className="text-sm text-brand-text">Bet Entry Price</p>
            <div className="flex-grow flex items-center justify-center min-h-10">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white break-words">${bet.entryPrice.toFixed(4)}</p>
            </div>
          </div>
          <div className="bg-brand-dark p-3 sm:p-4 rounded-lg flex flex-col">
            <p className="text-sm text-brand-text">Current BTC Price</p>
            <div className="flex-grow flex items-center justify-center min-h-10">
              <p className={`text-lg sm:text-xl md:text-2xl font-bold ${isPriceUp ? 'text-brand-green' : 'text-brand-red'} break-words`}>${currentPrice.toFixed(4)}</p>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-80 w-full animate-fade-in-slide-up">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id="waitingChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} hide />
              <Tooltip
                content={<ChartTooltip priceDecimalPlaces={4} bet={bet} />}
                cursor={{ stroke: chartColor, strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={3} fill="url(#waitingChartFill)" animationDuration={300} animationEasing="ease-out" />
              <ReferenceLine y={bet.entryPrice} label={{ value: 'Entry', position: 'insideLeft', fill: '#c3c3c3' }} stroke="#c3c3c3" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-4 text-brand-text h-6">
          {isResolving ? (
              <div className="flex items-center justify-center gap-2 animate-fade-in">
                  <SpinnerIcon className="animate-spin w-5 h-5" />
                  <span>Resolving on-chain...</span>
              </div>
          ) : countdown > 0 ? (
              <p className="animate-pulse">Waiting for round to end...</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default React.memo(WaitingView);
