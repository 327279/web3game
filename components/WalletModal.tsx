import React from 'react';
import MetaMaskIcon from './icons/MetaMaskIcon';
import OkxIcon from './icons/OkxIcon';
import PhantomIcon from './icons/PhantomIcon';
import { WalletType } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletType: WalletType) => void;
}

const wallets = [
  { id: 'metamask', name: 'MetaMask', icon: <MetaMaskIcon className="w-10 h-10" /> },
  { id: 'okx', name: 'OKX Wallet', icon: <OkxIcon className="w-10 h-10" /> },
  { id: 'phantom', name: 'Phantom', icon: <PhantomIcon className="w-10 h-10" /> },
];

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null;

  const handleWalletClick = (walletId: string) => {
    onConnect(walletId as WalletType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity animate-fade-in" aria-hidden="true" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative bg-brand-gray border border-brand-light-gray rounded-xl shadow-lg transform transition-all animate-scale-in w-full max-w-xs p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white" id="modal-title">Connect Wallet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletClick(wallet.id)}
              className="w-full flex items-center p-3 bg-brand-light-gray rounded-lg text-white font-semibold hover:bg-brand-green hover:text-black transition-colors duration-200"
            >
              {wallet.icon}
              <span className="ml-4 text-lg">{wallet.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
