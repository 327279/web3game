import React from 'react';

interface CurrentPriceLabelProps {
  viewBox?: { x: number; y: number; width: number; height: number };
  value?: string | number;
}

const CurrentPriceLabel: React.FC<CurrentPriceLabelProps> = ({ viewBox, value }) => {
  if (!viewBox) return null;

  const { x, y, width } = viewBox;
  const priceText = typeof value === 'number' ? `$${value.toFixed(2)}` : value;

  const circleCx = x + width;
  const circleCy = y;
  const textX = x + width + 15;
  const textY = y;

  return (
    <g>
      <circle
        cx={circleCx}
        cy={circleCy}
        r="5"
        fill="#f84339"
        className="animate-pulse-indicator"
      />
      <circle
        cx={circleCx}
        cy={circleCy}
        r="3"
        fill="#f84339"
      />
      <text
        x={textX}
        y={textY}
        dy={4}
        fill="#f84339"
        fontSize="12"
        fontWeight="bold"
        textAnchor="start"
      >
        {priceText}
      </text>
    </g>
  );
};

export default CurrentPriceLabel;