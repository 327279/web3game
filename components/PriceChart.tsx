import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Brush, ReferenceArea } from 'recharts';
import CurrentPriceLabel from './CurrentPriceLabel';
import ChartTooltip from './ChartTooltip';
import { Bet } from '../types';

interface PriceChartProps {
  data: { time: string; price: number }[];
  fullData: { time: string; price: number }[];
  currentPrice: number;
  onZoom: (domain: { startIndex?: number; endIndex?: number }) => void;
  brushKey: number;
  draftBet?: Bet | null;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, fullData, currentPrice, onZoom, brushKey, draftBet }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!data || data.length === 0) {
        return <div className="h-56 sm:h-64 w-full flex items-center justify-center text-brand-text">Loading chart data...</div>;
    }
    
    const minPrice = Math.min(...data.map(d => d.price));
    const maxPrice = Math.max(...data.map(d => d.price));
    const domainMargin = (maxPrice - minPrice) * 0.1 || 1; // Add fallback for flat data

    return (
        <div className="animate-fade-in-slide-up">
            <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a8ff00" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#a8ff00" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="time" 
                            stroke="#6b7280" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            interval="preserveStartEnd"
                            tickFormatter={(value, index) => {
                                // Show fewer ticks on mobile to avoid overlap
                                const tickFrequency = isMobile ? Math.floor(data.length / 3) : Math.floor(data.length / 5);
                                const tickCount = tickFrequency > 0 ? tickFrequency : 1;
                                return index % tickCount === 0 ? value : '';
                            }}
                        />
                        <YAxis 
                            stroke="#6b7280" 
                            fontSize={isMobile ? 10 : 12} 
                            tickLine={false} 
                            axisLine={false} 
                            domain={[minPrice - domainMargin, maxPrice + domainMargin]}
                            orientation="right"
                            tickFormatter={(value) => `$${Number(value).toFixed(isMobile ? 2 : 4)}`}
                            width={isMobile ? 70 : 80}
                        />
                        <Tooltip
                            content={<ChartTooltip priceDecimalPlaces={4} bet={draftBet} isPreview={!!draftBet} />}
                            cursor={{ stroke: '#a8ff00', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                         {/* Highlight bet range */}
                        {draftBet && draftBet.direction === 'UP' && (
                            <ReferenceArea y1={draftBet.entryPrice} y2={maxPrice + domainMargin} fill="#a8ff00" fillOpacity={0.1} strokeWidth={0} ifOverflow="hidden" />
                        )}
                        {draftBet && draftBet.direction === 'DOWN' && (
                            <ReferenceArea y1={minPrice - domainMargin} y2={draftBet.entryPrice} fill="#f84339" fillOpacity={0.1} strokeWidth={0} ifOverflow="hidden" />
                        )}
                        <Area type="monotone" dataKey="price" stroke="#a8ff00" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" animationDuration={300} animationEasing="ease-out" />
                        <ReferenceLine 
                            y={currentPrice} 
                            stroke="#a8ff00"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            label={<CurrentPriceLabel />}
                        />
                        {/* Entry Price Line */}
                        {draftBet && (
                            <ReferenceLine
                                y={draftBet.entryPrice}
                                stroke={draftBet.direction === 'UP' ? '#a8ff00' : '#f84339'}
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-brand-text -mt-3 mb-1">Use the overview below to zoom in.</p>
            <div className="h-20 w-full -mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fullData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <Area type="monotone" dataKey="price" stroke="#6b7280" fill="#6b7280" fillOpacity={0.3} />
                        <Brush 
                            key={brushKey}
                            dataKey="time" 
                            stroke="#a8ff00" 
                            fill="#1e1f2280" 
                            height={40} 
                            y={0} 
                            onChange={onZoom}
                            travellerWidth={isMobile ? 20 : 10}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default React.memo(PriceChart);