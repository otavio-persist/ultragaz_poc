/**
 * Serviço de Predição de Performance em Tempo Real
 * Prevê resultado final após análise parcial da interação
 */

import { ChatMessage, Scenario } from "../types";
import { VideoMetrics, AudioMetrics, TextMetrics } from "./multimodalAnalysis";

export interface PerformancePrediction {
  predictedScore: number; // 0-100
  confidence: number; // 0-1
  predictedBreakdown: {
    empathy: number;
    procedure: number;
    verification: number;
    communication: number;
    solution: number;
    /** Contato visual (0–100), derivado de métricas de vídeo quando disponíveis */
    eyeContact: number;
  };
  recommendations: string[];
  trajectory: 'improving' | 'stable' | 'declining';
}

/**
 * Modelo simples de predição (em produção, usar ML treinado)
 */
export class PerformancePredictor {
  private weights = {
    transcriptLength: 0.1,
    avgResponseTime: 0.15,
    empathyKeywords: 0.25,
    procedureKeywords: 0.20,
    solutionKeywords: 0.15,
    videoMetrics: 0.10,
    audioMetrics: 0.05
  };
  
  /**
   * Prediz score final baseado em dados parciais
   */
  async predictFinalScore(
    partialTranscript: ChatMessage[],
    videoMetrics?: VideoMetrics,
    audioMetrics?: AudioMetrics,
    textMetrics?: TextMetrics,
    timeElapsed: number = 0,
    totalTime: number = 120
  ): Promise<PerformancePrediction> {
    // Features básicas
    const features = this.extractFeatures(
      partialTranscript,
      videoMetrics,
      audioMetrics,
      textMetrics,
      timeElapsed,
      totalTime
    );
    
    // Predição baseada em heurísticas (em produção, usar modelo ML)
    const predictedScore = this.calculatePredictedScore(features);
    const confidence = this.calculateConfidence(timeElapsed, totalTime, partialTranscript.length);
    
    // Predição de breakdown
    const predictedBreakdown = this.predictBreakdown(features);
    
    // Recomendações baseadas em gaps previstos
    const recommendations = this.generateRecommendations(features, predictedBreakdown);
    
    // Trajetória
    const trajectory = this.analyzeTrajectory(partialTranscript, features);
    
    return {
      predictedScore: Math.round(predictedScore),
      confidence: Math.round(confidence * 100) / 100,
      predictedBreakdown,
      recommendations,
      trajectory
    };
  }
  
  private extractFeatures(
    transcript: ChatMessage[],
    videoMetrics?: VideoMetrics,
    audioMetrics?: AudioMetrics,
    textMetrics?: TextMetrics,
    timeElapsed: number = 0,
    totalTime: number = 120
  ) {
    const userMessages = transcript.filter(m => m.role === 'user');
    const assistantMessages = transcript.filter(m => m.role === 'assistant');
    
    // Comprimento do transcript
    const transcriptLength = transcript.length;
    
    // Tempo médio de resposta (estimado)
    const avgResponseTime = timeElapsed > 0 
      ? (timeElapsed / userMessages.length) 
      : 5; // default 5 segundos
    
    // Palavras-chave de empatia
    const empathyKeywords = [
      'desculpa', 'desculpe', 'entendo', 'compreendo', 'lamento',
      'peço desculpas', 'sinto muito', 'entendo sua situação'
    ];
    const empathyCount = userMessages.reduce((count, msg) => {
      const lower = msg.content.toLowerCase();
      return count + empathyKeywords.filter(kw => lower.includes(kw)).length;
    }, 0);
    
    // Palavras-chave de procedimento
    const procedureKeywords = [
      'verificar', 'confirmar', 'conferir', 'checar', 'validar',
      'protocolo', 'procedimento', 'seguir'
    ];
    const procedureCount = userMessages.reduce((count, msg) => {
      const lower = msg.content.toLowerCase();
      return count + procedureKeywords.filter(kw => lower.includes(kw)).length;
    }, 0);
    
    // Palavras-chave de solução
    const solutionKeywords = [
      'resolver', 'solucionar', 'ajudar', 'fazer', 'preparar',
      'corrigir', 'arrumar', 'substituir'
    ];
    const solutionCount = userMessages.reduce((count, msg) => {
      const lower = msg.content.toLowerCase();
      return count + solutionKeywords.filter(kw => lower.includes(kw)).length;
    }, 0);
    
    return {
      transcriptLength,
      avgResponseTime,
      empathyCount,
      procedureCount,
      solutionCount,
      videoMetrics: videoMetrics || null,
      audioMetrics: audioMetrics || null,
      textMetrics: textMetrics || null,
      timeElapsed,
      totalTime,
      progress: timeElapsed / totalTime
    };
  }
  
  private calculatePredictedScore(features: any): number {
    let score = 50; // Base score
    
    // Fator de comprimento (mais interação = melhor)
    if (features.transcriptLength > 5) score += 10;
    if (features.transcriptLength > 10) score += 5;
    
    // Fator de empatia
    score += Math.min(20, features.empathyCount * 5);
    
    // Fator de procedimento
    score += Math.min(15, features.procedureCount * 3);
    
    // Fator de solução
    score += Math.min(15, features.solutionCount * 3);
    
    // Fator de tempo de resposta (mais rápido = melhor, até certo ponto)
    if (features.avgResponseTime < 3) score += 5;
    else if (features.avgResponseTime > 10) score -= 5;
    
    // Fator de vídeo
    if (features.videoMetrics) {
      score += (features.videoMetrics.smilePercentage - 50) * 0.1;
      score += (features.videoMetrics.eyeContactPercentage - 50) * 0.1;
    }
    
    // Fator de áudio
    if (features.audioMetrics) {
      score += (100 - features.audioMetrics.stressLevel) * 0.1;
      score += (features.audioMetrics.voiceQuality.confidence - 50) * 0.1;
    }
    
    // Fator de texto
    if (features.textMetrics) {
      score += (features.textMetrics.empathyScore - 50) * 0.2;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateConfidence(
    timeElapsed: number,
    totalTime: number,
    messageCount: number
  ): number {
    // Confiança aumenta com mais tempo e mais mensagens
    const timeConfidence = Math.min(1, timeElapsed / (totalTime * 0.3)); // 30% do tempo
    const messageConfidence = Math.min(1, messageCount / 8); // 8 mensagens
    
    const raw = (timeConfidence + messageConfidence) / 2;
    return Math.round(raw * 100) / 100;
  }
  
  private predictBreakdown(features: any) {
    const baseScore = this.calculatePredictedScore(features);
    const clampRound = (n: number) =>
      Math.round(Math.max(0, Math.min(100, n)));

    return {
      empathy: clampRound(
        baseScore + (features.empathyCount * 8) - 10
      ),
      procedure: clampRound(
        baseScore + (features.procedureCount * 5) - 5
      ),
      verification: clampRound(
        baseScore + (features.procedureCount * 3) - 5
      ),
      communication: clampRound(
        baseScore + (features.audioMetrics?.voiceQuality?.clarity || 80 - 50) * 0.2
      ),
      solution: clampRound(
        baseScore + (features.solutionCount * 5) - 5
      ),
      eyeContact: clampRound(
        typeof features.videoMetrics?.eyeContactPercentage === 'number'
          ? features.videoMetrics.eyeContactPercentage
          : baseScore
      )
    };
  }
  
  private generateRecommendations(features: any, breakdown: any): string[] {
    const recommendations: string[] = [];
    
    if (breakdown.empathy < 70) {
      recommendations.push('Use mais frases empáticas como "Entendo sua situação"');
    }
    
    if (breakdown.procedure < 70) {
      recommendations.push('Siga os procedimentos da Ultragaz mais rigorosamente');
    }
    
    if (breakdown.verification < 70) {
      recommendations.push('Confirme informações com o cliente antes de finalizar');
    }
    
    if (breakdown.communication < 70) {
      recommendations.push('Fale mais claramente e em ritmo adequado');
    }
    
    if (breakdown.solution < 70) {
      recommendations.push('Foque em resolver o problema do cliente de forma proativa');
    }

    if (breakdown.eyeContact < 70) {
      recommendations.push('Mantenha contato visual com o cliente (olhar para a câmera) durante o atendimento');
    }
    
    if (features.audioMetrics?.stressLevel > 50) {
      recommendations.push('Respire fundo e mantenha a calma');
    }
    
    if (features.videoMetrics?.smilePercentage < 60) {
      recommendations.push('Sorria mais durante o atendimento');
    }
    
    return recommendations.slice(0, 3); // Máximo 3 recomendações
  }
  
  private analyzeTrajectory(
    transcript: ChatMessage[],
    features: any
  ): 'improving' | 'stable' | 'declining' {
    if (transcript.length < 4) return 'stable';
    
    // Analisar últimas mensagens vs. primeiras
    const firstHalf = transcript.slice(0, Math.floor(transcript.length / 2));
    const secondHalf = transcript.slice(Math.floor(transcript.length / 2));
    
    const firstEmpathy = firstHalf.filter(m => m.role === 'user').reduce((count, msg) => {
      const lower = msg.content.toLowerCase();
      return count + ['desculpa', 'entendo', 'compreendo'].filter(kw => lower.includes(kw)).length;
    }, 0);
    
    const secondEmpathy = secondHalf.filter(m => m.role === 'user').reduce((count, msg) => {
      const lower = msg.content.toLowerCase();
      return count + ['desculpa', 'entendo', 'compreendo'].filter(kw => lower.includes(kw)).length;
    }, 0);
    
    if (secondEmpathy > firstEmpathy * 1.2) return 'improving';
    if (secondEmpathy < firstEmpathy * 0.8) return 'declining';
    return 'stable';
  }
}



