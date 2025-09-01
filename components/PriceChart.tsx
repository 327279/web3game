import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';
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
                                const tickCount = Math.floor(data.length / 5) || 1;
                                return index % tickCount === 0 ? value : '';
                            }}
                        />
                        <YAxis 
                            stroke="#6b7280" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            domain={[minPrice - domainMargin, maxPrice + domainMargin]}
                            orientation="right"
                            tickFormatter={(value) => `$${Number(value).toFixed(4)}`}
                            width={80}
                        />
                        <Tooltip
                            content={<ChartTooltip priceDecimalPlaces={4} bet={draftBet} isPreview={!!draftBet} />}
                            cursor={{ stroke: '#a8ff00', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Area type="monotone" dataKey="price" stroke="#a8ff00" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" animationDuration={300} animationEasing="ease-out" />
                        <ReferenceLine 
                            y={currentPrice} 
                            stroke="#a8ff00"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            label={<CurrentPriceLabel />}
                        />
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
                            travellerWidth={10}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default React.memo(PriceChart);