
import React, { useState } from 'react';
import { playSound, isMuted, toggleMute } from '../utils/sound';
import WalletModal from './WalletModal';
import { WalletType } from '../types';
import SoundOnIcon from './icons/SoundOnIcon';
import SoundOffIcon from './icons/SoundOffIcon';

interface HeaderProps {
  address: string | null;
  onConnect: (walletType: WalletType) => void;
  onDisconnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ address, onConnect, onDisconnect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [muted, setMuted] = useState(isMuted());
  const displayAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';

  const handleConnect = (walletType: WalletType) => {
    playSound('click');
    onConnect(walletType);
    setIsModalOpen(false);
  };

  const handleToggleMute = () => {
    const newMutedState = toggleMute();
    setMuted(newMutedState);
    if (!newMutedState) {
        playSound('click');
    }
  };

  return (
    <>
      <header className="flex justify-between items-center bg-brand-gray p-4 rounded-xl border border-brand-light-gray">
        <h1 className="text-2xl font-black text-white tracking-tighter">
          CHAD<span className="text-brand-green">FLIP</span>
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={handleToggleMute} className="text-brand-text hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-brand-light-gray">
            {muted ? <SoundOffIcon className="w-6 h-6" /> : <SoundOnIcon className="w-6 h-6" />}
          </button>
          {address ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono bg-brand-dark px-3 py-2 rounded-md border border-brand-light-gray">{displayAddress}</span>
              <button
                  onClick={() => {
                    playSound('click');
                    onDisconnect();
                  }}
                  className="bg-brand-red text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-all duration-200 text-sm transform hover:scale-105"
              >
                  Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                playSound('click');
                setIsModalOpen(true);
              }}
              className="bg-brand-green text-black font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-all duration-200 shadow-green-glow transform hover:scale-105"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>
      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
      />
    </>
  );
};

export default Header;
