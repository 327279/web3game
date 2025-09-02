import React, { useState } from 'react';
import { BetResult } from '../types';
import ShareIcon from './icons/ShareIcon';

interface SocialShareButtonProps {
    result: BetResult;
}

const SocialShareButton: React.FC<SocialShareButtonProps> = ({ result }) => {
    const [copied, setCopied] = useState(false);
    const shareText = `I just won ${result.payout.toFixed(2)} CHAD on a ${result.leverage}x bet on #ChadFlip! 🚀`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'ChadFlip Win!',
                    text: shareText,
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };
    
    return (
        <button
            onClick={handleShare}
            className="w-full sm:w-auto p-4 rounded-lg bg-brand-light-gray text-white font-bold transition-all duration-200 hover:bg-opacity-70 flex items-center justify-center gap-2"
        >
            <ShareIcon className="w-5 h-5" />
            <span className="text-xl">{copied ? 'COPIED!' : 'SHARE'}</span>
        </button>
    );
};

export default SocialShareButton;
