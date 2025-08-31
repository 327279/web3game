
import { useState, useEffect, useCallback } from 'react';

interface PriceData {
  time: string;
  price: number;
}

const API_URL_HISTORY = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1';
const API_URL_CURRENT = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

const usePriceFeed = (initialPrice: number, dataPoints: number = 50) => {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(initialPrice);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Fetch historical data on initial load to populate the chart
  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch(API_URL_HISTORY);
      if (!response.ok) throw new Error('Failed to fetch historical price data');
      const data = await response.json();
      
      const history: PriceData[] = data.prices.slice(-dataPoints).map((p: [number, number]) => ({
        time: formatTime(p[0]),
        price: parseFloat(p[1].toFixed(2)),
      }));
      
      setPriceHistory(history);
      if (history.length > 0) {
        setCurrentPrice(history[history.length - 1].price);
      }
    } catch (error) {
      console.error("PriceFeed (Initial):", error);
      // Fallback to mock data if API fails
      const now = new Date();
      let price = initialPrice;
      const mockHistory: PriceData[] = [];
      for (let i = dataPoints - 1; i >= 0; i--) {
        price += (Math.random() - 0.5) * 20;
        mockHistory.push({
          time: new Date(now.getTime() - i * 1000 * 60).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: parseFloat(price.toFixed(2)),
        });
      }
      setPriceHistory(mockHistory);
      if (mockHistory.length > 0) {
        setCurrentPrice(mockHistory[mockHistory.length - 1].price);
      }
    }
  }, [initialPrice, dataPoints]);


  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch the latest price periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(API_URL_CURRENT);
        if (!response.ok) return; // Silently fail to avoid console spam on minor network issues
        const data = await response.json();
        const newPrice = parseFloat(data.bitcoin.usd.toFixed(2));

        setCurrentPrice(newPrice);
        setPriceHistory(prevHistory => {
            if(prevHistory.length === 0) return prevHistory; // Don't update if initial data isn't there yet
            const newHistory = [...prevHistory.slice(1), {
                time: formatTime(Date.now()),
                price: newPrice,
            }];
            return newHistory;
        });

      } catch (error) {
        console.warn("PriceFeed (Update):", error);
      }
    }, 2000); // Update every 2 seconds. NOTE: Frequent calls to public APIs can lead to rate-limiting.

    return () => clearInterval(interval);
  }, []);

  return { priceHistory, currentPrice };
};

export default usePriceFeed;