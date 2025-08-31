import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import CurrentPriceLabel from './CurrentPriceLabel';
import ChartTooltip from './ChartTooltip';

interface PriceChartProps {
  data: { time: string; price: number }[];
  currentPrice: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, currentPrice }) => {
    const minPrice = Math.min(...data.map(d => d.price));
    const maxPrice = Math.max(...data.map(d => d.price));
    const domainMargin = (maxPrice - minPrice) * 0.1;

    return (
        <div className="h-56 sm:h-64 w-full animate-fade-in-slide-up">
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
                        tickFormatter={(value, index) => index % Math.floor(data.length / 5) === 0 ? value : ''}
                    />
                    <YAxis 
                        stroke="#6b7280" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={[minPrice - domainMargin, maxPrice + domainMargin]}
                        orientation="right"
                        tickFormatter={(value) => `$${Number(value).toFixed(4)}`}
                    />
                    <Tooltip
                        content={<ChartTooltip priceDecimalPlaces={4} />}
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
    );
};

export default React.memo(PriceChart);