
import React from 'react';
import { Scenario, ScenarioType, ScenarioMood, Country } from '../types';
import { Play, MessageCircle, AlertCircle, ShoppingBag, Truck } from 'lucide-react';

interface ScenarioCardProps {
  scenario: Scenario;
  onStart: (scenario: Scenario) => void;
  attemptCount?: number;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onStart, attemptCount = 0 }) => {
  const getIcon = () => {
    switch (scenario.type) {
      case ScenarioType.NEW_PRODUCT: return <ShoppingBag className="text-blue-500" />;
      case ScenarioType.ISSUE_RESOLUTION: return <AlertCircle className="text-[#000fff]" />;
      case ScenarioType.CUSTOMIZATION: return <MessageCircle className="text-green-500" />;
      case ScenarioType.OUT_OF_STOCK: return <Truck className="text-orange-500" />;
      default: return <MessageCircle />;
    }
  };

  const getLanguage = () => {
    if (scenario.country === Country.BRAZIL) return 'português';
    if (scenario.country === Country.COLOMBIA || scenario.country === Country.ARGENTINA) return 'español';
    if (scenario.country === 'ALL') {
      // Detectar pelo título/descrição
      const text = scenario.title + ' ' + scenario.description;
      if (text.includes('ñ') || text.includes('¿') || text.includes('¡') || text.includes('Nuevo')) return 'español';
      if (text.includes('Customer') || text.includes('Hello') || text.includes('Hi') || text.toLowerCase().includes('english')) return 'english';
      return 'português';
    }
    return 'português';
  };

  const getMoodLabel = () => {
    const language = getLanguage();
    
    const labels: Record<string, Record<ScenarioMood, string>> = {
      'português': {
        [ScenarioMood.CALM]: 'Calmo',
        [ScenarioMood.NEUTRAL]: 'Neutro',
        [ScenarioMood.FRUSTRATED]: 'Frustrado',
        [ScenarioMood.ANGRY]: 'Bravo',
      },
      'español': {
        [ScenarioMood.CALM]: 'Tranquilo',
        [ScenarioMood.NEUTRAL]: 'Neutro',
        [ScenarioMood.FRUSTRATED]: 'Frustrado',
        [ScenarioMood.ANGRY]: 'Enojado',
      },
      'english': {
        [ScenarioMood.CALM]: 'Calm',
        [ScenarioMood.NEUTRAL]: 'Neutral',
        [ScenarioMood.FRUSTRATED]: 'Frustrated',
        [ScenarioMood.ANGRY]: 'Angry',
      }
    };
    
    return labels[language]?.[scenario.mood] || labels['português'][scenario.mood];
  };

  const getMoodBadge = () => {
    const colors: Record<ScenarioMood, string> = {
      [ScenarioMood.CALM]: 'bg-green-100 text-green-700 border-green-200',
      [ScenarioMood.NEUTRAL]: 'bg-gray-100 text-gray-700 border-gray-200',
      [ScenarioMood.FRUSTRATED]: 'bg-orange-100 text-orange-700 border-orange-200',
      [ScenarioMood.ANGRY]: 'bg-[#000fff]/10 text-[#000fff] border-[#000fff]/20',
    };
    return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${colors[scenario.mood]}`}>
        {getMoodLabel()}
      </span>
    );
  };

  const getLanguageBadge = () => {
    const language = getLanguage();
    const languageNames: Record<string, string> = {
      'português': 'Português',
      'español': 'Español',
      'english': 'English',
    };
    const colors: Record<string, string> = {
      'português': 'bg-blue-100 text-blue-700 border-blue-200',
      'español': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'english': 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${colors[language] || colors['português']}`}>
        {languageNames[language] || 'Português'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 group flex flex-col h-full min-h-[320px]">
      {/* Header com ícone e labels organizadas */}
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-[#000fff]/10 transition-colors">
          {getIcon()}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-sm border border-gray-100">
            Tentativas: {attemptCount}/3
          </span>
        </div>
      </div>
      
      {/* Labels de sentimento e idioma */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {getMoodBadge()}
        {getLanguageBadge()}
      </div>
      
      {/* Conteúdo */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">{scenario.title}</h3>
        <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-1">
          {scenario.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
          <div className="flex gap-2">
            {Object.keys(scenario.rubric).map(key => (
              <div key={key} className="w-2 h-2 rounded-full bg-gray-200" title={key} />
            ))}
          </div>
          <button 
            onClick={() => onStart(scenario)}
            className="flex items-center gap-2 bg-[#000fff] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#000fff]/90 transition-colors"
          >
            <Play size={16} fill="currentColor" />
            Começar
          </button>
        </div>
      </div>
    </div>
  );
};
