/**
 * Sistema de Agentes Autônomos Especializados
 * Múltiplos agentes coordenados para simulações mais realistas
 */

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Scenario, ChatMessage, ScenarioMood, Agent } from "../types";
import { getGeminiApiKey } from "../geminiEnv";
import {
  isGeminiRestQuotaExceeded,
  isGeminiQuotaError,
  markGeminiRestQuotaExceeded,
  parseGeminiRetryAfterMs,
  sleepMs,
} from "./geminiQuota";

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
    if (isGeminiRestQuotaExceeded()) {
      return {
        agentType: this.config.type as AgentType,
        content: "",
        metadata: { modelUsed: this.config.model, agentId: this.config.id, skipped: true as const, reason: "quota" },
      };
    }

    const call = () =>
      this.llm.models.generateContent({
        model: this.config.model,
        contents: prompt,
        config: {
          temperature: this.config.temperature,
          responseMimeType: isJson ? "application/json" : "text/plain",
        },
      });

    try {
      const response = await call();
      return {
        agentType: this.config.type as AgentType,
        content: response.text || "",
        metadata: {
          modelUsed: this.config.model,
          agentId: this.config.id,
        },
      };
    } catch (error) {
      if (isGeminiQuotaError(error)) {
        markGeminiRestQuotaExceeded();
        const wait = parseGeminiRetryAfterMs(error);
        if (wait != null && wait > 0 && wait <= 90_000) {
          await sleepMs(wait);
          try {
            const response = await call();
            return {
              agentType: this.config.type as AgentType,
              content: response.text || "",
              metadata: {
                modelUsed: this.config.model,
                agentId: this.config.id,
              },
            };
          } catch (retryErr) {
            if (!isGeminiQuotaError(retryErr)) {
              console.warn(`⚠️ Erro no Agente ${this.config.name} (após retry):`, retryErr);
            }
            throw retryErr;
          }
        }
      }
      if (!isGeminiQuotaError(error)) {
        console.warn(`⚠️ Erro no Agente ${this.config.name}:`, error);
      }
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
    conversationHistory: ChatMessage[],
    options?: { skipCustomerLlm?: boolean; skipEvaluatorAndCoach?: boolean }
  ): Promise<{
    customerResponse: AgentResponse;
    evaluation?: AgentResponse;
    coaching?: AgentResponse;
  }> {
    const historyText = conversationHistory
      .slice(-10)
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    // 1. Resposta do Cliente — em modo Live o cliente fala pela sessão WebSocket; evita generateContent redundante.
    let customerResponse: AgentResponse = { agentType: AgentType.CUSTOMER, content: "..." };
    const customerAgent = this.agents.get("customer");
    if (customerAgent && !options?.skipCustomerLlm) {
      const prompt = `${customerAgent.getConfig().systemPrompt}
      
CENÁRIO: ${this.scenario.title}
HISTÓRICO:
${historyText}

ÚLTIMA MENSAGEM DO FUNCIONÁRIO: "${employeeMessage}"
RESPOSTA:`;
      customerResponse = await customerAgent.generate(prompt);
    }

    // 2–3. Em Live, pular avaliador/coach REST economiza cota (ex.: 20 req/dia Flash no free tier).
    let evaluation: AgentResponse | undefined;
    let coaching: AgentResponse | undefined;
    if (!options?.skipEvaluatorAndCoach) {
      const evaluatorAgent = this.agents.get('evaluator');
      const userMessageCount = conversationHistory.filter(m => m.role === 'user').length;

      if (evaluatorAgent && userMessageCount % 2 === 0) {
        const prompt = `${evaluatorAgent.getConfig().systemPrompt}
      
CENÁRIO: ${this.scenario.title}
DIÁLOGO PARA AVALIAR:
${historyText}
USER: ${employeeMessage}

Retorne JSON com scores e feedback.`;
        try {
          evaluation = await evaluatorAgent.generate(prompt, true);
        } catch (e) {
          if (!isGeminiQuotaError(e)) {
            console.warn('Avaliador operacional indisponível (rede).', e);
          }
        }
      }

      const coachAgent = this.agents.get('coach');
      if (coachAgent && evaluation?.metadata?.overallScore < 80) {
        const coachPrompt = `${coachAgent.getConfig().systemPrompt}
      
Dê uma dica rápida baseada na última falha: "${evaluation.content}"`;
        try {
          coaching = await coachAgent.generate(coachPrompt);
        } catch (e) {
          if (!isGeminiQuotaError(e)) {
            console.warn('Coach indisponível (rede).', e);
          }
        }
      }
    }

    return { customerResponse, evaluation, coaching };
  }
}

