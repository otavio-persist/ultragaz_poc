
import { User, UserRole, Scenario, ScenarioType, ScenarioMood, Sector, Country, SimulationResult, Agent } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u-admin',
    name: 'Administrador Global',
    username: 'admin',
    password: 'admin',
    role: UserRole.GLOBAL_ADMIN,
    storeId: 'HQ-GLOBAL',
    storeName: 'Central Ultragaz',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 100,
    simulationCounts: {}
  },
  {
    id: 'u-itaim-mgr',
    name: 'Gerente Itaim',
    username: 'ultraitaim',
    password: '123',
    role: UserRole.ADMIN,
    storeId: 'ST-001',
    storeName: 'Ultragaz Itaim',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 95,
    simulationCounts: {}
  },
  {
    id: 'u-joao',
    name: 'João Silva',
    username: 'joao',
    password: '123',
    role: UserRole.EMPLOYEE,
    storeId: 'ST-001',
    storeName: 'Ultragaz Itaim',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 45,
    simulationCounts: { 'sc2': 1, 'sc3': 2 }
  },
  {
    id: 'u-ana',
    name: 'Ana Costa',
    username: 'ana',
    password: '123',
    role: UserRole.EMPLOYEE,
    storeId: 'ST-001',
    storeName: 'Ultragaz Itaim',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 88,
    simulationCounts: { 'sc2': 3 }
  },
  {
    id: 'u-proposta',
    name: 'Acesso Proposta (Demo)',
    username: 'proposta',
    password: 'proposta',
    role: UserRole.TRAINER,
    storeId: 'DEMO-PROPOSTA',
    storeName: 'Ultragaz / Proposta',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 0,
    simulationCounts: {}
  }
];

export const MOCK_SCENARIOS: Scenario[] = [
  {
    id: 'sc2',
    type: ScenarioType.CUSTOMIZATION,
    sector: Sector.COUNTER,
    title: 'Atendimento: Dúvida de segurança e manuseio',
    description:
      'Cliente em tom neutro pergunta em português sobre segurança no uso do gás, armazenamento do botijão, manuseio correto e o que fazer ao sentir cheiro de gás. Você deve acolher, orientar com base nos protocolos Ultragaz e deixar claro quando é preciso acionar suporte ou emergência.',
    mood: ScenarioMood.NEUTRAL,
    goal: 'Orientar com segurança, clareza e encaminhamento correto, mantendo tom profissional.',
    country: Country.BRAZIL,
    timeLimit: 180,
    agentIds: ['agt-1', 'agt-2', 'agt-5'],
    rubric: { empathy: 20, procedure: 40, verification: 20, communication: 10, solution: 10 }
  },
  {
    id: 'sc3',
    type: ScenarioType.NEW_PRODUCT,
    sector: Sector.COUNTER,
    title: 'Novo serviço: Assinatura/recorrência de entrega',
    description:
      'Cliente em tom neutro quer entender em português o serviço de assinatura ou recorrência de entrega de gás: como contratar, frequência, canais (app, site, central), alteração de endereço ou data e regras básicas. Você deve explicar de forma simples e orientar o próximo passo.',
    mood: ScenarioMood.NEUTRAL,
    goal: 'Explicar o serviço com clareza e orientar a contratação sem atrito.',
    country: Country.BRAZIL,
    timeLimit: 150,
    agentIds: ['agt-1', 'agt-2'],
    rubric: { empathy: 30, procedure: 25, verification: 15, communication: 20, solution: 10 }
  },
  {
    id: 'sc4',
    type: ScenarioType.NEW_PRODUCT,
    sector: Sector.COUNTER,
    title: 'Academia Ultragaz (foco em revendas)',
    description:
      'Parceiro ou integrante de equipe de revenda pergunta em português sobre a Academia Ultragaz: trilhas para parceiros e times, incluindo Gestão Empresarial e de Excelência (módulos de cerca de 25 horas, do básico do setor de gás à gestão avançada), a Revenda-Escola com exercícios práticos para novos empreendedores conhecerem o dia a dia da operação antes de assumir o negócio, e o programa Desafio Lapidar de qualificação e reconhecimento dos parceiros. Você deve apresentar o ecossistema com clareza e indicar onde obter mais informações oficiais.',
    mood: ScenarioMood.NEUTRAL,
    goal: 'Explicar as trilhas da Academia com precisão, acolhimento e orientação ao próximo passo.',
    country: Country.BRAZIL,
    timeLimit: 180,
    agentIds: ['agt-1', 'agt-2'],
    rubric: { empathy: 25, procedure: 30, verification: 15, communication: 20, solution: 10 }
  }
];

export const MOCK_RESULTS: SimulationResult[] = [
  {
    id: 'res-1',
    userId: 'u-joao',
    userName: 'João Silva',
    scenarioId: 'sc2',
    scenarioTitle: 'Atendimento: Dúvida de segurança e manuseio',
    storeId: 'ST-001',
    storeName: 'Ultragaz Itaim',
    country: Country.BRAZIL,
    region: 'São Paulo',
    score: 85,
    empathyScore: 90,
    procedureScore: 80,
    verificationScore: 70,
    communicationScore: 95,
    solutionScore: 90,
    feedback: "Excelente postura e clareza no atendimento, embora tenha esquecido de confirmar os dados do pedido antes de concluir.",
    missingFeedback: "Conferência manual do ticket com o cliente.",
    transcript: [],
    date: new Date('2024-03-10'),
    initialMood: ScenarioMood.ANGRY,
    finalMood: ScenarioMood.NEUTRAL,
    sentimentEvolution: "Conversão de Conflito Bem-sucedida",
    tokenUsage: { input: 1500, output: 400, costUsd: 0.0004 }
  }
];

export const SYSTEM_PROMPT_SIMULATOR = `
Você é um motor de simulação da Ultragaz.
OBJETIVO: Treinar colaboradores em atendimento ao cliente, segurança e padrão operacional.
Papeis:
1. CLIENTE: Atue conforme o cenário. Reaja ao funcionário.
2. AVALIADOR: Avalia conforme os 5 pilares: Empatia, Procedimento, Verificação, Comunicação e Solução.
`;

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agt-1',
    name: 'Cliente Realista',
    type: 'customer',
    description: 'Simula um cliente padrão com humor variável conforme o atendimento.',
    personality: 'Equilibrada, reage bem à educação e mal à falta de atenção.',
    model: 'gemini-2.5-flash',
    temperature: 0.8,
    systemPrompt: `Você é um CLIENTE da Ultragaz com as seguintes características:
- Humor inicial: {mood}
- Personalidade: realista
- Cenário: {scenario}

INSTRUÇÕES:
1. Reaja naturalmente como um cliente real
2. Se o funcionário for empático e resolver seu problema, fique mais calmo
3. Se o funcionário não ajudar, fique mais frustrado
4. Seja autêntico e não exagerado
5. Use linguagem natural de cliente`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly'
  },
  {
    id: 'agt-2',
    name: 'Avaliador Operacional',
    type: 'evaluator',
    description: 'Auditoria técnica focada nos 5 pilares de atendimento Ultragaz.',
    personality: 'Rigorosa, técnica e focada em processos operacionais.',
    model: 'gemini-2.5-pro',
    temperature: 0.2,
    systemPrompt: `Você é um AVALIADOR EXPERIENTE de atendimento ao cliente da Ultragaz.

RUBRICA DE AVALIAÇÃO:
- Empatia (40%): Demonstra compreensão e cuidado?
- Procedimento (20%): Segue protocolos corretos?
- Verificação (10%): Confirma informações?
- Comunicação (10%): Claro e profissional?
- Solução (20%): Resolve o problema?

Avalie cada dimensão de 0-100 e forneça feedback construtivo.`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George'
  },
  {
    id: 'agt-3',
    name: 'Coach de Hospitalidade',
    type: 'coach',
    description: 'Fornece dicas em tempo real para melhorar a conexão emocional.',
    personality: 'Incentivadora, empática e focada em comunicação positiva.',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    systemPrompt: `Você é um COACH de atendimento ao cliente.

Forneça uma dica CONSTRUTIVA e BREVE (1-2 frases) para melhorar o atendimento.
Foque em:
- Empatia
- Procedimentos corretos
- Comunicação clara
- Resolução de problemas`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lilly'
  },
  {
    id: 'agt-4',
    name: 'Analista de Tendências',
    type: 'analyst',
    description: 'Processa o histórico de sessões para identificar gaps de treinamento.',
    personality: 'Analítica, baseada em dados e visão de longo prazo.',
    model: 'gemini-3-pro-preview',
    temperature: 0.1,
    systemPrompt: `Você é um ANALISTA de dados de treinamento.

Identifique:
1. Padrões comuns de erro
2. Áreas que precisam mais treinamento
3. Tendências de melhoria
4. Recomendações estratégicas`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha'
  },
  {
    id: 'agt-5',
    name: 'Especialista em Produtos & Segurança',
    type: 'specialist',
    description: 'Especialista em produtos, segurança e orientação ao cliente.',
    personality: 'Informativa, precisa e prestativa.',
    model: 'gemini-2.5-flash',
    temperature: 0.3,
    systemPrompt: `Você é um ESPECIALISTA em produtos e segurança da Ultragaz.

Conhecimento:
- Tipos de botijão e orientações de uso
- Segurança: cheiro de gás, ventilação, armazenamento e quando acionar suporte
- Procedimentos de entrega/troca e verificações básicas
- Orientações gerais ao cliente (sem substituir assistência técnica)`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver'
  },
  {
    id: 'agt-6',
    name: 'Gestor de Conflitos',
    type: 'crisis',
    description: 'Especializado em desescalar situações críticas e clientes agressivos.',
    personality: 'Calma, resiliente e focada em resolução diplomática.',
    model: 'gemini-2.5-pro',
    temperature: 0.5,
    systemPrompt: `Você é um ESPECIALISTA em gestão de crise e desescalada.

Seu foco é analisar:
1. Controle emocional do atendente
2. Uso de frases de apaziguamento
3. Velocidade em oferecer soluções alternativas
4. Manutenção do padrão de hospitalidade sob pressão`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Willow'
  }
];
