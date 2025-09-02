import React, { useState } from 'react';
import { playSound, isMuted, toggleMute } from '../utils/sound';
import SoundOnIcon from './icons/SoundOnIcon';
import SoundOffIcon from './icons/SoundOffIcon';
import TrophyIcon from './icons/TrophyIcon';

interface HeaderProps {
  address: string | null | undefined;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenAchievements: () => void;
}

const Header: React.FC<HeaderProps> = ({ address, onConnect, onDisconnect, onOpenAchievements }) => {
  const [muted, setMuted] = useState(isMuted());
  const displayAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';

  const handleToggleMute = () => {
    const newMutedState = toggleMute();
    setMuted(newMutedState);
    if (!newMutedState) {
        playSound('click');
    }
  };
  
  const handleAchievementsClick = () => {
      playSound('click');
      onOpenAchievements();
  }

  return (
    <header className="flex justify-between items-center bg-brand-gray p-2 sm:p-4 rounded-xl border border-brand-light-gray">
      <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tighter">
        CHAD<span className="text-brand-green">FLIP</span>
      </h1>
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
        <button onClick={handleToggleMute} className="text-brand-text hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-brand-light-gray">
          {muted ? <SoundOffIcon className="w-6 h-6" /> : <SoundOnIcon className="w-6 h-6" />}
        </button>
        {address && (
            <button onClick={handleAchievementsClick} className="text-brand-text hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-brand-light-gray">
              <TrophyIcon className="w-6 h-6" />
            </button>
        )}
        {address ? (
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <span className="text-sm bg-brand-dark px-4 py-2.5 rounded-lg border border-brand-light-gray">{displayAddress}</span>
            <button
                onClick={() => {
                  playSound('click');
                  onDisconnect();
                }}
                className="bg-brand-red text-white font-bold px-4 py-2.5 rounded-lg hover:bg-opacity-80 transition-all duration-200 text-sm transform hover:scale-105 flex-shrink-0"
            >
                Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              playSound('click');
              onConnect();
            }}
            className="bg-brand-green text-black font-bold px-4 py-2.5 rounded-lg hover:bg-opacity-80 transition-all duration-200 shadow-green-glow transform hover:scale-105 text-sm"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;