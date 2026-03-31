/**
 * Sistema de Agentes Autônomos Especializados
 * Múltiplos agentes coordenados para simulações mais realistas
 */

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Scenario, ChatMessage, ScenarioMood, Agent } from "../types";
import { getGeminiApiKey } from "../env";

const apiKey = getGeminiApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Tipos de agentes
export enum AgentType {
  CUSTOMER = 'customer',
  EVALUATOR = 'evaluator',
  COACH = 'coach',
  ANALYST = 'analyst',
  SPECIALIST = 'specialist',
  CRISIS = 'crisis'
}

export interface AgentResponse {
  agentType: AgentType;
  content: string;
  metadata?: any;
}

/**
 * Agente Genérico - Baseado na configuração do Admin
 */
class DynamicAgent {
  private llm: GoogleGenAI;
  private config: Agent;
  
  constructor(config: Agent) {
    if (!ai) {
      throw new Error('IA indisponível. Configure VITE_GEMINI_API_KEY no ambiente e recompile.');
    }
    this.llm = ai;
    this.config = config;
  }
  
  async generate(
    prompt: string,
    isJson: boolean = false
  ): Promise<AgentResponse> {
    try {
      const response = await this.llm.models.generateContent({
        model: this.config.model,
        contents: prompt,
        config: {
          temperature: this.config.temperature,
          responseMimeType: isJson ? "application/json" : "text/plain"
        }
      });
      
      return {
        agentType: this.config.type as AgentType,
        content: response.text || "",
        metadata: {
          modelUsed: this.config.model,
          agentId: this.config.id
        }
      };
    } catch (error) {
      console.warn(`⚠️ Erro no Agente ${this.config.name}:`, error);
      throw error;
    }
  }

  getConfig() { return this.config; }
}

/**
 * Orquestrador Dinâmico - Coordena agentes vinculados ao cenário
 */
export class AgentOrchestrator {
  private agents: Map<string, DynamicAgent> = new Map();
  private scenario: Scenario;
  
  constructor(scenario: Scenario, allAgents: Agent[]) {
    this.scenario = scenario;
    
    // Inicializa apenas os agentes vinculados ao cenário
    const linkedAgentIds = scenario.agentIds || [];
    allAgents.forEach(agentConfig => {
      if (linkedAgentIds.includes(agentConfig.id) && agentConfig.isActive) {
        this.agents.set(agentConfig.type, new DynamicAgent(agentConfig));
      }
    });
  }
  
  async processInteraction(
    employeeMessage: string,
    conversationHistory: ChatMessage[]
  ): Promise<{
    customerResponse: AgentResponse;
    evaluation?: AgentResponse;
    coaching?: AgentResponse;
  }> {
    const historyText = conversationHistory
      .slice(-10)
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    // 1. Resposta do Cliente (Se houver agente do tipo customer)
    let customerResponse: AgentResponse = { agentType: AgentType.CUSTOMER, content: "..." };
    const customerAgent = this.agents.get('customer');
    if (customerAgent) {
      const prompt = `${customerAgent.getConfig().systemPrompt}
      
CENÁRIO: ${this.scenario.title}
HISTÓRICO:
${historyText}

ÚLTIMA MENSAGEM DO FUNCIONÁRIO: "${employeeMessage}"
RESPOSTA:`;
      customerResponse = await customerAgent.generate(prompt);
    }

    // 2. Avaliação (Se houver agente do tipo evaluator)
    let evaluation: AgentResponse | undefined;
    const evaluatorAgent = this.agents.get('evaluator');
    const userMessageCount = conversationHistory.filter(m => m.role === 'user').length;
    
    if (evaluatorAgent && userMessageCount % 2 === 0) {
      const prompt = `${evaluatorAgent.getConfig().systemPrompt}
      
CENÁRIO: ${this.scenario.title}
DIÁLOGO PARA AVALIAR:
${historyText}
USER: ${employeeMessage}

Retorne JSON com scores e feedback.`;
      evaluation = await evaluatorAgent.generate(prompt, true);
    }

    // 3. Coaching (Se houver agente do tipo coach)
    let coaching: AgentResponse | undefined;
    const coachAgent = this.agents.get('coach');
    if (coachAgent && evaluation?.metadata?.overallScore < 80) {
      const prompt = `${coachAgent.getConfig().systemPrompt}
      
Dê uma dica rápida baseada na última falha: "${evaluation.content}"`;
      coaching = await coachAgent.generate(prompt);
    }

    return { customerResponse, evaluation, coaching };
  }
}

