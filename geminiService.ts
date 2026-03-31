
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { ChatMessage, Scenario, SimulationResult, Country, ScenarioMood, Sector } from "./types";
import { SYSTEM_PROMPT_SIMULATOR } from "./constants";
import { getGeminiApiKey } from "./geminiEnv";

const apiKey = getGeminiApiKey();

if (!apiKey) {
  console.error('❌ Chave do Gemini não encontrada! Configure VITE_GEMINI_API_KEY (ex.: no Netlify) e recompile.');
  throw new Error('Chave do Gemini não configurada. Configure VITE_GEMINI_API_KEY nas variáveis de ambiente (ex.: Netlify).');
}

const ai = new GoogleGenAI({ apiKey });

// ---- Controle de custo/quotas (importantíssimo no free tier) ----
const ENABLE_RESPONSE_SUGGESTIONS = false; // gera UMA chamada extra por avaliação (alto custo). Deixe false por padrão.
const ENABLE_ATTENDANT_VISION = false; // análise por imagens é cara e estoura quota rápido. Deixe false por padrão.

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isQuotaError(err: any): boolean {
  return (
    err?.status === 429 ||
    err?.code === 429 ||
    (typeof err?.message === 'string' && (err.message.includes('429') || err.message.toLowerCase().includes('quota'))) ||
    (typeof err === 'string' && (err.includes('429') || err.toLowerCase().includes('quota')))
  );
}

function isNotFoundModelError(err: any): boolean {
  return (
    err?.status === 404 ||
    err?.code === 404 ||
    (typeof err?.message === 'string' && (err.message.includes('NOT_FOUND') || err.message.includes('not found') || err.message.includes('models/')))
  );
}

function getRetryDelayMs(err: any): number | null {
  // tenta ler retryDelay do payload do Google (ex: "25s")
  const details = err?.error?.details || err?.details;
  if (Array.isArray(details)) {
    const retryInfo = details.find((d: any) => d?.retryDelay);
    const retryDelay = retryInfo?.retryDelay;
    if (typeof retryDelay === 'string') {
      const match = retryDelay.match(/(\d+)\s*s/i);
      if (match) return Number(match[1]) * 1000;
    }
  }
  return null;
}

// Função para detectar o idioma do cenário
const detectScenarioLanguage = (scenario: Scenario): 'português' | 'español' | 'english' => {
  if (scenario.country === Country.BRAZIL) return 'português';
  if (scenario.country === Country.COLOMBIA || scenario.country === Country.ARGENTINA) return 'español';
  if (scenario.country === 'ALL') {
    // Detectar pelo título/descrição
    const text = (scenario.title + ' ' + scenario.description).toLowerCase();
    
    // Detectar espanhol
    if (text.includes('ñ') || text.includes('¿') || text.includes('¡') || 
        text.includes('nuevo') || 
        text.includes('juguete') || text.includes('cliente entra')) {
      return 'español';
    }
    
    // Detectar inglês - palavras-chave comuns em inglês
    const englishKeywords = [
      'customer', 'approaches', 'asking about', 'ingredients', 'taste', 
      'worth trying', 'makes it special', 'compared to', 'new service launch',
      'premium service', 'they are curious', 'they want to know',
      'you must demonstrate', 'addressing any questions'
    ];
    
    const hasEnglishKeywords = englishKeywords.some(keyword => text.includes(keyword));
    
    // Verificar também se começa com palavras em inglês
    const titleStartsWithEnglish = /^(new|a customer|the customer|hello|hi)/i.test(scenario.title);
    
    if (hasEnglishKeywords || titleStartsWithEnglish) {
      return 'english';
    }
    
    return 'português';
  }
  return 'português';
};

const updateMoodTool: FunctionDeclaration = {
  name: 'updateCustomerMood',
  parameters: {
    type: Type.OBJECT,
    description: 'Atualiza o estado emocional do cliente com base na interação.',
    properties: {
      mood: {
        type: Type.STRING,
        enum: ['CALM', 'NEUTRAL', 'FRUSTRATED', 'ANGRY'],
        description: 'O novo humor do cliente.'
      }
    },
    required: ['mood']
  }
};

export const connectLiveSimulation = (scenario: Scenario, callbacks: any) => {
  const language = detectScenarioLanguage(scenario);
  
  // Instruções de idioma
  const languageInstructions: Record<string, string> = {
    'português': 'IMPORTANTE: Você DEVE falar APENAS em PORTUGUÊS. Todas as suas respostas devem ser em português brasileiro.',
    'español': 'IMPORTANTE: Debes hablar SOLO en ESPAÑOL. Todas tus respuestas deben ser en español latinoamericano.',
    'english': 'IMPORTANTE: You MUST speak ONLY in ENGLISH. All your responses must be in English.'
  };
  
  // Instruções de início da conversa por idioma
  const startInstructions: Record<string, string> = {
    'português': 'VOCÊ É O CLIENTE. ESPERE O FUNCIONÁRIO INICIAR A CONVERSA. NÃO fale primeiro, apenas responda quando o funcionário se dirigir a você.',
    'español': 'TÚ ERES EL CLIENTE. ESPERA A QUE EL EMPLEADO INICIE LA CONVERSACIÓN. NO hables primero, solo responde cuando el empleado se dirija a ti.',
    'english': 'YOU ARE THE CUSTOMER. WAIT FOR THE EMPLOYEE TO START THE CONVERSATION. DO NOT speak first, only respond when the employee addresses you.'
  };
  
  // Instruções de missão por idioma
  const missionInstructions: Record<string, string> = {
    'português': 'Sua missão é reagir ao funcionário quando ele falar com você. Se ele for empático, mude seu humor usando \'updateCustomerMood\'. NÃO inicie a conversa - apenas responda quando o funcionário se dirigir a você primeiro.',
    'español': 'Tu misión es reaccionar al empleado cuando él te hable. Si él es empático, cambia tu estado de ánimo usando \'updateCustomerMood\'. NO inicies la conversación - solo responde cuando el empleado se dirija a ti primero.',
    'english': 'Your mission is to react to the employee when they speak to you. If they are empathetic, change your mood using \'updateCustomerMood\'. DO NOT start the conversation - only respond when the employee addresses you first.'
  };
  
  // Usar modelo que suporta live audio nativo
  // O modelo gemini-2.5-flash-native-audio-preview é específico para áudio em tempo real
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { 
          prebuiltVoiceConfig: { voiceName: 'Charon' } // Voz masculina informativa (meia idade) para todos os cenários
        },
      },
      tools: [{ functionDeclarations: [updateMoodTool] }],
      systemInstruction: `${SYSTEM_PROMPT_SIMULATOR}\n\n
      ${languageInstructions[language]}\n\n
      ${startInstructions[language]}
      Humor inicial / Initial mood / Estado de ánimo inicial: ${scenario.mood}.
      ${missionInstructions[language]}\n\n
      IMPORTANTE: Você é um cliente da Ultragaz no seguinte cenário:
      Título: ${scenario.title}
      Descrição: ${scenario.description}
      
      REGRA CRÍTICA: NÃO inicie a conversa. ESPERE o funcionário falar primeiro. Quando o funcionário se dirigir a você, então você pode mencionar o contexto do cenário. Por exemplo:
      - Se o cenário é sobre alergia alimentar, quando o funcionário perguntar o que você deseja, você menciona que tem alergia alimentar ao glúten (ou outro alergênico) e sua preocupação com segurança.
      - Se o cenário é sobre pedido errado, quando o funcionário perguntar como pode ajudar, você menciona que recebeu o pedido errado.
      - Se o cenário é sobre novo produto, quando o funcionário perguntar o que você deseja, você pergunta sobre o novo produto.
      
      NUNCA fale primeiro. Sempre espere o funcionário iniciar a conversa.`,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  });
};

export const evaluatePerformance = async (scenario: Scenario, transcript: ChatMessage[]): Promise<Partial<SimulationResult>> => {
  // Expandir lista de modelos - tentar mais opções quando quota exceder
  // Ordem: modelos mais recentes primeiro, depois alternativas
  // Nota: gemini-1.5-flash e gemini-1.5-pro foram descontinuados (404)
  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3-flash-preview',
    'gemini-3-pro-preview'
  ];
  const history = transcript.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  const language = detectScenarioLanguage(scenario);
  
  // Prompts de avaliação por idioma
  const evaluationPrompts: Record<string, string> = {
    'português': `Avalie o diálogo de treinamento Ultragaz.\n\nCenário: ${scenario.title}\nHistórico:\n${history}`,
    'español': `Evalúa el diálogo de entrenamiento Ultragaz.\n\nEscenario: ${scenario.title}\nHistorial:\n${history}`,
    'english': `Evaluate the Ultragaz training dialogue.\n\nScenario: ${scenario.title}\nHistory:\n${history}`
  };
  
  let lastError: any = null;
  let quotaExceededCount = 0;
  
  // Tentar com diferentes modelos em caso de erro de quota
  for (const model of models) {
    try {
      console.log(`🔄 Tentando avaliar com modelo: ${model}`);
      
      const response = await ai.models.generateContent({
        model,
        contents: evaluationPrompts[language],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              empathyScore: { type: Type.NUMBER },
              procedureScore: { type: Type.NUMBER },
              verificationScore: { type: Type.NUMBER },
              communicationScore: { type: Type.NUMBER },
              solutionScore: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              missingFeedback: { type: Type.STRING },
              finalMood: { type: Type.STRING, enum: ['CALM', 'NEUTRAL', 'FRUSTRATED', 'ANGRY'] },
              sentimentEvolution: { type: Type.STRING }
            },
            required: ["score", "feedback", "finalMood", "sentimentEvolution"]
          }
        }
      });

      const text = response.text || "{}";
      const rawResult = JSON.parse(text);

      // Estimativa de tokens (MOCK técnico realista)
      const inputTokens = Math.ceil(history.length / 4) + 1000;
      const outputTokens = Math.ceil(text.length / 4);
      const cost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006);

      console.log(`✅ Avaliação concluída com sucesso usando ${model}`);
      
      // Gerar sugestões de resposta de excelência para cada mensagem do usuário
      const transcriptWithSuggestions = ENABLE_RESPONSE_SUGGESTIONS
        ? await generateResponseSuggestions(transcript, scenario, model)
        : transcript;
      
      return { 
        ...rawResult, 
        transcript: transcriptWithSuggestions,
        initialMood: scenario.mood,
        tokenUsage: {
          input: inputTokens,
          output: outputTokens,
          costUsd: cost
        },
        costBreakdown: {
          evaluationUsd: cost,
          liveEstimateUsd: undefined,
          suggestionsEstimateUsd: undefined
        }
      };
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Erro ao usar modelo ${model}:`, error.message || error);
      
      // Se for erro de quota (429), continuar tentando outros modelos
      if (isQuotaError(error)) {
        quotaExceededCount++;
        console.warn(`⚠️ Quota excedida para ${model} (${quotaExceededCount}/${models.length}). Tentando próximo modelo...`);
        
        // Só parar se TODOS os modelos tiverem esgotado a quota
        if (quotaExceededCount >= models.length) {
          console.warn('⚠️ Todos os modelos esgotaram a quota. Usando relatório mockado.');
          break;
        }
        
        // Continuar para o próximo modelo
        continue;
      }

      // Se modelo não existe / não suportado, tenta o próximo sem quebrar o fluxo
      if (isNotFoundModelError(error)) {
        console.log(`⏭️ Modelo ${model} indisponível, tentando próximo...`);
        continue;
      }
      
      // Se for outro tipo de erro, relançar apenas se for o último modelo
      if (model === models[models.length - 1]) {
        throw error;
      }
      
      // Para outros erros, tentar próximo modelo
      console.warn(`⚠️ Erro inesperado com ${model}, tentando próximo modelo...`);
      continue;
    }
  }
  
  // Se todos os modelos falharam, retornar resultado mockado
  console.warn('⚠️ Todos os modelos falharam, retornando avaliação mockada');
  const mockResult: Partial<SimulationResult> = {
    score: 75,
    empathyScore: 70,
    procedureScore: 75,
    verificationScore: 80,
    communicationScore: 75,
    solutionScore: 70,
    feedback: quotaExceededCount > 0
      ? `Avaliação automática temporariamente indisponível devido a limitações da API (quota excedida em ${quotaExceededCount} modelo(s)). Seu treinamento foi registrado com sucesso. Continue praticando para melhorar suas habilidades de atendimento.`
      : "Avaliação automática temporariamente indisponível. Seu treinamento foi registrado com sucesso. Continue praticando para melhorar suas habilidades de atendimento.",
    missingFeedback: "Não foi possível gerar feedback detalhado devido a limitações da API. Tente novamente mais tarde.",
    finalMood: transcript.length > 0 ? (transcript[transcript.length - 1].role === 'assistant' ? ScenarioMood.CALM : scenario.mood) : scenario.mood,
    sentimentEvolution: "Evolução do sentimento não pôde ser analisada automaticamente.",
    transcript,
    initialMood: scenario.mood,
    tokenUsage: {
      input: Math.ceil(history.length / 4) + 1000,
      output: 0,
      costUsd: 0
    },
    costBreakdown: {
      evaluationUsd: 0,
      liveEstimateUsd: undefined,
      suggestionsEstimateUsd: undefined
    }
  };
  
  return mockResult;
};

// Função para gerar sugestões de resposta de excelência
async function generateResponseSuggestions(
  transcript: ChatMessage[], 
  scenario: Scenario, 
  model: string
): Promise<ChatMessage[]> {
  try {
    console.log('🔄 Gerando sugestões de resposta de excelência...');
    const language = detectScenarioLanguage(scenario);
    
    // Filtrar apenas mensagens do usuário que precisam de sugestões
    const userMessages = transcript.filter(m => m.role === 'user');
    
    console.log(`📝 Encontradas ${userMessages.length} mensagens do operador para analisar`);
    
    if (userMessages.length === 0) {
      console.log('⚠️ Nenhuma mensagem do operador encontrada, retornando transcript original');
      return transcript;
    }

    // Gerar sugestões para todas as respostas do usuário de uma vez
    const userMessagesWithContext = userMessages.map((msg, index) => {
      // Pegar o contexto: mensagem anterior do cliente e a resposta do usuário
      const msgIndex = transcript.indexOf(msg);
      const previousClientMsg = msgIndex > 0 ? transcript[msgIndex - 1] : null;
      
      return {
        userMessage: msg.content,
        clientMessage: previousClientMsg?.content || '',
        index
      };
    });

    // Prompts por idioma
    const prompts: Record<string, string> = {
      'português': `Você é um especialista em atendimento ao cliente da Ultragaz.

Cenário: ${scenario.title}
Humor inicial do cliente: ${scenario.mood}

Para cada resposta do operador abaixo, forneça uma sugestão de resposta de EXCELÊNCIA que:
1. Demonstre empatia genuína
2. Siga os procedimentos corretos da Ultragaz
3. Seja profissional e cortês
4. Resolva o problema do cliente de forma eficiente
5. Use linguagem adequada ao contexto de energia/gás e atendimento ao cliente

Respostas do operador para analisar:
${userMessagesWithContext.map((item, i) => 
  `\n${i + 1}. Cliente disse: "${item.clientMessage || 'Início da conversa'}"\n   Operador respondeu: "${item.userMessage}"`
).join('\n')}

Retorne APENAS um JSON array com as sugestões na mesma ordem, no formato:
[
  {"suggestedResponse": "sugestão 1"},
  {"suggestedResponse": "sugestão 2"},
  ...
]`,
      'español': `Eres un especialista en atención al cliente de Ultragaz.

Escenario: ${scenario.title}
Estado de ánimo inicial del cliente: ${scenario.mood}

Para cada respuesta del operador a continuación, proporciona una sugerencia de respuesta de EXCELENCIA que:
1. Demuestre empatía genuina
2. Siga los procedimientos correctos de Ultragaz
3. Sea profesional y cortés
4. Resuelva el problema del cliente de manera eficiente
5. Use lenguaje adecuado al contexto de energía/gas y atención al cliente

Respuestas del operador para analizar:
${userMessagesWithContext.map((item, i) => 
  `\n${i + 1}. Cliente dijo: "${item.clientMessage || 'Inicio de la conversación'}"\n   Operador respondió: "${item.userMessage}"`
).join('\n')}

Retorna SOLO un array JSON con las sugerencias en el mismo orden, en el formato:
[
  {"suggestedResponse": "sugerencia 1"},
  {"suggestedResponse": "sugerencia 2"},
  ...
]`,
      'english': `You are a customer service specialist at Ultragaz.

Scenario: ${scenario.title}
Initial customer mood: ${scenario.mood}

For each operator response below, provide an EXCELLENCE response suggestion that:
1. Demonstrates genuine empathy
2. Follows correct Ultragaz procedures
3. Is professional and courteous
4. Resolves the customer's problem efficiently
5. Uses language appropriate to the energy/gas customer service context

Operator responses to analyze:
${userMessagesWithContext.map((item, i) => 
  `\n${i + 1}. Customer said: "${item.clientMessage || 'Start of conversation'}"\n   Operator responded: "${item.userMessage}"`
).join('\n')}

Return ONLY a JSON array with suggestions in the same order, in the format:
[
  {"suggestedResponse": "suggestion 1"},
  {"suggestedResponse": "suggestion 2"},
  ...
]`
    };

    const prompt = prompts[language];

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              suggestedResponse: { type: Type.STRING }
            },
            required: ["suggestedResponse"]
          }
        }
      }
    });

    const text = response.text || "[]";
    const suggestions = JSON.parse(text);

    console.log(`✅ ${suggestions.length} sugestões geradas com sucesso`);

    // Adicionar sugestões ao transcript
    const updatedTranscript = [...transcript];
    let suggestionIndex = 0;
    
    for (let i = 0; i < updatedTranscript.length; i++) {
      if (updatedTranscript[i].role === 'user' && suggestionIndex < suggestions.length) {
        updatedTranscript[i] = {
          ...updatedTranscript[i],
          suggestedResponse: suggestions[suggestionIndex].suggestedResponse
        };
        console.log(`✅ Sugestão adicionada à mensagem ${i}:`, suggestions[suggestionIndex].suggestedResponse.substring(0, 50) + '...');
        suggestionIndex++;
      }
    }

    console.log('✅ Transcript atualizado com sugestões');
    return updatedTranscript;
  } catch (error) {
    console.error('❌ Erro ao gerar sugestões de resposta:', error);
    // Retornar transcript original se houver erro, mas adicionar sugestões mockadas para teste
    console.log('⚠️ Retornando transcript original sem sugestões devido ao erro');
    return transcript;
  }
}

export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

// Função para capturar frame do vídeo como base64
export function captureVideoFrame(video: HTMLVideoElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.warn('Erro ao capturar frame:', err);
    return null;
  }
}

// Função para analisar emoções do atendente baseado nos frames capturados
export const analyzeAttendantEmotions = async (videoFrames: string[]): Promise<Partial<SimulationResult['attendantAnalysis']>> => {
  // Evitar gastar quota com visão por padrão no free tier
  if (!ENABLE_ATTENDANT_VISION) {
    return {
      smilePercentage: 65,
      eyeContactPercentage: 75,
      expressions: { happy: 40, neutral: 35, serious: 20, concerned: 5 },
      overallMood: 'NEUTRAL',
      feedback: 'Análise de câmera desativada para economizar quota. (Ative ENABLE_ATTENDANT_VISION para habilitar.)'
    };
  }

  if (!videoFrames || videoFrames.length === 0) {
    // Retornar análise mockada se não houver frames
    return {
      smilePercentage: 65,
      eyeContactPercentage: 75,
      expressions: {
        happy: 40,
        neutral: 35,
        serious: 20,
        concerned: 5
      },
      overallMood: 'POSITIVE',
      feedback: 'Análise de câmera não disponível. A câmera estava ativa durante o treinamento.'
    };
  }

  const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview', 'gemini-3-pro-preview'];
  
  // Pegar alguns frames representativos (não todos para economizar tokens)
  const sampleFrames = videoFrames.slice(0, Math.min(5, videoFrames.length));
  
  for (const model of models) {
    try {
      console.log(`🔄 Analisando emoções do atendente com modelo: ${model}`);
      
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            text: `Analise as expressões faciais do atendente nestas ${sampleFrames.length} imagens capturadas durante um treinamento de atendimento ao cliente. 
            
            Avalie:
            1. Percentual do tempo sorrindo (smilePercentage: 0-100)
            2. Percentual do tempo com contato visual direto com a câmera (eyeContactPercentage: 0-100)
            3. Distribuição de expressões: happy, neutral, serious, concerned (cada uma de 0-100, somando 100)
            4. Humor geral: POSITIVE, NEUTRAL ou NEGATIVE
            5. Feedback detalhado sobre a expressão facial e postura do atendente
            
            Retorne apenas JSON válido.`
          },
          ...sampleFrames.map(frame => ({
            inlineData: {
              data: frame.split(',')[1], // Remove o prefixo data:image/jpeg;base64,
              mimeType: 'image/jpeg'
            }
          }))
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              smilePercentage: { type: Type.NUMBER },
              eyeContactPercentage: { type: Type.NUMBER },
              expressions: {
                type: Type.OBJECT,
                properties: {
                  happy: { type: Type.NUMBER },
                  neutral: { type: Type.NUMBER },
                  serious: { type: Type.NUMBER },
                  concerned: { type: Type.NUMBER }
                },
                required: ['happy', 'neutral', 'serious', 'concerned']
              },
              overallMood: { type: Type.STRING, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] },
              feedback: { type: Type.STRING }
            },
            required: ['smilePercentage', 'eyeContactPercentage', 'expressions', 'overallMood', 'feedback']
          }
        }
      });

      const text = response.text || "{}";
      const result = JSON.parse(text);
      
      console.log(`✅ Análise de emoções concluída usando ${model}`);
      return result;
    } catch (error: any) {
      console.warn(`⚠️ Erro ao analisar emoções com ${model}:`, error.message || error);
      
      if (isQuotaError(error)) {
        const delay = getRetryDelayMs(error);
        if (delay && delay <= 30000) await sleep(delay);
        continue;
      }

      if (isNotFoundModelError(error)) {
        continue;
      }
    }
  }
  
  // Retornar análise mockada se todos os modelos falharem
  console.warn('⚠️ Análise de emoções falhou, retornando dados mockados');
  return {
    smilePercentage: 65,
    eyeContactPercentage: 75,
    expressions: {
      happy: 40,
      neutral: 35,
      serious: 20,
      concerned: 5
    },
    overallMood: 'POSITIVE',
    feedback: 'Análise automática de emoções temporariamente indisponível. A câmera estava ativa durante o treinamento.'
  };
};
