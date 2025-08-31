
import { useState, useEffect } from 'react';

interface PriceData {
  time: string;
  price: number;
}

const usePriceFeed = (initialPrice: number, dataPoints: number = 50) => {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>(() => {
    const now = new Date();
    let price = initialPrice;
    const history: PriceData[] = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      price += (Math.random() - 0.5) * 20;
      history.push({
        time: new Date(now.getTime() - i * 1000 * 60).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: price,
      });
    }
    return history;
  });

  const currentPrice = priceHistory[priceHistory.length - 1]?.price || initialPrice;

  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory(prevHistory => {
        const lastPrice = prevHistory[prevHistory.length - 1].price;
        const newPrice = lastPrice + (Math.random() - 0.49) * 25; // More volatility
        const newHistory = [...prevHistory.slice(1), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: parseFloat(newPrice.toFixed(2)),
        }];
        return newHistory;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return { priceHistory, currentPrice };
};

export default usePriceFeed;
