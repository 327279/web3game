
import { useState, useEffect, useCallback } from 'react';

interface PriceData {
  time: string;
  price: number;
}

// Configuration for a 15-minute data window
const DATA_POINTS = 90; // 90 points for 15 minutes (1 point every 10 seconds)
const TIME_INTERVAL_SECONDS = 10;

const usePriceFeed = (initialPrice: number) => {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(initialPrice);

  const formatTime = (timestamp: number) => {
    // Show seconds for more granular time data on the chart
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  
  // Generate initial mock data for the last 15 minutes
  const generateInitialMockData = useCallback(() => {
    const now = new Date();
    let price = initialPrice;
    const mockHistory: PriceData[] = [];
    for (let i = DATA_POINTS - 1; i >= 0; i--) {
      // Create some realistic but random price movement, with reduced volatility for a shorter timeframe
      price += (Math.random() - 0.5) * 5; 
      mockHistory.push({
        time: formatTime(now.getTime() - i * 1000 * TIME_INTERVAL_SECONDS),
        price: parseFloat(price.toFixed(4)),
      });
    }
    setPriceHistory(mockHistory);
    if (mockHistory.length > 0) {
      setCurrentPrice(mockHistory[mockHistory.length - 1].price);
    }
  }, [initialPrice]);

  useEffect(() => {
    generateInitialMockData();
  }, [generateInitialMockData]);

  // Update with new mock data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory(prevHistory => {
        if (prevHistory.length === 0) {
            return prevHistory;
        }

        const lastPrice = prevHistory[prevHistory.length - 1].price;
        // Price change for updates, make it smaller for smoother ticks
        const newPrice = parseFloat((lastPrice + (Math.random() - 0.5) * 2).toFixed(4));
        
        setCurrentPrice(newPrice);

        const newHistory = [...prevHistory.slice(1), {
            time: formatTime(Date.now()),
            price: newPrice,
        }];
        return newHistory;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return { priceHistory, currentPrice };
};

export default usePriceFeed;
