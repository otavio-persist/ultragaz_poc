
import React from 'react';
import { ScenarioMood } from '../types';

interface CustomerAvatarProps {
  mood: ScenarioMood;
  isSpeaking: boolean;
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({ mood, isSpeaking }) => {
  const getColors = () => {
    switch (mood) {
      case ScenarioMood.ANGRY: 
        return { bg: 'bg-[#000fff]/10', accent: 'bg-[#000fff]', border: 'border-[#000fff]/30', moodText: 'Bravo' };
      case ScenarioMood.FRUSTRATED: 
        return { bg: 'bg-orange-100', accent: 'bg-orange-500', border: 'border-orange-300', moodText: 'Frustrado' };
      case ScenarioMood.CALM: 
        return { bg: 'bg-green-100', accent: 'bg-green-600', border: 'border-green-300', moodText: 'Calmo' };
      default: // NEUTRAL / NATURAL
        return { bg: 'bg-blue-100', accent: 'bg-blue-600', border: 'border-blue-300', moodText: 'Natural' };
    }
  };

  const colors = getColors();

  return (
    <div className={`relative w-48 h-48 rounded-full ${colors.bg} border-4 ${colors.border} flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-105 shadow-2xl' : 'scale-100'}`}>
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-20" />
      )}
      
      <div className="relative w-32 h-32 flex flex-col items-center justify-center gap-4">
        <div className="flex gap-10">
          <div className={`w-4 h-6 rounded-full ${colors.accent} transition-all duration-300 ${mood === ScenarioMood.ANGRY ? 'rotate-12 scale-y-75' : ''}`} />
          <div className={`w-4 h-6 rounded-full ${colors.accent} transition-all duration-300 ${mood === ScenarioMood.ANGRY ? '-rotate-12 scale-y-75' : ''}`} />
        </div>
        
        <div className={`w-12 h-6 border-4 border-t-0 rounded-b-full transition-all duration-500 ${colors.accent} ${
          mood === ScenarioMood.ANGRY ? 'rotate-180 scale-x-150 translate-y-2' : 
          mood === ScenarioMood.FRUSTRATED ? 'w-8 h-2 rounded-none border-b-4 border-l-0 border-r-0' : 
          mood === ScenarioMood.CALM ? 'h-8 w-14' : 'h-6 w-10'
        } ${isSpeaking ? 'animate-pulse' : ''}`} />
      </div>

      <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-white text-[10px] font-black uppercase ${colors.accent} shadow-md`}>
        {colors.moodText}
      </div>
    </div>
  );
};
