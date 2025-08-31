import { useState, useEffect } from 'react';
import { MarketData } from '../types';

const generateInitialHistory = (points = 24) => {
    const history = [];
    let price = 108540.00; // Corresponds to usePriceFeed initial price
    for (let i = 0; i < points; i++) {
        price += (Math.random() - 0.5) * 500;
        history.push({ value: price });
    }
    return history;
};

const useMarketData = (): MarketData => {
  const [priceHistory24h, setPriceHistory24h] = useState<{ value: number }[]>(generateInitialHistory());
  const [volume24h, setVolume24h] = useState(45.2 * 1e9); // Start at 45.2 Billion

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate volume change
      setVolume24h(prevVolume => prevVolume + (Math.random() - 0.5) * 1e8);

      // Simulate price history change
      setPriceHistory24h(prevHistory => {
          const lastPrice = prevHistory[prevHistory.length - 1].value;
          const newPrice = lastPrice + (Math.random() - 0.49) * 500; // Similar volatility to main feed
          return [...prevHistory.slice(1), { value: newPrice }];
      });

    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const firstPrice = priceHistory24h[0].value;
  const lastPrice = priceHistory24h[priceHistory24h.length - 1].value;
  const priceChange24h = ((lastPrice - firstPrice) / firstPrice) * 100;

  return { 
      volume24h, 
      priceChange24h,
      priceHistory24h
  };
};

export default useMarketData;
