
import React, { useState, useEffect, useRef } from 'react';
import { Scenario, ChatMessage, SimulationResult, ScenarioMood, Country, Agent } from '../types';
import { connectLiveSimulation, evaluatePerformance, encodeAudio, decodeAudio, decodeAudioData, analyzeAttendantEmotions } from '../geminiService';

// Função para detectar o idioma do cenário
const detectScenarioLanguage = (scenario: Scenario): 'português' | 'español' | 'english' => {
  if (scenario.country === Country.BRAZIL) return 'português';
  if (scenario.country === Country.COLOMBIA || scenario.country === Country.ARGENTINA) return 'español';
  if (scenario.country === 'ALL') {
    // Detectar pelo título/descrição
    const text = (scenario.title + ' ' + scenario.description).toLowerCase();
    
    // Detectar espanhol
    if (text.includes('ñ') || text.includes('¿') || text.includes('¡') || 
        text.includes('cajita feliz') || text.includes('nuevo') || 
        text.includes('juguete') || text.includes('cliente entra')) {
      return 'español';
    }
    
    // Detectar inglês - palavras-chave comuns em inglês
    const englishKeywords = [
      'customer', 'approaches', 'asking about', 'ingredients', 'taste', 
      'worth trying', 'makes it special', 'compared to', 'new burger launch',
      'premium signature', 'they are curious', 'they want to know',
      'you must demonstrate', 'addressing any questions'
    ];
    
    const hasEnglishKeywords = englishKeywords.some(keyword => text.includes(keyword));
    
    // Verificar também se começa com palavras em inglês
    const titleStartsWithEnglish = /^(new|a customer|the customer|happy meal)/i.test(scenario.title);
    
    if (hasEnglishKeywords || titleStartsWithEnglish || text.includes('happy meal')) {
      return 'english';
    }
    
    return 'português';
  }
  return 'português';
};

// Função para obter mensagem inicial no idioma correto
const getInitialMessage = (language: 'português' | 'español' | 'english'): string => {
  const messages = {
    'português': 'O funcionário está pronto. Comece seu atendimento agora como cliente.',
    'español': 'El empleado está listo. Comienza tu atención ahora como cliente.',
    'english': 'The employee is ready. Start your service now as a customer.'
  };
  return messages[language];
};
import { CustomerAvatar } from '../components/CustomerAvatar';
import { AdvancedAIFeatures } from '../components/AdvancedAIFeatures';
import { performHolisticAnalysis, clearAnalysisHistory } from '../services/multimodalAnalysis';
import { getCoachTip } from '../services/coachService';
import { addExcellenceSuggestions, generateExcellenceSuggestionWithAI, resetSuggestionCounters } from '../services/excellenceSuggestions';
import { initializeMediaPipe } from '../services/mediapipeAnalysis';
import { AgentOrchestrator } from '../services/agentsService';
import { MOCK_AGENTS } from '../constants';
import { CustomerAvatar3D } from '../components/CustomerAvatar3D';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { 
  Mic, 
  ArrowLeft, 
  Clock, 
  XCircle,
  Volume2,
  Camera,
  Loader2,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  FileText,
  Target,
  Moon,
  Sun,
  Smile,
  Frown,
  Meh,
} from 'lucide-react';

interface TrainingSessionProps {
  scenario: Scenario;
  onFinish: (result: SimulationResult | null) => void;
  agents: Agent[];
}

export const TrainingSession: React.FC<TrainingSessionProps> = ({ scenario: initialScenario, onFinish, agents: allAgents }) => {
  const [step, setStep] = useState<'intro' | 'chat' | 'processing' | 'result'>('intro');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentMood, setCurrentMood] = useState<ScenarioMood>(initialScenario.mood);
  const [timeLeft, setTimeLeft] = useState(initialScenario.timeLimit);
  const [isDarkMode, setIsDarkMode] = useState(true); // Dark mode por padrão (premium)
  const [processingComplete, setProcessingComplete] = useState(false);
  // Novos estados para funcionalidades avançadas (predição/coaching/análise multimodal)
  const [videoMetrics, setVideoMetrics] = useState<any>(null);
  const [audioMetrics, setAudioMetrics] = useState<any>(null);
  const [textMetrics, setTextMetrics] = useState<any>(null);
  const [coachingMessage, setCoachingMessage] = useState<string | null>(null);
  const [lastPrediction, setLastPrediction] = useState<SimulationResult['realTimePrediction'] | null>(null);
  const agentOrchestratorRef = useRef<AgentOrchestrator | null>(null);
  const lastCoachKeyRef = useRef<string | null>(null);
  const lastCoachAtRef = useRef<number>(0);
  const lastCustomerMsgCountRef = useRef<number>(0);

  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientVideoRef = useRef<HTMLVideoElement>(null);
  const nextStartTimeRef = useRef(0);
  const transcriptRef = useRef<ChatMessage[]>([]);
  const timerRef = useRef<number | null>(null);
  const videoFramesRef = useRef<string[]>([]); // Armazenar frames capturados para análise
  const frameCaptureIntervalRef = useRef<number | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]); // Rastrear todas as fontes de áudio ativas
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null); // Stream da câmera (vídeo) para desligar ao sair
  const isSessionActiveRef = useRef<boolean>(false);
  const initialMessageSentRef = useRef<boolean>(false);
  const radarContainerRef = useRef<HTMLDivElement>(null);
  const [radarDimensions, setRadarDimensions] = useState<{ width: number; height: number } | null>(null);

  const cleanupAudioResources = () => {
    // Parar o processamento de áudio imediatamente
    isSessionActiveRef.current = false;
    
    // Desconectar o processador de áudio ANTES de qualquer outra coisa
    if (audioProcessorRef.current) {
      try {
        const processor = audioProcessorRef.current;
        processor.onaudioprocess = null;
        processor.disconnect();
        console.log('✅ Processador de áudio desconectado');
      } catch (err) {
        // Silencioso
      }
      audioProcessorRef.current = null;
    }
    
    // Desconectar a fonte de áudio
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch (err) {}
      audioSourceRef.current = null;
    }
    
    // Parar todas as tracks do stream de mídia (áudio do microfone)
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      } catch (err) {}
      mediaStreamRef.current = null;
    }
    
    // Desligar a câmera (vídeo)
    if (cameraStreamRef.current) {
      try {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (err) {}
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (err) {}
    }
    
    // Fechar os contextos de áudio - ISSO É CRUCIAL PARA PARAR O ONAUDIOPROCESS
    if (inputAudioContextRef.current) {
      try {
        const ctx = inputAudioContextRef.current;
        if (ctx.state !== 'closed') {
          ctx.close();
        }
      } catch (err) {}
      inputAudioContextRef.current = null;
    }
    
    // Fechar a sessão WebSocket
    if (liveSessionRef.current) {
      try {
        liveSessionRef.current.close();
      } catch (err) {}
      liveSessionRef.current = null;
    }
  };

  // Inicializar MediaPipe quando o componente montar
  useEffect(() => {
    initializeMediaPipe().catch(err => {
      console.warn('⚠️ Erro ao inicializar MediaPipe (análise continuará com fallback):', err);
    });
  }, []);

  useEffect(() => {
    if (step === 'intro' || step === 'chat') {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        cameraStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      }).catch(err => console.error("Câmera bloqueada:", err));
      return () => {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(track => track.stop());
          cameraStreamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
      };
    }
  }, [step]);

  // Capturar frames do vídeo durante a sessão de chat ou intro e processar com MediaPipe em tempo real
  useEffect(() => {
    if ((step === 'chat' || step === 'intro') && videoRef.current) {
      let isProcessing = false; // Evitar processar múltiplos frames simultaneamente
      
      // Capturar e processar frame a cada 3 segundos (tempo real reduzido para intro)
      const interval = step === 'intro' ? 3000 : 5000;
      
      frameCaptureIntervalRef.current = window.setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4 && !isProcessing) {
          try {
            isProcessing = true;
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              const frameData = canvas.toDataURL('image/jpeg', 0.7);
              
              // Armazenar frame para análise posterior
              videoFramesRef.current.push(frameData);
              if (videoFramesRef.current.length > 20) {
                videoFramesRef.current.shift();
              }
              
              // Processar com MediaPipe em tempo real (apenas último frame)
              try {
                const { analyzeVideoFrames } = await import('../services/multimodalAnalysis');
                const realTimeMetrics = await analyzeVideoFrames([frameData]);
                
                // Atualizar métricas em tempo real para o card de predição
                setVideoMetrics(realTimeMetrics);
                
                console.log('✅ Métricas atualizadas em tempo real:', {
                  smile: realTimeMetrics.smilePercentage,
                  eyeContact: realTimeMetrics.eyeContactPercentage,
                  microExpressions: realTimeMetrics.microExpressions.detected
                });
              } catch (mediaPipeError) {
                // Se MediaPipe falhar, não quebrar a captura de frames
                console.warn('⚠️ Erro ao processar frame com MediaPipe (continuando...):', mediaPipeError);
              }
            }
          } catch (err) {
            console.warn('Erro ao capturar frame:', err);
          } finally {
            isProcessing = false;
          }
        }
      }, 5000); // A cada 5 segundos (processamento em tempo real)
    }
    
    return () => {
      if (frameCaptureIntervalRef.current) {
        clearInterval(frameCaptureIntervalRef.current);
        frameCaptureIntervalRef.current = null;
      }
    };
  }, [step]);

  // Função helper para determinar o vídeo correto baseado no estado emocional
  const getClientVideoSrc = (): string => {
    if (!isSpeaking) {
      return '/esperando.mp4';
    }
    
    // Quando está falando, usar o vídeo correspondente ao estado emocional
    switch (currentMood) {
      case ScenarioMood.ANGRY:
        return '/bravo.mp4';
      case ScenarioMood.CALM:
        return '/calmo.mp4';
      case ScenarioMood.FRUSTRATED:
        return '/frustrado.mp4';
      case ScenarioMood.NEUTRAL:
      default:
        return '/neutro.mp4';
    }
  };

  // Sincronizar vídeo do cliente com o estado de fala e humor
  useEffect(() => {
    if (step === 'chat' && clientVideoRef.current) {
      const video = clientVideoRef.current;
      const targetSrc = getClientVideoSrc();
      
      // Só mudar se a fonte for diferente
      const currentSrc = video.src;
      if (!currentSrc || !currentSrc.includes(targetSrc)) {
        // Mudar a fonte do vídeo
        video.src = targetSrc;
        video.load();
        
        // Reproduzir quando o vídeo estiver pronto
        const playWhenReady = () => {
          if (video.readyState >= 2) {
            video.play().catch(err => {
              // Ignorar erros de abort/interrupção
              if (!err.message?.includes('abort') && !err.message?.includes('interrupted') && !err.message?.includes('removed')) {
                console.warn('Erro ao reproduzir vídeo:', err);
              }
            });
          } else {
            video.addEventListener('loadeddata', playWhenReady, { once: true });
          }
        };
        
        playWhenReady();
      } else if (video.paused) {
        // Se já está na fonte correta mas está pausado, apenas reproduzir
        video.play().catch(() => {});
      }
    }
  }, [isSpeaking, currentMood, step]);

  useEffect(() => {
    if (step === 'chat' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleEndSimulation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  // Cleanup quando o componente desmontar ou sair da sessão
  useEffect(() => {
    return () => {
      // Limpar recursos de áudio
      isSessionActiveRef.current = false;
      
      if (audioProcessorRef.current) {
        try {
          audioProcessorRef.current.disconnect();
          audioProcessorRef.current.onaudioprocess = null;
        } catch (err) {
          // Ignorar erros
        }
      }
      
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.disconnect();
        } catch (err) {
          // Ignorar erros
        }
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (inputAudioContextRef.current) {
        try {
          inputAudioContextRef.current.close();
        } catch (err) {
          // Ignorar erros
        }
      }
      
      if (liveSessionRef.current) {
        try {
          liveSessionRef.current.close();
        } catch (err) {
          // Ignorar erros
        }
      }
      
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initLiveSession = async () => {
    try {
      setIsLoading(true);
      setStep('chat');
      
      // Inicializar Orquestrador de Agentes se houver agentes vinculados
      if (initialScenario.agentIds && initialScenario.agentIds.length > 0) {
        console.log('🤖 Inicializando Orquestrador de Agentes IA:', initialScenario.agentIds.length, 'agentes vinculados');
        agentOrchestratorRef.current = new AgentOrchestrator(initialScenario, allAgents);
      }
      
      // Resetar contadores de sugestões para nova sessão
      resetSuggestionCounters();
      
      // Limpar histórico de análise (microexpressões)
      clearAnalysisHistory();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await inputCtx.resume();
      await outputCtx.resume();
      audioContextRef.current = outputCtx;
      inputAudioContextRef.current = inputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      isSessionActiveRef.current = true;

      initialMessageSentRef.current = false;
      const sessionPromise = connectLiveSimulation(initialScenario, {
        onopen: async () => {
          console.log('✅ Conexão com Gemini estabelecida');
          
          try {
            // Aguardar a sessão ser estabelecida
            const s = await sessionPromise;
            
            // Atualizar a referência da sessão imediatamente
            liveSessionRef.current = s;
            
            if (!isSessionActiveRef.current) {
              console.warn('⚠️ Sessão não está mais ativa');
              return;
            }
            
            // NÃO enviar mensagem inicial - o cliente deve esperar o funcionário falar primeiro
            // A instrução do sistema já orienta o cliente a esperar
            initialMessageSentRef.current = true;
            console.log('✅ Sessão pronta - cliente aguardando funcionário iniciar a conversa');
            
            // Configurar processamento de áudio
            const source = inputCtx.createMediaStreamSource(stream);
            audioSourceRef.current = source;
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            audioProcessorRef.current = processor;
          
          let consecutiveErrors = 0;
          const MAX_CONSECUTIVE_ERRORS = 3;
          
          processor.onaudioprocess = (e) => {
            // Verificar se a sessão ainda está ativa antes de processar
            if (!isSessionActiveRef.current) return;
            
            const currentSession = liveSessionRef.current;
            if (!currentSession) return;
            
            // Verificar se o WebSocket está fechado ou fechando
            try {
              const ws = (currentSession as any)?._ws;
              const wsState = ws?.readyState;
              
              if (wsState === 2 || wsState === 3) { // 2 = CLOSING, 3 = CLOSED
                isSessionActiveRef.current = false;
                if (audioProcessorRef.current) {
                  audioProcessorRef.current.onaudioprocess = null;
                }
                return;
              }
            } catch (err) {}
            
            try {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              if (currentSession && isSessionActiveRef.current) {
                try {
                  currentSession.sendRealtimeInput({ 
                    media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                  });
                  consecutiveErrors = 0;
                } catch (err: any) {
                  consecutiveErrors++;
                  const errorMessage = err?.message || String(err);
                  if (errorMessage.includes('CLOSING') || errorMessage.includes('CLOSED') || errorMessage.includes('WebSocket')) {
                    isSessionActiveRef.current = false;
                    if (audioProcessorRef.current) audioProcessorRef.current.onaudioprocess = null;
                    return;
                  }
                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    isSessionActiveRef.current = false;
                    return;
                  }
                }
              }
            } catch (err) {
              consecutiveErrors++;
              if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) isSessionActiveRef.current = false;
            }
          };
            
            source.connect(processor);
            processor.connect(inputCtx.destination);
          } catch (err) {
            console.error('❌ Erro ao configurar sessão:', err);
            setIsLoading(false);
            setStep('intro');
          }
        },
        onerror: (error: any) => {
          console.error('❌ Erro na conexão Gemini:', error);
          
          // Parar processamento de áudio imediatamente
          isSessionActiveRef.current = false;
          if (audioProcessorRef.current) {
            try {
              audioProcessorRef.current.disconnect();
              audioProcessorRef.current.onaudioprocess = null;
            } catch {
              // Ignorar erros ao desconectar
            }
            audioProcessorRef.current = null;
          }
          
          alert(`Erro ao conectar com a API: ${error.message || 'Verifique sua chave GEMINI_API_KEY no arquivo .env.local'}`);
          setIsLoading(false);
          setStep('intro');
        },
        onmessage: async (msg: any) => {
          if (msg.toolCall) {
            for (const fc of msg.toolCall.functionCalls) {
              if (fc.name === 'updateCustomerMood') {
                setCurrentMood(fc.args.mood as ScenarioMood);
                const currentSession = liveSessionRef.current;
                if (currentSession && isSessionActiveRef.current) {
                  try {
                    currentSession.sendToolResponse({
                      functionResponses: [{ id: fc.id, name: fc.name, response: { result: "ok" } }]
                    });
                  } catch (err) {
                    console.warn('Erro ao enviar tool response:', err);
                  }
                }
              }
            }
          }
          const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioData) {
            // IMEDIATAMENTE mudar para vídeo "falando" assim que receber áudio
            if (!isSpeaking) {
              setIsSpeaking(true);
            }
            
            // Decodificar e preparar o áudio
            const buffer = await decodeAudioData(decodeAudio(audioData), outputCtx);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            const startTime = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            
            // Adicionar à lista de fontes de áudio ativas
            audioSourcesRef.current.push(source);
            
            source.start(startTime);
            nextStartTimeRef.current = startTime + buffer.duration;
            
            // Quando o áudio terminar, voltar para "esperando"
            source.onended = () => {
              // Remover da lista de fontes ativas
              audioSourcesRef.current = audioSourcesRef.current.filter(s => s !== source);
              
              // Só voltar para "esperando" se não houver mais áudio tocando
              if (audioSourcesRef.current.length === 0) {
                setIsSpeaking(false);
              }
            };
          }
          if (msg.serverContent?.inputTranscription) updateTranscript('user', msg.serverContent.inputTranscription.text);
          if (msg.serverContent?.outputTranscription) updateTranscript('assistant', msg.serverContent.outputTranscription.text);
          if (msg.serverContent?.turnComplete) setIsListening(true);
        }
      });

      // Aguardar a sessão ser estabelecida
      const session = await sessionPromise;
      liveSessionRef.current = session;
      setIsLoading(false);
      
      // Marcar que a sessão está pronta (não enviamos mensagem inicial - cliente espera funcionário)
      if (isSessionActiveRef.current && session && !initialMessageSentRef.current) {
        initialMessageSentRef.current = true;
        console.log('✅ Sessão pronta (fallback) - cliente aguardando funcionário iniciar a conversa');
      }
    } catch (error: any) {
      console.error('❌ Erro ao inicializar sessão:', error);
      alert(`Erro ao iniciar simulação: ${error.message || 'Verifique sua chave GEMINI_API_KEY no arquivo .env.local e reinicie o servidor'}`);
      setIsLoading(false);
      setStep('intro');
    }
  };

  const updateTranscript = async (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, content: last.content + content };
        transcriptRef.current = updated;
        return updated;
      }
      const newMsg: ChatMessage = { role, content, timestamp: new Date() };
      const updated = [...prev, newMsg];
      transcriptRef.current = updated;
      
      // Se for uma mensagem do usuário, gerar sugestão de excelência em tempo real usando IA
      // Limitar apenas para as últimas mensagens para economizar quota
      if (role === 'user' && updated.length <= 10) {
        // --- NOVO MODO: Processamento com Orquestrador de Agentes ---
        // IMPORTANTE: Apenas processa coaching/evaluation - NÃO envia resposta do cliente automaticamente
        if (agentOrchestratorRef.current) {
          agentOrchestratorRef.current.processInteraction(content, prev)
            .then(result => {
              // IMPORTANTE: A dica do coach é APENAS VISUAL - não deve ser enviada ao cliente
              if (result.coaching) {
                console.log('🤖 Dica do Agente Coach (apenas visual):', result.coaching.content);
                setCoachingMessage(result.coaching.content);
                // NÃO enviar result.coaching.content para o cliente - é apenas uma dica visual
              }
              if (result.evaluation) {
                console.log('🤖 Avaliação do Agente Evaluator:', result.evaluation.metadata);
                // Aqui poderíamos atualizar uma mini-dashboard de performance em tempo real
              }
              // IMPORTANTE: result.customerResponse NÃO deve ser enviado automaticamente
              // O cliente responde através do Gemini Live API, não através dos agentes
            }).catch(err => console.warn('Erro no processamento de agentes:', err));
        }

        // Buscar mensagem anterior do cliente para contexto
        const prevCustomerMsg = prev.length > 0 && prev[prev.length - 1]?.role === 'assistant' 
          ? prev[prev.length - 1].content 
          : '';
        
        // Gerar sugestão de forma assíncrona (não bloqueia a UI)
        // Usar debounce para evitar muitas chamadas
        setTimeout(() => {
          generateExcellenceSuggestionWithAI(
            prevCustomerMsg,
            content,
            initialScenario,
            updated
          ).then(suggestion => {
          // Atualizar a mensagem com a sugestão quando estiver pronta
          setMessages(current => {
            const msgIndex = current.findIndex(m => 
              m.role === 'user' && 
              m.content === content && 
              m.timestamp === newMsg.timestamp
            );
            
            if (msgIndex !== -1 && !current[msgIndex].suggestedResponse) {
              const updatedWithSuggestion = [...current];
              updatedWithSuggestion[msgIndex] = {
                ...updatedWithSuggestion[msgIndex],
                suggestedResponse: suggestion
              };
              transcriptRef.current = updatedWithSuggestion;
              return updatedWithSuggestion;
            }
            return current;
          });
          }).catch(error => {
            console.warn('Erro ao gerar sugestão em tempo real:', error);
            // Não fazer nada em caso de erro - a sugestão será gerada no final se necessário
          });
        }, 1000); // Debounce de 1 segundo para evitar muitas chamadas
      }
      
      return updated;
    });
  };

  // Atualizar dica do coach de forma estável (sem piscar) e contextual
  // IMPORTANTE: Esta dica é APENAS VISUAL - não deve ser enviada ao cliente
  useEffect(() => {
    if (step !== 'chat') return;
    const transcript = transcriptRef.current;
    if (!transcript || transcript.length === 0) return;

    // Contar quantas mensagens do cliente (assistant) existem
    const customerMsgCount = transcript.filter(m => m.role === 'assistant').length;
    const moodKey = currentMood;

    const now = Date.now();
    const cooldownMs = 15000; // evita trocar dica a todo ciclo
    const hasNewCustomerMsg = customerMsgCount !== lastCustomerMsgCountRef.current;

    // Só recalcular se chegou msg nova do cliente OU passou cooldown
    if (!hasNewCustomerMsg && now - lastCoachAtRef.current < cooldownMs) return;

    // Detectar idioma do cenário para a dica
    const lang = (() => {
      const scenarioLang = detectScenarioLanguage(initialScenario);
      if (scenarioLang === 'español') return 'es';
      if (scenarioLang === 'english') return 'en';
      return 'pt';
    })();

    const tipObj = getCoachTip({
      scenario: initialScenario,
      transcript,
      customerMood: currentMood,
      language: lang,
    });

    lastCustomerMsgCountRef.current = customerMsgCount;

    if (!tipObj) return;
    const newKey = `${moodKey}:${tipObj.reasonKey}:${tipObj.tip}`;

    // Evitar alternância entre duas frases: só muda se key mudou
    // IMPORTANTE: setCoachingMessage apenas atualiza o estado visual - NÃO envia mensagem ao cliente
    if (newKey !== lastCoachKeyRef.current) {
      lastCoachKeyRef.current = newKey;
      lastCoachAtRef.current = now;
      // Esta é apenas uma atualização visual - não afeta a conversa com o cliente
      setCoachingMessage(tipObj.tip);
    } else {
      // mantém fixa
      lastCoachAtRef.current = now;
    }
  }, [step, currentMood, initialScenario]);

  const handleEndSimulation = async () => {
    setStep('processing');
    setProcessingComplete(false);
    
    // Duração da sessão (segundos) para estimativa de custo Live API
    const sessionDurationSeconds = Math.max(0, initialScenario.timeLimit - timeLeft);
    
    // Parar captura de frames
    if (frameCaptureIntervalRef.current) {
      clearInterval(frameCaptureIntervalRef.current);
      frameCaptureIntervalRef.current = null;
    }
    
    // Limpar recursos de áudio antes de fechar a sessão
    cleanupAudioResources();
    
        // Processar resultado em background
        (async () => {
          try {
            // Análise multimodal completa
            let holisticAnalysis = null;
            try {
              // Criar AudioBuffer mockado se não houver (para análise de texto e vídeo)
              holisticAnalysis = await performHolisticAnalysis(
                videoFramesRef.current,
                null, // AudioBuffer não disponível no final, mas análise de vídeo e texto funciona
                transcriptRef.current
              );
              
              // Atualizar métricas para uso futuro
              if (holisticAnalysis) {
                setVideoMetrics(holisticAnalysis.video);
                setTextMetrics(holisticAnalysis.text);
              }
            } catch (holisticError) {
              console.warn('Erro na análise holística:', holisticError);
            }
            
            // Avaliar performance e análise do atendente em paralelo
            const [evaluation, attendantAnalysis] = await Promise.all([
              evaluatePerformance(initialScenario, transcriptRef.current),
              analyzeAttendantEmotions(videoFramesRef.current)
            ]);
            
            // Combinar análise holística com análise básica
            const enhancedAttendantAnalysis = holisticAnalysis 
              ? {
                  ...attendantAnalysis,
                  ...holisticAnalysis.video,
                  textAnalysis: holisticAnalysis.text,
                  combinedScore: holisticAnalysis.combined.overallScore,
                  strengths: holisticAnalysis.combined.strengths,
                  weaknesses: holisticAnalysis.combined.weaknesses,
                  recommendations: holisticAnalysis.combined.recommendations
                }
              : attendantAnalysis;
            
            // Estimativas de custo: Live API ~US$0.01–0.05 por sessão; sugestões ~US$0.0005 por mensagem do operador
            const liveEstimateUsd = sessionDurationSeconds < 60 ? 0.01 : Math.min(0.06, 0.01 + (sessionDurationSeconds / 60) * 0.012);
            const userMsgCount = transcriptRef.current.filter(m => m.role === 'user').length;
            const suggestionsEstimateUsd = Math.round(userMsgCount * 0.0005 * 10000) / 10000;

            const finalResult = {
              ...evaluation,
              attendantAnalysis: enhancedAttendantAnalysis,
              realTimePrediction: lastPrediction || undefined,
              sessionDurationSeconds,
              costBreakdown: {
                evaluationUsd: evaluation.tokenUsage?.costUsd ?? 0,
                liveEstimateUsd,
                suggestionsEstimateUsd
              }
            } as SimulationResult;

            // Garantir "Resposta de Excelência" no Dossiê do Diálogo (usando IA em tempo real)
            finalResult.transcript = await addExcellenceSuggestions(
              (finalResult.transcript && finalResult.transcript.length > 0) ? finalResult.transcript : transcriptRef.current,
              initialScenario
            );
            
            setResult(finalResult);
            setProcessingComplete(true);
          } catch (error: any) {
        console.error('❌ Erro ao avaliar performance:', error);
        
        // Criar resultado mockado em caso de erro (campos obrigatórios serão preenchidos no App.tsx)
        const mockResult: Partial<SimulationResult> = {
          score: 75,
          empathyScore: 70,
          procedureScore: 75,
          verificationScore: 80,
          communicationScore: 75,
          solutionScore: 70,
          feedback: error.message?.includes('quota') || error.message?.includes('429') 
            ? "Avaliação automática temporariamente indisponível devido a limitações da API. Seu treinamento foi registrado com sucesso. Tente novamente mais tarde ou verifique sua cota da API do Google Gemini."
            : "Ocorreu um erro ao processar a avaliação. Seu treinamento foi registrado com sucesso.",
          missingFeedback: "Não foi possível gerar feedback detalhado. Tente novamente mais tarde.",
          finalMood: (transcriptRef.current.length > 0 
            ? (transcriptRef.current[transcriptRef.current.length - 1].role === 'assistant' ? ScenarioMood.CALM : initialScenario.mood) 
            : initialScenario.mood) as ScenarioMood,
          sentimentEvolution: "Evolução do sentimento não pôde ser analisada automaticamente.",
          transcript: await addExcellenceSuggestions(transcriptRef.current, initialScenario),
          initialMood: initialScenario.mood,
          tokenUsage: {
            input: 0,
            output: 0,
            costUsd: 0
          },
          sessionDurationSeconds,
          costBreakdown: {
            evaluationUsd: 0,
            liveEstimateUsd: sessionDurationSeconds < 60 ? 0.01 : Math.min(0.06, 0.01 + (sessionDurationSeconds / 60) * 0.012),
            suggestionsEstimateUsd: Math.round(transcriptRef.current.filter(m => m.role === 'user').length * 0.0005 * 10000) / 10000
          }
        };
        
        setResult(mockResult);
        setProcessingComplete(true);
      }
    })();
  };


  // Efeito para ir para o resultado quando o processamento estiver completo
  useEffect(() => {
    if (step === 'processing' && processingComplete && result !== null) {
      const timer = setTimeout(() => setStep('result'), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, processingComplete, result]);

  // Efeito para calcular dimensões do radar quando entrar na tela de resultado
  useEffect(() => {
    if (step === 'result' && radarContainerRef.current) {
      const updateDimensions = () => {
        if (radarContainerRef.current) {
          const rect = radarContainerRef.current.getBoundingClientRect();
          const width = rect.width || 400; // Fallback para 400px se não conseguir calcular
          const height = rect.height || 256; // Fallback para 256px se não conseguir calcular
          
          if (width > 0 && height > 0) {
            setRadarDimensions({ width, height });
          } else {
            // Se ainda não tiver dimensões válidas, usar valores padrão
            setRadarDimensions({ width: 400, height: 256 });
          }
        } else {
          // Se o ref ainda não estiver disponível, usar valores padrão
          setRadarDimensions({ width: 400, height: 256 });
        }
      };

      // Aguardar múltiplos tempos para garantir que o DOM está renderizado
      const timer1 = setTimeout(updateDimensions, 50);
      const timer2 = setTimeout(updateDimensions, 200);
      const timer3 = setTimeout(updateDimensions, 500);
      
      // Também atualizar quando a janela redimensionar
      window.addEventListener('resize', updateDimensions);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        window.removeEventListener('resize', updateDimensions);
      };
    } else {
      setRadarDimensions(null);
    }
  }, [step, result]);

  const radarData = result ? [
    { subject: 'Empatia', val: result.empathyScore || 0 },
    { subject: 'Procedimento', val: result.procedureScore || 0 },
    { subject: 'Verificação', val: result.verificationScore || 0 },
    { subject: 'Comunicação', val: result.communicationScore || 0 },
    { subject: 'Solução', val: result.solutionScore || 0 },
  ] : [];

  return (
    <div className={`flex flex-col w-full h-screen shadow-2xl border-0 overflow-hidden relative transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header sempre em modo light */}
      <header className="px-10 py-6 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src="/favicon.png" className="w-10 h-10 object-contain" />
            <span className="absolute -top-0.5 -right-0.5 bg-[#000fff]/90 text-white text-[7px] font-bold px-1 py-0.5 rounded-sm backdrop-blur-sm">
              POC
            </span>
          </div>
          <div className="h-8 w-[1px] bg-gray-200" />
          <div className="flex items-center gap-2">
            <Clock className={timeLeft < 20 ? 'text-[#00C48C] animate-pulse' : 'text-gray-400'} size={20} />
            <span className={`font-black text-2xl ${timeLeft < 20 ? 'text-[#00C48C]' : 'text-gray-900'}`}>{timeLeft}s</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Toggle de Tema */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-2xl transition-all active:scale-90 flex items-center justify-center ${isDarkMode ? 'bg-gray-100 text-yellow-600 hover:bg-gray-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            cleanupAudioResources();
            onFinish(null);
          }} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-[#000fff] transition-all active:scale-90 flex items-center gap-2 font-bold text-sm">
            <ArrowLeft size={24} />
            Sair do Treinamento
          </button>
        </div>
      </header>

      <div className={`flex-1 relative flex flex-col ${step === 'result' || step === 'processing' ? 'overflow-y-auto' : 'overflow-hidden'} transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]'}`}>
        {step === 'intro' && (
          <div className="flex-1 flex items-center justify-center p-6 lg:p-8 animate-in fade-in duration-500 overflow-hidden">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center h-full">
              {/* Lado Esquerdo: Informações */}
              <div className="flex flex-col items-center justify-center space-y-4 lg:space-y-6">
                <div className="text-center space-y-2">
                  <h3 className={`text-2xl lg:text-3xl xl:text-4xl font-black tracking-tighter leading-tight px-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {initialScenario.title}
                  </h3>
                  <p className={`max-w-md font-medium text-xs lg:text-sm leading-relaxed px-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Interaja como se fosse um cliente humano real. Mantenha contato visual com a câmera ligada e siga os protocolos Ultragaz.
                  </p>
                </div>

                {/* Cards de Informação */}
                <div className="grid grid-cols-4 gap-2 lg:gap-3 w-full max-w-lg px-4">
                  <div className="bg-gradient-to-br from-[#000fff]/5 to-[#00AEEF]/10 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-[#000fff]/15 text-center shadow-sm hover:shadow-md transition-shadow">
                    <Clock className="text-[#000fff] mx-auto mb-1.5 lg:mb-2" size={18} />
                    <p className="text-[10px] lg:text-xs font-black text-gray-700 uppercase tracking-tight">{initialScenario.timeLimit}s</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-yellow-200 text-center shadow-sm hover:shadow-md transition-shadow">
                    <Target className="text-[#00C48C] mx-auto mb-1.5 lg:mb-2" size={18} />
                    <p className="text-[10px] lg:text-xs font-black text-gray-700 uppercase tracking-tight">Treinamento</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-blue-200 text-center shadow-sm hover:shadow-md transition-shadow">
                    <Volume2 className="text-blue-600 mx-auto mb-1.5 lg:mb-2" size={18} />
                    <p className="text-[10px] lg:text-xs font-black text-gray-700 uppercase tracking-tight">Áudio</p>
                  </div>
                  {/* Card de Sentimento */}
                  {(() => {
                    const getMoodConfig = () => {
                      switch (initialScenario.mood) {
                        case ScenarioMood.ANGRY:
                          return {
                            bg: 'from-[#000fff]/5 to-[#00AEEF]/10',
                            border: 'border-[#000fff]/15',
                            icon: <Frown className="text-[#000fff]" size={18} />,
                            text: 'Bravo'
                          };
                        case ScenarioMood.FRUSTRATED:
                          return {
                            bg: 'from-orange-50 to-orange-100',
                            border: 'border-orange-200',
                            icon: <Meh className="text-orange-600" size={18} />,
                            text: 'Frustrado'
                          };
                        case ScenarioMood.CALM:
                          return {
                            bg: 'from-green-50 to-green-100',
                            border: 'border-green-200',
                            icon: <Smile className="text-green-600" size={18} />,
                            text: 'Calmo'
                          };
                        default: // NEUTRAL
                          return {
                            bg: 'from-gray-50 to-gray-100',
                            border: 'border-gray-200',
                            icon: <Meh className="text-gray-600" size={18} />,
                            text: 'Neutro'
                          };
                      }
                    };
                    const moodConfig = getMoodConfig();
                    return (
                      <div className={`bg-gradient-to-br ${moodConfig.bg} p-3 lg:p-4 rounded-xl lg:rounded-2xl border ${moodConfig.border} text-center shadow-sm hover:shadow-md transition-shadow`}>
                        <div className="mx-auto mb-1.5 lg:mb-2 flex items-center justify-center">
                          {moodConfig.icon}
                        </div>
                        <p className="text-[10px] lg:text-xs font-black text-gray-700 uppercase tracking-tight">{moodConfig.text}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Lado Direito: Câmera e Botão */}
              <div className="flex flex-col items-center justify-center space-y-4 lg:space-y-6">
                <div className="relative w-full max-w-md">
                  <div className="w-full aspect-video bg-gradient-to-br from-gray-900 to-black rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-2xl border-4 border-white relative group">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 lg:top-4 left-3 lg:left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-white/20">
                      <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 bg-[#00C48C] rounded-full animate-pulse shadow-lg shadow-[#00C48C]/40" />
                      <span className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-widest">Ao Vivo</span>
                    </div>

                    {/* Indicador de IA Facial em Tempo Real na Intro */}
                    {videoMetrics && (
                      <div className="absolute top-3 lg:top-4 right-3 lg:right-4 flex flex-col gap-1.5">
                        <div className="bg-green-500/90 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">IA Facial Ativa</span>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[7px] font-bold text-gray-300 uppercase">Contato Visual</span>
                            <span className="text-[8px] font-black text-blue-400">{videoMetrics.eyeContactPercentage}%</span>
                          </div>
                          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${videoMetrics.eyeContactPercentage}%` }} />
                          </div>
                          {videoMetrics.microExpressions?.detected && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
                              <span className="text-[6px] font-black text-yellow-400 uppercase tracking-tighter">Micro-expressão Detectada</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-3 lg:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#000fff]/90 backdrop-blur-md px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-white/30 shadow-xl">
                      <Camera className="text-white" size={14} />
                      <span className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-widest">Câmera Ativa</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={initLiveSession}
                  disabled={isLoading}
                  className="w-full max-w-md group relative overflow-hidden bg-gradient-to-r from-[#000fff] via-[#00AEEF] to-[#0f0] text-white rounded-[24px] lg:rounded-[32px] font-black text-lg lg:text-xl xl:text-2xl shadow-2xl hover:shadow-[#000fff]/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 lg:gap-4 py-5 lg:py-6 xl:py-7 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Mic size={24} className="relative z-10 lg:w-7 lg:h-7" />
                  <span className="relative z-10">
                    {isLoading ? 'Iniciando...' : 'Iniciar Simulação'}
                  </span>
                  {!isLoading && (
                    <div className="absolute -right-3 lg:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <ArrowLeft className="rotate-180 text-white" size={18} />
                    </div>
                  )}
                </button>

                {/* Indicadores de Requisitos */}
                <div className="flex items-center justify-center gap-3 lg:gap-4 text-[10px] lg:text-xs text-gray-500">
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-bold">Câmera</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-bold">Microfone</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'chat' && (
          <div className="flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-4 md:gap-8 items-stretch h-full min-h-0">
            {/* Área principal: vídeo/avatar (foco total no mobile, tipo chamada de vídeo) */}
            <div className={`flex-1 flex flex-col items-center justify-center rounded-[24px] md:rounded-[40px] border shadow-sm relative overflow-hidden transition-colors duration-300 min-h-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="relative w-full h-full rounded-[40px] overflow-hidden">
                {initialScenario.id === 'sc6' ? (
                  <CustomerAvatar3D 
                    mood={currentMood} 
                    isSpeaking={isSpeaking} 
                  />
                ) : (
                  <video
                    ref={clientVideoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    src={getClientVideoSrc()}
                    key={`${isSpeaking ? 'speaking' : 'waiting'}-${currentMood}`}
                    onLoadedData={(e) => {
                      e.currentTarget.play().catch(err => {
                        console.warn('Erro ao reproduzir vídeo:', err);
                      });
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />

                {/* Indicador de Sentimento no canto */}
                {(() => {
                  const getMoodConfig = () => {
                    switch (currentMood) {
                      case ScenarioMood.ANGRY:
                        return { bg: 'bg-[#000fff]', text: 'Bravo', icon: <Frown className="text-white" size={16} />, border: 'border-[#000fff]' };
                      case ScenarioMood.FRUSTRATED:
                        return { bg: 'bg-orange-500', text: 'Frustrado', icon: <Meh className="text-white" size={16} />, border: 'border-orange-600' };
                      case ScenarioMood.CALM:
                        return { bg: 'bg-green-500', text: 'Calmo', icon: <Smile className="text-white" size={16} />, border: 'border-green-600' };
                      default:
                        return { bg: 'bg-gray-500', text: 'Neutro', icon: <Meh className="text-white" size={16} />, border: 'border-gray-600' };
                    }
                  };
                  const moodConfig = getMoodConfig();
                  return (
                    <div className={`absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full ${moodConfig.bg} border-2 ${moodConfig.border} shadow-xl backdrop-blur-sm animate-in slide-in-from-top-2 fade-in duration-300`}>
                      {moodConfig.icon}
                      <span className="text-white font-black text-xs uppercase tracking-wider">{moodConfig.text}</span>
                    </div>
                  );
                })()}

                {/* Overlay: Dica do Coach (sobre o vídeo principal) */}
                {/* IMPORTANTE: Esta dica é APENAS VISUAL para o funcionário ler - NÃO é enviada ao cliente */}
                {coachingMessage && (
                  <div className="absolute top-4 left-4 z-30 w-[380px] max-w-[calc(100%-2rem)] backdrop-blur-md bg-yellow-400/90 text-white p-4 rounded-2xl shadow-2xl border border-yellow-200/40">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">💡</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase mb-1 tracking-widest">Dica do Coach</p>
                        <p className="text-sm font-bold leading-snug break-words">{coachingMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overlay: Histórico do Chat (sobre o vídeo principal) */}
                <div className="absolute bottom-4 left-4 z-30 w-[380px] max-w-[calc(100%-2rem)]">
                  <div className="backdrop-blur-md bg-black/45 text-white rounded-2xl border border-white/15 shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-white/80" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Histórico</span>
                      </div>
                      <span className="text-[10px] font-black text-white/70">{messages.length} msgs</span>
                    </div>
                    <div className="px-4 pb-4 max-h-[220px] overflow-y-auto space-y-2">
                      {messages.slice(-8).reverse().map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[92%] px-3 py-2 rounded-2xl text-xs font-bold leading-snug ${
                            msg.role === 'user'
                              ? 'bg-[#000fff] text-white'
                              : 'bg-white/90 text-gray-900'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-xs font-bold text-white/70 italic">Aguardando conversa...</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini-câmera do atendente: mobile = canto superior esquerdo, menor; desktop = canto inferior direito */}
                <div className={`absolute top-4 left-4 md:top-auto md:left-auto md:bottom-4 md:right-4 z-30 w-[110px] h-[85px] md:w-[260px] md:h-[150px] rounded-[16px] md:rounded-[28px] overflow-hidden shadow-2xl border-2 md:border-4 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-white bg-black'}`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute bottom-1.5 left-1.5 md:bottom-3 md:left-3 flex items-center gap-1 md:gap-2 bg-black/50 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/20">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#00C48C] rounded-full animate-pulse" />
                    <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest">Você</span>
                  </div>
                </div>

                {/* Indicador visual sutil quando está falando */}
                {isSpeaking && (
                  <div className="absolute inset-0 border-4 border-[#00C48C]/30 rounded-[40px] animate-pulse pointer-events-none" />
                )}

                {/* Mobile: botão Encerrar flutuante sobre o vídeo (estilo chamada de vídeo) */}
                <div className="md:hidden absolute bottom-6 left-4 right-4 z-40">
                  <button
                    onClick={handleEndSimulation}
                    className="w-full py-5 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-2xl active:scale-[0.98] bg-[#000fff] text-white hover:bg-[#000fff]/90 border-2 border-white/20"
                  >
                    Encerrar Atendimento
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop: coluna direita com Predição em Tempo Real + botão. No mobile essa coluna fica oculta (só vídeo + botão flutuante). */}
            <div className="hidden md:flex md:w-[420px] flex-col gap-6 shrink-0">
              <AdvancedAIFeatures
                transcript={messages}
                scenario={initialScenario}
                timeElapsed={timeLeft > 0 ? initialScenario.timeLimit - timeLeft : 0}
                totalTime={initialScenario.timeLimit}
                videoMetrics={videoMetrics}
                audioMetrics={audioMetrics}
                textMetrics={textMetrics}
                onPredictionUpdate={(pred) => setLastPrediction(pred)}
                showCoach={false}
                customerMood={currentMood}
              />
              <button
                onClick={handleEndSimulation}
                className={`py-5 rounded-[32px] font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 ${isDarkMode ? 'bg-[#000fff] text-white hover:bg-[#000fff]/90' : 'bg-gray-900 text-white hover:bg-black'}`}
              >
                Encerrar Atendimento
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex-1 flex items-center justify-center">
            {/* Indicador de processamento centralizado */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-[#000fff] animate-spin" strokeWidth={3} />
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">
                    {processingComplete ? 'Processamento Concluído!' : 'Processando Resultado...'}
                  </p>
                  {!processingComplete && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Aguardando processamento...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className={`p-10 pb-20 animate-in fade-in duration-700 max-w-7xl mx-auto w-full min-h-full transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Lateral: Scores e Radar */}
                <div className="lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-0">
                   <div className="bg-[#000fff] p-8 rounded-[40px] text-white text-center shadow-2xl relative overflow-hidden">
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                      <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-2">Média Geral Ultragaz</p>
                      <h2 className="text-8xl font-black leading-none">{result.score}</h2>
                   </div>

                   <div className={`p-6 rounded-[32px] border shadow-sm flex flex-col items-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <h4 className={`text-[10px] font-black uppercase tracking-widest mb-6 w-full flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                         <Target size={14} className="text-[#000fff]" /> Mapa de Competências
                      </h4>
                      <div 
                        ref={radarContainerRef}
                        className="h-64 w-full min-h-[256px]" 
                        style={{ minWidth: 0, minHeight: 256 }}
                      >
                        {radarData.length > 0 && radarDimensions && radarDimensions.width > 0 && radarDimensions.height > 0 ? (
                          <ResponsiveContainer 
                            width={radarDimensions.width} 
                            height={radarDimensions.height}
                            minHeight={256}
                          >
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                              <PolarGrid stroke={isDarkMode ? "#374151" : "#f1f5f9"} />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? '#9ca3af' : '#64748b', fontSize: 9, fontWeight: 800 }} />
                              <Radar name="Performance" dataKey="val" stroke="#000fff" fill="#000fff" fillOpacity={0.6} />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : radarData.length > 0 ? (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Preparando gráfico...</div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Carregando dados...</div>
                        )}
                      </div>
                   </div>

                   <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                         <TrendingUp size={14} className="text-[#000fff]" /> Análise de Sentimento
                      </h4>
                      {(() => {
                         // Função para renderizar o ícone do humor
                         const getMoodIcon = (mood: ScenarioMood) => {
                            switch (mood) {
                               case ScenarioMood.ANGRY:
                                  return (
                                     <div className="flex flex-col items-center justify-center">
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                           {/* Círculo do rosto */}
                                           <circle cx="24" cy="24" r="20" stroke="#DC2626" strokeWidth="2" fill="none"/>
                                           {/* Olhos */}
                                           <circle cx="18" cy="20" r="2" fill="#DC2626"/>
                                           <circle cx="30" cy="20" r="2" fill="#DC2626"/>
                                           {/* Boca triste */}
                                           <path d="M 18 30 Q 24 26 30 30" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                        </svg>
                                        <span className="text-[10px] font-black text-[#DC2626] mt-1 uppercase tracking-wider">BRAVO</span>
                                     </div>
                                  );
                               case ScenarioMood.FRUSTRATED:
                                  return <Meh className="text-orange-600" size={32} />;
                               case ScenarioMood.CALM:
                                  return <Smile className="text-green-600" size={32} />;
                               default: // NEUTRAL
                                  return <Meh className="text-gray-600" size={32} />;
                            }
                         };

                         const initialMood = result.initialMood || initialScenario.mood;
                         const finalMood = result.finalMood || initialScenario.mood;

                         return (
                            <>
                               <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 bg-white p-3 rounded-2xl text-center border border-gray-100">
                                     <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Humor Inicial</span>
                                     <div className="flex items-center justify-center h-12">
                                        {getMoodIcon(initialMood)}
                                     </div>
                                  </div>
                                  <div className="w-8 flex items-center justify-center text-gray-300">➜</div>
                                  <div className="flex-1 bg-white p-3 rounded-2xl text-center border border-gray-100">
                                     <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Humor Final</span>
                                     <div className="flex items-center justify-center h-12">
                                        {getMoodIcon(finalMood)}
                                     </div>
                                  </div>
                               </div>
                               <p className="text-[11px] font-black text-gray-900 mt-4 text-center uppercase tracking-tighter">
                                  {result.sentimentEvolution || 'Melhoria de Humor Alcançada'}
                               </p>
                            </>
                         );
                      })()}
                   </div>

                   {/* Predição capturada durante a sessão (última) */}
                   {result.realTimePrediction && (
                     <div className={`p-6 rounded-[32px] border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                       <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                         <TrendingUp size={14} className="text-blue-500" /> Predição (durante a sessão)
                       </h4>
                       <div className="grid grid-cols-2 gap-4">
                         <div className={`p-4 rounded-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-100'}`}>
                           <p className={`text-[10px] font-black uppercase mb-1 ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>Score previsto</p>
                           <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>{result.realTimePrediction.predictedScore}/100</p>
                         </div>
                         <div className={`p-4 rounded-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                           <p className={`text-[10px] font-black uppercase mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Confiança</p>
                           <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(result.realTimePrediction.confidence * 100)}%</p>
                         </div>
                       </div>
                       {result.realTimePrediction.recommendations?.length > 0 && (
                         <div className={`mt-4 p-4 rounded-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
                           <p className={`text-[10px] font-black uppercase mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>Recomendações</p>
                           <ul className="space-y-2">
                             {result.realTimePrediction.recommendations.slice(0, 3).map((rec, i) => (
                               <li key={i} className={`text-sm font-bold leading-snug ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                 - {rec}
                               </li>
                             ))}
                           </ul>
                         </div>
                       )}
                     </div>
                   )}
                </div>

                {/* Principal: Detalhes e Transcrição */}
                <div className="lg:col-span-8 space-y-8">
                   <section className={`p-8 rounded-[40px] border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                        <FileText size={14} className="text-[#00C48C]" /> Descrição do Atendimento
                      </h3>
                      <div className="space-y-4">
                         <h4 className={`text-2xl font-black transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{initialScenario.title}</h4>
                         <p className={`font-medium leading-relaxed transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{initialScenario.description}</p>
                      </div>
                   </section>

                   <section>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Feedback do Gerente Virtual</h3>
                      <div className={`p-10 rounded-[40px] shadow-lg relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>
                         <Volume2 className="absolute top-10 right-10 text-white/5 w-24 h-24 pointer-events-none" />
                         <p className="text-xl italic font-medium leading-relaxed relative z-10 whitespace-pre-wrap">"{result.feedback}"</p>
                      </div>
                   </section>

                   <section className={`p-8 rounded-[40px] border transition-colors duration-300 ${isDarkMode ? 'bg-[#000fff]/15 border-[#000fff]/30' : 'bg-[#000fff]/5 border-[#000fff]/15'}`}>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-[#00AEEF]' : 'text-[#000fff]'}`}>
                        <XCircle size={14} /> Oportunidades de Melhoria
                      </h3>
                      <p className={`font-bold leading-relaxed transition-colors duration-300 ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>{result.missingFeedback}</p>
                   </section>

                   {/* Análise do Atendente baseada na câmera */}
                   {result.attendantAnalysis && (
                     <section className={`p-8 rounded-[40px] border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                       <h3 className={`text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                         <Camera size={14} className="text-[#000fff]" /> Mapa de Sentimento do Atendente
                       </h3>
                       
                       <div className="grid grid-cols-2 gap-4 mb-6">
                         {/* Sorriso */}
                         <div className={`p-4 rounded-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'}`}>
                           <div className="flex items-center justify-between mb-2">
                             <span className={`text-xs font-black uppercase tracking-tight transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-green-700'}`}>Sorriso</span>
                             <Smile className={isDarkMode ? 'text-green-400' : 'text-green-600'} size={20} />
                           </div>
                           <div className="flex items-center gap-2">
                             <div className={`flex-1 h-3 rounded-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-600' : 'bg-green-100'}`}>
                               <div 
                                 className="h-full bg-green-500 rounded-full transition-all duration-500"
                                 style={{ width: `${result.attendantAnalysis.smilePercentage}%` }}
                               />
                             </div>
                             <span className={`text-lg font-black transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-green-700'}`}>
                               {result.attendantAnalysis.smilePercentage}%
                             </span>
                           </div>
                         </div>

                         {/* Contato Visual */}
                         <div className={`p-4 rounded-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                           <div className="flex items-center justify-between mb-2">
                             <span className={`text-xs font-black uppercase tracking-tight transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>Contato Visual</span>
                             <Camera className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={20} />
                           </div>
                           <div className="flex items-center gap-2">
                             <div className={`flex-1 h-3 rounded-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-600' : 'bg-blue-100'}`}>
                               <div 
                                 className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                 style={{ width: `${result.attendantAnalysis.eyeContactPercentage}%` }}
                               />
                             </div>
                             <span className={`text-lg font-black transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>
                               {result.attendantAnalysis.eyeContactPercentage}%
                             </span>
                           </div>
                         </div>
                       </div>

                       {/* Distribuição de Expressões */}
                       <div className={`p-6 rounded-2xl border mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                         <h4 className={`text-xs font-black uppercase mb-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Distribuição de Expressões</h4>
                         <div className="space-y-3">
                           <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 w-24">
                               <Smile className="text-green-500" size={16} />
                               <span className={`text-xs font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Feliz</span>
                             </div>
                             <div className={`flex-1 h-2 rounded-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                               <div className="h-full bg-green-500 rounded-full" style={{ width: `${result.attendantAnalysis.expressions.happy}%` }} />
                             </div>
                             <span className={`text-xs font-black w-12 text-right transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{result.attendantAnalysis.expressions.happy}%</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 w-24">
                               <Meh className="text-gray-500" size={16} />
                               <span className={`text-xs font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Neutro</span>
                             </div>
                             <div className={`flex-1 h-2 rounded-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                               <div className="h-full bg-gray-500 rounded-full" style={{ width: `${result.attendantAnalysis.expressions.neutral}%` }} />
                             </div>
                             <span className={`text-xs font-black w-12 text-right transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{result.attendantAnalysis.expressions.neutral}%</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 w-24">
                               <Frown className="text-orange-500" size={16} />
                               <span className={`text-xs font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sério</span>
                             </div>
                             <div className={`flex-1 h-2 rounded-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                               <div className="h-full bg-orange-500 rounded-full" style={{ width: `${result.attendantAnalysis.expressions.serious}%` }} />
                             </div>
                             <span className={`text-xs font-black w-12 text-right transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{result.attendantAnalysis.expressions.serious}%</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 w-24">
                              <Frown className="text-[#000fff]" size={16} />
                               <span className={`text-xs font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Preocupado</span>
                             </div>
                             <div className={`flex-1 h-2 rounded-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                               <div className="h-full bg-[#000fff] rounded-full" style={{ width: `${result.attendantAnalysis.expressions.concerned}%` }} />
                             </div>
                             <span className={`text-xs font-black w-12 text-right transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{result.attendantAnalysis.expressions.concerned}%</span>
                           </div>
                         </div>
                       </div>

                       {/* Humor Geral e Feedback */}
                       <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
                         result.attendantAnalysis.overallMood === 'POSITIVE' 
                           ? (isDarkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200')
                           : result.attendantAnalysis.overallMood === 'NEGATIVE'
                           ? (isDarkMode ? 'bg-[#000fff]/20 border-[#000fff]/40' : 'bg-[#000fff]/5 border-[#000fff]/15')
                           : (isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200')
                       }`}>
                         <div className="flex items-center gap-3 mb-3">
                           <span className={`text-xs font-black uppercase transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Humor Geral:</span>
                           <span className={`px-3 py-1 rounded-full text-xs font-black uppercase transition-colors duration-300 ${
                             result.attendantAnalysis.overallMood === 'POSITIVE'
                               ? 'bg-green-500 text-white'
                               : result.attendantAnalysis.overallMood === 'NEGATIVE'
                              ? 'bg-[#000fff] text-white'
                               : 'bg-gray-500 text-white'
                           }`}>
                             {result.attendantAnalysis.overallMood === 'POSITIVE' ? 'Positivo' : result.attendantAnalysis.overallMood === 'NEGATIVE' ? 'Negativo' : 'Neutro'}
                           </span>
                         </div>
                         <p className={`text-sm font-medium leading-relaxed transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                           {result.attendantAnalysis.feedback}
                         </p>
                       </div>
                     </section>
                   )}

                   <section>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Dossiê do Diálogo</h3>
                      <div className={`p-8 rounded-[40px] space-y-6 max-h-[500px] overflow-y-auto border shadow-inner transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                         {result.transcript.length > 0 ? result.transcript.map((m, i) => (
                            <div key={i} className="space-y-3">
                               <div className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black shrink-0 ${m.role === 'user' ? 'bg-[#000fff] text-white' : (isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-600')}`}>
                                     {m.role === 'user' ? 'OPERADOR' : 'CLIENTE'}
                                  </div>
                                  <div className={`p-5 rounded-[28px] text-sm font-bold leading-relaxed shadow-sm transition-colors duration-300 ${
                                    m.role === 'user' 
                                      ? (isDarkMode ? 'bg-[#000fff]/20 text-white/90 rounded-tr-none' : 'bg-[#000fff]/10 text-gray-900 rounded-tr-none')
                                      : (isDarkMode ? 'bg-gray-700 text-gray-200 rounded-tl-none' : 'bg-white text-gray-700 rounded-tl-none')
                                  }`}>
                                     {m.content}
                                  </div>
                               </div>
                               {/* Sugestão de Resposta de Excelência (apenas para mensagens do usuário) */}
                               {m.role === 'user' && m.suggestedResponse && (
                                  <div className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                     <div className="w-10 shrink-0" /> {/* Espaço para alinhar com o avatar */}
                                     <div className={`flex-1 p-5 rounded-[24px] border-l-4 shadow-md transition-colors duration-300 ${
                                       isDarkMode 
                                         ? 'bg-green-900/30 border-green-500 text-green-200' 
                                         : 'bg-green-50 border-green-500 text-green-800'
                                     }`}>
                                        <div className="flex items-start gap-2 mb-3">
                                           <TrendingUp size={16} className={`mt-0.5 shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                           <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                              Resposta de Excelência Sugerida
                                           </span>
                                        </div>
                                        <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-green-200' : 'text-green-900'}`}>
                                           {m.suggestedResponse}
                                        </p>
                                     </div>
                                  </div>
                               )}
                            </div>
                         )) : (
                           <p className={`text-center font-bold py-10 italic transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Nenhum diálogo registrado.</p>
                         )}
                      </div>
                   </section>

                   <div className="pt-6 pb-8">
                      <button onClick={() => onFinish(result)} className="w-full py-7 bg-[#000fff] text-white rounded-[40px] font-black text-2xl shadow-2xl hover:bg-[#000fff]/90 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-4">
                         <CheckCircle2 size={32} />
                         Salvar e Voltar
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
