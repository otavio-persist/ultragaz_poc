/**
 * RAG (Retrieval-Augmented Generation) Service
 * Conecta a IA com base de conhecimento da Ultragaz para respostas precisas
 */

import { GoogleGenAI } from "@google/genai";
import { Scenario, ChatMessage } from "../types";
import { getGeminiApiKey } from "../geminiEnv";

const apiKey = getGeminiApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Base de conhecimento da Ultragaz (em produção, viria de banco de dados)
const KNOWLEDGE_BASE = {
  policies: [
    {
      id: "pol-001",
      title: "Política de Atendimento ao Cliente",
      content: "Sempre cumprimentar o cliente com sorriso. Usar linguagem formal mas amigável. Resolver problemas imediatamente quando possível.",
      tags: ["atendimento", "hospitalidade", "protocolo"]
    },
    {
      id: "pol-002",
      title: "Procedimento de Entrega e Troca",
      content: "Confirmar dados do pedido/endereço antes de finalizar. Verificar disponibilidade e prazo. Informar status com clareza. Registrar ocorrência e oferecer alternativas quando necessário.",
      tags: ["entrega", "verificação", "procedimento"]
    },
    {
      id: "pol-003",
      title: "Segurança — Cheiro de Gás",
      content: "Manter a calma. Orientar a ventilar o ambiente, não acionar interruptores, fechar o registro se for seguro e acionar o suporte conforme procedimento. Registrar ocorrência com prioridade.",
      tags: ["segurança", "cheiro-de-gás", "procedimento"]
    },
    {
      id: "pol-004",
      title: "Novos Serviços",
      content: "Explicar claramente como funciona o serviço, canais disponíveis e regras. Confirmar dados do cliente e orientar o próximo passo (app/site/central).",
      tags: ["serviços", "orientação", "conhecimento"]
    }
  ],
  products: [
    { id: "prd-001", name: "Botijão P13", details: ["uso residencial", "orientações de instalação e manuseio"] },
    { id: "prd-002", name: "Botijão P20/P45", details: ["uso comercial", "orientações de segurança e manuseio"] }
  ],
  procedures: [
    {
      id: "proc-001",
      scenario: "Entrega atrasada",
      steps: [
        "Pedir desculpas e reconhecer o impacto",
        "Confirmar dados do pedido e endereço",
        "Verificar status/logística no sistema",
        "Oferecer alternativas (prioridade, reagendamento, retirada)",
        "Registrar ocorrência e confirmar próximos passos"
      ]
    }
  ],
  historicalFeedback: [] // Será populado com dados reais
};

// Função simples de embedding (em produção, usar modelo real)
function simpleEmbedding(text: string): number[] {
  // Simulação de embedding - em produção usar OpenAI/Google embeddings
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  words.forEach((word, i) => {
    const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    embedding[hash % 384] += 1 / (i + 1);
  });
  return embedding;
}

// Similaridade de cosseno
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Busca documentos relevantes na base de conhecimento
 */
export async function retrieveRelevantDocuments(
  query: string,
  scenario: Scenario,
  topK: number = 5
): Promise<any[]> {
  const queryEmbedding = simpleEmbedding(query);
  const scenarioEmbedding = simpleEmbedding(scenario.title + " " + scenario.description);
  
  // Combinar embeddings
  const combinedEmbedding = queryEmbedding.map((val, i) => 
    (val + scenarioEmbedding[i]) / 2
  );
  
  // Buscar em todas as fontes de conhecimento
  const allDocuments: any[] = [
    ...KNOWLEDGE_BASE.policies.map(doc => ({ ...doc, source: 'policies' })),
    ...KNOWLEDGE_BASE.menu.map(doc => ({ ...doc, source: 'menu' })),
    ...KNOWLEDGE_BASE.procedures.map(doc => ({ ...doc, source: 'procedures' }))
  ];
  
  // Calcular similaridade
  const scored = allDocuments.map(doc => {
    const docText = doc.content || doc.name || doc.steps?.join(' ') || '';
    const docEmbedding = simpleEmbedding(docText);
    const similarity = cosineSimilarity(combinedEmbedding, docEmbedding);
    return { ...doc, similarity };
  });
  
  // Ordenar e retornar top K
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter(doc => doc.similarity > 0.1); // Threshold mínimo
}

/**
 * Gera resposta com RAG (grounding em base de conhecimento)
 */
export async function generateRAGResponse(
  query: string,
  scenario: Scenario,
  context: ChatMessage[]
): Promise<string> {
  if (!ai) {
    return "IA indisponível no momento. Configure VITE_GEMINI_API_KEY no ambiente (ex.: Netlify) e recompile.";
  }
  // 1. Recuperar documentos relevantes
  const relevantDocs = await retrieveRelevantDocuments(query, scenario);
  
  // 2. Construir contexto com documentos
  const contextText = relevantDocs.map((doc, i) => {
    if (doc.source === 'policies') {
      return `[Política ${i + 1}]: ${doc.title}\n${doc.content}`;
    } else if (doc.source === 'menu') {
      return `[Cardápio ${i + 1}]: ${doc.name} - R$ ${doc.price}\nIngredientes: ${doc.ingredients.join(', ')}`;
    } else if (doc.source === 'procedures') {
      return `[Procedimento ${i + 1}]: ${doc.scenario}\nPassos: ${doc.steps.join('\n')}`;
    }
    return '';
  }).join('\n\n');
  
  // 3. Histórico da conversa
  const history = context
    .slice(-5) // Últimas 5 mensagens
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');
  
  // 4. Prompt com grounding
  const prompt = `Você é um especialista em atendimento ao cliente da Ultragaz.

CENÁRIO ATUAL:
${scenario.title}
${scenario.description}

BASE DE CONHECIMENTO (use estas informações para responder com precisão):
${contextText}

HISTÓRICO DA CONVERSA:
${history}

PERGUNTA/COMENTÁRIO DO CLIENTE:
${query}

INSTRUÇÕES:
1. Use APENAS informações da base de conhecimento acima
2. Se não souber algo, diga que vai consultar
3. Seja empático e profissional
4. Siga os procedimentos da Ultragaz
5. Responda de forma natural e conversacional

RESPOSTA:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Modelo mais recente
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024
      }
    });
    
    return response.text || "Desculpe, não consegui processar sua solicitação no momento.";
  } catch (error) {
    console.error('Erro no RAG:', error);
    // Fallback: resposta genérica
    return "Entendo sua preocupação. Vou verificar isso para você imediatamente.";
  }
}

/**
 * Atualiza base de conhecimento com feedback de treinamentos
 */
export function updateKnowledgeBase(feedback: {
  scenario: string;
  successfulResponse: string;
  score: number;
}) {
  // Adicionar ao histórico de feedback
  KNOWLEDGE_BASE.historicalFeedback.push({
    ...feedback,
    timestamp: new Date()
  });
  
  // Em produção, salvaria no banco de dados
  console.log('📚 Base de conhecimento atualizada com novo feedback');
}



