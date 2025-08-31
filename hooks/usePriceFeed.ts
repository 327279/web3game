
import { useState, useEffect } from 'react';

interface PriceData {
  time: string;
  price: number;
}

// Configuration for a 15-minute data window
const DATA_POINTS = 90; // 90 points for 15 minutes (1 point every 10 seconds)
const TIME_INTERVAL_SECONDS = 10;

const formatTime = (timestamp: number) => {
  // Show seconds for more granular time data on the chart
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// A pure function to generate the initial dataset.
// This prevents the component from rendering with an empty array first.
const generateInitialData = (initialPrice: number) => {
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
    const currentPrice = mockHistory.length > 0 ? mockHistory[mockHistory.length - 1].price : initialPrice;
    return { history: mockHistory, currentPrice };
}


const usePriceFeed = (initialPrice: number) => {
  // Use the lazy initializer form of useState to generate data only on the first render.
  // This avoids the "render with empty array" problem that caused the crash.
  const [initialData] = useState(() => generateInitialData(initialPrice));

  const [priceHistory, setPriceHistory] = useState<PriceData[]>(initialData.history);
  const [currentPrice, setCurrentPrice] = useState<number>(initialData.currentPrice);

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
