/**
 * Componente que exibe funcionalidades avançadas de IA
 * Predição em tempo real, coaching, análise multimodal
 */

import React, { useState, useEffect } from 'react';
import { ChatMessage, Scenario, ScenarioMood } from '../types';
import { getAdvancedAIService } from '../services/integrationService';
import { PerformancePrediction } from '../services/predictionService';
import { TrendingUp, Lightbulb, Target, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdvancedAIFeaturesProps {
  transcript: ChatMessage[];
  scenario: Scenario;
  timeElapsed: number;
  totalTime: number;
  videoMetrics?: any;
  audioMetrics?: any;
  textMetrics?: any;
  customerMood?: ScenarioMood;
  onCoachingReceived?: (coaching: string) => void;
  onPredictionUpdate?: (prediction: PerformancePrediction) => void;
  compact?: boolean;
  showCoach?: boolean;
  emitCoach?: boolean;
}

export const AdvancedAIFeatures: React.FC<AdvancedAIFeaturesProps> = ({
  transcript,
  scenario,
  timeElapsed,
  totalTime,
  videoMetrics,
  audioMetrics,
  textMetrics,
  customerMood,
  onCoachingReceived,
  onPredictionUpdate,
  compact = false,
  showCoach = true,
  emitCoach = true
}) => {
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [coaching, setCoaching] = useState<string | null>(null);
  const [lastEmittedCoaching, setLastEmittedCoaching] = useState<string | null>(null);

  const aiService = getAdvancedAIService();

  const pickBestCoaching = (pred: PerformancePrediction): string | null => {
    const recs = (pred.recommendations || []).filter(Boolean);
    if (recs.length === 0) return null;

    // 1) Foco pela dimensão mais baixa
    const breakdown = pred.predictedBreakdown;
    const lowest = Object.entries(breakdown).sort(([, a], [, b]) => a - b)[0]?.[0] as
      | 'empathy'
      | 'procedure'
      | 'verification'
      | 'communication'
      | 'solution'
      | undefined;

    const keywordByDim: Record<string, string[]> = {
      empathy: ['empátic', 'entendo', 'desculp', 'sinto', 'compreend'],
      procedure: ['proced', 'protoc', 'rigoros', 'seguir'],
      verification: ['confirm', 'verific', 'confer', 'checar'],
      communication: ['claro', 'calma', 'ritmo', 'comunica'],
      solution: ['resolver', 'solução', 'corrigir', 'ajudar', 'proativo'],
    };

    const moodBoostKeywords =
      customerMood === ScenarioMood.ANGRY || customerMood === ScenarioMood.FRUSTRATED
        ? keywordByDim.empathy
        : customerMood === ScenarioMood.CALM
          ? keywordByDim.verification
          : [];

    const tryMatch = (keywords: string[]) =>
      recs.find(r => keywords.some(k => r.toLowerCase().includes(k)));

    // 2) Se cliente está bravo/frustrado, priorizar dica empática (reduz escalada)
    const moodMatch = moodBoostKeywords.length ? tryMatch(moodBoostKeywords) : null;
    if (moodMatch && moodMatch !== lastEmittedCoaching) return moodMatch;

    // 3) Caso contrário, priorizar dica da dimensão mais fraca
    const dimKeywords = (lowest && keywordByDim[lowest]) ? keywordByDim[lowest] : [];
    const dimMatch = dimKeywords.length ? tryMatch(dimKeywords) : null;
    if (dimMatch && dimMatch !== lastEmittedCoaching) return dimMatch;

    // 4) Evitar repetir: pega a primeira diferente da última
    const different = recs.find(r => r !== lastEmittedCoaching);
    return different || recs[0];
  };

  // Atualizar predição a cada 10 segundos
  useEffect(() => {
    if (transcript.length < 2) return;

    const updatePrediction = async () => {
      try {
        const pred = await aiService.predictPerformance(
          transcript,
          videoMetrics,
          audioMetrics,
          textMetrics,
          timeElapsed,
          totalTime
        );
        setPrediction(pred);
        onPredictionUpdate?.(pred);

        // Se houver coaching, emitir para o container (opcional) e/ou exibir UI
        if (emitCoach && onCoachingReceived) {
          const best = pickBestCoaching(pred);
          if (best && best !== lastEmittedCoaching) {
            setLastEmittedCoaching(best);
            onCoachingReceived(best);
            if (showCoach) setCoaching(best);
          }
        }
      } catch (error) {
        console.error('Erro ao obter predição:', error);
      }
    };

    updatePrediction();
    const interval = setInterval(updatePrediction, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  }, [transcript, timeElapsed, videoMetrics, audioMetrics, textMetrics, customerMood, emitCoach, showCoach, lastEmittedCoaching]);

  // Predição deve sempre aparecer (mesmo zerada)
  const safePrediction: PerformancePrediction = prediction || {
    predictedScore: 0,
    confidence: 0,
    predictedBreakdown: {
      empathy: 0,
      procedure: 0,
      verification: 0,
      communication: 0,
      solution: 0
    },
    recommendations: [],
    trajectory: 'stable'
  };

  const trajectoryColors = {
    improving: 'text-green-600',
    stable: 'text-yellow-600',
    declining: 'text-[#000fff]'
  };

  const trajectoryIcons = {
    improving: <TrendingUp className="text-green-600" size={16} />,
    stable: <Target className="text-yellow-600" size={16} />,
    declining: <AlertCircle className="text-[#000fff]" size={16} />
  };

  return (
    <div className="space-y-4">
      {/* Predição de Performance (sempre visível) */}
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-lg ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20} />
            <h3 className={`${compact ? 'text-base' : 'text-lg'} font-black text-gray-900`}>Predição em Tempo Real</h3>
          </div>
        </div>

          <div className={`grid grid-cols-2 gap-4 ${compact ? 'mb-3' : 'mb-4'}`}>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Score Previsto</p>
              <div className="flex items-baseline gap-2">
                <span className={`${compact ? 'text-3xl' : 'text-4xl'} font-black text-blue-600`}>{safePrediction.predictedScore}</span>
                <span className="text-sm text-gray-500">/100</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Confiança</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${safePrediction.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {Math.round(safePrediction.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Trajetória */}
          <div className={`flex items-center gap-2 bg-white rounded-xl ${compact ? 'mb-3 p-2' : 'mb-4 p-3'}`}>
            {trajectoryIcons[safePrediction.trajectory]}
            <span className={`text-sm font-bold ${trajectoryColors[safePrediction.trajectory]}`}>
              {safePrediction.trajectory === 'improving' && 'Melhorando'}
              {safePrediction.trajectory === 'stable' && 'Estável'}
              {safePrediction.trajectory === 'declining' && 'Precisa Atenção'}
            </span>
          </div>

          {/* Breakdown Previsto */}
          <div className={`space-y-2 ${compact ? 'mb-3' : 'mb-4'}`}>
            <p className="text-xs font-bold text-gray-500 uppercase">Detalhamento</p>
            {(
              [
                ['empathy', 'Empatia'],
                ['procedure', 'Procedimento'],
                ['verification', 'Verificação'],
                ['communication', 'Comunicação'],
                ['solution', 'Solução'],
              ] as const
            ).map(([key, label]) => {
              const value = safePrediction.predictedBreakdown[key];
              return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 w-28">{label}:</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs font-black text-gray-700 w-12 text-right">{value}%</span>
              </div>
              );
            })}
          </div>

          {/* Removido: Recomendações (para reduzir altura do card e manter botão visível) */}
      </div>

      {/* Coaching em Tempo Real */}
      {showCoach && coaching && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-4 animate-in slide-in-from-right">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 rounded-xl">
              <Lightbulb className="text-yellow-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-yellow-700 uppercase mb-1">Dica do Coach</p>
              <p className="text-sm font-bold text-gray-800">{coaching}</p>
            </div>
            <button
              onClick={() => setCoaching(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

