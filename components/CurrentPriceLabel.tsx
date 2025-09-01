import React from 'react';

interface CurrentPriceLabelProps {
  viewBox?: { x: number; y: number; width: number; height: number };
  value?: string | number;
}

const CurrentPriceLabel: React.FC<CurrentPriceLabelProps> = ({ viewBox, value }) => {
  if (!viewBox) return null;

  const { x, y, width } = viewBox;
  const priceText = typeof value === 'number' ? `$${value.toFixed(4)}` : value;

  const ballCx = x + width;
  const ballCy = y;
  
  const textX = ballCx + 12;
  const textY = y;

  return (
    <g>
      <circle cx={ballCx} cy={ballCy} r="5" fill="#a8ff00" stroke="#131313" strokeWidth="2">
        <animate attributeName="r" from="5" to="8" dur="1.5s" begin="0s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="1" to="0.3" dur="1.5s" begin="0s" repeatCount="indefinite" />
      </circle>
      <text
        x={textX}
        y={textY}
        dy={4}
        fill="#a8ff00"
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
