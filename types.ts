
export enum UserRole {
  GLOBAL_ADMIN = 'GLOBAL_ADMIN',
  COUNTRY_ADMIN = 'COUNTRY_ADMIN',
  REGIONAL_ADMIN = 'REGIONAL_ADMIN',
  TRAINER = 'TRAINER',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN'
}

export enum Country {
  BRAZIL = 'Brasil',
  ARGENTINA = 'Argentina',
  COLOMBIA = 'Colômbia'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  storeId: string;
  storeName: string;
  country: Country;
  region: string;
  progress: number;
  simulationCounts: Record<string, number>; // scenarioId -> count (0 to 3)
}

export enum Sector {
  DRIVE_THRU = 'Drive-Thru',
  COUNTER = 'Balcão',
  KITCHEN = 'Cozinha',
  MANAGEMENT = 'Gestão'
}

export enum ScenarioMood {
  CALM = 'CALM',
  NEUTRAL = 'NEUTRAL',
  ANGRY = 'ANGRY',
  FRUSTRATED = 'FRUSTRATED'
}

export enum ScenarioType {
  NEW_PRODUCT = 'NEW_PRODUCT',
  ISSUE_RESOLUTION = 'ISSUE_RESOLUTION',
  CUSTOMIZATION = 'CUSTOMIZATION',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export interface Scenario {
  id: string;
  type: ScenarioType;
  sector: Sector;
  title: string;
  description: string;
  mood: ScenarioMood;
  goal: string;
  country: Country | 'ALL';
  timeLimit: number;
  agentIds?: string[];
  rubric: {
    empathy: number;
    procedure: number;
    verification: number;
    communication: number;
    solution: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestedResponse?: string; // Resposta de excelência sugerida (apenas para mensagens do usuário)
}

export interface SimulationResult {
  id: string;
  userId: string;
  userName?: string;
  scenarioId: string;
  scenarioTitle?: string;
  storeId: string;
  storeName: string;
  country: Country;
  region: string;
  score: number;
  empathyScore: number;
  procedureScore: number;
  verificationScore: number;
  communicationScore: number;
  solutionScore: number;
  feedback: string;
  missingFeedback: string;
  transcript: ChatMessage[];
  date: Date;
  // Novos campos para Análise Profissional
  initialMood: ScenarioMood;
  finalMood: ScenarioMood;
  sentimentEvolution: string; // Ex: "Melhoria Significativa"
  tokenUsage: {
    input: number;
    output: number;
    costUsd: number;
  };
  /** Detalhamento de custos por componente (avaliação, Live API estimada, sugestões) */
  costBreakdown?: {
    evaluationUsd: number;
    liveEstimateUsd?: number;
    suggestionsEstimateUsd?: number;
  };
  /** Duração da sessão em segundos (para estimativa de custo Live API) */
  sessionDurationSeconds?: number;
  // Análise do atendente baseada na câmera
  attendantAnalysis?: {
    smilePercentage: number; // % do tempo sorrindo
    eyeContactPercentage: number; // % do tempo com contato visual
    expressions: {
      happy: number;
      neutral: number;
      serious: number;
      concerned: number;
    };
    overallMood: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    feedback: string;
  };
  // Última predição em tempo real capturada durante a sessão (opcional)
  realTimePrediction?: {
    predictedScore: number;
    confidence: number;
    predictedBreakdown: {
      empathy: number;
      procedure: number;
      verification: number;
      communication: number;
      solution: number;
      eyeContact: number;
    };
    recommendations: string[];
    trajectory: 'improving' | 'stable' | 'declining';
  };
}

export interface Agent {
  id: string;
  name: string;
  type: 'customer' | 'evaluator' | 'coach' | 'analyst' | 'specialist' | 'crisis';
  description: string;
  personality: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  isActive: boolean;
  avatar?: string;
}