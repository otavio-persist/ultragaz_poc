/**
 * Geração de "Resposta de Excelência" usando IA em tempo real.
 * Usa API do Gemini para sugestões inteligentes e dinâmicas baseadas no contexto da conversa.
 */

import { ChatMessage, Scenario, ScenarioMood, ScenarioType, Sector } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Sistema de rate limiting e cache para evitar exceder quota
const suggestionCache = new Map<string, string>();
const lastSuggestionTime = new Map<string, number>();
const QUOTA_EXCEEDED_FLAG = 'QUOTA_EXCEEDED';
let quotaExceeded = false;

// Configurações de rate limiting
const MIN_TIME_BETWEEN_SUGGESTIONS = 5000; // 5 segundos entre sugestões
const MAX_SUGGESTIONS_PER_SESSION = 10; // Máximo de 10 sugestões por sessão
let suggestionsGeneratedThisSession = 0;

// Função para verificar se é erro de quota
function isQuotaError(error: any): boolean {
  return (
    error?.status === 429 ||
    error?.code === 429 ||
    error?.error?.code === 429 ||
    (typeof error?.message === 'string' && error.message.includes('429')) ||
    (typeof error?.error?.message === 'string' && error.error.message.includes('quota'))
  );
}

// Função para criar chave de cache
function createCacheKey(customerMsg: string, employeeMsg: string, scenarioId: string): string {
  return `${scenarioId}:${customerMsg.substring(0, 50)}:${employeeMsg.substring(0, 50)}`;
}

type Lang = 'pt' | 'es' | 'en';

function detectLang(scenario: Scenario): Lang {
  // Heurística simples (compatível com o resto do projeto)
  if (scenario.country === 'Brasil') return 'pt';
  if (scenario.country === 'Argentina' || scenario.country === 'Colômbia') return 'es';
  const text = (scenario.title + ' ' + scenario.description).toLowerCase();
  if (text.includes('customer') || text.includes('happy meal') || text.includes('premium')) return 'en';
  if (text.includes('cajita') || text.includes('nuevo') || text.includes('¿') || text.includes('¡')) return 'es';
  return 'pt';
}

function t(lang: Lang, pt: string, es: string, en: string) {
  if (lang === 'es') return es;
  if (lang === 'en') return en;
  return pt;
}

function norm(s: string) {
  return (s || '').toLowerCase();
}

function containsAny(text: string, needles: string[]) {
  const x = norm(text);
  return needles.some(n => x.includes(n));
}

function isAngryText(text: string) {
  return containsAny(text, ['absur', 'ridículo', 'pior', 'raiva', 'irrit', 'bravo', 'frustr', 'complaint', 'angry']);
}

function buildExcellentResponse(params: {
  scenario: Scenario;
  customerUtterance: string;
  employeeUtterance: string;
  lang: Lang;
}): string {
  const { scenario, customerUtterance, employeeUtterance, lang } = params;
  const customerText = customerUtterance || '';

  const wantsManager = containsAny(customerText, ['gerente', 'supervisor', 'manager']);
  const mentionsWait = containsAny(customerText, ['esper', 'demor', '20 minuto', '30 minuto', 'meia hora', 'fila']);
  const mentionsWrongOrMissing = containsAny(customerText, ['errado', 'veio errado', 'faltou', 'não veio', 'missing']);
  const mentionsRefund = containsAny(customerText, ['reembolso', 'devolver', 'refund']);
  const mentionsAllergy = containsAny(customerText, ['alerg', 'glúten', 'gluten', 'allergy']);
  const isAllergyScenario = containsAny((scenario.title + ' ' + scenario.description), ['alerg', 'glúten', 'gluten']);

  // Detectar erros de confirmação do operador (tamanhos trocados, itens errados)
  const customerHasSize = containsAny(customerText, ['grande', 'média', 'pequena', 'large', 'medium', 'small']);
  const employeeHasSize = containsAny(employeeUtterance, ['grande', 'média', 'pequena', 'large', 'medium', 'small']);
  const hasConfirmationError = customerHasSize && employeeHasSize && 
    ((customerText.includes('grande') && employeeUtterance.includes('média')) || 
     (customerText.includes('média') && employeeUtterance.includes('grande')) ||
     (customerText.includes('pequena') && employeeUtterance.includes('grande')));

  // Detectar se o operador está perguntando de forma confusa
  const isConfusedConfirmation = containsAny(employeeUtterance, ['isso que você falou?', 'é isso?', 'confirma?', 'isso mesmo?']) && 
    (customerText.length > 0 && !containsAny(customerText, ['sim', 'isso', 'correto', 'yes', 'correct']));

  // Base: empatia + ownership + próximo passo + confirmação
  const empathy = t(
    lang,
    `Sinto muito por isso e entendo sua frustração.`,
    `Lo siento y entiendo tu frustración.`,
    `I’m sorry about that, and I understand your frustration.`
  );

  const ownership = t(
    lang,
    `Eu vou resolver isso agora com você.`,
    `Lo voy a resolver ahora contigo.`,
    `I’ll take care of this right now.`
  );

  // Procedimento baseado no contexto REAL da conversa
  let procedure = '';
  
  if (hasConfirmationError || isConfusedConfirmation) {
    // Erro de confirmação: operador confundiu tamanhos/itens
    const customerSize = customerText.match(/(grande|média|pequena)/i)?.[0] || 'tamanho';
    const customerItem = customerText.match(/(batata|coca|refrigerante|hambúrguer|bebida)/i)?.[0] || 'item';
    procedure = t(
      lang,
      `Deixa eu confirmar com você para garantir: você pediu ${customerSize} de ${customerItem}. Vou anotar corretamente agora.`,
      `Déjame confirmar contigo para asegurar: pediste ${customerSize} de ${customerItem}. Voy a anotarlo correctamente ahora.`,
      `Let me confirm with you to make sure: you ordered ${customerSize} ${customerItem}. I'll write it down correctly now.`
    );
  } else if (isAllergyScenario || mentionsAllergy) {
    // Procedimento completo de alergia alimentar - SEMPRE aplicar quando o cenário é sobre alergia
    procedure = t(
      lang,
      `Entendo sua preocupação com a alergia alimentar. Vou confirmar qual é o alergênico específico que você tem e vou verificar com a cozinha os protocolos de segurança, incluindo o risco de contaminação cruzada, antes de confirmar qualquer preparo.`,
      `Entiendo tu preocupación con la alergia alimentaria. Voy a confirmar cuál es el alérgeno específico que tienes y voy a verificar con la cocina los protocolos de seguridad, incluyendo el riesgo de contaminación cruzada, antes de confirmar cualquier preparación.`,
      `I understand your concern about food allergies. I'll confirm which specific allergen you have and check with the kitchen about safety protocols, including cross-contamination risk, before confirming any preparation.`
    );
  } else if (scenario.sector === Sector.DRIVE_THRU || mentionsWrongOrMissing) {
    procedure = t(
      lang,
      `Vou conferir o ticket e confirmar com você o item correto, e já vou repor/refazer com prioridade.`,
      `Voy a revisar el ticket, confirmar contigo el ítem correcto y reponerlo/re-hacerlo con prioridad.`,
      `I'll check the receipt, confirm the correct item with you, and replace it with priority.`
    );
  } else if (scenario.type === ScenarioType.NEW_PRODUCT) {
    procedure = t(
      lang,
      `Posso te explicar os ingredientes principais e o que torna esse item diferente — e te ajudo a escolher conforme sua preferência.`,
      `Puedo explicarte los ingredientes principales y qué lo hace diferente — y ayudarte a elegir según tu preferencia.`,
      `I can explain the key ingredients and what makes it different — and help you choose based on your preference.`
    );
  } else {
    // Confirmação padrão para pedidos normais
    const customerSize = customerText.match(/(grande|média|pequena)/i)?.[0] || 'tamanho';
    const customerItem = customerText.match(/(batata|coca|refrigerante|hambúrguer|bebida)/i)?.[0] || 'item';
    procedure = t(
      lang,
      `Perfeito! Então é ${customerSize} de ${customerItem}. Vou anotar e já preparar para você.`,
      `Perfecto! Entonces es ${customerSize} de ${customerItem}. Voy a anotarlo y prepararlo para ti.`,
      `Perfect! So that's ${customerSize} ${customerItem}. I'll write it down and prepare it for you.`
    );
  }

  // Tempo/ETA
  const eta = mentionsWait
    ? t(lang, `Vou te dar um retorno em até 1 minuto com a solução.`, `Te doy una respuesta en hasta 1 minuto con la solución.`, `I’ll get back to you within 1 minute with a solution.`)
    : '';

  // Escalada/gerente
  const escalation = (wantsManager || mentionsRefund)
    ? t(
        lang,
        `Se você preferir, eu já aciono o gerente agora para acelerar e garantir que fique tudo certo.`,
        `Si prefieres, llamo al gerente ahora para acelerar y asegurar que quede todo bien.`,
        `If you prefer, I can call the manager now to speed things up and make sure everything is handled.`
      )
    : '';

  // Confirmação final (só se necessário)
  let confirm = '';
  if (hasConfirmationError || mentionsWrongOrMissing) {
    confirm = t(
      lang,
      `Pode me confirmar rapidamente o que veio/ficou errado no seu pedido?`,
      `¿Puedes confirmarme rápidamente qué llegó mal o qué faltó en tu pedido?`,
      `Can you quickly confirm what was missing or incorrect in your order?`
    );
  } else if (isAllergyScenario || mentionsAllergy) {
    confirm = t(
      lang,
      `Pode me informar qual é o alergênico específico que você tem? Vou garantir que seguimos todos os protocolos de segurança.`,
      `¿Puedes informarme cuál es el alérgeno específico que tienes? Voy a garantizar que seguimos todos los protocolos de seguridad.`,
      `Can you tell me which specific allergen you have? I'll make sure we follow all safety protocols.`
    );
  }

  // Se cliente não parece bravo, suaviza (sem repetir frustração)
  const angry = isAngryText(customerText);
  const opener = angry ? `${empathy} ${ownership}` : ownership;

  return [opener, procedure, eta, escalation, confirm].filter(Boolean).join(' ');
}

/**
 * Gera sugestão de resposta de excelência usando IA em tempo real
 */
export async function generateExcellenceSuggestionWithAI(
  customerMessage: string,
  employeeMessage: string,
  scenario: Scenario,
  fullTranscript: ChatMessage[]
): Promise<string> {
  // Se quota foi excedida, usar fallback offline imediatamente
  if (quotaExceeded) {
    const lang = detectLang(scenario);
    return buildExcellentResponse({
      scenario,
      customerUtterance: customerMessage,
      employeeUtterance: employeeMessage,
      lang
    });
  }

  // Verificar cache primeiro
  const cacheKey = createCacheKey(customerMessage, employeeMessage, scenario.id);
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey)!;
  }

  // Rate limiting: verificar se já geramos muitas sugestões nesta sessão
  if (suggestionsGeneratedThisSession >= MAX_SUGGESTIONS_PER_SESSION) {
    console.log('Limite de sugestões por sessão atingido, usando fallback offline');
    const lang = detectLang(scenario);
    const suggestion = buildExcellentResponse({
      scenario,
      customerUtterance: customerMessage,
      employeeUtterance: employeeMessage,
      lang
    });
    suggestionCache.set(cacheKey, suggestion);
    return suggestion;
  }

  // Rate limiting: verificar tempo mínimo entre sugestões
  const lastTime = lastSuggestionTime.get(cacheKey) || 0;
  const now = Date.now();
  if (now - lastTime < MIN_TIME_BETWEEN_SUGGESTIONS) {
    console.log('Rate limit: aguardando antes de gerar nova sugestão');
    const lang = detectLang(scenario);
    const suggestion = buildExcellentResponse({
      scenario,
      customerUtterance: customerMessage,
      employeeUtterance: employeeMessage,
      lang
    });
    suggestionCache.set(cacheKey, suggestion);
    return suggestion;
  }

  if (!ai) {
    // Fallback para método offline se API não estiver disponível
    const lang = detectLang(scenario);
    return buildExcellentResponse({
      scenario,
      customerUtterance: customerMessage,
      employeeUtterance: employeeMessage,
      lang
    });
  }

  try {
    const lang = detectLang(scenario);
    const language = lang === 'es' ? 'español' : lang === 'en' ? 'english' : 'português';

    // Criar contexto da conversa para a IA entender melhor
    const conversationContext = fullTranscript
      .slice(-6) // Últimas 6 mensagens para contexto
      .map(m => `${m.role === 'user' ? 'Operador' : 'Cliente'}: ${m.content}`)
      .join('\n');

    const prompts: Record<string, string> = {
      'português': `Você é um especialista em atendimento ao cliente da Ultragaz.

Cenário: ${scenario.title}
Descrição: ${scenario.description}
Humor inicial do cliente: ${scenario.mood}

Contexto da conversa até agora:
${conversationContext}

O cliente acabou de dizer: "${customerMessage}"
O operador respondeu: "${employeeMessage}"

Com base no contexto completo da conversa, forneça uma sugestão de resposta de EXCELÊNCIA que:
1. Demonstre empatia genuína e adequada ao humor do cliente
2. Siga os procedimentos corretos da Ultragaz
3. Seja profissional, cortês e natural
4. Resolva o problema do cliente de forma eficiente e proativa
5. Use linguagem adequada ao contexto de energia/gás e atendimento ao cliente
6. Seja específica ao contexto da conversa, não genérica

Retorne APENAS a sugestão de resposta, sem explicações adicionais.`,
      'español': `Eres un especialista en atención al cliente de Ultragaz.

Escenario: ${scenario.title}
Descripción: ${scenario.description}
Estado de ánimo inicial del cliente: ${scenario.mood}

Contexto de la conversación hasta ahora:
${conversationContext}

El cliente acaba de decir: "${customerMessage}"
El operador respondió: "${employeeMessage}"

Basándote en el contexto completo de la conversación, proporciona una sugerencia de respuesta de EXCELENCIA que:
1. Demuestre empatía genuina y adecuada al estado de ánimo del cliente
2. Siga los procedimientos correctos de Ultragaz
3. Sea profesional, cortés y natural
4. Resuelva el problema del cliente de manera eficiente y proactiva
5. Use lenguaje adecuado al contexto de energía/gas y atención al cliente
6. Sea específica al contexto de la conversación, no genérica

Retorna SOLO la sugerencia de respuesta, sin explicaciones adicionales.`,
      'english': `You are a customer service specialist at Ultragaz.

Scenario: ${scenario.title}
Description: ${scenario.description}
Initial customer mood: ${scenario.mood}

Conversation context so far:
${conversationContext}

The customer just said: "${customerMessage}"
The operator responded: "${employeeMessage}"

Based on the complete conversation context, provide an EXCELLENCE response suggestion that:
1. Demonstrates genuine empathy appropriate to the customer's mood
2. Follows correct Ultragaz procedures
3. Is professional, courteous, and natural
4. Resolves the customer's problem efficiently and proactively
5. Uses language appropriate to the energy/gas customer service context
6. Is specific to the conversation context, not generic

Return ONLY the response suggestion, without additional explanations.`
    };

    const prompt = prompts[language];
    // Usar modelo rápido e eficiente (tentar flash primeiro, depois pro)
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    
    let suggestion = '';
    let lastError: any = null;

    // Tentar com diferentes modelos em caso de erro
    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 200
          }
        });

        suggestion = response.text?.trim() || '';
        
        if (suggestion) {
          // Sucesso: atualizar cache e contadores
          suggestionsGeneratedThisSession++;
          lastSuggestionTime.set(cacheKey, Date.now());
          suggestionCache.set(cacheKey, suggestion);
          break; // Sucesso, sair do loop
        }
      } catch (error: any) {
        lastError = error;
        
        // Se for erro de quota, marcar flag e usar fallback
        if (isQuotaError(error)) {
          console.warn('⚠️ Quota da API excedida, usando fallback offline para todas as sugestões futuras');
          quotaExceeded = true;
          const lang = detectLang(scenario);
          const fallbackSuggestion = buildExcellentResponse({
            scenario,
            customerUtterance: customerMessage,
            employeeUtterance: employeeMessage,
            lang
          });
          suggestionCache.set(cacheKey, fallbackSuggestion);
          return fallbackSuggestion;
        }
        
        console.warn(`Erro ao gerar sugestão com modelo ${model}:`, error);
        // Continuar para o próximo modelo apenas se não for erro de quota
      }
    }
    
    if (suggestion) {
      return suggestion;
    } else {
      // Fallback para método offline se todos os modelos falharem
      console.warn('Todos os modelos falharam, usando fallback offline:', lastError);
      const lang = detectLang(scenario);
      const fallbackSuggestion = buildExcellentResponse({
        scenario,
        customerUtterance: customerMessage,
        employeeUtterance: employeeMessage,
        lang
      });
      suggestionCache.set(cacheKey, fallbackSuggestion);
      return fallbackSuggestion;
    }
  } catch (error: any) {
    // Se for erro de quota, marcar flag
    if (isQuotaError(error)) {
      console.warn('⚠️ Quota da API excedida, usando fallback offline');
      quotaExceeded = true;
    }
    
    console.warn('Erro ao gerar sugestão com IA, usando fallback offline:', error);
    // Fallback para método offline em caso de erro
    const lang = detectLang(scenario);
    const fallbackSuggestion = buildExcellentResponse({
      scenario,
      customerUtterance: customerMessage,
      employeeUtterance: employeeMessage,
      lang
    });
    
    // Cachear fallback também
    const cacheKey = createCacheKey(customerMessage, employeeMessage, scenario.id);
    suggestionCache.set(cacheKey, fallbackSuggestion);
    
    return fallbackSuggestion;
  }
}

/**
 * Reseta o contador de sugestões (chamar no início de uma nova sessão)
 */
export function resetSuggestionCounters(): void {
  suggestionsGeneratedThisSession = 0;
  quotaExceeded = false;
  suggestionCache.clear();
  lastSuggestionTime.clear();
}

/**
 * Adiciona sugestões de excelência ao transcript (usado no final da simulação)
 * Tenta usar IA, mas faz fallback para método offline se necessário
 */
export async function addExcellenceSuggestions(
  transcript: ChatMessage[], 
  scenario: Scenario
): Promise<ChatMessage[]> {
  const lang = detectLang(scenario);
  const updated: ChatMessage[] = [];

  // Se não houver API key, transcript vazio ou quota excedida, usar método offline
  if (!ai || transcript.length === 0 || quotaExceeded) {
    return addExcellenceSuggestionsOffline(transcript, scenario);
  }

  // Limitar geração de sugestões: apenas para as últimas mensagens se já geramos muitas
  const userMessages = transcript.filter(m => m.role === 'user');
  const shouldLimitSuggestions = suggestionsGeneratedThisSession >= MAX_SUGGESTIONS_PER_SESSION / 2;
  // Se já geramos muitas, processar apenas as últimas 5 mensagens do usuário
  const messagesToProcessWithAI = shouldLimitSuggestions 
    ? userMessages.slice(-5)
    : userMessages;

  // Tentar gerar sugestões com IA apenas para mensagens selecionadas
  for (let i = 0; i < transcript.length; i++) {
    const msg = transcript[i];
    if (msg.role !== 'user') {
      updated.push(msg);
      continue;
    }

    // Se já tiver sugestão, manter
    if (msg.suggestedResponse) {
      updated.push(msg);
      continue;
    }

    // Verificar se devemos processar esta mensagem com IA
    const shouldProcessWithAI = messagesToProcessWithAI.includes(msg);

    // Contexto: mensagem anterior do cliente (assistant), se existir
    const prevCustomer = i > 0 && transcript[i - 1]?.role === 'assistant' 
      ? transcript[i - 1].content 
      : '';

    // Se não deve processar ou quota excedida, usar fallback offline
    if (!shouldProcessWithAI || quotaExceeded) {
      const suggestion = buildExcellentResponse({
        scenario,
        customerUtterance: prevCustomer,
        employeeUtterance: msg.content,
        lang
      });
      updated.push({
        ...msg,
        suggestedResponse: suggestion
      });
      continue;
    }

    try {
      const suggestion = await generateExcellenceSuggestionWithAI(
        prevCustomer,
        msg.content,
        scenario,
        transcript.slice(0, i + 1)
      );

      updated.push({
        ...msg,
        suggestedResponse: suggestion
      });
    } catch (error) {
      console.warn(`Erro ao gerar sugestão para mensagem ${i}, usando fallback:`, error);
      // Fallback para método offline
      const suggestion = buildExcellentResponse({
        scenario,
        customerUtterance: prevCustomer,
        employeeUtterance: msg.content,
        lang
      });
      updated.push({
        ...msg,
        suggestedResponse: suggestion
      });
    }
  }

  return updated;
}

/**
 * Método offline (fallback) - versão original sem IA
 */
function addExcellenceSuggestionsOffline(transcript: ChatMessage[], scenario: Scenario): ChatMessage[] {
  const lang = detectLang(scenario);
  const updated: ChatMessage[] = [];

  for (let i = 0; i < transcript.length; i++) {
    const msg = transcript[i];
    if (msg.role !== 'user') {
      updated.push(msg);
      continue;
    }

    // Contexto: mensagem anterior do cliente (assistant), se existir
    const prevCustomer = i > 0 && transcript[i - 1]?.role === 'assistant' ? transcript[i - 1].content : '';
    const suggestion = buildExcellentResponse({
      scenario,
      customerUtterance: prevCustomer,
      employeeUtterance: msg.content,
      lang
    });

    updated.push({
      ...msg,
      suggestedResponse: suggestion
    });
  }

  return updated;
}


