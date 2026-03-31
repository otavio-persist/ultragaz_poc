# 📖 Exemplos de Uso - Funcionalidades Avançadas

Este documento contém exemplos práticos de como usar cada funcionalidade avançada implementada.

## 🎯 Índice

1. [RAG (Retrieval-Augmented Generation)](#rag)
2. [Análise Multimodal](#análise-multimodal)
3. [Sistema de Agentes](#agentes)
4. [Predição em Tempo Real](#predição)
5. [Sistema Adaptativo](#adaptativo)
6. [Integração Completa](#integração)

---

## 📚 RAG (Retrieval-Augmented Generation)

### Exemplo 1: Buscar Documentos Relevantes

```typescript
import { retrieveRelevantDocuments } from './services/ragService';
import { Scenario } from './types';

const scenario: Scenario = {
  id: 'sc1',
  type: 'ISSUE_RESOLUTION',
  sector: 'DRIVE_THRU',
  title: 'Item Faltando',
  description: 'Cliente recebeu pedido sem batata',
  mood: 'ANGRY',
  goal: 'Resolver rapidamente',
  country: 'BRAZIL',
  timeLimit: 120,
  rubric: { empathy: 40, procedure: 20, verification: 10, communication: 10, solution: 20 }
};

// Buscar documentos relevantes
const docs = await retrieveRelevantDocuments(
  "Cliente está bravo porque faltou batata no pedido",
  scenario,
  5 // top 5 documentos
);

console.log('Documentos encontrados:', docs);
// [
//   { id: 'pol-002', title: 'Procedimento Drive-Thru', similarity: 0.85, ... },
//   { id: 'proc-001', title: 'Item faltando', similarity: 0.92, ... },
//   ...
// ]
```

### Exemplo 2: Gerar Resposta com Grounding

```typescript
import { generateRAGResponse } from './services/ragService';

const conversationHistory: ChatMessage[] = [
  { role: 'assistant', content: 'Olá, como posso ajudar?', timestamp: new Date() },
  { role: 'user', content: 'Faltou batata no meu pedido!', timestamp: new Date() }
];

const response = await generateRAGResponse(
  "Faltou batata no meu pedido!",
  scenario,
  conversationHistory
);

console.log(response);
// "Peço desculpas pelo inconveniente. Vou verificar seu pedido imediatamente 
//  e preparar a batata faltante com prioridade. Isso levará apenas alguns minutos."
```

---

## 🎥 Análise Multimodal

### Exemplo 1: Análise Completa

```typescript
import { performHolisticAnalysis } from './services/multimodalAnalysis';

// Capturar frames de vídeo
const videoFrames: string[] = [];
// ... capturar frames do vídeo

// Obter áudio
const audioBuffer: AudioBuffer = ...; // do MediaStream

// Transcript da conversa
const transcript: ChatMessage[] = [
  { role: 'user', content: 'Peço desculpas pelo inconveniente', timestamp: new Date() },
  { role: 'assistant', content: 'Ok, mas preciso resolver isso agora', timestamp: new Date() }
];

// Análise holística
const analysis = await performHolisticAnalysis(
  videoFrames,
  audioBuffer,
  transcript
);

console.log('Score Geral:', analysis.combined.overallScore);
console.log('Pontos Fortes:', analysis.combined.strengths);
console.log('Pontos Fracos:', analysis.combined.weaknesses);
console.log('Recomendações:', analysis.combined.recommendations);

// Métricas individuais
console.log('Sorriso:', analysis.video.smilePercentage + '%');
console.log('Contato Visual:', analysis.video.eyeContactPercentage + '%');
console.log('Estresse:', analysis.audio.stressLevel);
console.log('Empatia (texto):', analysis.text.empathyScore);
```

### Exemplo 2: Análise Individual

```typescript
import { 
  analyzeVideoFrames, 
  analyzeAudio, 
  analyzeText 
} from './services/multimodalAnalysis';

// Apenas vídeo
const videoMetrics = await analyzeVideoFrames(videoFrames);
console.log('Expressões:', videoMetrics.expressions);

// Apenas áudio
const audioMetrics = await analyzeAudio(audioBuffer, transcriptText);
console.log('Prosódia:', audioMetrics.prosody);
console.log('Qualidade da Voz:', audioMetrics.voiceQuality);

// Apenas texto
const textMetrics = await analyzeText(transcript);
console.log('Sentimento:', textMetrics.sentiment);
console.log('Intenção:', textMetrics.intent);
```

---

## 🤖 Sistema de Agentes

### Exemplo 1: Orquestrador Completo

```typescript
import { AgentOrchestrator } from './services/agentsService';
import { ScenarioMood } from './types';

// Inicializar orquestrador
const orchestrator = new AgentOrchestrator(ScenarioMood.ANGRY);

// Processar interação
const result = await orchestrator.processInteraction(
  "Peço desculpas pelo inconveniente. Vou verificar seu pedido imediatamente.",
  scenario,
  conversationHistory
);

// Resposta do cliente
console.log('Cliente:', result.customerResponse.content);
// "Ok, mas preciso resolver isso rápido, estou com pressa"

// Avaliação (se disponível)
if (result.evaluation) {
  console.log('Score:', result.evaluation.metadata.overallScore);
  console.log('Feedback:', result.evaluation.content);
  console.log('Pontos Fortes:', result.evaluation.metadata.strengths);
}

// Coaching (se score baixo)
if (result.coaching) {
  console.log('Dica do Coach:', result.coaching.content);
  // "Continue sendo empático, mas também seja mais proativo na solução"
}
```

### Exemplo 2: Agentes Individuais

```typescript
import { 
  CustomerAgent, 
  EvaluatorAgent, 
  CoachAgent 
} from './services/agentsService';

// Cliente
const customerAgent = new CustomerAgent(ScenarioMood.FRUSTRATED, 'realistic');
const customerResponse = await customerAgent.react(
  "Vou verificar isso para você",
  scenario,
  conversationHistory
);

// Avaliador
const evaluatorAgent = new EvaluatorAgent();
const evaluation = await evaluatorAgent.evaluate(
  fullConversation,
  scenario
);

// Coach
const coachAgent = new CoachAgent();
const coaching = await coachAgent.provideCoaching(
  recentMessages,
  scenario,
  currentScore
);
```

---

## 📊 Predição em Tempo Real

### Exemplo 1: Predição Básica

```typescript
import { PerformancePredictor } from './services/predictionService';

const predictor = new PerformancePredictor();

const prediction = await predictor.predictFinalScore(
  partialTranscript,
  videoMetrics,
  audioMetrics,
  textMetrics,
  45, // 45 segundos decorridos
  120  // 120 segundos total
);

console.log('Score Previsto:', prediction.predictedScore);
console.log('Confiança:', Math.round(prediction.confidence * 100) + '%');
console.log('Trajetória:', prediction.trajectory);
console.log('Recomendações:', prediction.recommendations);
```

### Exemplo 2: Uso no Componente React

```tsx
import { AdvancedAIFeatures } from './components/AdvancedAIFeatures';

function TrainingSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  return (
    <div>
      {/* Seu componente de treinamento */}
      
      <AdvancedAIFeatures
        transcript={messages}
        scenario={scenario}
        timeElapsed={timeElapsed}
        totalTime={scenario.timeLimit}
        videoMetrics={videoMetrics}
        audioMetrics={audioMetrics}
        textMetrics={textMetrics}
        onCoachingReceived={(coaching) => {
          // Exibir coaching para o usuário
          showNotification(coaching);
        }}
      />
    </div>
  );
}
```

---

## 🎯 Sistema Adaptativo

### Exemplo 1: Recomendação de Cenário

```typescript
import { AdaptiveDifficultySystem } from './services/adaptiveSystem';

const adaptiveSystem = new AdaptiveDifficultySystem();

// Atualizar perfil do usuário
adaptiveSystem.updateUserProfile(user, allResults);

// Obter recomendação
const recommendation = adaptiveSystem.selectNextScenario(
  user,
  availableScenarios,
  allResults
);

console.log('Cenário Recomendado:', recommendation.scenario.title);
console.log('Razão:', recommendation.reason);
console.log('Dificuldade Esperada:', recommendation.expectedDifficulty);
console.log('Área de Foco:', recommendation.focusArea);
```

### Exemplo 2: Atualizar Após Simulação

```typescript
// Após uma simulação completada
const result: SimulationResult = {
  // ... resultado da simulação
  score: 85,
  scenarioId: 'sc1'
};

// Atualizar sistema adaptativo
adaptiveSystem.updateReward(result.scenarioId, result.score);

// Obter perfil atualizado
const profile = adaptiveSystem.getUserProfile(user.id);
console.log('Score Médio:', profile.avgScore);
console.log('Áreas Fracas:', profile.weakAreas);
```

---

## 🔗 Integração Completa

### Exemplo: Fluxo Completo de Treinamento

```typescript
import { getAdvancedAIService } from './services/integrationService';

const aiService = getAdvancedAIService();

// 1. Inicializar sessão
const orchestrator = aiService.initializeSession(scenario, 'ANGRY');

// 2. Durante a simulação - processar interação
const interactionResult = await aiService.processInteractionWithRAG(
  employeeMessage,
  scenario,
  conversationHistory
);

// 3. Análise em tempo real
const prediction = await aiService.predictPerformance(
  conversationHistory,
  videoMetrics,
  audioMetrics,
  textMetrics,
  timeElapsed,
  totalTime
);

// 4. Análise completa ao final
const completeAnalysis = await aiService.performCompleteAnalysis(
  allVideoFrames,
  audioBuffer,
  fullTranscript
);

// 5. Após simulação - atualizar sistema
aiService.updateAfterSimulation(scenario.id, finalScore);

// 6. Recomendar próximo cenário
const nextScenario = aiService.recommendNextScenario(
  user,
  availableScenarios,
  allResults
);
```

### Exemplo: Dashboard com Métricas

```typescript
// Obter perfil do usuário
const profile = aiService.getUserProfile(userId);

console.log('Perfil do Usuário:');
console.log('- Score Médio:', profile.avgScore);
console.log('- Experiência:', profile.experience, 'simulações');
console.log('- Área Mais Fraca:', Object.entries(profile.weakAreas)
  .sort(([,a], [,b]) => a - b)[0][0]);
console.log('- Tendência:', profile.recentScores);
```

---

## 🎨 Exemplo de UI Completa

```tsx
import React, { useState, useEffect } from 'react';
import { AdvancedAIFeatures } from './components/AdvancedAIFeatures';
import { getAdvancedAIService } from './services/integrationService';

export function EnhancedTrainingSession({ scenario, onFinish }) {
  const [messages, setMessages] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [videoMetrics, setVideoMetrics] = useState(null);
  const [audioMetrics, setAudioMetrics] = useState(null);
  const [textMetrics, setTextMetrics] = useState(null);
  const [coaching, setCoaching] = useState(null);
  
  const aiService = getAdvancedAIService();
  
  useEffect(() => {
    // Inicializar sessão
    aiService.initializeSession(scenario, scenario.mood);
    
    // Timer
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const handleMessage = async (message: string) => {
    // Adicionar mensagem
    const newMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Processar com RAG e agentes
    const result = await aiService.processInteractionWithRAG(
      message,
      scenario,
      [...messages, newMessage]
    );
    
    // Adicionar resposta do cliente
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: result.customerResponse,
      timestamp: new Date()
    }]);
    
    // Exibir coaching se disponível
    if (result.coaching) {
      setCoaching(result.coaching);
    }
  };
  
  return (
    <div className="training-session">
      {/* Interface de conversa */}
      <div className="chat-container">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      {/* Funcionalidades Avançadas */}
      <AdvancedAIFeatures
        transcript={messages}
        scenario={scenario}
        timeElapsed={timeElapsed}
        totalTime={scenario.timeLimit}
        videoMetrics={videoMetrics}
        audioMetrics={audioMetrics}
        textMetrics={textMetrics}
        onCoachingReceived={setCoaching}
      />
      
      {/* Coaching em destaque */}
      {coaching && (
        <div className="coaching-banner">
          💡 {coaching}
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 Próximos Passos

Para implementar essas funcionalidades no seu projeto:

1. **Instale as dependências**: `npm install`
2. **Configure a API Key**: Crie `.env.local` com `GEMINI_API_KEY`
3. **Importe os serviços**: Use os exemplos acima
4. **Integre no componente**: Adicione `AdvancedAIFeatures` ao seu `TrainingSession`

Para mais detalhes, consulte [ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md).



