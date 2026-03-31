/**
 * Serviço de Integração
 * Conecta todos os serviços avançados de IA
 */

import { Scenario, ChatMessage, SimulationResult, User } from "../types";
import { generateRAGResponse, retrieveRelevantDocuments } from "./ragService";
import { performHolisticAnalysis, HolisticAnalysis } from "./multimodalAnalysis";
import { AgentOrchestrator } from "./agentsService";
import { MOCK_AGENTS } from "../constants";
import { PerformancePredictor, PerformancePrediction } from "./predictionService";
import { AdaptiveDifficultySystem, ScenarioRecommendation } from "./adaptiveSystem";

/**
 * Serviço principal que integra todas as funcionalidades avançadas
 */
export class AdvancedAIService {
  private predictor: PerformancePredictor;
  private adaptiveSystem: AdaptiveDifficultySystem;
  private orchestrator: AgentOrchestrator | null = null;
  
  constructor() {
    this.predictor = new PerformancePredictor();
    this.adaptiveSystem = new AdaptiveDifficultySystem();
  }
  
  /**
   * Inicializa orquestrador de agentes para uma sessão
   */
  initializeSession(scenario: Scenario) {
    this.orchestrator = new AgentOrchestrator(scenario, MOCK_AGENTS);
    return this.orchestrator;
  }
  
  /**
   * Processa interação com RAG e agentes
   */
  async processInteractionWithRAG(
    employeeMessage: string,
    scenario: Scenario,
    conversationHistory: ChatMessage[]
  ): Promise<{
    customerResponse: string;
    ragContext?: string;
    evaluation?: any;
    coaching?: string;
  }> {
    // 1. Buscar contexto relevante com RAG
    const relevantDocs = await retrieveRelevantDocuments(
      employeeMessage,
      scenario,
      3
    );
    
    // 2. Gerar resposta do cliente com RAG
    const customerResponse = await generateRAGResponse(
      employeeMessage,
      scenario,
      conversationHistory
    );
    
    // 3. Se orquestrador estiver ativo, usar agentes
    let evaluation, coaching;
    if (this.orchestrator) {
      const agentResponse = await this.orchestrator.processInteraction(
        employeeMessage,
        conversationHistory
      );
      
      evaluation = agentResponse.evaluation?.metadata;
      coaching = agentResponse.coaching?.content;
    }
    
    return {
      customerResponse,
      ragContext: relevantDocs.map(d => d.title).join(', '),
      evaluation,
      coaching
    };
  }
  
  /**
   * Análise completa multimodal
   */
  async performCompleteAnalysis(
    videoFrames: string[],
    audioBuffer: AudioBuffer | null,
    transcript: ChatMessage[]
  ): Promise<HolisticAnalysis> {
    return await performHolisticAnalysis(videoFrames, audioBuffer, transcript);
  }
  
  /**
   * Predição de performance em tempo real
   */
  async predictPerformance(
    partialTranscript: ChatMessage[],
    videoMetrics?: any,
    audioMetrics?: any,
    textMetrics?: any,
    timeElapsed: number = 0,
    totalTime: number = 120
  ): Promise<PerformancePrediction> {
    return await this.predictor.predictFinalScore(
      partialTranscript,
      videoMetrics,
      audioMetrics,
      textMetrics,
      timeElapsed,
      totalTime
    );
  }
  
  /**
   * Recomendação adaptativa de cenário
   */
  recommendNextScenario(
    user: User,
    availableScenarios: Scenario[],
    results: SimulationResult[]
  ): ScenarioRecommendation {
    return this.adaptiveSystem.selectNextScenario(
      user,
      availableScenarios,
      results
    );
  }
  
  /**
   * Atualiza sistema adaptativo após simulação
   */
  updateAfterSimulation(scenarioId: string, performance: number) {
    this.adaptiveSystem.updateReward(scenarioId, performance);
  }
  
  /**
   * Obtém perfil do usuário
   */
  getUserProfile(userId: string) {
    return this.adaptiveSystem.getUserProfile(userId);
  }
}

// Instância singleton
let advancedAIServiceInstance: AdvancedAIService | null = null;

export function getAdvancedAIService(): AdvancedAIService {
  if (!advancedAIServiceInstance) {
    advancedAIServiceInstance = new AdvancedAIService();
  }
  return advancedAIServiceInstance;
}


