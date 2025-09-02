import React from 'react';
import FlameIcon from './icons/FlameIcon';
import Tooltip from './Tooltip';

interface WinStreakIndicatorProps {
  streak: number;
}

const WinStreakIndicator: React.FC<WinStreakIndicatorProps> = ({ streak }) => {
  if (streak === 0) return null;

  const intensity = Math.min(streak / 5, 1); // Max intensity at 5 streak
  const color = `rgba(248, 67, 57, ${0.5 + intensity * 0.5})`;
  const glow = `0 0 ${2 + intensity * 8}px ${color}`;

  return (
    <Tooltip text={`You are on a ${streak}-win streak!`}>
        <div className="flex items-center gap-1 bg-brand-dark px-2 py-1 rounded-md cursor-help">
          <FlameIcon 
            className="w-4 h-4 text-brand-red" 
            style={{ 
                filter: `drop-shadow(${glow})`,
            }}
          />
          <span className="font-bold text-sm text-white">{streak}</span>
        </div>
    </Tooltip>
  );
};

export default WinStreakIndicator;
