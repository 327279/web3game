import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
  data: { value: number }[];
  isPositive: boolean;
}

const SparklineChart: React.FC<SparklineChartProps> = ({ data, isPositive }) => {
  const color = isPositive ? '#a8ff00' : '#f84339';
  const gradientId = `sparklineGradient-${isPositive ? 'positive' : 'negative'}`;

  return (
    <div className="w-24 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineChart;
