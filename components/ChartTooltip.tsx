import React from 'react';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  priceDecimalPlaces?: number;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label, priceDecimalPlaces = 2 }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0];
    const price = dataPoint.value;
    // Be more robust in finding the time. Use `label` if available, otherwise fallback to the data payload.
    const time = label || dataPoint.payload?.time;

    return (
      <div className="p-2 bg-brand-dark border border-brand-light-gray rounded-md shadow-lg text-sm">
        <p className="text-brand-text">{`Time: ${time}`}</p>
        <p className="font-bold text-white">{`Price: $${Number(price).toFixed(priceDecimalPlaces)}`}</p>
      </div>
    );
  }

  return null;
};

export default ChartTooltip;
