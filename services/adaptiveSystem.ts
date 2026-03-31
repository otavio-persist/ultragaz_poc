/**
 * Sistema Adaptativo com Reinforcement Learning
 * Ajusta dificuldade e seleciona cenários baseado no perfil do usuário
 */

import { Scenario, User, SimulationResult } from "../types";

export interface UserProfile {
  userId: string;
  avgScore: number;
  weakAreas: {
    empathy: number;
    procedure: number;
    verification: number;
    communication: number;
    solution: number;
  };
  experience: number; // Número de simulações
  recentScores: number[]; // Últimas 5 simulações
  preferredScenarios: string[]; // IDs de cenários mais praticados
}

export interface ScenarioRecommendation {
  scenario: Scenario;
  reason: string;
  expectedDifficulty: 'easy' | 'medium' | 'hard';
  focusArea: string;
}

/**
 * Contextual Bandit simples para seleção de cenários
 */
export class AdaptiveDifficultySystem {
  private userProfiles: Map<string, UserProfile> = new Map();
  private scenarioRewards: Map<string, number> = new Map(); // scenarioId -> reward acumulado
  
  /**
   * Cria ou atualiza perfil do usuário
   */
  updateUserProfile(user: User, results: SimulationResult[]): UserProfile {
    const userResults = results.filter(r => r.userId === user.id);
    
    const avgScore = userResults.length > 0
      ? userResults.reduce((sum, r) => sum + r.score, 0) / userResults.length
      : 0;
    
    // Calcular áreas fracas (média mais baixa)
    const weakAreas = {
      empathy: userResults.length > 0
        ? userResults.reduce((sum, r) => sum + r.empathyScore, 0) / userResults.length
        : 50,
      procedure: userResults.length > 0
        ? userResults.reduce((sum, r) => sum + r.procedureScore, 0) / userResults.length
        : 50,
      verification: userResults.length > 0
        ? userResults.reduce((sum, r) => sum + r.verificationScore, 0) / userResults.length
        : 50,
      communication: userResults.length > 0
        ? userResults.reduce((sum, r) => sum + r.communicationScore, 0) / userResults.length
        : 50,
      solution: userResults.length > 0
        ? userResults.reduce((sum, r) => sum + r.solutionScore, 0) / userResults.length
        : 50
    };
    
    const recentScores = userResults
      .slice(-5)
      .map(r => r.score);
    
    const preferredScenarios = userResults
      .map(r => r.scenarioId)
      .filter((id, index, self) => self.indexOf(id) === index)
      .slice(0, 5);
    
    const profile: UserProfile = {
      userId: user.id,
      avgScore,
      weakAreas,
      experience: userResults.length,
      recentScores,
      preferredScenarios
    };
    
    this.userProfiles.set(user.id, profile);
    return profile;
  }
  
  /**
   * Seleciona próximo cenário otimizado para o usuário
   */
  selectNextScenario(
    user: User,
    availableScenarios: Scenario[],
    results: SimulationResult[]
  ): ScenarioRecommendation {
    const profile = this.updateUserProfile(user, results);
    
    // Identificar área mais fraca
    const weakAreas = Object.entries(profile.weakAreas)
      .sort(([, a], [, b]) => a - b);
    
    const weakestArea = weakAreas[0][0];
    const weakestScore = weakAreas[0][1];
    
    // Filtrar cenários que focam na área fraca
    const relevantScenarios = availableScenarios.filter(scenario => {
      // Verificar se o cenário tem alta pontuação na rubrica da área fraca
      const rubricWeight = scenario.rubric[weakestArea as keyof typeof scenario.rubric] || 0;
      return rubricWeight >= 20; // Pelo menos 20% de peso
    });
    
    // Se não houver cenários relevantes, usar todos
    const candidates = relevantScenarios.length > 0 
      ? relevantScenarios 
      : availableScenarios;
    
    // Calcular dificuldade esperada baseada no perfil
    const expectedDifficulty = this.calculateExpectedDifficulty(profile);
    
    // Selecionar cenário (priorizar não praticados recentemente)
    const scenario = this.selectScenarioWithExploration(
      candidates,
      profile,
      expectedDifficulty
    );
    
    return {
      scenario,
      reason: this.generateRecommendationReason(profile, weakestArea, scenario),
      expectedDifficulty,
      focusArea: weakestArea
    };
  }
  
  private calculateExpectedDifficulty(profile: UserProfile): 'easy' | 'medium' | 'hard' {
    const recentAvg = profile.recentScores.length > 0
      ? profile.recentScores.reduce((a, b) => a + b, 0) / profile.recentScores.length
      : profile.avgScore;
    
    if (recentAvg >= 85) return 'hard';
    if (recentAvg >= 70) return 'medium';
    return 'easy';
  }
  
  private selectScenarioWithExploration(
    scenarios: Scenario[],
    profile: UserProfile,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Scenario {
    // Filtrar por dificuldade (baseado em timeLimit e mood)
    const filtered = scenarios.filter(s => {
      if (difficulty === 'easy') {
        return s.timeLimit >= 150 && s.mood !== 'ANGRY';
      } else if (difficulty === 'medium') {
        return s.timeLimit >= 120 && s.timeLimit <= 180;
      } else {
        return s.timeLimit <= 120 || s.mood === 'ANGRY' || s.mood === 'FRUSTRATED';
      }
    });
    
    const candidates = filtered.length > 0 ? filtered : scenarios;
    
    // Priorizar cenários não praticados recentemente (exploration)
    const notRecentlyPracticed = candidates.filter(s => 
      !profile.preferredScenarios.includes(s.id)
    );
    
    if (notRecentlyPracticed.length > 0) {
      // Seleção aleatória entre não praticados (exploration)
      return notRecentlyPracticed[
        Math.floor(Math.random() * notRecentlyPracticed.length)
      ];
    }
    
    // Se todos foram praticados, selecionar aleatoriamente (exploitation)
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  
  private generateRecommendationReason(
    profile: UserProfile,
    weakestArea: string,
    scenario: Scenario
  ): string {
    const areaNames: Record<string, string> = {
      empathy: 'Empatia',
      procedure: 'Procedimento',
      verification: 'Verificação',
      communication: 'Comunicação',
      solution: 'Solução'
    };
    
    return `Recomendado para melhorar ${areaNames[weakestArea] || weakestArea}. ` +
           `Seu score médio nesta área é ${Math.round(profile.weakAreas[weakestArea as keyof typeof profile.weakAreas])}%. ` +
           `Este cenário foca em desenvolver essa competência.`;
  }
  
  /**
   * Atualiza recompensas após simulação
   */
  updateReward(scenarioId: string, performance: number) {
    const currentReward = this.scenarioRewards.get(scenarioId) || 0;
    // Recompensa = performance normalizada (0-1)
    const reward = performance / 100;
    // Média móvel exponencial
    this.scenarioRewards.set(scenarioId, currentReward * 0.7 + reward * 0.3);
  }
  
  /**
   * Obtém perfil do usuário
   */
  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }
}



