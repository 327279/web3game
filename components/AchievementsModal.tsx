import React from 'react';
import { AchievementDef } from '../types';
import TrophyIcon from './icons/TrophyIcon';
import CloseIcon from './icons/CloseIcon';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: (AchievementDef & { unlocked: boolean })[];
}

const AchievementCard: React.FC<{ achievement: AchievementDef & { unlocked: boolean } }> = ({ achievement }) => (
    <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${achievement.unlocked ? 'bg-brand-green/10 border-brand-green' : 'bg-brand-dark border-brand-light-gray'}`}>
        <div className="flex items-center gap-3">
            <TrophyIcon className={`w-8 h-8 flex-shrink-0 ${achievement.unlocked ? 'text-brand-green' : 'text-brand-text'}`} />
            <div>
                <h4 className={`font-bold ${achievement.unlocked ? 'text-white' : 'text-gray-300'}`}>{achievement.name}</h4>
                <p className="text-xs text-brand-text mt-1">{achievement.description}</p>
            </div>
        </div>
    </div>
);

const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, achievements }) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity animate-fade-in" aria-hidden="true" onClick={onClose}></div>

      <div className="relative bg-brand-gray border border-brand-light-gray rounded-xl shadow-lg transform transition-all animate-scale-in w-full max-w-2xl">
        <div className="p-6 border-b border-brand-light-gray flex justify-between items-center">
            <div>
                <h3 className="text-2xl font-bold text-white" id="modal-title">Achievements</h3>
                <p className="text-brand-text text-sm">Unlocked: {unlockedCount} / {totalCount}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map(ach => (
                    <AchievementCard key={ach.id} achievement={ach} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;
